import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, X, Pencil, Plus, MessageCircle, LogOut } from "lucide-react";
import { toast } from "sonner";
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
import { brl, brlCompacto, rotuloTipo, type Imovel } from "@/lib/matchmaker";
import {
  enviarOtp,
  entrarCorretor,
  logout,
  me,
  painelImoveis,
  painelLeads,
  salvarImovel,
} from "@/lib/api";

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
  component: Corretor,
});

function Corretor() {
  const sessao = useQuery({ queryKey: ["me"], queryFn: () => me() });
  if (sessao.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Carregando…
      </div>
    );
  }
  const ehCorretor = sessao.data?.usuario?.papel === "corretor";
  return ehCorretor ? <Painel /> : <LoginCorretor />;
}

// ---------------------------- Login (OTP) ----------------------------
function LoginCorretor() {
  const qc = useQueryClient();
  const [etapa, setEtapa] = useState<"whats" | "otp">("whats");
  const [whatsapp, setWhatsapp] = useState("");
  const [codigo, setCodigo] = useState("");

  const otp = useMutation({
    mutationFn: () => enviarOtp({ data: { destino: whatsapp.trim(), canal: "whatsapp" } }),
    onSuccess: () => {
      setEtapa("otp");
      toast.success("Código enviado", { description: "Confira seu WhatsApp." });
    },
    onError: (e: Error) => toast.error("Falha ao enviar", { description: e.message }),
  });
  const entrar = useMutation({
    mutationFn: () =>
      entrarCorretor({ data: { whatsapp: whatsapp.trim(), codigo: codigo.trim() } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
    onError: (e: Error) => toast.error("Não foi possível entrar", { description: e.message }),
  });

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-md place-items-center bg-background px-6">
      <div className="w-full space-y-6">
        <div className="text-center">
          <p className="eyebrow">Painel do corretor</p>
          <h1 className="mt-1 text-3xl">Acesso restrito</h1>
        </div>
        <div className="gold-rule" />
        {etapa === "whats" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (whatsapp.trim().length >= 8) otp.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="w">WhatsApp do corretor</Label>
              <Input
                id="w"
                inputMode="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(61) 99999-0000"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={whatsapp.trim().length < 8 || otp.isPending}
            >
              {otp.isPending ? "Enviando…" : "Receber código"}
            </Button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (codigo.trim().length >= 4) entrar.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="c">Código de acesso</Label>
              <Input
                id="c"
                inputMode="numeric"
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="text-center text-2xl tracking-[0.5em]"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={codigo.trim().length < 4 || entrar.isPending}
            >
              {entrar.isPending ? "Entrando…" : "Entrar"}
            </Button>
            <button
              type="button"
              className="w-full text-center text-xs text-muted-foreground underline underline-offset-4"
              onClick={() => setEtapa("whats")}
            >
              Usar outro número
            </button>
          </form>
        )}
        <p className="text-center text-xs text-muted-foreground">
          <Link to="/" className="text-gold underline underline-offset-4">
            Abrir a experiência do cliente
          </Link>
        </p>
      </div>
    </main>
  );
}

// ---------------------------- Painel ----------------------------
function Painel() {
  const qc = useQueryClient();
  const imoveisQ = useQuery({ queryKey: ["painel-imoveis"], queryFn: () => painelImoveis() });
  const leadsQ = useQuery({ queryKey: ["painel-leads"], queryFn: () => painelLeads() });

  const imoveis = imoveisQ.data ?? [];
  const leads = leadsQ.data?.leads ?? [];
  const interacoes = leadsQ.data?.interacoes ?? [];
  const likes = interacoes.filter((i) => i.acao === "like");

  const sair = useMutation({
    mutationFn: () => logout(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-background pb-16">
      <header className="border-b border-border px-6 pb-5 pt-7">
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow">Painel do corretor</p>
            <h1 className="mt-1 text-3xl">Interesses em tempo real</h1>
          </div>
          <Button variant="ghost" size="icon" aria-label="Sair" onClick={() => sair.mutate()}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
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
              <div key={i.id} className="rounded-lg border border-border bg-card p-4 card-shadow">
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
          <FormImovel />
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
                  {brl(imovel.preco)} · {imovel.area} m² · {imovel.quartos} quartos · {imovel.vagas}{" "}
                  vagas
                </p>
                <p className="text-xs text-muted-foreground">
                  {imovel.bairro}, {imovel.cidade}
                </p>
              </div>
              <FormImovel editar={imovel} />
            </div>
          ))}
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

const IMOVEL_VAZIO = {
  titulo: "",
  bairro: "",
  cidade: "",
  preco: 0,
  area: 0,
  quartos: 0,
  vagas: 0,
  tipo: "apartamento" as const,
  foto: "/imoveis/imovel-1.jpg",
  diferenciais: [] as string[],
};

function FormImovel({ editar }: { editar?: Imovel }) {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState(() => editar ?? IMOVEL_VAZIO);
  const [difs, setDifs] = useState((editar?.diferenciais ?? []).join(", "));

  const salvar = useMutation({
    mutationFn: () =>
      salvarImovel({
        data: {
          ...(editar ? { id: editar.id } : {}),
          titulo: form.titulo,
          bairro: form.bairro,
          cidade: form.cidade,
          preco: Number(form.preco) || 0,
          area: Number(form.area) || 0,
          quartos: Number(form.quartos) || 0,
          vagas: Number(form.vagas) || 0,
          tipo: form.tipo,
          foto: form.foto || "/imoveis/imovel-1.jpg",
          diferenciais: difs
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean),
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["painel-imoveis"] });
      setAberto(false);
      toast.success(editar ? "Imóvel atualizado" : "Imóvel adicionado");
    },
    onError: (e: Error) => toast.error("Falha ao salvar", { description: e.message }),
  });

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
            label="Foto (URL)"
            value={form.foto}
            onChange={(v) => setForm({ ...form, foto: v })}
          />
          <Campo label="Diferenciais (separados por vírgula)" value={difs} onChange={setDifs} />
        </div>
        <DialogFooter>
          <Button
            onClick={() => salvar.mutate()}
            disabled={!form.titulo.trim() || salvar.isPending}
          >
            {salvar.isPending ? "Salvando…" : "Salvar"}
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
