/* ==========================================================================
   Editor do site — ficha do cliente
   Preenche-se à esquerda, o site atualiza-se à direita. "Guardar no site"
   escreve config.js, sitemap.xml, robots.txt, as fotografias e o título/
   descrição de cada página diretamente na pasta do site (Chrome/Edge).
   ========================================================================== */
(function () {
  "use strict";

  var d = document;
  var CHAVE_RASCUNHO = "editor-pastelaria-rascunho";
  var PAGINAS_HTML = ["index", "privacidade", "termos", "cookies", "404"];

  /* valores de exemplo que não podem ir para o site de um cliente real */
  var EXEMPLOS = {
    "contacto.telefone": "+351 253 000 000", "contacto.whatsapp": "351910000000", "contacto.codigoPostal": "4700-000",
    "legal.nif": "500 000 000", "contacto.email": "ola@pastelaria-aurora.pt", "legal.emailPrivacidade": "ola@pastelaria-aurora.pt",
    "seo.dominio": "https://www.pastelaria-aurora.pt", "legal.denominacao": "Aurora Pastelaria, Lda."
  };

  /* ---------------------------------------------------------------- utils */
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function txt(v) { return v == null ? "" : String(v); }
  function clonar(o) { return JSON.parse(JSON.stringify(o)); }
  function get(o, caminho) { return caminho.split(".").reduce(function (a, k) { return a == null ? undefined : a[k]; }, o); }
  function set(o, caminho, v) {
    var ks = caminho.split("."), a = o;
    for (var i = 0; i < ks.length - 1; i++) { if (a[ks[i]] == null || typeof a[ks[i]] !== "object") a[ks[i]] = {}; a = a[ks[i]]; }
    a[ks[ks.length - 1]] = v;
  }
  function esc(s) { return txt(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function el(tag, cls, t) { var n = d.createElement(tag); if (cls) n.className = cls; if (t != null) n.textContent = t; return n; }
  function slug(s) { return txt(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "foto"; }
  function ico(n) {
    var P = {
      cima: '<path d="m18 15-6-6-6 6"/>', baixo: '<path d="m6 9 6 6 6-6"/>', lixo: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
      mais: '<path d="M12 5v14M5 12h14"/>', seta: '<path d="m6 9 6 6 6-6"/>', foto: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 9"/>'
    };
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (P[n] || "") + "</svg>";
  }
  var avisoT;
  function aviso(msg, erro) {
    var a = $("[data-aviso]"); a.textContent = msg;
    a.classList.toggle("aviso--erro", !!erro); a.classList.add("aviso--ver");
    clearTimeout(avisoT); avisoT = setTimeout(function () { a.classList.remove("aviso--ver"); }, erro ? 6000 : 3500);
  }

  /* NIF português: 9 dígitos com dígito de controlo */
  function nifValido(v) {
    var n = txt(v).replace(/\s/g, "");
    if (!/^\d{9}$/.test(n) || !/^(1|2|3|5|6|8|9|45|70|71|72|74|75|77|79|90|91|98|99)/.test(n)) return false;
    var s = 0; for (var i = 0; i < 8; i++) s += (+n[i]) * (9 - i);
    var c = 11 - (s % 11); if (c >= 10) c = 0;
    return c === +n[8];
  }

  /* ---------------------------------------------------------------- o que se pede em cada campo
     c = caminho no config · r = rótulo · d = o que colocar · obrig = essencial */
  var GRUPOS = [
    { id: "negocio", nome: "O negócio", intro: "Como o cliente se apresenta. Aparece no logótipo, na animação de entrada e no Google.", campos: [
      { c: "negocio.nome", r: "Nome curto", d: "O nome que as pessoas usam no dia a dia. Aparece no logótipo e grande na animação de entrada. Ex.: Aurora", obrig: true, max: 24 },
      { c: "negocio.nomeCompleto", r: "Nome completo", d: "Como deve aparecer no Google e no separador do browser. Ex.: Pastelaria Aurora", obrig: true, max: 60 },
      { c: "negocio.tipo", r: "Tipo de negócio", d: "Uma expressão curta. Ex.: Pastelaria artesanal · Padaria e pastelaria · Casa de chá", obrig: true, max: 40 },
      { c: "negocio.cidade", r: "Cidade", d: "Onde fica. Ex.: Braga", obrig: true, max: 40 },
      { c: "negocio.desde", r: "Aberto desde (ano)", d: "Ano de abertura. Deixa vazio se não quiserem mostrar.", max: 4 }
    ]},
    { id: "abertura", nome: "Abertura do site", intro: "A primeira coisa que se vê ao abrir o site.", campos: [
      { c: "hero.titulo", r: "Frase principal", t: "textarea", d: "Curta e concreta, 6 a 12 palavras. Escreve [foto] onde queres uma fotografia pequena dentro da frase (no máximo duas). Ex.: Massa folhada [foto] feita de madrugada, [foto] no centro de Braga.", obrig: true, max: 110 },
      { c: "hero.texto", r: "Texto de apoio", t: "textarea", d: "Uma ou duas frases sobre o que fazem de especial. Fala de coisas reais: horas, ingredientes, receitas.", obrig: true, max: 220 },
      { c: "hero.botaoPrincipal", r: "Texto do botão principal", d: "Leva ao menu. Ex.: Ver o menu", max: 28 },
      { c: "hero.botaoSecundario", r: "Texto do segundo botão", d: "Leva às encomendas. Ex.: Encomendar um bolo", max: 28 },
      { c: "hero.imagem", r: "Fotografia grande", t: "imagem", alt: "hero.imagemAlt", d: "A melhor fotografia do cliente, na vertical e bem iluminada.", obrig: true },
      { c: "hero.fotosTitulo", r: "Fotografias dentro da frase", t: "lista", max: 2, novo: { src: "", alt: "" }, titulo: "alt", itemNome: "Fotografia",
        campos: [{ c: "src", r: "Fotografia", t: "imagem", alt: "alt", d: "Aparece em ponto pequeno, redonda. Um grande plano funciona melhor." }] },
      { c: "hero.selo", r: "Texto do selo redondo", d: "Gira à volta do ícone ao lado da fotografia. Ex.: feito à mão todos os dias", max: 32 }
    ]},
    { id: "cores", nome: "Cores", especial: "cores", intro: "Escolhe uma paleta pronta ou afina cada cor. O site inteiro muda de cara." },
    { id: "contactos", nome: "Contactos e morada", intro: "Aparecem nos botões, no rodapé e no Google.", campos: [
      { c: "contacto.telefone", r: "Telefone", t: "tel", d: "Como se escreve normalmente. Ex.: +351 253 123 456", obrig: true },
      { c: "contacto.whatsapp", r: "WhatsApp", d: "Só números, com o 351 à frente. Ex.: 912 345 678 fica 351912345678. Vazio se não usarem — os botões de WhatsApp desaparecem.", filtro: "digitos" },
      { c: "contacto.email", r: "Email", t: "email", d: "Para onde vão os pedidos de bolo por email. Ex.: geral@pastelaria.pt" },
      { c: "contacto.morada", r: "Rua e número", d: "Ex.: Rua do Souto, 45", obrig: true },
      { c: "contacto.codigoPostal", r: "Código postal", d: "Formato 0000-000. Ex.: 4700-321", obrig: true, max: 8 },
      { c: "contacto.localidade", r: "Localidade", d: "Ex.: Braga", obrig: true },
      { c: "contacto.mapaLink", r: "Link do Google Maps", t: "url", d: "No Google Maps, procura o estabelecimento, carrega em Partilhar e copia o link. É o botão “Como chegar”.", obrig: true },
      { c: "contacto.mapaEmbed", r: "Mapa para mostrar no site", t: "textarea", d: "No Google Maps: Partilhar → Incorporar um mapa → Copiar HTML. Cola aqui tudo — o editor tira sozinho o endereço certo.", filtro: "mapa", obrig: true }
    ]},
    { id: "horario", nome: "Horário", especial: "horario", intro: "O site calcula sozinho se está aberto agora e destaca o dia de hoje." },
    { id: "especialidades", nome: "Especialidades", intro: "Até 5 produtos com fotografia. O primeiro aparece em destaque.", campos: [
      { c: "especialidades", t: "lista", max: 5, titulo: "nome", itemNome: "Especialidade", novo: { nome: "", descricao: "", preco: "", imagem: "", alt: "" }, campos: [
        { c: "nome", r: "Nome", d: "Ex.: Pastel de nata", max: 40 },
        { c: "preco", r: "Preço", d: "Com o símbolo. Ex.: 1,30 € · 3,20 € a fatia · desde 0,25 €", max: 20 },
        { c: "descricao", r: "Descrição", t: "textarea", d: "Uma frase com um pormenor verdadeiro. Ex.: Sai do forno de hora a hora.", max: 140 },
        { c: "imagem", r: "Fotografia", t: "imagem", alt: "alt" }
      ]}
    ]},
    { id: "menu", nome: "Menu e preços", intro: "Categorias com os respetivos produtos. As etiquetas criam filtros automaticamente.", campos: [
      { c: "menu", t: "lista", titulo: "nome", itemNome: "Categoria", novo: { nome: "", itens: [] }, campos: [
        { c: "nome", r: "Nome da categoria", d: "Ex.: Pastelaria · Bolos · Salgados · Pão · Cafetaria", max: 24 },
        { c: "itens", r: "Produtos", t: "lista", titulo: "nome", sub: "preco", itemNome: "Produto", novo: { nome: "", descricao: "", preco: "", etiquetas: [] }, campos: [
          { c: "nome", r: "Nome", d: "Ex.: Bola de Berlim", max: 48 },
          { c: "preco", r: "Preço", d: "Ex.: 1,60 €", max: 20 },
          { c: "descricao", r: "Descrição", d: "Curta. Ex.: Com creme pasteleiro ou simples.", max: 120 },
          { c: "etiquetas", r: "Etiquetas", t: "etiquetas", d: "Separadas por vírgulas. Ex.: vegetariano, sem glúten, da casa, novidade" }
        ]}
      ]}
    ]},
    { id: "encomendas", nome: "Encomendas", intro: "O formulário prepara a mensagem e abre o WhatsApp ou o email do cliente final. Nada é guardado.", campos: [
      { c: "encomendas.ativo", r: "Mostrar a secção de encomendas", t: "sim-nao", d: "Desliga se o cliente não aceita encomendas." },
      { c: "encomendas.titulo", r: "Título", d: "Ex.: Bolos por encomenda", max: 40 },
      { c: "encomendas.texto", r: "Texto", t: "textarea", d: "Para que ocasiões e como funciona. Ex.: Aniversários, batizados e casamentos. Respondemos no mesmo dia.", max: 260 },
      { c: "encomendas.antecedenciaDias", r: "Antecedência mínima (dias)", t: "number", min: 0, max: 60, d: "O calendário não deixa escolher datas antes disto." },
      { c: "encomendas.precoPorPessoa", r: "Preço base por pessoa (€)", t: "number", min: 0, max: 100, passo: .1, d: "Serve para mostrar uma estimativa. Põe 0 para não mostrar valores." },
      { c: "encomendas.tipos", r: "Tipos de bolo", t: "linhas", d: "Um por linha. Ex.: Bolo de aniversário" },
      { c: "encomendas.sabores", r: "Sabores", t: "linhas", d: "Um por linha. Ex.: Chocolate" },
      { c: "encomendas.imagem", r: "Fotografia", t: "imagem", alt: "encomendas.alt" }
    ]},
    { id: "historia", nome: "A casa (história)", intro: "Quem são e como trabalham. Evita frases feitas — conta factos.", campos: [
      { c: "historia.titulo", r: "Título", d: "Ex.: Na mesma rua desde 1987", max: 50 },
      { c: "historia.texto", r: "Texto", t: "textarea", linhas: 7, d: "Dois ou três parágrafos curtos. Deixa uma linha em branco entre parágrafos. O primeiro aparece em destaque.", max: 900 },
      { c: "historia.imagem", r: "Fotografia principal", t: "imagem", alt: "historia.alt", d: "Vertical: a equipa, o balcão ou a fachada." },
      { c: "historia.imagem2", r: "Fotografia redonda", t: "imagem", alt: "historia.alt2", d: "Um pormenor: mãos, massa, forno." }
    ]},
    { id: "processo", nome: "Um dia na cozinha", intro: "Os passos do dia, por ordem de hora. Deixa vazio para esconder.", campos: [
      { c: "processo", t: "lista", max: 4, titulo: "titulo", sub: "hora", itemNome: "Passo", novo: { hora: "", titulo: "", texto: "", imagem: "", alt: "" }, campos: [
        { c: "hora", r: "Hora", t: "time", d: "Ex.: 04:30" },
        { c: "titulo", r: "Título", d: "Ex.: A massa", max: 24 },
        { c: "texto", r: "Texto", d: "Uma frase. Ex.: Estendida e enrolada à mão.", max: 100 },
        { c: "imagem", r: "Fotografia", t: "imagem", alt: "alt" }
      ]}
    ]},
    { id: "galeria", nome: "Galeria", intro: "Seis fotografias funcionam bem. Deixa vazio para esconder a secção.", campos: [
      { c: "galeria", t: "lista", max: 12, titulo: "alt", itemNome: "Fotografia", novo: { src: "", alt: "" }, campos: [
        { c: "src", r: "Fotografia", t: "imagem", alt: "alt" }
      ]}
    ]},
    { id: "faq", nome: "Perguntas frequentes", intro: "O que os clientes perguntam ao telefone. Poupa chamadas.", campos: [
      { c: "faq", t: "lista", titulo: "pergunta", itemNome: "Pergunta", novo: { pergunta: "", resposta: "" }, campos: [
        { c: "pergunta", r: "Pergunta", d: "Ex.: Têm opções sem glúten?", max: 110 },
        { c: "resposta", r: "Resposta", t: "textarea", d: "Direta, uma ou duas frases.", max: 320 }
      ]}
    ]},
    { id: "redes", nome: "Redes sociais", intro: "Links completos. Vazio = o botão não aparece.", campos: [
      { c: "redes.instagram", r: "Instagram", t: "url", d: "Ex.: https://www.instagram.com/pastelaria.aurora" },
      { c: "redes.facebook", r: "Facebook", t: "url", d: "Ex.: https://www.facebook.com/pastelaria.aurora" },
      { c: "redes.avaliacoesGoogle", r: "Avaliações no Google", t: "url", d: "Link para as avaliações reais no Google. Nunca inventes testemunhos." }
    ]},
    { id: "legal", nome: "Dados legais", intro: "Preenchem a política de privacidade, os termos e o rodapé. Pede ao cliente a certidão ou o cartão da empresa.", campos: [
      { c: "legal.denominacao", r: "Nome da empresa", d: "Como está registada. Ex.: Aurora Pastelaria, Lda. · Maria Silva (empresário em nome individual)", obrig: true },
      { c: "legal.nif", r: "NIF / NIPC", d: "9 dígitos. O editor confirma se o número é válido.", obrig: true, valida: "nif" },
      { c: "legal.sede", r: "Morada da sede", d: "Morada fiscal completa. Ex.: Rua do Souto, 45, 4700-321 Braga", obrig: true },
      { c: "legal.emailPrivacidade", r: "Email para assuntos de dados pessoais", t: "email", d: "Pode ser o email geral.", obrig: true },
      { c: "legal.ralNome", r: "Centro de arbitragem de consumo", d: "Obrigatório por lei. Braga, Viana e Vila Real: CIAB. Outras zonas: consulta a lista em consumidor.gov.pt.", obrig: true },
      { c: "legal.ralSite", r: "Site do centro de arbitragem", t: "url", d: "Ex.: https://www.ciab.pt" },
      { c: "legal.ralMorada", r: "Morada do centro de arbitragem", d: "Ex.: Rua D. Afonso Henriques, n.º 1, Braga" },
      { c: "legal.atualizado", r: "Data da última atualização", t: "date", d: "Aparece no topo das páginas legais." }
    ]},
    { id: "seo", nome: "Google e endereço", intro: "Como o site aparece no Google e quando se partilha o link no WhatsApp.", campos: [
      { c: "seo.dominio", r: "Endereço do site", t: "url", d: "O endereço final, com https. Ex.: https://www.pastelaria-aurora.pt", obrig: true },
      { c: "seo.descricao", r: "Descrição para o Google", t: "textarea", d: "Entre 120 e 160 caracteres, com o nome, a cidade e o que fazem.", obrig: true, max: 170, contar: true }
    ]},
    { id: "extras", nome: "Animação e créditos", campos: [
      { c: "intro.ativar", r: "Animação de entrada", t: "sim-nao", d: "O nome aparece e desaparece antes do site. Só na primeira visita." },
      { c: "intro.pausa", r: "Tempo com o nome no ecrã (segundos)", t: "number", min: 0, max: 3, passo: .1, d: "Ex.: 0,3" },
      { c: "creditos.nome", r: "Créditos no rodapé", d: "Aparece “Site por …”. Vazio para esconder." },
      { c: "creditos.link", r: "Link dos créditos", t: "url", d: "O teu site ou Instagram." }
    ]}
  ];

  var PALETAS = [
    { nome: "Bege clássico", cores: { fundo: "#FBF7F0", creme: "#F3E7D3", areia: "#E4CFAE", destaque: "#9A5A2E", texto: "#2B1D15" } },
    { nome: "Rosa pastel", cores: { fundo: "#FCF6F4", creme: "#F6E4DF", areia: "#EBC9C0", destaque: "#A4506A", texto: "#2E1B20" } },
    { nome: "Pistácio", cores: { fundo: "#F8F8F1", creme: "#EAEEDC", areia: "#D3DDB8", destaque: "#5E7A3A", texto: "#1F2618" } },
    { nome: "Chocolate", cores: { fundo: "#FAF5EF", creme: "#EFE2D4", areia: "#DCC3A8", destaque: "#5B3421", texto: "#24160F" } },
    { nome: "Azulejo", cores: { fundo: "#F9F7F2", creme: "#ECE7DC", areia: "#D9D0BD", destaque: "#2F5D8C", texto: "#1B2330" } }
  ];

  var DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
  var NOMES_CORES = [
    ["fundo", "Fundo da página", "Clara — é a cor que se vê mais."],
    ["creme", "Fundo das secções alternadas", "Um pouco mais escura que o fundo."],
    ["areia", "Bordas e detalhes", "Tom médio, para linhas e etiquetas."],
    ["destaque", "Cor da marca", "Botões, preços e ligações."],
    ["texto", "Texto", "Muito escura, para se ler bem."]
  ];

  /* ---------------------------------------------------------------- estado */
  var cfg = null;              /* configuração em edição */
  var imagensNovas = {};       /* caminho -> { ficheiro, url } — fotos escolhidas e ainda não guardadas */
  var pastaSite = null;        /* pasta do site (File System Access) */
  var sujo = false;            /* há alterações que ainda não estão no site */

  function lista(v) { return Array.isArray(v) ? v : []; }
  function semAcentos(s) { return txt(s).normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function esqueleto() {
    return {
      negocio: {}, hero: { fotosTitulo: [] }, cores: clonar(PALETAS[0].cores), contacto: {},
      horario: DIAS_SEMANA.map(function (dd) { return { dia: dd, fechado: false, abre: "08:00", fecha: "19:00" }; }),
      horarioNota: "", especialidades: [], menu: [],
      encomendas: { ativo: true, antecedenciaDias: 2, precoPorPessoa: 0, tipos: [], sabores: [] },
      historia: {}, processo: [], galeria: [], faq: [], redes: {}, legal: {}, seo: {},
      intro: { ativar: true, pausa: .3 }, creditos: {}
    };
  }
  /* garante que todas as chaves existem (útil ao importar fichas antigas ou incompletas) */
  function completar(o) {
    var base = esqueleto();
    (function junta(alvo, modelo) {
      Object.keys(modelo).forEach(function (k) {
        if (alvo[k] == null) alvo[k] = clonar(modelo[k]);
        else if (modelo[k] && typeof modelo[k] === "object" && !Array.isArray(modelo[k]) && typeof alvo[k] === "object") junta(alvo[k], modelo[k]);
      });
    })(o, base);
    DIAS_SEMANA.forEach(function (dd) {
      if (!o.horario.some(function (h) { return h && h.dia === dd; })) o.horario.push({ dia: dd, fechado: true, abre: "", fecha: "" });
    });
    o.horario.sort(function (a, b) { return DIAS_SEMANA.indexOf(a.dia) - DIAS_SEMANA.indexOf(b.dia); });
    return o;
  }

  /* ---------------------------------------------------------------- validação de cada campo */
  var RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function problema(def, abs, v) {
    var s = Array.isArray(v) ? v.join(",") : txt(v).trim();
    if (!s) return "";
    if (EXEMPLOS[abs] && s === EXEMPLOS[abs]) return "Ainda é o valor de exemplo — troca pelo do cliente.";
    if (def.valida === "nif" && !nifValido(s)) return "Este NIF não é válido. Confirma os 9 dígitos.";
    if (def.t === "email" && !RE_EMAIL.test(s)) return "Falta o @ ou o domínio (ex.: nome@empresa.pt).";
    if (def.t === "url" && !/^https?:\/\/[^\s]+\.[^\s]+/.test(s)) return "Tem de ser um endereço completo, a começar por https://";
    if (abs === "contacto.codigoPostal" && !/^\d{4}-\d{3}$/.test(s)) return "Formato 0000-000.";
    if (abs === "contacto.whatsapp" && !/^\d{11,15}$/.test(s)) return "Parece curto: inclui o indicativo (351) e o número completo.";
    if (abs === "contacto.mapaEmbed" && !/^https:\/\/(www\.)?google\.[a-z.]+\/maps/.test(s)) return "Não parece um mapa do Google. Cola o código de “Incorporar um mapa”.";
    if (abs === "hero.titulo" && (s.match(/\[foto\]/gi) || []).length > 2) return "No máximo duas [foto] na frase.";
    return "";
  }

  /* ---------------------------------------------------------------- a ficha */
  function desenharFicha() {
    var f = $("[data-form]"), abertos = {};
    $$(".grupo", f).forEach(function (g) { abertos[g.id] = g.open; });
    f.textContent = "";
    GRUPOS.forEach(function (g, gi) {
      var det = el("details", "grupo"); det.id = "grupo-" + g.id;
      det.open = abertos[det.id] != null ? abertos[det.id] : gi === 0;
      var s = el("summary");
      s.innerHTML = '<span class="grupo__num">' + (gi + 1) + '</span><span class="grupo__nome">' + esc(g.nome) + '</span><span class="grupo__estado"></span>' + ico("seta").replace("<svg", '<svg class="grupo__seta"');
      det.appendChild(s);
      var corpo = el("div", "grupo__corpo");
      if (g.intro) corpo.appendChild(el("p", "grupo__intro", g.intro));
      if (g.especial === "cores") corpo.appendChild(campoCores());
      else if (g.especial === "horario") corpo.appendChild(campoHorario());
      else g.campos.forEach(function (c) { corpo.appendChild(campo(c, cfg, c.c)); });
      det.appendChild(corpo);
      f.appendChild(det);
    });
    atualizarProgresso();
  }

  function idDe(abs) { return "f-" + abs.replace(/[^a-z0-9]+/gi, "-"); }
  function procuraDe(def) { return semAcentos((def.r || "") + " " + (def.d || "") + " " + (def.c || "")).toLowerCase(); }

  function campo(def, alvo, abs) {
    var t = def.t || "text";
    if (t === "lista") return campoLista(def, alvo, abs);
    var box = el("div", "campo"), id = idDe(abs), valor = get(alvo, def.c);
    box.setAttribute("data-campo", abs);
    box.setAttribute("data-procura", procuraDe(def));

    if (t === "sim-nao") {
      box.classList.add("campo--linha");
      var lb = el("label", "campo__rotulo", def.r); lb.htmlFor = id;
      var sw = el("span", "interruptor"), cb = el("input"); cb.type = "checkbox"; cb.id = id; cb.checked = valor !== false;
      sw.appendChild(cb); sw.appendChild(el("span"));
      box.appendChild(lb); box.appendChild(sw);
      if (def.d) { var dd = el("p", "campo__dica", def.d); dd.style.gridColumn = "1 / -1"; box.appendChild(dd); }
      cb.addEventListener("change", function () { set(alvo, def.c, cb.checked); mudou(); });
      return box;
    }

    var rot = el("label", "campo__rotulo"); rot.htmlFor = id;
    rot.appendChild(el("span", null, def.r));
    if (def.obrig) rot.appendChild(el("span", "campo__obrig", "essencial"));
    box.appendChild(rot);

    if (t === "imagem") return campoImagem(def, alvo, abs, box, id);

    var inp;
    if (t === "textarea" || t === "linhas") {
      inp = el("textarea"); inp.rows = def.linhas || (t === "linhas" ? 5 : 3);
      inp.value = t === "linhas" ? lista(valor).join("\n") : txt(valor);
    } else {
      inp = el("input");
      inp.type = { tel: "tel", url: "url", email: "email", number: "number", date: "date", time: "time" }[t] || "text";
      inp.value = t === "etiquetas" ? lista(valor).join(", ") : txt(valor);
      if (t === "number") { if (def.min != null) inp.min = def.min; if (def.max != null) inp.max = def.max; inp.step = def.passo || 1; }
    }
    if (def.max && t !== "number") inp.maxLength = def.filtro === "mapa" ? 4000 : def.max;
    inp.id = id;
    box.appendChild(inp);
    if (def.d) { var dica = el("p", "campo__dica", def.d); dica.id = id + "-dica"; inp.setAttribute("aria-describedby", dica.id); box.appendChild(dica); }
    var erro = el("p", "campo__erro"); erro.hidden = true; box.appendChild(erro);
    var cont = def.contar ? el("p", "campo__dica") : null; if (cont) box.appendChild(cont);

    function validar() {
      var v = get(alvo, def.c), p = problema(def, abs, v);
      erro.textContent = p; erro.hidden = !p;
      inp.setAttribute("aria-invalid", p ? "true" : "false");
      var vazio = !(Array.isArray(v) ? v.length : txt(v).trim());
      box.classList.toggle("campo--aviso", !!def.obrig && (vazio || !!p));
      box.classList.toggle("campo--ok", !!def.obrig && !vazio && !p);
      if (cont) { var n = txt(v).length; cont.textContent = n + " caracteres" + (n < 120 ? " — escreve um pouco mais (ideal: 120 a 160)." : n > 160 ? " — o Google corta depois dos 160." : " — bom tamanho."); }
    }
    inp.addEventListener("input", function () {
      var v = inp.value;
      if (t === "number") v = v === "" ? "" : Number(v);
      else if (t === "linhas") v = v.split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
      else if (t === "etiquetas") v = v.split(",").map(function (x) { return x.trim().toLowerCase(); }).filter(Boolean);
      else if (def.filtro === "digitos") { v = v.replace(/\D/g, ""); }
      else if (def.filtro === "mapa") {
        var m = /src\s*=\s*["']([^"']+)["']/i.exec(v);
        if (m) { v = m[1].replace(/&amp;/g, "&"); inp.value = v; aviso("Tirei o endereço do mapa do código colado."); }
        v = v.trim();
      }
      set(alvo, def.c, v);
      validar(); mudou();
    });
    if (def.filtro === "digitos") inp.addEventListener("blur", function () { inp.value = txt(get(alvo, def.c)); });
    validar();
    return box;
  }

  /* ---------------------------------------------------------------- fotografias */
  function urlPreview(v) {
    v = txt(v).trim();
    if (!v) return "";
    if (imagensNovas[v]) return imagensNovas[v].url;
    if (/^(https?:|data:image\/|blob:)/i.test(v)) return v;
    return "site/" + v.replace(/^\.?\//, "");
  }
  function escolherImagem(depois) {
    var fi = el("input"); fi.type = "file"; fi.accept = "image/jpeg,image/png,image/webp,image/avif";
    fi.addEventListener("change", function () {
      var f = fi.files && fi.files[0];
      if (!f) return;
      if (!/^image\/(jpeg|png|webp|avif)$/.test(f.type)) { aviso("Esse ficheiro não é uma fotografia (usa JPG, PNG ou WebP).", true); return; }
      var ext = (f.name.match(/\.(jpe?g|png|webp|avif)$/i) || [".jpg"])[0].toLowerCase().replace(".jpeg", ".jpg");
      var base = slug(f.name.replace(/\.[^.]+$/, "")), caminho = "assets/img/" + base + ext, n = 2;
      while (imagensNovas[caminho] && imagensNovas[caminho].ficheiro !== f) caminho = "assets/img/" + base + "-" + (n++) + ext;
      imagensNovas[caminho] = { ficheiro: f, url: URL.createObjectURL(f) };
      if (f.size > 1.5 * 1024 * 1024) aviso("A fotografia tem " + (f.size / 1048576).toFixed(1).replace(".", ",") + " MB. Comprime-a em squoosh.app para o site abrir depressa.", true);
      depois(caminho);
    });
    fi.click();
  }
  function campoImagem(def, alvo, abs, box, id) {
    var linha = el("div", "imagem"), mini = el("img", "imagem__mini"), acoes = el("div", "imagem__acoes");
    mini.alt = ""; mini.decoding = "async";
    var inp = el("input"); inp.type = "text"; inp.id = id; inp.value = txt(get(alvo, def.c));
    inp.placeholder = "assets/img/foto.jpg ou https://…";
    var btn = el("button", "botao"); btn.type = "button"; btn.innerHTML = ico("foto") + "Escolher fotografia…";
    acoes.appendChild(btn); acoes.appendChild(inp);
    var altIn = null;
    if (def.alt) {
      altIn = el("input"); altIn.type = "text"; altIn.maxLength = 120;
      altIn.placeholder = "O que se vê na foto (ex.: Pastéis de nata num tabuleiro)";
      altIn.setAttribute("aria-label", "Descrição da fotografia, para quem não vê");
      altIn.value = txt(get(alvo, def.alt));
      acoes.appendChild(altIn);
    }
    linha.appendChild(mini); linha.appendChild(acoes); box.appendChild(linha);
    if (def.d) box.appendChild(el("p", "campo__dica", def.d));
    function mostrar() { var u = urlPreview(inp.value); if (u) { mini.src = u; mini.hidden = false; } else { mini.removeAttribute("src"); mini.hidden = true; } }
    function estado() {
      var vazio = !inp.value.trim();
      box.classList.toggle("campo--aviso", !!def.obrig && vazio);
      box.classList.toggle("campo--ok", !!def.obrig && !vazio);
    }
    inp.addEventListener("input", function () { set(alvo, def.c, inp.value.trim()); mostrar(); estado(); mudou(); });
    if (altIn) altIn.addEventListener("input", function () { set(alvo, def.alt, altIn.value); mudou(); });
    btn.addEventListener("click", function () {
      escolherImagem(function (caminho) {
        inp.value = caminho; set(alvo, def.c, caminho); mostrar(); estado(); mudou();
        if (altIn && !altIn.value.trim()) altIn.focus();
      });
    });
    mini.addEventListener("error", function () { mini.hidden = true; });
    mostrar(); estado();
    return box;
  }

  /* ---------------------------------------------------------------- listas repetíveis */
  function campoLista(def, alvo, abs) {
    if (!Array.isArray(get(alvo, def.c))) set(alvo, def.c, []);
    var arr = get(alvo, def.c);
    var box = el("div", "campo"); box.setAttribute("data-campo", abs); box.setAttribute("data-procura", procuraDe(def));
    if (def.r) { var rot = el("div", "campo__rotulo"); rot.appendChild(el("span", null, def.r)); box.appendChild(rot); }
    var wrap = el("div", "lista");
    function refazer(abrir) {
      var novo = campoLista(def, alvo, abs);
      box.parentNode.replaceChild(novo, box);
      if (abrir != null) { var c = $$(":scope > .lista > .cartao", novo)[abrir]; if (c) { c.open = true; var p = $("input, textarea", c); if (p) p.focus(); } }
      mudou();
    }
    arr.forEach(function (item, i) {
      if (!item || typeof item !== "object") return;
      var det = el("details", "cartao"), s = el("summary"), tit = el("span", "cartao__titulo");
      function titulo() {
        var t1 = txt(item[def.titulo]).trim(), t2 = def.sub ? txt(item[def.sub]).trim() : "";
        tit.textContent = t1 || (def.itemNome + " " + (i + 1) + " (sem nome)");
        if (t2) { var sm = el("small", null, t2); tit.appendChild(sm); }
      }
      titulo();
      s.appendChild(tit);
      [["cima", "Subir", i === 0, function () { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); refazer(i - 1); }],
       ["baixo", "Descer", i === arr.length - 1, function () { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); refazer(i + 1); }],
       ["lixo", "Apagar", false, function () {
         if (!confirm("Apagar “" + (txt(item[def.titulo]) || def.itemNome) + "”?")) return;
         arr.splice(i, 1); refazer();
       }]].forEach(function (b) {
        var mb = el("button", "mini" + (b[0] === "lixo" ? " mini--apagar" : "")); mb.type = "button";
        mb.innerHTML = ico(b[0]); mb.title = b[1]; mb.setAttribute("aria-label", b[1] + ": " + (txt(item[def.titulo]) || def.itemNome + " " + (i + 1)));
        mb.disabled = b[2];
        mb.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); b[3](); });
        s.appendChild(mb);
      });
      det.appendChild(s);
      var corpo = el("div", "cartao__corpo");
      def.campos.forEach(function (sub) { corpo.appendChild(campo(sub, item, abs + "." + i + "." + sub.c)); });
      corpo.addEventListener("input", titulo);
      det.appendChild(corpo);
      wrap.appendChild(det);
    });
    box.appendChild(wrap);
    if (!def.max || arr.length < def.max) {
      var add = el("button", "acrescentar"); add.type = "button";
      add.innerHTML = ico("mais") + "Acrescentar " + def.itemNome.toLowerCase();
      add.addEventListener("click", function () { arr.push(clonar(def.novo)); refazer(arr.length - 1); });
      box.appendChild(add);
    } else box.appendChild(el("p", "campo__dica", "Chegaste ao máximo (" + def.max + "). Apaga um para acrescentar outro."));
    return box;
  }

  /* ---------------------------------------------------------------- cores */
  function luminancia(hex) {
    var m = /^#([0-9a-f]{6})$/i.exec(txt(hex)); if (!m) return null;
    var n = parseInt(m[1], 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
  }
  function contraste(a, b) { var la = luminancia(a), lb = luminancia(b); if (la == null || lb == null) return 21; return (Math.max(la, lb) + .05) / (Math.min(la, lb) + .05); }
  function campoCores() {
    var box = el("div"); box.style.display = "grid"; box.style.gap = "1rem";
    var pal = el("div", "paletas");
    PALETAS.forEach(function (p) {
      var b = el("button", "paleta"); b.type = "button";
      var bol = el("i"); ["fundo", "areia", "destaque", "texto"].forEach(function (k) { var x = el("b"); x.style.background = p.cores[k]; bol.appendChild(x); });
      b.appendChild(bol); b.appendChild(d.createTextNode(p.nome));
      b.addEventListener("click", function () { cfg.cores = clonar(p.cores); var novo = campoCores(); box.parentNode.replaceChild(novo, box); mudou(); aviso("Paleta “" + p.nome + "” aplicada."); });
      pal.appendChild(b);
    });
    box.appendChild(pal);
    var aviso1 = el("p", "campo__erro"); aviso1.hidden = true;
    function verContraste() {
      var c = cfg.cores, r1 = contraste(c.texto, c.fundo), r2 = contraste(c.destaque, c.fundo);
      var msg = r1 < 7 ? "O texto tem pouco contraste com o fundo — escolhe um texto mais escuro." : r2 < 4.5 ? "A cor da marca tem pouco contraste com o fundo — botões e preços ficam difíceis de ler." : "";
      aviso1.textContent = msg; aviso1.hidden = !msg;
    }
    NOMES_CORES.forEach(function (nc) {
      var k = nc[0], cx = el("div", "campo"), id = "f-cor-" + k;
      cx.setAttribute("data-procura", semAcentos(nc[1] + " " + nc[2] + " cor").toLowerCase());
      var lb = el("label", "campo__rotulo", nc[1]); lb.htmlFor = id;
      var linha = el("div", "cor"), pk = el("input"), hx = el("input");
      pk.type = "color"; pk.value = /^#[0-9a-f]{6}$/i.test(txt(cfg.cores[k])) ? cfg.cores[k] : "#000000"; pk.setAttribute("aria-label", nc[1] + " (seletor)");
      hx.type = "text"; hx.id = id; hx.value = txt(cfg.cores[k]).toUpperCase(); hx.maxLength = 7; hx.spellcheck = false;
      pk.addEventListener("input", function () { hx.value = pk.value.toUpperCase(); cfg.cores[k] = pk.value; verContraste(); mudou(); });
      hx.addEventListener("input", function () { var v = hx.value.trim(); if (v && v[0] !== "#") v = "#" + v; if (/^#[0-9a-f]{6}$/i.test(v)) { cfg.cores[k] = v; pk.value = v; verContraste(); mudou(); } });
      linha.appendChild(pk); linha.appendChild(hx);
      cx.appendChild(lb); cx.appendChild(linha); cx.appendChild(el("p", "campo__dica", nc[2]));
      box.appendChild(cx);
    });
    box.appendChild(aviso1); verContraste();
    return box;
  }

  /* ---------------------------------------------------------------- horário */
  function campoHorario() {
    var box = el("div"); box.style.display = "grid"; box.style.gap = ".9rem";
    box.setAttribute("data-procura", "horario abre fecha dias semana fechado");
    var dias = el("div", "dias");
    cfg.horario.forEach(function (h) {
      var row = el("div", "dia" + (h.fechado ? " dia--fechado" : ""));
      row.appendChild(el("span", "dia__nome", h.dia));
      var a = el("input"), f = el("input"), lb = el("label", "dia__fechado"), cb = el("input");
      a.type = f.type = "time"; a.value = txt(h.abre); f.value = txt(h.fecha);
      a.setAttribute("aria-label", h.dia + ": abre às"); f.setAttribute("aria-label", h.dia + ": fecha às");
      cb.type = "checkbox"; cb.checked = !!h.fechado; lb.appendChild(cb); lb.appendChild(d.createTextNode("fechado"));
      a.disabled = f.disabled = !!h.fechado;
      a.addEventListener("input", function () { h.abre = a.value; mudou(); });
      f.addEventListener("input", function () { h.fecha = f.value; mudou(); });
      cb.addEventListener("change", function () { h.fechado = cb.checked; a.disabled = f.disabled = cb.checked; row.classList.toggle("dia--fechado", cb.checked); mudou(); });
      row.appendChild(a); row.appendChild(f); row.appendChild(lb);
      dias.appendChild(row);
    });
    box.appendChild(dias);
    var copiar = el("button", "botao"); copiar.type = "button"; copiar.textContent = "Copiar o horário de segunda para os outros dias úteis";
    copiar.addEventListener("click", function () {
      var s = cfg.horario[0];
      cfg.horario.slice(1, 5).forEach(function (h) { h.abre = s.abre; h.fecha = s.fecha; h.fechado = s.fechado; });
      var novo = campoHorario(); box.parentNode.replaceChild(novo, box); mudou(); aviso("Horário copiado de segunda para terça a sexta.");
    });
    box.appendChild(copiar);
    box.appendChild(campo({ c: "horarioNota", r: "Nota sobre o horário", d: "Feriados, férias ou exceções. Ex.: Fechamos a 25 de dezembro e a 1 de janeiro.", max: 140 }, cfg, "horarioNota"));
    return box;
  }

  /* ---------------------------------------------------------------- progresso e o que falta */
  var DEFS = {};
  GRUPOS.forEach(function (g) { (g.campos || []).forEach(function (c) { if (c.t !== "lista") DEFS[c.c] = { g: g, c: c }; }); });
  function atualizarProgresso() {
    var ess = [], pend = [];
    Object.keys(DEFS).forEach(function (k) { if (DEFS[k].c.obrig) ess.push(DEFS[k]); });
    ess.forEach(function (x) {
      var v = get(cfg, x.c.c), vazio = !(Array.isArray(v) ? v.length : txt(v).trim());
      if (vazio || problema(x.c, x.c.c, v)) pend.push(x);
    });
    Object.keys(EXEMPLOS).forEach(function (k) {
      if (txt(get(cfg, k)).trim() === EXEMPLOS[k] && DEFS[k] && pend.indexOf(DEFS[k]) < 0) pend.push(DEFS[k]);
    });
    var feitos = ess.length - pend.filter(function (p) { return p.c.obrig; }).length;
    $("[data-progresso-txt]").textContent = feitos + " de " + ess.length + " essenciais";
    $("[data-progresso-barra]").style.width = (ess.length ? Math.round(feitos / ess.length * 100) : 100) + "%";
    GRUPOS.forEach(function (g) {
      var det = d.getElementById("grupo-" + g.id); if (!det) return;
      var temObrig = (g.campos || []).some(function (c) { return c.obrig; });
      var faltam = pend.filter(function (p) { return p.g === g; }).length;
      det.classList.toggle("grupo--completo", temObrig && !faltam);
      $(".grupo__estado", det).textContent = !temObrig ? "opcional" : faltam ? "falta" + (faltam > 1 ? "m " + faltam : " 1") : "completo";
    });
    var box = $("[data-pendentes]");
    box.textContent = "";
    box.hidden = !pend.length;
    if (pend.length) {
      box.appendChild(el("strong", null, "Antes de publicar, falta rever:"));
      pend.slice(0, 8).forEach(function (p, i) {
        if (i) box.appendChild(d.createTextNode(" · "));
        var b = el("button", null, p.c.r); b.type = "button";
        b.addEventListener("click", function () { irPara(p.c.c, p.g.id); });
        box.appendChild(b);
      });
      if (pend.length > 8) box.appendChild(d.createTextNode(" e mais " + (pend.length - 8) + "."));
    }
    $("[data-nome-cliente]").textContent = txt(get(cfg, "negocio.nomeCompleto")) || txt(get(cfg, "negocio.nome")) || "Cliente sem nome";
  }
  function irPara(caminho, grupoId) {
    var g = d.getElementById("grupo-" + grupoId); if (g) g.open = true;
    var inp = d.getElementById(idDe(caminho));
    if (inp) { inp.scrollIntoView({ block: "center", behavior: "smooth" }); setTimeout(function () { inp.focus(); }, 250); }
  }

  /* ---------------------------------------------------------------- procurar campos */
  function filtrarCampos(q) {
    q = semAcentos(q).toLowerCase().trim();
    $$(".grupo").forEach(function (g) {
      var nomeG = semAcentos($(".grupo__nome", g).textContent).toLowerCase(), algum = false;
      $$("[data-procura]", g).forEach(function (n) {
        if (n.parentNode && n.parentNode.closest && n.parentNode.closest(".cartao")) return;
        var ok = !q || n.getAttribute("data-procura").indexOf(q) >= 0 || nomeG.indexOf(q) >= 0;
        n.hidden = !ok; if (ok) algum = true;
      });
      g.hidden = !!q && !algum && nomeG.indexOf(q) < 0;
      if (q && algum) g.open = true;
    });
  }

  /* ---------------------------------------------------------------- pré-visualização ao vivo */
  var iframe, mudouT;
  function configPreview() {
    var c = clonar(cfg);
    (function troca(o) {
      Object.keys(o).forEach(function (k) {
        var v = o[k];
        if (typeof v === "string" && imagensNovas[v]) o[k] = imagensNovas[v].url;
        else if (v && typeof v === "object") troca(v);
      });
    })(c);
    return c;
  }
  function enviarPreview() {
    try { iframe.contentWindow.postMessage({ tipo: "pastelaria:config", config: configPreview() }, "*"); } catch (e) {}
  }
  function mudou() {
    sujo = true;
    $("[data-estado-guardar]").textContent = "Há alterações por guardar no site. Ficam seguras neste browser até carregar em “Guardar no site” (Ctrl+S).";
    clearTimeout(mudouT);
    mudouT = setTimeout(function () { enviarPreview(); guardarRascunho(); atualizarProgresso(); }, 140);
  }
  function guardarRascunho() { try { localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify({ config: cfg, quando: Date.now() })); } catch (e) {} }
  function lerRascunho() { try { return JSON.parse(localStorage.getItem(CHAVE_RASCUNHO) || "null"); } catch (e) { return null; } }

  /* ---------------------------------------------------------------- ficheiros: config.js, sitemap, robots, título de cada página */
  function dominio() { return txt(get(cfg, "seo.dominio")).trim().replace(/\/+$/, ""); }
  function escXml(s) { return txt(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function textoConfig() {
    return "/* Configuração do site — gerada pelo editor (abre ../editor.html) em " + new Date().toLocaleString("pt-PT") + ".\n" +
      "   Podes editar à mão, mas mantém o formato: chaves e textos entre \"aspas\". */\n" +
      "window.SITE_CONFIG = " + JSON.stringify(cfg, null, 2) + ";\n";
  }
  function textoRobots() { return "User-agent: *\nAllow: /\n\nSitemap: " + dominio() + "/sitemap.xml\n"; }
  function textoSitemap() {
    var hoje = new Date().toISOString().slice(0, 10), dm = dominio();
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      [["/", "1.0"], ["/privacidade", "0.3"], ["/termos", "0.3"], ["/cookies", "0.3"]].map(function (u) {
        return "  <url><loc>" + escXml(dm + u[0]) + "</loc><lastmod>" + hoje + "</lastmod><priority>" + u[1] + "</priority></url>";
      }).join("\n") + "\n</urlset>\n";
  }
  function srcsetUnsplash(u) {
    if (!/^https:\/\/images\.unsplash\.com\//.test(u) || !/[?&]w=\d+/.test(u)) return "";
    return [480, 800, 1200, 1600].map(function (w) { return u.replace(/([?&])w=\d+/, "$1w=" + w) + " " + w + "w"; }).join(", ");
  }
  function absoluta(src, largura) {
    src = txt(src).trim(); if (!src) return "";
    if (/^https?:\/\//.test(src)) return /images\.unsplash\.com/.test(src) ? src.replace(/([?&])w=\d+/, "$1w=" + largura) : src;
    return dominio() + "/" + src.replace(/^\.?\//, "");
  }
  var RE_META = /<!-- META:INICIO[\s\S]*?<!-- META:FIM -->/;
  function blocoMeta(p) {
    var nome = txt(get(cfg, "negocio.nomeCompleto")) || txt(get(cfg, "negocio.nome")), dm = dominio();
    var tipo = txt(get(cfg, "negocio.tipo")), cid = txt(get(cfg, "negocio.cidade"));
    var M = {
      index: { t: nome + " — " + tipo + (cid ? " em " + cid : ""), d: txt(get(cfg, "seo.descricao")), u: dm + "/" },
      privacidade: { t: "Política de privacidade — " + nome, d: "Como a " + nome + " trata os seus dados pessoais, durante quanto tempo e como exercer os seus direitos.", u: dm + "/privacidade" },
      termos: { t: "Termos e condições — " + nome, d: "Condições de utilização do site, preços, encomendas, alergénios e resolução de litígios da " + nome + ".", u: dm + "/termos" },
      cookies: { t: "Política de cookies — " + nome, d: "Que cookies e armazenamento local usa o site da " + nome + " e como mudar a sua escolha.", u: dm + "/cookies" },
      "404": { t: "Página não encontrada — " + nome, d: "Esta página não existe. Volte ao início ou pesquise no site da " + nome + "." }
    }[p];
    var L = ["<!-- META:INICIO (gerado pelo editor — não editar à mão) -->", "<title>" + esc(M.t) + "</title>", '<meta name="description" content="' + esc(M.d) + '">'];
    if (M.u) L.push('<link rel="canonical" href="' + esc(M.u) + '">');
    if (p === "index") {
      L.push('<meta property="og:type" content="website">', '<meta property="og:locale" content="pt_PT">',
        '<meta property="og:site_name" content="' + esc(nome) + '">', '<meta property="og:title" content="' + esc(M.t) + '">',
        '<meta property="og:description" content="' + esc(M.d) + '">', '<meta property="og:url" content="' + esc(M.u) + '">');
      var img = absoluta(get(cfg, "hero.imagem"), 1200);
      if (img) L.push('<meta property="og:image" content="' + esc(img) + '">');
      L.push('<meta name="twitter:card" content="summary_large_image">');
      var hero = txt(get(cfg, "hero.imagem")).trim(), ss = srcsetUnsplash(hero);
      if (hero) L.push('<link rel="preload" as="image" href="' + esc(hero) + '"' + (ss ? ' imagesrcset="' + esc(ss) + '" imagesizes="(min-width: 900px) 50vw, 100vw"' : "") + ' fetchpriority="high">');
    } else if (p !== "404") {
      L.push('<meta property="og:title" content="' + esc(M.t) + '">', '<meta property="og:type" content="website">');
    }
    L.push("<!-- META:FIM -->");
    return L.join("\n");
  }
  function descarregar(nome, conteudo, tipo) {
    var b = conteudo instanceof Blob ? conteudo : new Blob([conteudo], { type: tipo || "text/plain;charset=utf-8" });
    var u = URL.createObjectURL(b), a = el("a"); a.href = u; a.download = nome;
    d.body.appendChild(a); a.click(); a.parentNode.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
  }
  function usadas() { var s = JSON.stringify(cfg); return Object.keys(imagensNovas).filter(function (c) { return s.indexOf('"' + c + '"') >= 0; }); }

  /* ---------------------------------------------------------------- importar uma ficha (.js ou .json) */
  function paraJSON(s) {
    /* aceita o formato "à mão": comentários, chaves sem aspas, 'aspas simples' e vírgulas no fim */
    var out = "", i = 0, n = s.length;
    while (i < n) {
      var ch = s[i];
      if (ch === '"' || ch === "'") {
        var j = i + 1, buf = "";
        while (j < n && s[j] !== ch) { if (s[j] === "\\") { buf += s[j] + (s[j + 1] || ""); j += 2; continue; } buf += s[j]; j++; }
        if (ch === "'") buf = buf.replace(/\\'/g, "'").replace(/(^|[^\\])"/g, '$1\\"');
        out += '"' + buf + '"'; i = j + 1; continue;
      }
      if (ch === "/" && s[i + 1] === "/") { while (i < n && s[i] !== "\n") i++; continue; }
      if (ch === "/" && s[i + 1] === "*") { var k = s.indexOf("*/", i + 2); i = k < 0 ? n : k + 2; continue; }
      if (ch === "}" || ch === "]") { out = out.replace(/,\s*$/, ""); out += ch; i++; continue; }
      if (/[A-Za-z_$]/.test(ch) && /[{,]\s*$/.test(out)) {
        var m = /^[A-Za-z_$][\w$]*/.exec(s.slice(i))[0], r = i + m.length;
        while (r < n && /\s/.test(s[r])) r++;
        out += s[r] === ":" ? '"' + m + '"' : m; i += m.length; continue;
      }
      out += ch; i++;
    }
    return out;
  }
  function lerFicha(texto) {
    var i = texto.indexOf("{"), j = texto.lastIndexOf("}");
    if (i < 0 || j < i) throw new Error("não encontrei nenhuma ficha dentro do ficheiro.");
    var corpo = texto.slice(i, j + 1), o;
    try { o = JSON.parse(corpo); } catch (e) { o = JSON.parse(paraJSON(corpo)); }
    if (!o || typeof o !== "object" || Array.isArray(o)) throw new Error("o conteúdo não é uma ficha válida.");
    return o;
  }
  function importar(ficheiro) {
    var r = new FileReader();
    r.onload = function () {
      try {
        var o = lerFicha(txt(r.result));
        cfg = completar(o); imagensNovas = {};
        desenharFicha(); mudou();
        aviso("Ficha importada: " + (txt(get(cfg, "negocio.nomeCompleto")) || ficheiro.name) + ".");
      } catch (e) { aviso("Não consegui ler esse ficheiro: " + e.message + " Confirma que é um config.js ou .json do editor.", true); }
    };
    r.readAsText(ficheiro, "utf-8");
  }

  /* ---------------------------------------------------------------- guardar diretamente na pasta do site */
  var temFS = typeof window.showDirectoryPicker === "function";
  function idb(modo, fn) {
    return new Promise(function (ok, erro) {
      if (!window.indexedDB) { ok(null); return; }
      var r = indexedDB.open("editor-pastelaria", 1);
      r.onupgradeneeded = function () { r.result.createObjectStore("k"); };
      r.onsuccess = function () { var tx = r.result.transaction("k", modo), q = fn(tx.objectStore("k")); tx.oncomplete = function () { ok(q && q.result); }; tx.onerror = function () { erro(tx.error); }; };
      r.onerror = function () { erro(r.error); };
    });
  }
  function lembrarPasta(h) { return idb("readwrite", function (s) { return s.put(h, "pasta"); }).catch(function () {}); }
  function pastaLembrada() { return idb("readonly", function (s) { return s.get("pasta"); }).catch(function () { return null; }); }
  async function validarPasta(h) {
    try { await h.getFileHandle("config.js"); await h.getFileHandle("index.html"); }
    catch (e) { throw new Error("essa pasta não é a do site. Escolhe a pasta “site”, a que tem o index.html e o config.js."); }
  }
  async function escolherPasta() {
    var h = await window.showDirectoryPicker({ id: "site-pastelaria", mode: "readwrite" });
    await validarPasta(h);
    pastaSite = h; await lembrarPasta(h);
    aviso("Pasta escolhida: “" + h.name + "”. A partir de agora o botão Guardar escreve lá.");
    return h;
  }
  async function permissao(h) {
    var o = { mode: "readwrite" };
    if (h.queryPermission && (await h.queryPermission(o)) === "granted") return true;
    return h.requestPermission ? (await h.requestPermission(o)) === "granted" : true;
  }
  async function escrever(dir, nome, conteudo) {
    var fh = await dir.getFileHandle(nome, { create: true }), w = await fh.createWritable();
    await w.write(conteudo); await w.close();
  }
  async function lerTexto(dir, nome) { var fh = await dir.getFileHandle(nome); return (await fh.getFile()).text(); }

  async function guardarNoSite() {
    if (!temFS) { descarregarTudo(); return; }
    var btn = $('[data-acao="guardar"]');
    try {
      if (!pastaSite) pastaSite = await pastaLembrada();
      if (!pastaSite) { aviso("Escolhe a pasta “site” deste projeto — só é preciso uma vez."); await escolherPasta(); }
      if (!(await permissao(pastaSite))) throw new Error("o browser não deu autorização para escrever na pasta.");
      await validarPasta(pastaSite);
      btn.disabled = true; btn.textContent = "A guardar…";
      var feitos = [], fotos = usadas();
      if (fotos.length) {
        var imgDir = await (await pastaSite.getDirectoryHandle("assets", { create: true })).getDirectoryHandle("img", { create: true });
        for (var i = 0; i < fotos.length; i++) await escrever(imgDir, fotos[i].split("/").pop(), imagensNovas[fotos[i]].ficheiro);
        feitos.push(fotos.length + (fotos.length === 1 ? " fotografia" : " fotografias"));
      }
      await escrever(pastaSite, "config.js", textoConfig()); feitos.push("config.js");
      if (/^https?:\/\/[^\s]+\.[^\s]+$/.test(dominio())) {
        await escrever(pastaSite, "robots.txt", textoRobots());
        await escrever(pastaSite, "sitemap.xml", textoSitemap());
        feitos.push("sitemap.xml e robots.txt");
      }
      var np = 0;
      for (var k = 0; k < PAGINAS_HTML.length; k++) {
        var nomeF = PAGINAS_HTML[k] + ".html", t;
        try { t = await lerTexto(pastaSite, nomeF); } catch (e) { continue; }
        if (!RE_META.test(t)) continue;
        var novo = t.replace(RE_META, blocoMeta(PAGINAS_HTML[k]));
        if (novo !== t) { await escrever(pastaSite, nomeF, novo); }
        np++;
      }
      if (np) feitos.push("título e descrição de " + np + " páginas");
      Object.keys(imagensNovas).forEach(function (c) { URL.revokeObjectURL(imagensNovas[c].url); });
      imagensNovas = {};
      sujo = false;
      try { localStorage.removeItem(CHAVE_RASCUNHO); } catch (e) {}
      var hora = new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
      $("[data-estado-guardar]").innerHTML = "<strong>Guardado no site às " + esc(hora) + ".</strong> " + esc(feitos.join(" · ")) + ". Já podes publicar a pasta “" + esc(pastaSite.name) + "”.";
      aviso("Guardado: " + feitos.join(", ") + ".");
      iframe.src = iframe.src.replace(/([?&])v=\d+/, "").replace("?editor=1", "?editor=1&v=" + Date.now());
      desenharFicha();
    } catch (e) {
      if (e && e.name === "AbortError") return;
      aviso("Não consegui guardar: " + (e && e.message ? e.message : e) + " Alternativa: “Descarregar config.js”.", true);
    } finally {
      btn.disabled = false; btn.textContent = "Guardar no site";
    }
  }
  function descarregarTudo() {
    descarregar("config.js", textoConfig(), "text/javascript;charset=utf-8");
    var fotos = usadas();
    fotos.forEach(function (c) { descarregar(c.split("/").pop(), imagensNovas[c].ficheiro); });
    aviso("Descarregado. Põe o config.js dentro da pasta “site”" + (fotos.length ? " e as fotografias em site/assets/img/" : "") + ". Para gravar direto na pasta, usa o Chrome ou o Edge.", false);
  }

  /* ---------------------------------------------------------------- arrancar */
  var BASE;
  function iniciar() {
    iframe = $("[data-iframe]");
    var base = window.SITE_CONFIG && typeof window.SITE_CONFIG === "object" ? window.SITE_CONFIG : null;
    BASE = base ? clonar(base) : esqueleto();
    var r = lerRascunho();
    if (r && r.config && JSON.stringify(r.config) !== JSON.stringify(BASE)) {
      cfg = completar(r.config); sujo = true;
      setTimeout(function () { aviso("Recuperei alterações que ainda não estavam guardadas no site."); }, 700);
    } else cfg = completar(clonar(BASE));
    if (!base) setTimeout(function () { aviso("Não consegui ler site/config.js — comecei com uma ficha vazia.", true); }, 700);
    desenharFicha();
    if (sujo) mudou();

    window.addEventListener("message", function (e) {
      if (e.source !== iframe.contentWindow) return;
      var m = e.data;
      if (!m || m.tipo !== "pastelaria:pronto") return;
      enviarPreview();
      var pag = m.pagina === "inicio" ? "index" : m.pagina;
      $$("[data-pagina]").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-pagina") === pag ? "true" : "false"); });
    });
    $$("[data-pagina]").forEach(function (b) {
      b.addEventListener("click", function () { iframe.src = "site/" + b.getAttribute("data-pagina") + ".html?editor=1"; });
    });
    $$("[data-tamanho]").forEach(function (b) {
      b.addEventListener("click", function () {
        iframe.style.width = b.getAttribute("data-tamanho");
        $$("[data-tamanho]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      });
    });
    $("[data-procura-campos]").addEventListener("input", function (e) { filtrarCampos(e.target.value); });

    var fImp = $("[data-ficheiro-importar]");
    fImp.addEventListener("change", function () { if (fImp.files[0]) importar(fImp.files[0]); fImp.value = ""; });
    d.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-acao]"); if (!b) return;
      var a = b.getAttribute("data-acao"), mais = b.closest(".mais"); if (mais) mais.open = false;
      if (a === "guardar") guardarNoSite();
      else if (a === "descarregar") { descarregar("config.js", textoConfig(), "text/javascript;charset=utf-8"); aviso("config.js descarregado. Substitui o que está na pasta “site”."); }
      else if (a === "importar") fImp.click();
      else if (a === "pasta") { if (temFS) escolherPasta().catch(function (er) { if (er.name !== "AbortError") aviso("Não consegui usar essa pasta: " + er.message, true); }); }
      else if (a === "seo") {
        if (!/^https?:\/\//.test(dominio())) { aviso("Preenche primeiro o endereço do site (grupo “Google e endereço”).", true); irPara("seo.dominio", "seo"); return; }
        descarregar("sitemap.xml", textoSitemap(), "application/xml"); descarregar("robots.txt", textoRobots());
      }
      else if (a === "copiar") {
        var t = textoConfig();
        (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { aviso("config.js copiado."); }, function () { aviso("O browser não deixou copiar. Usa “Descarregar config.js”.", true); });
      }
      else if (a === "descartar") {
        if (!confirm("Descartar tudo o que não foi guardado no site e voltar à versão da pasta?")) return;
        try { localStorage.removeItem(CHAVE_RASCUNHO); } catch (er) {}
        imagensNovas = {}; cfg = completar(clonar(BASE)); sujo = false;
        desenharFicha(); enviarPreview();
        $("[data-estado-guardar]").textContent = "Alterações descartadas. A ficha voltou à versão guardada no site.";
      }
    });
    d.addEventListener("keydown", function (e) {
      if ((e.key === "s" || e.key === "S") && (e.ctrlKey || e.metaKey)) { e.preventDefault(); guardarNoSite(); }
    });
    window.addEventListener("beforeunload", function (e) {
      if (Object.keys(imagensNovas).length) { e.preventDefault(); e.returnValue = ""; }
    });
    if (!temFS) {
      var g = $('[data-acao="guardar"]'); g.textContent = "Descarregar tudo";
      $('[data-acao="pasta"]').hidden = true;
      $("[data-estado-guardar]").textContent = "Este browser não grava diretamente em pastas: “Descarregar tudo” dá-te o config.js e as fotografias. No Chrome ou no Edge, grava direto.";
    }
  }
  iniciar();
})();
