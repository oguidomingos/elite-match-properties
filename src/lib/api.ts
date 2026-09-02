/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sql } from "@/lib/db.server";
import {
  requestOtp,
  verifyOtp,
  currentUser,
  requireCorretor,
  logout as doLogout,
} from "@/lib/auth.server";
import { sendWhatsapp } from "@/lib/evolution.server";
import type { Imovel, Lead, Interacao, TipoImovel } from "@/lib/matchmaker";

// ---------- mappers (snake_case do banco -> shape usado na UI) ----------
const mapImovel = (r: any): Imovel => ({
  id: r.id,
  titulo: r.titulo,
  bairro: r.bairro,
  cidade: r.cidade,
  preco: Number(r.preco),
  area: Number(r.area),
  quartos: Number(r.quartos),
  vagas: Number(r.vagas),
  tipo: r.tipo as TipoImovel,
  foto: r.foto,
  diferenciais: r.diferenciais ?? [],
});
const mapLead = (r: any): Lead => ({
  id: r.id,
  nome: r.nome,
  whatsapp: r.whatsapp,
  orcamentoMin: Number(r.orcamento_min),
  orcamentoMax: Number(r.orcamento_max),
  regiao: r.regiao,
  tipo: r.tipo as TipoImovel,
  quartos: Number(r.quartos),
  desejo: r.desejo,
  criadoEm: new Date(r.criado_em).getTime(),
});
const mapInteracao = (r: any): Interacao => ({
  id: r.id,
  leadId: r.lead_id,
  imovelId: r.imovel_id,
  acao: r.acao,
  criadoEm: new Date(r.criado_em).getTime(),
});

const tipoEnum = z.enum(["casa", "apartamento", "terreno", "comercial"]);

// ============================ AUTH ============================
export const enviarOtp = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        destino: z.string().min(3),
        canal: z.enum(["whatsapp", "email"]).default("whatsapp"),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requestOtp(data.destino, data.canal);
    return { ok: true as const };
  });

export const me = createServerFn({ method: "GET" }).handler(async () => {
  const u = await currentUser();
  if (!u) return { usuario: null, lead: null as Lead | null };
  const [lead] =
    await sql`select * from leads where usuario_id = ${u.id} order by criado_em desc limit 1`;
  return { usuario: u, lead: lead ? mapLead(lead) : null };
});

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  await doLogout();
  return { ok: true as const };
});

// Cadastro do lead: valida OTP, abre sessão e grava o lead vinculado ao usuário.
export const confirmarLead = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        nome: z.string().min(2),
        whatsapp: z.string().min(8),
        orcamentoMin: z.number().int().nonnegative(),
        orcamentoMax: z.number().int().positive(),
        regiao: z.string().min(1),
        tipo: tipoEnum,
        quartos: z.number().int().min(0).max(20),
        desejo: z.string().max(2000).default(""),
        codigo: z.string().min(4).max(8),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const usuario = await verifyOtp(data.whatsapp, "whatsapp", data.codigo);
    const [lead] = await sql`
      insert into leads (usuario_id, nome, whatsapp, orcamento_min, orcamento_max, regiao, tipo, quartos, desejo)
      values (${usuario.id}, ${data.nome}, ${usuario.whatsapp ?? data.whatsapp}, ${data.orcamentoMin},
              ${data.orcamentoMax}, ${data.regiao}, ${data.tipo}, ${data.quartos}, ${data.desejo})
      returning *`;
    return { lead: mapLead(lead) };
  });

// Login do corretor: valida OTP e exige papel corretor.
export const entrarCorretor = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ whatsapp: z.string().min(8), codigo: z.string().min(4).max(8) }).parse(d),
  )
  .handler(async ({ data }) => {
    const usuario = await verifyOtp(data.whatsapp, "whatsapp", data.codigo);
    if (usuario.papel !== "corretor") {
      await doLogout();
      throw new Error("Este número não é de um corretor autorizado.");
    }
    return { usuario };
  });

// ============================ FEED (lead) ============================
// Imóveis que o lead atual ainda não avaliou.
export const feedImoveis = createServerFn({ method: "GET" }).handler(async () => {
  const u = await currentUser();
  if (!u) return { imoveis: [] as Imovel[], curtidos: 0 };
  const [lead] = await sql<
    any[]
  >`select id from leads where usuario_id = ${u.id} order by criado_em desc limit 1`;
  if (!lead) return { imoveis: [] as Imovel[], curtidos: 0 };
  const rows = await sql`
    select * from imoveis
    where ativo = true
      and id not in (select imovel_id from interacoes where lead_id = ${lead.id})
    order by criado_em asc`;
  const contagem = await sql<{ n: number }[]>`
    select count(*)::int as n from interacoes where lead_id = ${lead.id} and acao = 'like'`;
  return { imoveis: rows.map(mapImovel), curtidos: Number(contagem[0]?.n ?? 0) };
});

export const registrarInteracao = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ imovelId: z.string().uuid(), acao: z.enum(["like", "dislike"]) }).parse(d),
  )
  .handler(async ({ data }) => {
    const u = await currentUser();
    if (!u) throw new Error("Sessão expirada. Faça o cadastro novamente.");
    const [lead] = await sql<
      any[]
    >`select * from leads where usuario_id = ${u.id} order by criado_em desc limit 1`;
    if (!lead) throw new Error("Cadastro não encontrado.");

    await sql`
      insert into interacoes (lead_id, imovel_id, acao) values (${lead.id}, ${data.imovelId}, ${data.acao})
      on conflict (lead_id, imovel_id) do update set acao = excluded.acao, criado_em = now()`;

    if (data.acao === "like") {
      const [imovel] = await sql<any[]>`select * from imoveis where id = ${data.imovelId}`;
      const corretores = await sql<
        { whatsapp: string }[]
      >`select whatsapp from usuarios where papel = 'corretor' and whatsapp is not null`;
      const texto =
        `🔔 Novo interesse: ${lead.nome} (${lead.whatsapp}) curtiu "${imovel?.titulo}" ` +
        `em ${imovel?.bairro}. Puxe o gancho no WhatsApp.`;
      for (const c of corretores) {
        // não bloqueia a resposta ao usuário em caso de falha de envio
        void sendWhatsapp(c.whatsapp, texto).catch(() => {});
      }
    }
    return { ok: true as const };
  });

// ============================ PAINEL (corretor) ============================
export const painelImoveis = createServerFn({ method: "GET" }).handler(async () => {
  await requireCorretor();
  const rows = await sql`select * from imoveis order by criado_em desc`;
  return rows.map(mapImovel);
});

export const painelLeads = createServerFn({ method: "GET" }).handler(async () => {
  await requireCorretor();
  const leads = await sql`select * from leads order by criado_em desc`;
  const inter = await sql`select * from interacoes order by criado_em desc`;
  return { leads: leads.map(mapLead), interacoes: inter.map(mapInteracao) };
});

export const salvarImovel = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        titulo: z.string().min(1),
        bairro: z.string().default(""),
        cidade: z.string().default(""),
        preco: z.number().int().nonnegative(),
        area: z.number().int().nonnegative(),
        quartos: z.number().int().min(0),
        vagas: z.number().int().min(0),
        tipo: tipoEnum,
        foto: z.string().default(""),
        diferenciais: z.array(z.string()).default([]),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireCorretor();
    if (data.id) {
      const [r] = await sql`
        update imoveis set titulo=${data.titulo}, bairro=${data.bairro}, cidade=${data.cidade},
          preco=${data.preco}, area=${data.area}, quartos=${data.quartos}, vagas=${data.vagas},
          tipo=${data.tipo}, foto=${data.foto}, diferenciais=${data.diferenciais}
        where id=${data.id} returning *`;
      return mapImovel(r);
    }
    const [r] = await sql`
      insert into imoveis (titulo, bairro, cidade, preco, area, quartos, vagas, tipo, foto, diferenciais)
      values (${data.titulo}, ${data.bairro}, ${data.cidade}, ${data.preco}, ${data.area}, ${data.quartos},
              ${data.vagas}, ${data.tipo}, ${data.foto}, ${data.diferenciais})
      returning *`;
    return mapImovel(r);
  });
