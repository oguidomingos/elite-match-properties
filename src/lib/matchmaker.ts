// Tipos e formatadores compartilhados (client-safe). A persistência agora é no
// Postgres via server functions em src/server/api.ts — nada de localStorage.

export type TipoImovel = "casa" | "apartamento" | "terreno" | "comercial";

export type Imovel = {
  id: string;
  titulo: string;
  bairro: string;
  cidade: string;
  preco: number;
  area: number;
  quartos: number;
  vagas: number;
  tipo: TipoImovel;
  foto: string;
  diferenciais: string[];
};

export type Lead = {
  id: string;
  nome: string;
  whatsapp: string;
  orcamentoMin: number;
  orcamentoMax: number;
  regiao: string;
  tipo: TipoImovel;
  quartos: number;
  desejo: string;
  criadoEm: number;
};

export type Interacao = {
  id: string;
  leadId: string;
  imovelId: string;
  acao: "like" | "dislike";
  criadoEm: number;
};

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const brlCompacto = (v: number) =>
  v >= 1_000_000 ? `R$ ${(v / 1_000_000).toFixed(1).replace(".", ",")} mi` : brl(v);

export const rotuloTipo: Record<TipoImovel, string> = {
  casa: "Casa",
  apartamento: "Apartamento",
  terreno: "Terreno",
  comercial: "Comercial",
};
