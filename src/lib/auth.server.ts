/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { sql } from "./db.server";
import { normalizeWhatsapp, sendWhatsapp } from "./evolution.server";

const COOKIE = "em_session";
const SECRET = () => process.env["SESSION_SECRET"] ?? "dev-insecure-secret";
const OTP_TTL_MIN = () => Number(process.env["OTP_TTL_MINUTES"] ?? 10);
const SESSION_TTL_DAYS = () => Number(process.env["SESSION_TTL_DAYS"] ?? 30);

export type Papel = "lead" | "corretor";
export type Usuario = {
  id: string;
  nome: string;
  email: string | null;
  whatsapp: string | null;
  papel: Papel;
};

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const hashCodigo = (destino: string, codigo: string) => sha(`${destino}:${codigo}:${SECRET()}`);

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

/** Emite um OTP para whatsapp (ou email) e o envia. Retorna o canal usado. */
export async function requestOtp(destinoRaw: string, canal: "whatsapp" | "email") {
  const destino =
    canal === "whatsapp" ? normalizeWhatsapp(destinoRaw) : destinoRaw.trim().toLowerCase();
  if (canal === "whatsapp" && destino.length < 12) throw new Error("WhatsApp inválido.");
  if (canal === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(destino))
    throw new Error("E-mail inválido.");

  const codigo = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const expira = new Date(Date.now() + OTP_TTL_MIN() * 60_000);

  // Invalida OTPs anteriores do mesmo destino.
  await sql`update otp_codes set consumido = true where destino = ${destino} and consumido = false`;
  await sql`insert into otp_codes (destino, canal, codigo_hash, expira_em)
            values (${destino}, ${canal}, ${hashCodigo(destino, codigo)}, ${expira})`;

  const msg = `Elite Match — seu código de acesso é ${codigo}. Vale por ${OTP_TTL_MIN()} minutos.`;
  if (canal === "whatsapp") {
    const ok = await sendWhatsapp(destino, msg);
    if (!ok && process.env["NODE_ENV"] === "production") {
      // Não vaza o código em prod; loga apenas para operador.
      console.error(`[otp] envio WhatsApp falhou para ${destino}`);
    }
    if (process.env["NODE_ENV"] !== "production") console.log(`[otp:dev] ${destino} => ${codigo}`);
  } else {
    // Sem SMTP configurado: registra para o operador (fallback).
    console.log(`[otp:email] ${destino} => ${codigo}`);
  }
  return { destino, canal };
}

/** Verifica o OTP; cria/recupera o usuário e abre sessão via cookie. */
export async function verifyOtp(
  destinoRaw: string,
  canal: "whatsapp" | "email",
  codigo: string,
): Promise<Usuario> {
  const destino =
    canal === "whatsapp" ? normalizeWhatsapp(destinoRaw) : destinoRaw.trim().toLowerCase();
  const [row] = await sql<any[]>`
    select * from otp_codes
    where destino = ${destino} and consumido = false
    order by criado_em desc limit 1`;

  if (!row) throw new Error("Código não encontrado. Solicite um novo.");
  if (new Date(row.expira_em).getTime() < Date.now()) throw new Error("Código expirado.");
  if (row.tentativas >= 5) throw new Error("Muitas tentativas. Solicite um novo código.");

  if (!safeEqualHex(row.codigo_hash, hashCodigo(destino, codigo.trim()))) {
    await sql`update otp_codes set tentativas = tentativas + 1 where id = ${row.id}`;
    throw new Error("Código incorreto.");
  }
  await sql`update otp_codes set consumido = true where id = ${row.id}`;

  // Upsert do usuário. Papel corretor se o whatsapp estiver na lista de admins.
  const admins = (process.env["ADMIN_WHATSAPP"] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const ehAdmin = canal === "whatsapp" && admins.includes(destino);
  const campo = canal === "whatsapp" ? "whatsapp" : "email";

  const [existente] =
    campo === "whatsapp"
      ? await sql<any[]>`select * from usuarios where whatsapp = ${destino} limit 1`
      : await sql<any[]>`select * from usuarios where email = ${destino} limit 1`;

  let usuario: Usuario;
  if (existente) {
    // Promove a corretor se aplicável; nunca rebaixa.
    if (ehAdmin && existente.papel !== "corretor") {
      const [u] =
        await sql`update usuarios set papel = 'corretor' where id = ${existente.id} returning *`;
      usuario = u as Usuario;
    } else {
      usuario = existente as Usuario;
    }
  } else {
    const papel: Papel = ehAdmin ? "corretor" : "lead";
    const [u] =
      campo === "whatsapp"
        ? await sql`insert into usuarios (whatsapp, papel) values (${destino}, ${papel}) returning *`
        : await sql`insert into usuarios (email, papel) values (${destino}, ${papel}) returning *`;
    usuario = u as Usuario;
  }

  await abrirSessao(usuario.id);
  return usuario;
}

async function abrirSessao(usuarioId: string) {
  const token = randomBytes(32).toString("hex");
  const expira = new Date(Date.now() + SESSION_TTL_DAYS() * 86_400_000);
  await sql`insert into sessoes (token_hash, usuario_id, expira_em) values (${sha(token)}, ${usuarioId}, ${expira})`;
  setCookie(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: (process.env["PUBLIC_ORIGIN"] ?? "").startsWith("https"),
    path: "/",
    maxAge: SESSION_TTL_DAYS() * 86_400,
  });
}

export async function currentUser(): Promise<Usuario | null> {
  const token = getCookie(COOKIE);
  if (!token) return null;
  const [row] = await sql`
    select u.* from sessoes s
    join usuarios u on u.id = s.usuario_id
    where s.token_hash = ${sha(token)} and s.expira_em > now()
    limit 1`;
  return (row as Usuario) ?? null;
}

export async function logout() {
  const token = getCookie(COOKIE);
  if (token) await sql`delete from sessoes where token_hash = ${sha(token)}`;
  deleteCookie(COOKIE, { path: "/" });
}

export async function requireCorretor(): Promise<Usuario> {
  const u = await currentUser();
  if (!u || u.papel !== "corretor") throw new Error("Acesso restrito ao corretor.");
  return u;
}
