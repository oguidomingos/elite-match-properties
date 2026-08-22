import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, X, Pencil, Plus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMmStore } from "@/hooks/use-mm-store";
import {
  brl,
  brlCompacto,
  imoveisIniciais,
  novoId,
  rotuloTipo,
  store,
  type Imovel,
  type Interacao,
  type Lead,
} from "@/lib/matchmaker";

export const Route = createFileRoute("/corretor")({
  head: () => ({
    meta: [
      { title: "Painel do corretor | Matchmaker Alto Padrão" },
      {
        name: "description",
        content:
          "Acompanhe leads, likes e dislikes em tempo real e gerencie o portfólio de imóveis de alto padrão.",
      },
      { property: "og:title", content: "Painel do corretor | Matchmaker Alto Padrão" },
      {
        property: "og:description",
        content: "Leads quentes com o gancho certo para o primeiro contato.",
      },
    ],
  }),
  component: Painel,
});

function Painel() {
  const imoveis = useMmStore<Imovel[]>(() => store.getImoveis(), imoveisIniciais);
  const leads = useMmStore<Lead[]>(() => store.getLeads(), []);
  const interacoes = useMmStore<Interacao[]>(() => store.getInteracoes(), []);

  const likes = interacoes.filter((i) => i.acao === "like");

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-background pb-16">
      <header className="border-b border-border px-6 pb-5 pt-7">
        <p className="eyebrow">Painel do corretor</p>
        <h1 className="mt-1 text-3xl">Interesses em tempo real</h1>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <Metrica valor={leads.length} rotulo="leads" />
          <Metrica valor={likes.length} rotulo="likes" />
          <Metrica valor={imoveis.length} rotulo="imóveis" />
        </div>
      </header>

      <Tabs defaultValue="alertas" className="px-6 pt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="imoveis">Imóveis</TabsTrigger>
        </TabsList>

        <TabsContent value="alertas" className="space-y-3 pt-6">
          {likes.length === 0 && <Vazio texto="Nenhum like ainda. Envie o link para um cliente." />}
          {likes.map((i) => {
            const lead = leads.find((l) => l.id === i.leadId);
            const imovel = imoveis.find((p) => p.id === i.imovelId);
            if (!imovel) return null;
            return (
              <div
                key={i.id}
                className="rounded-lg border border-border bg-card p-4 card-shadow"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={imovel.foto}
                    alt={imovel.titulo}
                    width={1024}
                    height={1280}
                    loading="lazy"
                    className="h-16 w-16 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">{lead?.nome ?? "Visitante"}</span> quer
                      visitar
                    </p>
                    <p className="truncate font-display text-lg">{imovel.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {brlCompacto(imovel.preco)} · {imovel.bairro} ·{" "}
                      {new Date(i.criadoEm).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                {lead?.desejo && (
                  <p className="mt-3 border-l-2 border-gold pl-3 text-xs italic text-muted-foreground">
                    “{lead.desejo}”
                  </p>
                )}
                {lead && (
                  <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                    <a
                      href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Olá ${lead.nome.split(" ")[0]}, vi que você se interessou pelo ${imovel.titulo} no ${imovel.bairro}. Posso reservar um horário de visita?`,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" /> Chamar no WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="leads" className="space-y-3 pt-6">
          {leads.length === 0 && <Vazio texto="Nenhum lead cadastrado ainda." />}
          {leads.map((lead) => {
            const hist = interacoes.filter((i) => i.leadId === lead.id);
            return (
              <div key={lead.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-xl">{lead.nome}</h2>
                  <span className="text-xs text-muted-foreground">{lead.whatsapp}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {rotuloTipo[lead.tipo]} · {lead.quartos} quartos · {lead.regiao} ·{" "}
                  {brlCompacto(lead.orcamentoMin)} a {brlCompacto(lead.orcamentoMax)}
                </p>
                {lead.desejo && (
                  <p className="mt-3 border-l-2 border-gold pl-3 text-xs italic text-muted-foreground">
                    “{lead.desejo}”
                  </p>
                )}
                <ul className="mt-3 space-y-1">
                  {hist.length === 0 && (
                    <li className="text-xs text-muted-foreground">Ainda não avaliou imóveis.</li>
                  )}
                  {hist.map((i) => {
                    const imovel = imoveis.find((p) => p.id === i.imovelId);
                    return (
                      <li key={i.id} className="flex items-center gap-2 text-xs">
                        {i.acao === "like" ? (
                          <Heart className="h-3.5 w-3.5 text-gold" />
                        ) : (
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span
                          className={
                            i.acao === "like" ? "text-foreground" : "text-muted-foreground"
                          }
                        >
                          {imovel?.titulo ?? "Imóvel removido"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="imoveis" className="space-y-3 pt-6">
          <FormImovel imoveis={imoveis} />
          {imoveis.map((imovel) => (
            <div
              key={imovel.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              <img
                src={imovel.foto}
                alt={imovel.titulo}
                width={1024}
                height={1280}
                loading="lazy"
                className="h-16 w-16 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg">{imovel.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {brl(imovel.preco)} · {imovel.area} m² · {imovel.quartos} quartos ·{" "}
                  {imovel.vagas} vagas
                </p>
                <p className="text-xs text-muted-foreground">
                  {imovel.bairro}, {imovel.cidade}
                </p>
              </div>
              <FormImovel imoveis={imoveis} editar={imovel} />
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => store.reset()}
          >
            Reiniciar dados do protótipo
          </Button>
        </TabsContent>
      </Tabs>

      <p className="px-6 pt-8 text-center text-xs text-muted-foreground">
        <Link to="/" className="text-gold underline underline-offset-4">
          Abrir a experiência do cliente
        </Link>
      </p>
    </main>
  );
}

function Metrica({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="rounded-lg border border-border bg-card py-3">
      <p className="font-display text-2xl text-gold">{valor}</p>
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{rotulo}</p>
    </div>
  );
}

function Vazio({ texto }: { texto: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
      {texto}
    </p>
  );
}

function FormImovel({ imoveis, editar }: { imoveis: Imovel[]; editar?: Imovel }) {
  const [aberto, setAberto] = useState(false);
  const base: Imovel = editar ?? {
    id: novoId(),
    titulo: "",
    bairro: "",
    cidade: "",
    preco: 0,
    area: 0,
    quartos: 0,
    vagas: 0,
    tipo: "apartamento",
    foto: imoveisIniciais[0]!.foto,
    diferenciais: [],
  };
  const [form, setForm] = useState<Imovel>(base);
  const [difs, setDifs] = useState(base.diferenciais.join(", "));

  function salvar() {
    const atualizado: Imovel = {
      ...form,
      diferenciais: difs
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean),
    };
    const existe = imoveis.some((i) => i.id === atualizado.id);
    store.setImoveis(
      existe ? imoveis.map((i) => (i.id === atualizado.id ? atualizado : i)) : [...imoveis, atualizado],
    );
    setAberto(false);
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        {editar ? (
          <Button variant="ghost" size="icon" aria-label={`Editar ${editar.titulo}`}>
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Adicionar imóvel
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {editar ? "Editar imóvel" : "Novo imóvel"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Campo
            label="Título"
            value={form.titulo}
            onChange={(v) => setForm({ ...form, titulo: v })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Campo
              label="Bairro"
              value={form.bairro}
              onChange={(v) => setForm({ ...form, bairro: v })}
            />
            <Campo
              label="Cidade"
              value={form.cidade}
              onChange={(v) => setForm({ ...form, cidade: v })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo
              label="Preço (R$)"
              type="number"
              value={String(form.preco)}
              onChange={(v) => setForm({ ...form, preco: Number(v) })}
            />
            <Campo
              label="Área (m²)"
              type="number"
              value={String(form.area)}
              onChange={(v) => setForm({ ...form, area: Number(v) })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo
              label="Quartos"
              type="number"
              value={String(form.quartos)}
              onChange={(v) => setForm({ ...form, quartos: Number(v) })}
            />
            <Campo
              label="Vagas"
              type="number"
              value={String(form.vagas)}
              onChange={(v) => setForm({ ...form, vagas: Number(v) })}
            />
          </div>
          <Campo
            label="Diferenciais (separados por vírgula)"
            value={difs}
            onChange={setDifs}
          />
        </div>
        <DialogFooter>
          <Button onClick={salvar} disabled={!form.titulo.trim()}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Campo({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
