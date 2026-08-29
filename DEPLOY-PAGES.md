# Deploy — GitHub Pages (site estático)

URL pública: https://oguidomingos.github.io/elite-match-properties/

Este app é TanStack Start (SSR/Nitro). O preset `static`/SPA do toolchain
Lovable falha no prerender (procura `dist/server/server.js`, mas o Nitro
emite em `.output/`). Então o site estático é gerado por **prerender manual**
a partir do build `node-server`, que funciona.

## Como reproduzir

```sh
bun install

# build com base do subpath do Pages de projeto
GH_PAGES_BASE="/elite-match-properties/" NITRO_PRESET=node-server \
  SERVER_PRESET=node-server bun run build

# sobe o server e captura o HTML já renderizado de cada rota
PORT=3999 node .output/server/index.mjs &   # redireciona / -> /elite-match-properties/
curl -sL http://127.0.0.1:3999/elite-match-properties/          > index.html
curl -sL http://127.0.0.1:3999/elite-match-properties/feed      > feed/index.html
curl -sL http://127.0.0.1:3999/elite-match-properties/corretor  > corretor/index.html
cp index.html 404.html          # fallback SPA p/ deep-link e refresh
cp -r .output/public/assets .   # bundles JS/CSS + imagens
touch .nojekyll
```

Publicar o diretório resultante na branch `gh-pages` (root). O Pages serve de
`gh-pages` / `/`. O `router.tsx` usa `basepath: import.meta.env.BASE_URL`, então
o roteamento client acompanha o `base` do Vite automaticamente.

App é 100% client-side (store em sessionStorage, sem backend), então roda
perfeitamente como estático.
