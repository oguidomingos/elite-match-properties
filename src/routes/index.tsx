import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { rotuloTipo, type TipoImovel } from "@/lib/matchmaker";
import { confirmarLead, enviarOtp } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Encontre seu imóvel ideal | Matchmaker Alto Padrão" },
      {
        name: "description",
        content:
          "Responda 6 perguntas rápidas e receba uma seleção curada de imóveis de alto padrão para deslizar e escolher.",
      },
      { property: "og:title", content: "Encontre seu imóvel ideal | Matchmaker Alto Padrão" },
      {
        property: "og:description",
        content: "Seleção curada de imóveis de alto padrão, feita para o seu perfil.",
      },
    ],
  }),
  component: Cadastro,
});

const faixas = [
  { label: "Até R$ 2 mi", min: 0, max: 2_000_000 },
  { label: "R$ 2 mi – R$ 5 mi", min: 2_000_000, max: 5_000_000 },
  { label: "R$ 5 mi – R$ 10 mi", min: 5_000_000, max: 10_000_000 },
  { label: "Acima de R$ 10 mi", min: 10_000_000, max: 99_000_000 },
];

const tipos: TipoImovel[] = ["casa", "apartamento", "terreno", "comercial"];
const quartosOpts = [1, 2, 3, 4, 5];

function Chip({
  ativo,
  children,
  onClick,
}: {
  ativo: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm transition-colors",
        ativo
          ? "border-gold bg-gold-soft text-accent-foreground"
          : "border-border bg-card text-muted-foreground hover:border-gold/50",
      )}
    >
      {children}
    </button>
  );
}

function Cadastro() {
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState<"form" | "otp">("form");
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [faixa, setFaixa] = useState(1);
  const [regiao, setRegiao] = useState("");
  const [tipo, setTipo] = useState<TipoImovel>("apartamento");
  const [quartos, setQuartos] = useState(3);
  const [desejo, setDesejo] = useState("");
  const [codigo, setCodigo] = useState("");

  const valido = nome.trim().length > 1 && whatsapp.trim().length >= 8 && regiao.trim().length > 1;

  const otp = useMutation({
    mutationFn: () => enviarOtp({ data: { destino: whatsapp.trim(), canal: "whatsapp" } }),
    onSuccess: () => {
      setEtapa("otp");
      toast.success("Código enviado", { description: "Confira seu WhatsApp." });
    },
    onError: (e: Error) =>
      toast.error("Não foi possível enviar o código", { description: e.message }),
  });

  const confirmar = useMutation({
    mutationFn: () => {
      const f = faixas[faixa] ?? faixas[1]!;
      return confirmarLead({
        data: {
          nome: nome.trim(),
          whatsapp: whatsapp.trim(),
          orcamentoMin: f.min,
          orcamentoMax: f.max,
          regiao: regiao.trim(),
          tipo,
          quartos,
          desejo: desejo.trim(),
          codigo: codigo.trim(),
        },
      });
    },
    onSuccess: () => navigate({ to: "/feed" }),
    onError: (e: Error) => toast.error("Código inválido", { description: e.message }),
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-background pb-16">
      <header className="relative h-64 overflow-hidden">
        <img
          src="/imoveis/imovel-1.jpg"
          alt="Sala de estar de cobertura de alto padrão com vista para a cidade"
          width={1024}
          height={1280}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-5 left-6 right-6">
          <p className="eyebrow">Curadoria privada</p>
          <h1 className="mt-2 text-4xl leading-tight text-foreground">
            Seu próximo endereço,
            <br />
            <span className="italic text-gold">escolhido a dedo</span>
          </h1>
        </div>
      </header>

      {etapa === "form" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (valido) otp.mutate();
          }}
          className="space-y-7 px-6 pt-8"
        >
          <p className="text-sm text-muted-foreground">
            Seis perguntas rápidas. Confirmamos seu WhatsApp por um código e você desliza por uma
            seleção feita para o seu perfil.
          </p>
          <div className="gold-rule" />

          <div className="space-y-2">
            <Label htmlFor="nome">Nome completo</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Como podemos te chamar?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              inputMode="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="(11) 99999-0000"
            />
          </div>

          <div className="space-y-3">
            <Label>Orçamento</Label>
            <div className="flex flex-wrap gap-2">
              {faixas.map((f, i) => (
                <Chip key={f.label} ativo={faixa === i} onClick={() => setFaixa(i)}>
                  {f.label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="regiao">Região de interesse</Label>
            <Input
              id="regiao"
              value={regiao}
              onChange={(e) => setRegiao(e.target.value)}
              placeholder="Jardins, Itaim, Alphaville…"
            />
          </div>

          <div className="space-y-3">
            <Label>Tipo de imóvel</Label>
            <div className="flex flex-wrap gap-2">
              {tipos.map((t) => (
                <Chip key={t} ativo={tipo === t} onClick={() => setTipo(t)}>
                  {rotuloTipo[t]}
                </Chip>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Quartos desejados</Label>
            <div className="flex flex-wrap gap-2">
              {quartosOpts.map((q) => (
                <Chip key={q} ativo={quartos === q} onClick={() => setQuartos(q)}>
                  {q === 5 ? "5+" : q}
                </Chip>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desejo">O que não pode faltar no seu imóvel ideal?</Label>
            <Textarea
              id="desejo"
              rows={4}
              value={desejo}
              onChange={(e) => setDesejo(e.target.value)}
              placeholder="Vista livre, varanda gourmet, pé-direito alto, silêncio…"
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={!valido || otp.isPending}>
            {otp.isPending ? "Enviando código…" : "Ver minha seleção"}
          </Button>

          <p className="pt-2 text-center text-xs text-muted-foreground">
            É corretor?{" "}
            <Link to="/corretor" className="text-gold underline underline-offset-4">
              Acessar painel
            </Link>
          </p>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (codigo.trim().length >= 4) confirmar.mutate();
          }}
          className="space-y-6 px-6 pt-8"
        >
          <div className="gold-rule" />
          <div className="space-y-2">
            <h2 className="text-2xl">Confirme seu WhatsApp</h2>
            <p className="text-sm text-muted-foreground">
              Enviamos um código de 6 dígitos para{" "}
              <span className="text-foreground">{whatsapp}</span>.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="codigo">Código de acesso</Label>
            <Input
              id="codigo"
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
            size="lg"
            className="w-full"
            disabled={codigo.trim().length < 4 || confirmar.isPending}
          >
            {confirmar.isPending ? "Validando…" : "Ver minha seleção"}
          </Button>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <button
              type="button"
              className="underline underline-offset-4"
              onClick={() => setEtapa("form")}
            >
              Corrigir dados
            </button>
            <button
              type="button"
              className="text-gold underline underline-offset-4 disabled:opacity-50"
              disabled={otp.isPending}
              onClick={() => otp.mutate()}
            >
              Reenviar código
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
