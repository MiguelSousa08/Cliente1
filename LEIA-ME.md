# Template — Pastelaria

Site completo para pastelarias, padarias e casas de chá, com um **editor** onde se preenche a ficha do cliente e o site muda ao vivo.

```
pastelaria/
├── editor.html        ← abre este (duplo clique) para preencher a ficha do cliente
├── editor/            ← ferramenta interna (NÃO vai para o alojamento)
└── site/              ← ESTA é a pasta que se publica
    ├── index.html  privacidade.html  termos.html  cookies.html  404.html
    ├── config.js      ← a ficha do cliente (o editor escreve aqui)
    ├── robots.txt  sitemap.xml
    ├── vercel.json    ← cabeçalhos de segurança na Vercel
    ├── _headers       ← os mesmos cabeçalhos no Netlify / Cloudflare Pages
    └── assets/  (css, js, img)
```

## Cliente novo, passo a passo

1. **Copia a pasta `pastelaria`** inteira e dá-lhe o nome do cliente (ex.: `pastelaria-doce-ponte`).
2. **Abre `editor.html`** no Chrome ou no Edge.
3. **Preenche a ficha** à esquerda, grupo a grupo. Cada campo diz o que lá pôr. O site à direita muda enquanto escreves.
   - A barra no topo conta os campos essenciais; a caixa amarela diz o que falta (inclui valores de exemplo esquecidos, como o NIF ou o telefone).
   - Fotografias: “Escolher fotografia…” — o editor copia-a para `site/assets/img/` quando guardas.
   - O texto de cada campo fica guardado no browser mesmo que feches a janela.
4. **Carrega em “Guardar no site”** (ou Ctrl+S). Da primeira vez, escolhe a pasta `site`. O editor escreve:
   `config.js`, as fotografias, `sitemap.xml`, `robots.txt` e o título/descrição de cada página (para o Google e para a pré-visualização do link no WhatsApp).
5. **Publica a pasta `site`** (só essa):
   - **Vercel:** `vercel` na pasta `site`, ou arrasta-a no painel. Nota: o plano gratuito (Hobby) é só para uso não comercial — para clientes pagos usa o Pro.
   - **Cloudflare Pages** (grátis, uso comercial permitido): *Workers & Pages → Create → Pages → Upload assets*, arrasta a pasta `site`.
   - **Netlify:** arrasta a pasta `site` para app.netlify.com/drop.
6. Liga o domínio do cliente nas definições do alojamento e confirma que o endereço em “Google e endereço” é o mesmo.

Firefox e Safari não gravam diretamente em pastas: o botão passa a “Descarregar tudo” e dá-te o `config.js` e as fotografias para copiares à mão.

## Antes de entregar ao cliente

- [ ] Nenhum valor de exemplo na caixa amarela do editor (NIF, telefone, domínio, email).
- [ ] NIF validado pelo editor e nome da empresa igual à certidão.
- [ ] Centro de arbitragem certo para a zona (Braga/Viana/Vila Real: CIAB; outras: consumidor.gov.pt).
- [ ] O cliente registado no Livro de Reclamações Eletrónico (livroreclamacoes.pt) — o link já está no rodapé.
- [ ] Fotografias do cliente comprimidas (squoosh.app), com descrição preenchida.
- [ ] Testado no telemóvel.
- [ ] Os textos legais são uma base sólida mas **não substituem um jurista** — revê-os se o cliente vender online ou recolher mais dados.

## O que o site já faz

Animação de entrada (1.ª visita), título com fotografias embutidas, estado “aberto agora” calculado pelo horário, menu com categorias e filtros, pedido de bolo que abre o WhatsApp/email com a mensagem feita (sem guardar dados), galeria em ecrã inteiro, perguntas frequentes, pesquisa no site (Ctrl+K ou /), mapa só com autorização, banner de cookies, barra de progresso, voltar ao topo, saltar para o conteúdo, página 404, privacidade, termos e cookies, dados estruturados para o Google, CSP e restantes cabeçalhos de segurança.

As fotografias da demo são do Unsplash (uso comercial permitido) e servem só de exemplo — troca-as sempre pelas do cliente.
