import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { novoId, rotuloTipo, store, type TipoImovel } from "@/lib/matchmaker";
import heroImg from "@/assets/imovel-1.jpg";

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
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [faixa, setFaixa] = useState(1);
  const [regiao, setRegiao] = useState("");
  const [tipo, setTipo] = useState<TipoImovel>("apartamento");
  const [quartos, setQuartos] = useState(3);
  const [desejo, setDesejo] = useState("");

  const valido = nome.trim().length > 1 && whatsapp.trim().length >= 8 && regiao.trim().length > 1;

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!valido) return;
    const f = faixas[faixa] ?? faixas[1]!;
    store.addLead({
      id: novoId(),
      nome: nome.trim(),
      whatsapp: whatsapp.trim(),
      orcamentoMin: f.min,
      orcamentoMax: f.max,
      regiao: regiao.trim(),
      tipo,
      quartos,
      desejo: desejo.trim(),
      criadoEm: Date.now(),
    });
    navigate({ to: "/feed" });
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-background pb-16">
      <header className="relative h-64 overflow-hidden">
        <img
          src={heroImg}
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

      <form onSubmit={enviar} className="space-y-7 px-6 pt-8">
        <p className="text-sm text-muted-foreground">
          Seis perguntas rápidas. Em seguida você desliza por uma seleção feita para o seu perfil.
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

        <Button type="submit" size="lg" className="w-full" disabled={!valido}>
          Ver minha seleção
        </Button>

        <p className="pt-2 text-center text-xs text-muted-foreground">
          É corretor?{" "}
          <Link to="/corretor" className="text-gold underline underline-offset-4">
            Acessar painel
          </Link>
        </p>
      </form>
    </main>
  );
}
