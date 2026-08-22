# Elite Match Properties

Crie um protótipo de matchmaker de imóveis estilo "swipe" (parecido com Tinder), voltado para corretores de imóveis de alto padrão.

Fluxo principal:
1. Tela de cadastro do CLIENTE (lead): nome, WhatsApp, orçamento (faixa de valor), região de interesse, tipo de imóvel (casa/apto/terreno/comercial), número de quartos desejado, e uma pergunta aberta "o que não pode faltar no seu imóvel ideal?"
2. Depois do cadastro, o cliente vê um feed de cards de imóveis (foto grande, preço, metragem, bairro, 2-3 diferenciais em destaque) que ele desliza: like (quero visitar) ou dislike (não é isso).
3. Cada "like" dispara automaticamente uma notificação/resumo pro corretor (pode simular como um painel admin simples) mostrando quem curtiu o quê, pra ele já entrar em contato puxando gancho certo.
4. Painel do corretor: lista de imóveis cadastrados (foto, título, preço, specs) que ele pode adicionar/editar, e lista de leads com o histórico de likes/dislikes de cada um.

Estilo visual: alto padrão, minimalista, cores neutras com um acento em dourado/bronze, tipografia serifada no título e sans-serif no corpo, mobile-first (esse app vai ser usado principalmente no celular via link do WhatsApp).

Não precisa de backend real robusto — pode usar dados mockados/local storage pra esse protótipo, o objetivo é mostrar o conceito de UX pro cliente aprovar antes de construir de verdade.

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
