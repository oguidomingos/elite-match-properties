# Deploy

**Produção:** https://elite-match-properties.vercel.app/ (Vercel, SSR)

O app é TanStack Start (SSR/Nitro). Deploy roda o build SSR nativo — sem
prerender/estático.

## Vercel (recomendado)

```sh
bun install
NITRO_PRESET=vercel bun run build          # gera .vercel/output (Build Output API)
vercel deploy --prebuilt --prod --scope <team>
```

O `--prebuilt` sobe o `.vercel/output` direto, evitando mis-detecção de framework.

## GitHub Pages — não funciona

Pages só serve estático. Tentar servir o HTML SSR como arquivo quebra a
hidratação do TanStack (stream barrier + estado deidratado esperam o server SSR),
então a navegação client (ex.: "Ver minha seleção" → `/feed`) trava na 1ª página.
A branch `gh-pages` hoje só **redireciona** para o deploy Vercel.

O preset `static`/SPA do toolchain Lovable também falha no prerender
(procura `dist/server/server.js`, mas o Nitro emite em `.output/`).

## Notas

- App é 100% client-side (store em sessionStorage, sem backend).
- `vite.config.ts` aceita `GH_PAGES_BASE` p/ subpath; não usado no deploy Vercel (raiz).
