import img1 from "@/assets/imovel-1.jpg";
import img2 from "@/assets/imovel-2.jpg";
import img3 from "@/assets/imovel-3.jpg";
import img4 from "@/assets/imovel-4.jpg";
import img5 from "@/assets/imovel-5.jpg";
import img6 from "@/assets/imovel-6.jpg";

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

const K_LEADS = "mm.leads";
const K_INTER = "mm.interacoes";
const K_IMOVEIS = "mm.imoveis";
const K_ATUAL = "mm.leadAtual";

export const imoveisIniciais: Imovel[] = [
  {
    id: "p1",
    titulo: "Cobertura Panorâmica Itaim",
    bairro: "Itaim Bibi",
    cidade: "São Paulo",
    preco: 8900000,
    area: 420,
    quartos: 4,
    vagas: 5,
    tipo: "apartamento",
    foto: img1,
    diferenciais: ["Vista 360° da cidade", "Pé-direito duplo", "Automação completa"],
  },
  {
    id: "p2",
    titulo: "Casa Contemporânea com Piscina",
    bairro: "Alphaville",
    cidade: "Barueri",
    preco: 6400000,
    area: 580,
    quartos: 5,
    vagas: 6,
    tipo: "casa",
    foto: img2,
    diferenciais: ["Piscina raia aquecida", "Condomínio fechado", "Home theater"],
  },
  {
    id: "p3",
    titulo: "Apartamento Jardins Assinado",
    bairro: "Jardins",
    cidade: "São Paulo",
    preco: 4250000,
    area: 210,
    quartos: 3,
    vagas: 3,
    tipo: "apartamento",
    foto: img3,
    diferenciais: ["Projeto de interiores incluso", "Varanda gourmet", "Andar alto"],
  },
  {
    id: "p4",
    titulo: "Duplex Frente Mar",
    bairro: "Riviera",
    cidade: "Bertioga",
    preco: 5100000,
    area: 260,
    quartos: 4,
    vagas: 4,
    tipo: "apartamento",
    foto: img4,
    diferenciais: ["Frente mar total", "Terraço com spa", "Mobiliado"],
  },
  {
    id: "p5",
    titulo: "Laje Corporativa Faria Lima",
    bairro: "Pinheiros",
    cidade: "São Paulo",
    preco: 12500000,
    area: 900,
    quartos: 0,
    vagas: 18,
    tipo: "comercial",
    foto: img5,
    diferenciais: ["Certificação LEED", "Lobby em mármore", "Alta liquidez"],
  },
  {
    id: "p6",
    titulo: "Terreno em Condomínio de Montanha",
    bairro: "Vale das Videiras",
    cidade: "Petrópolis",
    preco: 2300000,
    area: 3200,
    quartos: 0,
    vagas: 0,
    tipo: "terreno",
    foto: img6,
    diferenciais: ["Vista para o vale", "Nascente própria", "Projeto aprovado"],
  },
];

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("mm:update"));
}

export const store = {
  getImoveis: () => read<Imovel[]>(K_IMOVEIS, imoveisIniciais),
  setImoveis: (v: Imovel[]) => write(K_IMOVEIS, v),
  getLeads: () => read<Lead[]>(K_LEADS, []),
  addLead: (lead: Lead) => {
    write(K_LEADS, [lead, ...read<Lead[]>(K_LEADS, [])]);
    write(K_ATUAL, lead.id);
  },
  getLeadAtualId: () => read<string | null>(K_ATUAL, null),
  setLeadAtualId: (id: string | null) => write(K_ATUAL, id),
  getInteracoes: () => read<Interacao[]>(K_INTER, []),
  addInteracao: (i: Interacao) => write(K_INTER, [i, ...read<Interacao[]>(K_INTER, [])]),
  reset: () => {
    [K_LEADS, K_INTER, K_IMOVEIS, K_ATUAL].forEach((k) => window.localStorage.removeItem(k));
    window.dispatchEvent(new Event("mm:update"));
  },
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

export const novoId = () => Math.random().toString(36).slice(2, 10);
