import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Heart, X, MapPin, Ruler, BedDouble, Car } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMmStore } from "@/hooks/use-mm-store";
import {
  brlCompacto,
  novoId,
  rotuloTipo,
  store,
  type Imovel,
  type Lead,
  imoveisIniciais,
} from "@/lib/matchmaker";

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "Sua seleção de imóveis | Matchmaker Alto Padrão" },
      {
        name: "description",
        content:
          "Deslize pelos imóveis selecionados: curta os que quer visitar e o corretor entra em contato.",
      },
      { property: "og:title", content: "Sua seleção de imóveis | Matchmaker Alto Padrão" },
      {
        property: "og:description",
        content: "Deslize, curta e agende sua visita com o corretor.",
      },
    ],
  }),
  component: Feed,
});

function Feed() {
  const imoveis = useMmStore<Imovel[]>(() => store.getImoveis(), imoveisIniciais);
  const leads = useMmStore<Lead[]>(() => store.getLeads(), []);
  const leadId = useMmStore<string | null>(() => store.getLeadAtualId(), null);
  const lead = useMemo(() => leads.find((l) => l.id === leadId) ?? null, [leads, leadId]);

  const [indice, setIndice] = useState(0);
  const [drag, setDrag] = useState(0);
  const [saindo, setSaindo] = useState<"like" | "dislike" | null>(null);
  const inicio = useRef<number | null>(null);

  const atual = imoveis[indice];
  const proximo = imoveis[indice + 1];
  const curtidos = useMmStore(
    () => store.getInteracoes().filter((i) => i.acao === "like" && i.leadId === store.getLeadAtualId()).length,
    0,
  );

  function decidir(acao: "like" | "dislike") {
    if (!atual || saindo) return;
    setSaindo(acao);
    window.setTimeout(() => {
      store.addInteracao({
        id: novoId(),
        leadId: leadId ?? "anonimo",
        imovelId: atual.id,
        acao,
        criadoEm: Date.now(),
      });
      if (acao === "like") {
        toast.success("Corretor avisado", {
          description: `Enviamos seu interesse em ${atual.titulo}.`,
        });
      }
      setSaindo(null);
      setDrag(0);
      setIndice((i) => i + 1);
    }, 220);
  }

  function onDown(e: React.PointerEvent) {
    inicio.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    if (inicio.current === null) return;
    setDrag(e.clientX - inicio.current);
  }
  function onUp() {
    if (inicio.current === null) return;
    const d = drag;
    inicio.current = null;
    if (d > 90) decidir("like");
    else if (d < -90) decidir("dislike");
    else setDrag(0);
  }

  const deslocamento = saindo ? (saindo === "like" ? 500 : -500) : drag;
  const rotacao = deslocamento / 22;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <header className="flex items-center justify-between px-6 pb-4 pt-6">
        <div>
          <p className="eyebrow">Seleção curada</p>
          <h1 className="text-2xl">{lead ? `Olá, ${lead.nome.split(" ")[0]}` : "Sua seleção"}</h1>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl text-gold">{curtidos}</p>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">visitas</p>
        </div>
      </header>

      <section className="relative flex-1 px-5">
        <div className="relative h-[560px] select-none">
          {!atual && (
            <div className="flex h-full flex-col items-center justify-center rounded-xl border border-border bg-card px-8 text-center card-shadow">
              <h2 className="text-3xl">Tudo visto</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Seu corretor já recebeu os imóveis que você curtiu e vai te chamar no WhatsApp com
                as opções mais próximas do seu perfil.
              </p>
              <Button asChild variant="outline" className="mt-6">
                <Link to="/corretor">Ver painel do corretor</Link>
              </Button>
            </div>
          )}

          {proximo && (
            <CardImovel
              imovel={proximo}
              className="absolute inset-0 scale-[0.96] opacity-70"
              lazy
            />
          )}

          {atual && (
            <div
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              className="absolute inset-0 touch-pan-y"
              style={{
                transform: `translateX(${deslocamento}px) rotate(${rotacao}deg)`,
                transition: inicio.current === null ? "transform 220ms ease-out" : "none",
              }}
            >
              <CardImovel imovel={atual} drag={deslocamento} />
            </div>
          )}
        </div>
      </section>

      <div className="flex items-center justify-center gap-6 py-7">
        <button
          onClick={() => decidir("dislike")}
          disabled={!atual}
          aria-label="Não é isso"
          className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:opacity-40"
        >
          <X className="h-6 w-6" />
        </button>
        <button
          onClick={() => decidir("like")}
          disabled={!atual}
          aria-label="Quero visitar"
          className="flex h-20 w-20 items-center justify-center rounded-full bg-gold text-gold-foreground transition-transform hover:scale-105 disabled:opacity-40"
        >
          <Heart className="h-7 w-7" />
        </button>
      </div>
    </main>
  );
}

function CardImovel({
  imovel,
  drag = 0,
  className,
  lazy,
}: {
  imovel: Imovel;
  drag?: number;
  className?: string;
  lazy?: boolean;
}) {
  return (
    <article
      className={cn(
        "relative h-full overflow-hidden rounded-xl border border-border bg-card card-shadow",
        className,
      )}
    >
      <img
        src={imovel.foto}
        alt={`${imovel.titulo} em ${imovel.bairro}`}
        width={1024}
        height={1280}
        loading={lazy ? "lazy" : undefined}
        draggable={false}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

      {drag > 40 && (
        <span className="absolute left-5 top-5 rounded-full border border-gold bg-gold-soft px-4 py-1 text-xs uppercase tracking-widest text-accent-foreground">
          Quero visitar
        </span>
      )}
      {drag < -40 && (
        <span className="absolute right-5 top-5 rounded-full border border-border bg-card px-4 py-1 text-xs uppercase tracking-widest text-muted-foreground">
          Não é isso
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 space-y-3 p-6 text-primary-foreground">
        <p className="text-[11px] uppercase tracking-[0.22em] opacity-70">
          {rotuloTipo[imovel.tipo]}
        </p>
        <h2 className="text-3xl leading-tight">{imovel.titulo}</h2>
        <p className="font-display text-2xl text-gold">{brlCompacto(imovel.preco)}</p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs opacity-85">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {imovel.bairro}, {imovel.cidade}
          </span>
          <span className="flex items-center gap-1">
            <Ruler className="h-3.5 w-3.5" /> {imovel.area} m²
          </span>
          {imovel.quartos > 0 && (
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" /> {imovel.quartos} quartos
            </span>
          )}
          {imovel.vagas > 0 && (
            <span className="flex items-center gap-1">
              <Car className="h-3.5 w-3.5" /> {imovel.vagas} vagas
            </span>
          )}
        </div>

        <ul className="flex flex-wrap gap-2 pt-1">
          {imovel.diferenciais.slice(0, 3).map((d) => (
            <li
              key={d}
              className="rounded-full border border-gold/50 px-3 py-1 text-[11px] tracking-wide"
            >
              {d}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
