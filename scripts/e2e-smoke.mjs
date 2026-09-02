// Smoke E2E das server functions (wire real: seroval + x-tsr-serverFn).
// Semeia OTPs controlados no banco (mesmo hash/segredo do app) para validar
// verifyOtp/sessão/feed/painel de ponta a ponta sem depender de entrega externa.
import { toJSONAsync, fromCrossJSON } from "seroval";
import { createHash } from "node:crypto";
import postgres from "postgres";

const BASE = process.env.BASE ?? "http://127.0.0.1:3071";
const SECRET = process.env.SESSION_SECRET;
const sql = postgres(process.env.DATABASE_URL, { max: 4 });

const IDS = {
  enviarOtp: "0d8a4cec993b8454e9e83e77845f1df68cbdc6859c8c95c64acdbc92ac9c1ab5",
  confirmarLead: "fc91af2116847cbd9c6d4985126523a78695c01f9902a68d68ff0eea32d29f5b",
  feedImoveis: "15937d804175223d6ec96c989ce9b0dbfc1f29181fab74d80c10152c2eef6bd4",
  registrarInteracao: "5ac52299fc42b6517ad5b45a038c06893e226b74df29dacbea24de8feeb284ad",
  me: "c71ddcbc99b06b28f637558db29fc5139377055f3508a2cd04a0224638842104",
  painelLeads: "719c843ca5f3ea4a7be7eed1e0e96f2f4282f4abd70d01d977629f5a409e8cb7",
  entrarCorretor: "809f0973571cb599855c9b0e30e85bce80be6fcab32dc451fe13e0c12798de30",
};

const sha = (s) => createHash("sha256").update(s).digest("hex");
async function seedOtp(destino, codigo) {
  const hash = sha(`${destino}:${codigo}:${SECRET}`);
  await sql`update otp_codes set consumido = true where destino = ${destino} and consumido = false`;
  await sql`insert into otp_codes (destino, canal, codigo_hash, expira_em)
            values (${destino}, 'whatsapp', ${hash}, now() + interval '10 minutes')`;
}

const jar = {};
function setJar(res) {
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const [k, v] = c.split(";")[0].split("=");
    jar[k.trim()] = v;
  }
}
const cookieHeader = () =>
  Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

async function call(name, data, method = "POST") {
  const url = `${BASE}/_serverFn/${IDS[name]}`;
  const headers = {
    "x-tsr-serverFn": "true",
    origin: BASE,
    accept: "application/json",
    cookie: cookieHeader(),
  };
  let body;
  if (method === "POST") {
    headers["content-type"] = "application/json";
    body = JSON.stringify(await toJSONAsync({ data }));
  }
  const res = await fetch(url, { method, headers, body });
  setJar(res);
  const text = await res.text();
  const env = fromCrossJSON(JSON.parse(text), { refs: new Map() });
  if (env?.error) throw new Error(`${name}: ${env.error?.message ?? JSON.stringify(env.error)}`);
  if (!res.ok) throw new Error(`${name} HTTP ${res.status}`);
  return env?.result;
}

let fails = 0;
const assert = (c, m) => {
  console.log(`${c ? "OK " : "XX "} ${m}`);
  if (!c) fails++;
};

const LEAD_WA = "5561988887777";
const ADMIN_WA = process.env.ADMIN_WHATSAPP ?? "556199449983";

try {
  // limpeza
  await sql`delete from interacoes where lead_id in (select id from leads where whatsapp=${LEAD_WA})`;
  await sql`delete from leads where whatsapp=${LEAD_WA}`;
  await sql`delete from sessoes`;
  await sql`delete from usuarios where whatsapp=${LEAD_WA}`;
  await sql`delete from otp_codes`;

  console.log("== FLUXO LEAD ==");
  const r1 = await call("enviarOtp", { destino: LEAD_WA, canal: "whatsapp" });
  assert(r1?.ok === true, "enviarOtp responde ok (tenta entrega via Evolution)");

  // código errado é rejeitado
  await seedOtp(LEAD_WA, "111111");
  let rejeitou = false;
  try {
    await call("confirmarLead", {
      nome: "X",
      whatsapp: LEAD_WA,
      orcamentoMin: 0,
      orcamentoMax: 1,
      regiao: "x",
      tipo: "apartamento",
      quartos: 1,
      desejo: "",
      codigo: "000000",
    });
  } catch {
    rejeitou = true;
  }
  assert(rejeitou, "confirmarLead rejeita código incorreto");

  await seedOtp(LEAD_WA, "123456");
  const conf = await call("confirmarLead", {
    nome: "Cliente Teste E2E",
    whatsapp: LEAD_WA,
    orcamentoMin: 2000000,
    orcamentoMax: 5000000,
    regiao: "Itaim",
    tipo: "apartamento",
    quartos: 3,
    desejo: "vista livre",
    codigo: "123456",
  });
  assert(conf?.lead?.id, `Lead cadastrado + sessao aberta (${conf?.lead?.nome})`);
  assert(!!jar["em_session"], "Cookie de sessao httpOnly setado");

  const meResp = await call("me", undefined, "GET");
  assert(
    meResp?.usuario?.papel === "lead",
    `me() reconhece sessao (papel=${meResp?.usuario?.papel})`,
  );

  const feed = await call("feedImoveis", undefined, "GET");
  assert(feed?.imoveis?.length === 6, `Feed traz imoveis do banco (${feed?.imoveis?.length})`);

  await call("registrarInteracao", { imovelId: feed.imoveis[0].id, acao: "like" });
  const feed2 = await call("feedImoveis", undefined, "GET");
  assert(
    feed2?.imoveis?.length === 5 && feed2?.curtidos === 1,
    `Like persistido (restam ${feed2?.imoveis?.length}, curtidos ${feed2?.curtidos})`,
  );

  const jarLead = { ...jar };

  console.log("\n== FLUXO CORRETOR ==");
  for (const k of Object.keys(jar)) delete jar[k];
  await seedOtp(ADMIN_WA, "654321");
  const login = await call("entrarCorretor", { whatsapp: ADMIN_WA, codigo: "654321" });
  assert(
    login?.usuario?.papel === "corretor",
    `Login corretor OK (papel=${login?.usuario?.papel})`,
  );

  const painel = await call("painelLeads", undefined, "GET");
  assert(
    painel?.leads?.some((l) => l.whatsapp === LEAD_WA),
    `Painel enxerga o lead (${painel?.leads?.length} leads)`,
  );
  assert(
    painel?.interacoes?.some((i) => i.acao === "like"),
    `Painel enxerga o like (${painel?.interacoes?.length} interacoes)`,
  );

  console.log("\n== SEGURANCA ==");
  for (const k of Object.keys(jar)) delete jar[k];
  Object.assign(jar, jarLead);
  let bloqueou = false;
  try {
    await call("painelLeads", undefined, "GET");
  } catch {
    bloqueou = true;
  }
  assert(bloqueou, "Painel bloqueia sessao de lead (requireCorretor)");
} catch (e) {
  console.error("ERRO FATAL:", e.message);
  fails++;
} finally {
  await sql.end();
}

console.log(`\n${fails === 0 ? "TODOS OS TESTES PASSARAM" : `${fails} FALHA(S)`}`);
process.exit(fails === 0 ? 0 : 1);
