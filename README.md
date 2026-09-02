# Elite Match Properties

> **Status: produção.** O protótipo virou app full-stack real — auth por OTP
> (WhatsApp), Postgres dedicado, server functions e painéis cliente/corretor
> integrados às APIs. Arquitetura e deploy em **[DEPLOY.md](./DEPLOY.md)**.
>
> Stack: TanStack Start (SSR/Nitro) · Postgres 16 · Evolution API (OTP) · pm2 · bun.
> Persistência real substituiu o `localStorage`; dados em `src/lib/api.ts`
> (server functions) sobre `src/lib/{db,auth,evolution}.server.ts`.

---

Matchmaker de imóveis estilo "swipe" (parecido com Tinder), voltado para corretores de imóveis de alto padrão.

Fluxo principal:

1. Tela de cadastro do CLIENTE (lead): nome, WhatsApp, orçamento (faixa de valor), região de interesse, tipo de imóvel (casa/apto/terreno/comercial), número de quartos desejado, e uma pergunta aberta "o que não pode faltar no seu imóvel ideal?"
2. Depois do cadastro, o cliente vê um feed de cards de imóveis (foto grande, preço, metragem, bairro, 2-3 diferenciais em destaque) que ele desliza: like (quero visitar) ou dislike (não é isso).
3. Cada "like" dispara automaticamente uma notificação/resumo pro corretor (pode simular como um painel admin simples) mostrando quem curtiu o quê, pra ele já entrar em contato puxando gancho certo.
4. Painel do corretor: lista de imóveis cadastrados (foto, título, preço, specs) que ele pode adicionar/editar, e lista de leads com o histórico de likes/dislikes de cada um.

Estilo visual: alto padrão, minimalista, cores neutras com um acento em dourado/bronze, tipografia serifada no título e sans-serif no corpo, mobile-first (esse app vai ser usado principalmente no celular via link do WhatsApp).

O protótipo original usava dados mockados/localStorage só para validar a UX. Esta
versão já é o backend real: cadastro e login por OTP, banco Postgres, notificação
do corretor no WhatsApp a cada like e CRUD de imóveis no painel.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cd62485f-d7e3-4fe1-8886-909b2f3c6dc7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
