/* ==========================================================================
   Pastelaria — motor do site
   Lê o window.SITE_CONFIG (config.js) e desenha tudo. As funções de desenho
   podem correr várias vezes (o editor manda config novo e o site redesenha).
   ========================================================================== */
(function () {
  "use strict";

  var d = document, html = d.documentElement;
  var C = window.SITE_CONFIG || {};
  var EDITOR = html.classList.contains("modo-editor");
  var PAGINA = html.getAttribute("data-pagina") || "";
  var RAIZ = PAGINA === "404" ? "/" : ""; /* a 404 pode ser servida em qualquer endereço */
  var DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  var REDUZ = false;
  try { REDUZ = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  /* ---------------------------------------------------------------- utils */
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function get(o, caminho) {
    return caminho.split(".").reduce(function (a, k) { return a == null ? undefined : a[k]; }, o);
  }
  function txt(v) { return v == null ? "" : String(v); }
  function lista(v) { return Array.isArray(v) ? v : []; }
  function esc(s) {
    return txt(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  /* só deixa passar ligações seguras (bloqueia javascript:, data:, etc.) */
  function urlSegura(u) {
    u = txt(u).trim();
    if (!u) return "";
    if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
    if (/^(blob:)/i.test(u) && EDITOR) return u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u) || /^\/\//.test(u)) return "";
    return u; // caminho relativo (ex.: assets/img/foto.jpg)
  }
  function imgSegura(u) {
    u = txt(u).trim();
    if (/^data:image\/(png|jpe?g|webp|gif|avif);base64,/i.test(u)) return u;
    return urlSegura(u);
  }
  function mapaSeguro(u) {
    u = txt(u).trim();
    return /^https:\/\/(www\.)?google\.[a-z.]+\/maps/i.test(u) ? u : "";
  }
  function telHref(t) { var n = txt(t).replace(/[^\d+]/g, ""); return n ? "tel:" + n : ""; }
  function waHref(msg) {
    var n = txt(get(C, "contacto.whatsapp")).replace(/\D/g, "");
    if (!n) return "";
    return "https://wa.me/" + n + (msg ? "?text=" + encodeURIComponent(msg) : "");
  }
  function minutos(h) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(txt(h).trim());
    return m ? (+m[1]) * 60 + (+m[2]) : null;
  }
  function el(tag, cls, texto) {
    var n = d.createElement(tag);
    if (cls) n.className = cls;
    if (texto != null) n.textContent = texto;
    return n;
  }
  function svg(nome) {
    var P = {
      pesquisa: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
      telefone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
      whatsapp: '<path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.4z"/><path d="M9 10c.5 2 2 3.5 4 4l1.2-1.2 2 .8-.4 1.6c-3.6.6-8-3.8-7.4-7.4L10 7.4l.8 2z"/>',
      email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
      mapa: '<path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
      instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8"/>',
      facebook: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/>',
      estrela: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
      seta: '<path d="M12 19V5M5 12l7-7 7 7"/>',
      fechar: '<path d="M6 6l12 12M18 6 6 18"/>',
      anterior: '<path d="m15 18-6-6 6-6"/>',
      seguinte: '<path d="m9 18 6-6-6-6"/>'
    };
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (P[nome] || "") + "</svg>";
  }
  var NATA = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="21" fill="#D6A461" stroke="#9A5A2E" stroke-width="3" stroke-dasharray="4 3"/><circle cx="32" cy="32" r="15" fill="#F2D38C"/><ellipse cx="27" cy="28" rx="5" ry="3.5" fill="#9A5A2E" opacity=".85"/><ellipse cx="37" cy="35" rx="4" ry="3" fill="#7A3E1D" opacity=".8"/></svg>';

  /* imagens: srcset automático para fotos do Unsplash */
  function srcsetDe(u) {
    if (!/^https:\/\/images\.unsplash\.com\//.test(u) || !/[?&]w=\d+/.test(u)) return "";
    return [480, 800, 1200, 1600].map(function (w) {
      return u.replace(/([?&])w=\d+/, "$1w=" + w) + " " + w + "w";
    }).join(", ");
  }
  function porImagem(img, src, alt, sizes) {
    var s = imgSegura(src);
    if (!s) { img.removeAttribute("src"); img.removeAttribute("srcset"); img.alt = txt(alt); return; }
    var ss = srcsetDe(s);
    if (ss) { img.srcset = ss; img.sizes = sizes || "(min-width: 900px) 50vw, 100vw"; }
    else { img.removeAttribute("srcset"); img.removeAttribute("sizes"); }
    if (img.getAttribute("src") !== s) img.src = s;
    img.alt = txt(alt);
  }
  function novaImagem(src, alt, sizes, preguicosa) {
    var i = d.createElement("img");
    i.decoding = "async";
    if (preguicosa !== false) i.loading = "lazy";
    porImagem(i, src, alt, sizes);
    return i;
  }
  /* se uma foto falhar, fica um fundo cor de areia em vez do ícone partido */
  d.addEventListener("error", function (e) {
    var t = e.target;
    if (t && t.tagName === "IMG" && !t.dataset.falhou) { t.dataset.falhou = "1"; t.classList.add("img-falhou"); }
  }, true);

  function formatarData(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(txt(iso));
    if (!m) return txt(iso);
    var meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    return (+m[3]) + " de " + meses[(+m[2]) - 1] + " de " + m[1];
  }
  function dominio() { return txt(get(C, "seo.dominio")).replace(/\/+$/, ""); }

  /* -------------------------------------------------- cabeçalho e rodapé */
  function desenharTopo() {
    var slot = $('[data-slot="topo"]');
    if (!slot) return;
    var inicio = PAGINA === "inicio" ? "" : RAIZ + "index.html";
    if (!slot.firstChild) {
      slot.innerHTML =
        '<header class="topo" id="topo">' +
          '<div class="topo__barra">' +
            '<a class="marca" href="' + (inicio || "#inicio") + '"><span class="marca__nome" data-cfg="negocio.nome"></span><span class="marca__tipo" data-cfg="negocio.tipo"></span></a>' +
            '<nav class="nav" id="nav" aria-label="Principal">' +
              '<a href="' + inicio + '#especialidades">Especialidades</a>' +
              '<a href="' + inicio + '#menu">Menu</a>' +
              '<a href="' + inicio + '#encomendas" data-se-encomendas>Encomendas</a>' +
              '<a href="' + inicio + '#casa">A casa</a>' +
              '<a href="' + inicio + '#visitar">Visitar</a>' +
            "</nav>" +
            '<div class="topo__acoes">' +
              '<span class="estado" data-estado hidden><span class="estado__ponto"></span><span class="estado__txt"></span></span>' +
              '<button class="btn-icone" type="button" data-abrir-pesquisa aria-label="Pesquisar no site">' + svg("pesquisa") + '<kbd data-atalho>Ctrl K</kbd></button>' +
              '<a class="btn btn--pequeno topo__cta" href="' + inicio + '#encomendas" data-se-encomendas>Encomendar</a>' +
              '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav" aria-label="Abrir menu"><span></span><span></span></button>' +
            "</div>" +
          "</div>" +
        "</header>";
      if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) $("[data-atalho]", slot).textContent = "⌘ K";
    }
  }

  function desenharRodape() {
    var slot = $('[data-slot="rodape"]');
    if (!slot) return;
    var inicio = PAGINA === "inicio" ? "" : RAIZ + "index.html";
    slot.innerHTML =
      '<footer class="rodape">' +
        '<div class="rodape__grelha">' +
          '<div class="rodape__marca"><p class="rodape__nome" data-cfg="negocio.nome"></p><p class="rodape__desc" data-cfg="seo.descricao"></p></div>' +
          '<div class="rodape__col"><h2 class="rodape__tit">Visitar</h2><address data-rodape-morada></address><p data-rodape-horario></p></div>' +
          '<div class="rodape__col"><h2 class="rodape__tit">Contactos</h2><ul class="rodape__lista" data-rodape-contactos></ul></div>' +
          '<div class="rodape__col"><h2 class="rodape__tit">Informação</h2><ul class="rodape__lista">' +
            '<li><a href="' + RAIZ + 'privacidade.html">Política de privacidade</a></li>' +
            '<li><a href="' + RAIZ + 'termos.html">Termos e condições</a></li>' +
            '<li><a href="' + RAIZ + 'cookies.html">Política de cookies</a></li>' +
            '<li><button type="button" class="rodape__botao" data-abrir-cookies>Preferências de cookies</button></li>' +
            '<li><a href="https://www.livroreclamacoes.pt/" target="_blank" rel="noopener">Livro de Reclamações</a></li>' +
          "</ul></div>" +
        "</div>" +
        '<div class="rodape__base">' +
          '<p><span data-ano></span> <span data-cfg="legal.denominacao"></span> · NIF <span data-cfg="legal.nif"></span></p>' +
          '<p class="rodape__ral">Litígios de consumo: <a data-cfg-href="legal.ralSite" target="_blank" rel="noopener" data-cfg="legal.ralNome"></a>. Mais entidades em <a href="https://www.consumidor.gov.pt/" target="_blank" rel="noopener">consumidor.gov.pt</a>.</p>' +
          '<div class="rodape__redes" data-redes></div>' +
          '<p class="rodape__creditos" data-creditos></p>' +
        "</div>" +
        '<p class="rodape__gigante" aria-hidden="true" data-cfg="negocio.nome"></p>' +
      "</footer>";
    var ano = $("[data-ano]", slot);
    if (ano) ano.textContent = "© " + new Date().getFullYear();
    if (!inicio) return;
  }

  /* -------------------------------------------------- textos genéricos */
  function desenharTextos() {
    $$("[data-cfg]").forEach(function (n) {
      var v = get(C, n.getAttribute("data-cfg"));
      if (v != null && typeof v !== "object") n.textContent = txt(v);
    });
    $$("[data-cfg-href]").forEach(function (n) {
      var v = urlSegura(get(C, n.getAttribute("data-cfg-href")));
      if (v) { n.href = v; n.hidden = false; } else { n.removeAttribute("href"); }
    });
    $$("[data-cfg-data]").forEach(function (n) { n.textContent = formatarData(get(C, n.getAttribute("data-cfg-data"))); });
    $$("[data-paragrafos]").forEach(function (n) {
      n.textContent = "";
      txt(get(C, n.getAttribute("data-paragrafos"))).split(/\n\s*\n/).forEach(function (p) {
        if (p.trim()) n.appendChild(el("p", null, p.trim()));
      });
    });
    $$("[data-img]").forEach(function (img) {
      var alt = img.getAttribute("data-alt");
      porImagem(img, get(C, img.getAttribute("data-img")), alt ? get(C, alt) : "", img.getAttribute("data-sizes"));
    });
    $$("[data-cfg-email]").forEach(function (n) {
      var v = txt(get(C, n.getAttribute("data-cfg-email"))).trim();
      n.textContent = v; if (/^[^\s@]+@[^\s@]+$/.test(v)) n.href = "mailto:" + v;
    });
    var ativo = get(C, "encomendas.ativo") !== false;
    $$("[data-se-encomendas]").forEach(function (n) { n.hidden = !ativo; });
    var selo = $("[data-selo]");
    if (selo) { var s = txt(get(C, "hero.selo")) || "feito à mão todos os dias"; selo.textContent = s + " · " + s + " · "; }
  }

  /* -------------------------------------------------- abertura */
  function desenharHero() {
    var h = $("[data-hero-titulo]");
    if (!h) return;
    var fotos = lista(get(C, "hero.fotosTitulo"));
    var partes = txt(get(C, "hero.titulo")).split(/\[foto\]/i);
    var i = 0, fi = 0;
    h.textContent = "";
    partes.forEach(function (parte, pi) {
      parte.split(/(\s+)/).forEach(function (pal) {
        if (!pal) return;
        if (/^\s+$/.test(pal)) { h.appendChild(d.createTextNode(" ")); return; }
        var w = el("span", "pal"), inner = el("span", null, pal);
        inner.style.setProperty("--i", i++);
        w.appendChild(inner); h.appendChild(w);
      });
      if (pi < partes.length - 1) {
        var f = fotos[fi++];
        if (f && imgSegura(f.src)) {
          var wrap = el("span", "pal"), pill = el("span", "titulo-foto");
          pill.appendChild(novaImagem(f.src, f.alt, "160px", false));
          pill.style.setProperty("--i", i++);
          wrap.appendChild(pill); h.appendChild(wrap);
        }
      }
    });
    var faixa = $("[data-faixa]");
    if (faixa) {
      var nomes = [];
      lista(C.especialidades).forEach(function (e) { if (e && e.nome) nomes.push(e.nome); });
      lista(C.menu).forEach(function (c) { lista(c && c.itens).slice(0, 2).forEach(function (it) { if (it && it.nome && nomes.indexOf(it.nome) < 0) nomes.push(it.nome); }); });
      faixa.textContent = "";
      for (var k = 0; k < 2; k++) {
        nomes.forEach(function (nm) {
          var s = el("span", "faixa__item"); s.appendChild(d.createTextNode(nm));
          s.insertAdjacentHTML("beforeend", NATA); faixa.appendChild(s);
        });
      }
    }
  }

  /* -------------------------------------------------- especialidades */
  function desenharEspecialidades() {
    var box = $("[data-especialidades]");
    if (!box) return;
    box.textContent = "";
    var validas = lista(C.especialidades).filter(Boolean);
    box.className = "bento bento--" + Math.min(validas.length, 5); /* a grelha adapta-se ao número de itens */
    validas.forEach(function (e, i) {
      var art = el("article", "prato" + (i === 0 ? " prato--grande" : ""));
      var fig = el("figure", "prato__foto" + (i === 0 ? " arco" : ""));
      fig.appendChild(novaImagem(e.imagem, e.alt, i === 0 ? "(min-width: 900px) 50vw, 100vw" : "(min-width: 900px) 25vw, 100vw"));
      var corpo = el("div", "prato__corpo");
      var topo = el("div", "prato__topo");
      topo.appendChild(el("h3", "prato__nome", e.nome));
      if (e.preco) topo.appendChild(el("span", "prato__preco", e.preco));
      corpo.appendChild(topo);
      if (e.descricao) corpo.appendChild(el("p", "prato__desc", e.descricao));
      art.appendChild(fig); art.appendChild(corpo);
      art.setAttribute("data-revela", "");
      box.appendChild(art);
    });
  }

  /* -------------------------------------------------- menu */
  var menuEstado = { cat: 0, filtro: "" };
  function semAcentos(s) { return txt(s).normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function slug(s) { return semAcentos(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function desenharMenu() {
    var tabs = $("[data-menu-tabs]"), filtros = $("[data-menu-filtros]"), paineis = $("[data-menu-paineis]");
    if (!tabs || !paineis) return;
    var cats = lista(C.menu).filter(function (c) { return c && c.nome; });
    if (menuEstado.cat >= cats.length) menuEstado.cat = 0;
    tabs.textContent = "";
    cats.forEach(function (c, i) {
      var b = el("button", "menu__tab");
      b.type = "button"; b.id = "tab-" + i;
      b.setAttribute("role", "tab");
      b.setAttribute("aria-controls", "painel-" + i);
      b.setAttribute("aria-selected", i === menuEstado.cat ? "true" : "false");
      b.tabIndex = i === menuEstado.cat ? 0 : -1;
      b.setAttribute("data-cat", i);
      b.appendChild(d.createTextNode(c.nome));
      b.appendChild(el("small", null, String(lista(c.itens).length)));
      tabs.appendChild(b);
    });
    var todas = {};
    cats.forEach(function (c) { lista(c.itens).forEach(function (it) { lista(it && it.etiquetas).forEach(function (t) { if (t) todas[t] = 1; }); }); });
    if (filtros) {
      filtros.textContent = "";
      Object.keys(todas).forEach(function (t) {
        var ch = el("button", "chip", t);
        ch.type = "button"; ch.setAttribute("data-filtro", t);
        ch.setAttribute("aria-pressed", menuEstado.filtro === t ? "true" : "false");
        filtros.appendChild(ch);
      });
      if (menuEstado.filtro && !todas[menuEstado.filtro]) menuEstado.filtro = "";
    }
    paineis.textContent = "";
    cats.forEach(function (c, i) {
      var p = el("div", "menu__painel");
      p.id = "painel-" + i; p.setAttribute("role", "tabpanel"); p.setAttribute("aria-labelledby", "tab-" + i);
      p.hidden = i !== menuEstado.cat;
      var ul = el("ul", "menu__lista"), n = 0;
      lista(c.itens).forEach(function (it, j) {
        if (!it || !it.nome) return;
        if (menuEstado.filtro && lista(it.etiquetas).indexOf(menuEstado.filtro) < 0) return;
        n++;
        var li = el("li", "item"); li.id = "item-" + i + "-" + j;
        var linha = el("div", "item__linha");
        linha.appendChild(el("span", "item__nome", it.nome));
        linha.appendChild(el("span", "item__pontos"));
        linha.appendChild(el("span", "item__preco", it.preco));
        li.appendChild(linha);
        if (it.descricao) li.appendChild(el("p", "item__desc", it.descricao));
        var tags = lista(it.etiquetas).filter(Boolean);
        if (tags.length) {
          var tw = el("div", "item__etiquetas");
          tags.forEach(function (t) { tw.appendChild(el("span", "etiqueta etiqueta--" + slug(t), t)); });
          li.appendChild(tw);
        }
        ul.appendChild(li);
      });
      if (n) p.appendChild(ul);
      else p.appendChild(el("p", "menu__vazio", "Nada nesta categoria com o filtro “" + menuEstado.filtro + "”. Toque no filtro outra vez para ver tudo."));
      paineis.appendChild(p);
    });
  }
  function escolherCategoria(i, focar) {
    menuEstado.cat = i;
    $$(".menu__tab").forEach(function (b, k) {
      b.setAttribute("aria-selected", k === i ? "true" : "false");
      b.tabIndex = k === i ? 0 : -1;
      if (k === i && focar) b.focus();
    });
    $$(".menu__painel").forEach(function (p, k) { p.hidden = k !== i; });
  }

  /* -------------------------------------------------- encomendas */
  function precoNum() { var v = parseFloat(txt(get(C, "encomendas.precoPorPessoa")).replace(",", ".")); return isFinite(v) && v > 0 ? v : 0; }
  function euros(v) { return v.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"; }
  function isoLocal(dt) { return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0"); }
  function dataMinima() {
    var dias = parseInt(get(C, "encomendas.antecedenciaDias"), 10);
    if (!isFinite(dias) || dias < 0) dias = 2;
    var dt = new Date(); dt.setDate(dt.getDate() + dias); return dt;
  }
  function desenharEncomendas() {
    var f = $("[data-pedido]");
    if (!f) return;
    $$("[data-opcoes]", f).forEach(function (s) {
      var atual = s.value;
      s.textContent = "";
      lista(get(C, s.getAttribute("data-opcoes"))).forEach(function (o) { if (o) { var op = el("option", null, o); op.value = o; s.appendChild(op); } });
      if (atual) s.value = atual;
      if (!s.value && s.options.length) s.selectedIndex = 0;
    });
    var min = dataMinima(), dataIn = $("#p-data", f);
    dataIn.min = isoLocal(min);
    var mm = $("[data-data-minima]", f);
    if (mm) mm.textContent = min.toLocaleDateString("pt-PT", { day: "numeric", month: "long" });
    atualizarEstimativa();
  }
  function atualizarEstimativa() {
    var out = $("[data-estimativa]"), inp = $("#p-pessoas");
    if (!out || !inp) return;
    var n = parseInt(inp.value, 10), p = precoNum();
    if (!p || !isFinite(n) || n < 1) { out.textContent = "Respondemos com o preço final no mesmo dia."; return; }
    out.innerHTML = "Estimativa para " + n + " pessoas: <strong>" + esc(euros(n * p)) + "</strong><br>Preço final confirmado por nós, depende da decoração.";
  }

  /* -------------------------------------------------- processo, galeria, faq */
  function desenharProcesso() {
    var ol = $("[data-processo]");
    if (!ol) return;
    ol.textContent = "";
    lista(C.processo).forEach(function (p) {
      if (!p) return;
      var li = el("li", "passo"); li.setAttribute("data-revela", "");
      var hora = el("time", "passo__hora", p.hora); if (minutos(p.hora) != null) hora.dateTime = p.hora;
      li.appendChild(hora);
      if (p.imagem) { var fig = el("figure", "passo__foto"); fig.appendChild(novaImagem(p.imagem, p.alt, "(min-width: 900px) 25vw, 50vw")); li.appendChild(fig); }
      li.appendChild(el("h4", "passo__tit", p.titulo));
      if (p.texto) li.appendChild(el("p", "passo__txt", p.texto));
      ol.appendChild(li);
    });
    var cab = $(".processo-cab"); if (cab) cab.hidden = !lista(C.processo).length;
  }
  function desenharGaleria() {
    var g = $("[data-galeria]");
    if (!g) return;
    g.textContent = "";
    var fotos = lista(C.galeria).filter(function (f) { return f && imgSegura(f.src); });
    fotos.forEach(function (f, i) {
      var b = el("button", "galeria__item"); b.type = "button";
      b.setAttribute("data-foto", i);
      b.setAttribute("aria-label", "Ver fotografia: " + (f.alt || "sem descrição"));
      b.appendChild(novaImagem(f.src, f.alt, "(min-width: 900px) 33vw, 100vw"));
      g.appendChild(b);
    });
    var sec = $("#galeria"); if (sec) sec.hidden = !fotos.length;
  }
  function desenharFaq() {
    var box = $("[data-faq]");
    if (!box) return;
    box.textContent = "";
    lista(C.faq).forEach(function (q) {
      if (!q || !q.pergunta) return;
      var det = el("details", "pergunta"), sum = el("summary");
      sum.appendChild(el("span", null, q.pergunta));
      sum.appendChild(el("span", "pergunta__sinal"));
      det.appendChild(sum);
      det.appendChild(el("p", "pergunta__resp", q.resposta));
      box.appendChild(det);
    });
    var sec = $("#perguntas"); if (sec) sec.hidden = !box.children.length;
  }

  /* -------------------------------------------------- horário e estado */
  function horarioDoDia(idx) { /* idx: 0 = domingo */
    var nome = DIAS[idx];
    var h = lista(C.horario).filter(function (x) { return x && x.dia === nome; })[0];
    return h || null;
  }
  function estadoAgora() {
    var agora = new Date(), dia = agora.getDay(), m = agora.getHours() * 60 + agora.getMinutes();
    var h = horarioDoDia(dia);
    if (!lista(C.horario).length) return null;
    if (h && !h.fechado) {
      var a = minutos(h.abre), f = minutos(h.fecha);
      if (a != null && f != null && m >= a && m < f) {
        if (f - m <= 45) return { tipo: "quase", curto: "Fecha às " + h.fecha, longo: "Aberto, mas fecha às " + h.fecha + "." };
        return { tipo: "aberto", curto: "Aberto até às " + h.fecha, longo: "Aberto agora, até às " + h.fecha + "." };
      }
      if (a != null && m < a) return { tipo: "fechado", curto: "Abre às " + h.abre, longo: "Fechado. Hoje abrimos às " + h.abre + "." };
    }
    for (var k = 1; k <= 7; k++) {
      var di = (dia + k) % 7, hh = horarioDoDia(di);
      if (hh && !hh.fechado && minutos(hh.abre) != null) {
        var quando = k === 1 ? "amanhã" : (di === 0 ? "no domingo" : "na " + DIAS[di].toLowerCase());
        if (di === 6) quando = k === 1 ? "amanhã" : "no sábado";
        return { tipo: "fechado", curto: "Abre " + quando + " às " + hh.abre, longo: "Fechado. Abrimos " + quando + " às " + hh.abre + "." };
      }
    }
    return { tipo: "fechado", curto: "Fechado", longo: "Fechado." };
  }
  function agrupaHorario() {
    var ordem = [1, 2, 3, 4, 5, 6, 0], grupos = [];
    ordem.forEach(function (i) {
      var h = horarioDoDia(i); if (!h) return;
      var chave = h.fechado ? "fechado" : txt(h.abre) + "–" + txt(h.fecha);
      var ult = grupos[grupos.length - 1];
      if (ult && ult.chave === chave) { ult.fim = i; ult.dias.push(i); }
      else grupos.push({ chave: chave, ini: i, fim: i, dias: [i], fechado: !!h.fechado });
    });
    return grupos;
  }
  function nomeGrupo(g) {
    if (g.ini === g.fim) return DIAS[g.ini];
    return DIAS[g.ini] + (g.dias.length === 2 ? " e " : " a ") + DIAS[g.fim].toLowerCase();
  }
  function desenharHorario() {
    var hoje = new Date().getDay();
    var tb = $("[data-horario]");
    if (tb) {
      tb.textContent = "";
      agrupaHorario().forEach(function (g) {
        var tr = el("tr"), th = el("th", null, nomeGrupo(g));
        th.scope = "row";
        tr.appendChild(th);
        tr.appendChild(el("td", null, g.fechado ? "Fechado" : g.chave.replace("–", " – ")));
        if (g.dias.indexOf(hoje) >= 0) tr.setAttribute("data-hoje", "");
        tb.appendChild(tr);
      });
    }
    var est = estadoAgora();
    $$("[data-estado]").forEach(function (n) {
      if (!est) { n.hidden = true; return; }
      n.hidden = false; n.setAttribute("data-tipo", est.tipo);
      $(".estado__txt", n).textContent = est.curto;
    });
    var grande = $("[data-estado-grande]");
    if (grande) { grande.hidden = !est; if (est) { grande.setAttribute("data-tipo", est.tipo); grande.textContent = est.longo; } }
    var hj = $("[data-hoje]");
    if (hj) {
      var h = horarioDoDia(hoje);
      hj.innerHTML = h ? (h.fechado ? "Hoje estamos <strong>fechados</strong>." : "Hoje: <strong>" + esc(h.abre) + " – " + esc(h.fecha) + "</strong>") : "";
    }
    var rh = $("[data-rodape-horario]");
    if (rh) {
      rh.textContent = "";
      agrupaHorario().forEach(function (g, k) {
        if (k) rh.appendChild(el("br"));
        rh.appendChild(d.createTextNode(nomeGrupo(g) + ": " + (g.fechado ? "fechado" : g.chave.replace("–", " – "))));
      });
    }
  }

  /* -------------------------------------------------- contactos e rodapé */
  function linkContacto(tipo, href, texto, externo) {
    var a = el("a"); a.href = href;
    if (externo) { a.target = "_blank"; a.rel = "noopener"; }
    a.innerHTML = svg(tipo); a.appendChild(d.createTextNode(texto));
    return a;
  }
  function desenharContactos() {
    var ct = C.contacto || {};
    var morada = [ct.morada, [ct.codigoPostal, ct.localidade].filter(Boolean).join(" ")].filter(Boolean).join(", ");
    var box = $("[data-contactos]");
    if (box) {
      box.textContent = "";
      if (morada && urlSegura(ct.mapaLink)) box.appendChild(linkContacto("mapa", urlSegura(ct.mapaLink), morada, true));
      else if (morada) box.appendChild(el("p", null, morada));
      if (telHref(ct.telefone)) box.appendChild(linkContacto("telefone", telHref(ct.telefone), ct.telefone));
      if (/^[^\s@]+@[^\s@]+$/.test(txt(ct.email))) box.appendChild(linkContacto("email", "mailto:" + ct.email, ct.email));
    }
    var ac = $("[data-visitar-acoes]");
    if (ac) {
      ac.textContent = "";
      if (urlSegura(ct.mapaLink)) { var a1 = linkContacto("mapa", urlSegura(ct.mapaLink), "Como chegar", true); a1.className = "btn"; ac.appendChild(a1); }
      if (telHref(ct.telefone)) { var a2 = linkContacto("telefone", telHref(ct.telefone), "Ligar"); a2.className = "btn btn--linha"; ac.appendChild(a2); }
      if (waHref()) { var a3 = linkContacto("whatsapp", waHref("Olá! Tenho uma pergunta."), "WhatsApp", true); a3.className = "btn btn--linha"; ac.appendChild(a3); }
    }
    $$('[data-link="whatsapp"]').forEach(function (a) {
      var w = waHref("Olá! Tenho uma pergunta."); if (w) { a.href = w; a.target = "_blank"; a.rel = "noopener"; }
    });
    var rm = $("[data-rodape-morada]"); if (rm) rm.textContent = morada;
    var rc = $("[data-rodape-contactos]");
    if (rc) {
      rc.textContent = "";
      if (telHref(ct.telefone)) { var l1 = el("li"); l1.appendChild(linkContacto("telefone", telHref(ct.telefone), ct.telefone)); rc.appendChild(l1); }
      if (waHref()) { var l2 = el("li"); l2.appendChild(linkContacto("whatsapp", waHref(), "WhatsApp", true)); rc.appendChild(l2); }
      if (/^[^\s@]+@[^\s@]+$/.test(txt(ct.email))) { var l3 = el("li"); l3.appendChild(linkContacto("email", "mailto:" + ct.email, ct.email)); rc.appendChild(l3); }
    }
    var redes = $("[data-redes]");
    if (redes) {
      redes.textContent = "";
      [["instagram", "Instagram"], ["facebook", "Facebook"], ["estrela", "Avaliações no Google", "avaliacoesGoogle"]].forEach(function (r) {
        var u = urlSegura(get(C, "redes." + (r[2] || r[0])));
        if (/^https?:/.test(u)) { var a = el("a", "rodape__rede"); a.href = u; a.target = "_blank"; a.rel = "noopener"; a.innerHTML = svg(r[0]); a.appendChild(el("span", null, r[1])); redes.appendChild(a); }
      });
    }
    var cr = $("[data-creditos]");
    if (cr) {
      var nome = txt(get(C, "creditos.nome")), lk = urlSegura(get(C, "creditos.link"));
      cr.textContent = "";
      if (nome) {
        cr.appendChild(d.createTextNode("Site por "));
        if (/^https?:/.test(lk)) { var ca = el("a", null, nome); ca.href = lk; ca.target = "_blank"; ca.rel = "noopener"; cr.appendChild(ca); }
        else cr.appendChild(d.createTextNode(nome));
      }
    }
  }

  /* -------------------------------------------------- título, descrição e dados para o Google */
  function desenharMeta() {
    var nome = txt(get(C, "negocio.nomeCompleto")) || txt(get(C, "negocio.nome"));
    var titulos = {
      inicio: nome + " — " + txt(get(C, "negocio.tipo")) + (get(C, "negocio.cidade") ? " em " + get(C, "negocio.cidade") : ""),
      privacidade: "Política de privacidade — " + nome,
      termos: "Termos e condições — " + nome,
      cookies: "Política de cookies — " + nome,
      "404": "Página não encontrada — " + nome
    };
    if (titulos[PAGINA]) d.title = titulos[PAGINA];
    var md = $('meta[name="description"]');
    if (md && PAGINA === "inicio" && get(C, "seo.descricao")) md.content = txt(get(C, "seo.descricao"));
    if (PAGINA !== "inicio") return;
    var ct = C.contacto || {}, horas = [];
    lista(C.horario).forEach(function (h) {
      var i = DIAS.indexOf(h && h.dia);
      if (i < 0 || h.fechado || minutos(h.abre) == null || minutos(h.fecha) == null) return;
      horas.push({ "@type": "OpeningHoursSpecification", dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][i], opens: h.abre, closes: h.fecha });
    });
    var ld = {
      "@context": "https://schema.org", "@type": "Bakery", name: nome,
      description: txt(get(C, "seo.descricao")), url: dominio() + "/",
      telephone: txt(ct.telefone), email: txt(ct.email),
      image: imgSegura(get(C, "hero.imagem")),
      address: { "@type": "PostalAddress", streetAddress: txt(ct.morada), postalCode: txt(ct.codigoPostal), addressLocality: txt(ct.localidade), addressCountry: "PT" },
      openingHoursSpecification: horas, servesCuisine: "Pastelaria portuguesa", priceRange: "€"
    };
    var s = d.getElementById("dados-estruturados");
    if (!s) { s = d.createElement("script"); s.type = "application/ld+json"; s.id = "dados-estruturados"; d.head.appendChild(s); }
    s.textContent = JSON.stringify(ld);
  }

  /* -------------------------------------------------- índice das páginas legais */
  function desenharIndice() {
    var box = $("[data-indice]"), texto = $(".legal__texto");
    if (!box || !texto) return;
    box.textContent = "";
    $$("h2", texto).forEach(function (h, i) {
      if (!h.id) h.id = "s" + (i + 1) + "-" + slug(h.textContent).slice(0, 40);
      var li = el("li"), a = el("a", null, h.textContent);
      a.href = "#" + h.id; li.appendChild(a); box.appendChild(li);
    });
  }

  /* ================================================== desenhar tudo */
  function desenharTudo() {
    desenharTopo(); desenharRodape(); desenharTextos(); desenharHero(); desenharEspecialidades();
    desenharMenu(); desenharEncomendas(); desenharProcesso(); desenharGaleria(); desenharFaq();
    desenharHorario(); desenharContactos(); desenharMeta(); desenharIndice();
    indicePesquisa = null;
    observarRevelacoes();
    observarNav();
  }
  function aplicarCores() {
    var cores = C.cores || {}, m = { fundo: "--c-fundo", creme: "--c-creme", areia: "--c-areia", destaque: "--c-destaque", texto: "--c-texto" };
    Object.keys(m).forEach(function (k) {
      if (typeof cores[k] === "string" && /^#[0-9a-f]{6}$/i.test(cores[k])) html.style.setProperty(m[k], cores[k]);
      else html.style.removeProperty(m[k]);
    });
    var tc = $('meta[name="theme-color"]'); if (tc && /^#[0-9a-f]{6}$/i.test(txt(cores.fundo))) tc.content = cores.fundo;
  }

  /* -------------------------------------------------- aviso (toast) */
  var avisoT;
  function aviso(msg) {
    var a = $(".aviso");
    if (!a) { a = el("div", "aviso"); a.setAttribute("role", "status"); a.setAttribute("aria-live", "polite"); d.body.appendChild(a); }
    a.textContent = msg; a.classList.add("aviso--ver");
    clearTimeout(avisoT); avisoT = setTimeout(function () { a.classList.remove("aviso--ver"); }, 3200);
  }

  /* -------------------------------------------------- entrada */
  var abriu = false;
  /* setTimeout e não requestAnimationFrame: continua a funcionar se a página abrir num separador em segundo plano */
  function abertura() { if (abriu) return; abriu = true; setTimeout(function () { html.classList.add("abertura"); }, 30); }
  function intro() {
    var ov = $("#intro");
    if (!ov || !html.classList.contains("com-intro")) { if (ov) ov.parentNode.removeChild(ov); abertura(); return; }
    var nome = txt(get(C, "negocio.nome")); $(".intro__nome", ov).textContent = nome;
    var FADE = 1000, P = parseFloat(get(C, "intro.pausa")); P = (isFinite(P) && P >= 0 ? Math.min(P, 3) : .3) * 1000;
    function fim() {
      clearTimeout(salva); html.classList.remove("com-intro");
      if (ov.parentNode) ov.parentNode.removeChild(ov);
      try { sessionStorage.setItem("intro-vista", "1"); } catch (e) {}
      abertura();
    }
    var salva = setTimeout(fim, FADE * 3 + P + 4000);
    setTimeout(function () { ov.classList.add("intro--nome"); }, 40);                 /* 1) nome aparece (1s) */
    setTimeout(function () { ov.classList.add("intro--sai"); }, FADE + P);            /* 2) ecrã desaparece (1s) */
    setTimeout(function () { html.classList.remove("com-intro"); ov.style.display = "grid"; abertura(); }, FADE + P + FADE * .55); /* 3) site aparece (1s) */
    setTimeout(fim, FADE * 2 + P + FADE + 300);
  }

  /* -------------------------------------------------- rolar: cabeçalho, progresso, voltar ao topo, paralaxe */
  var ultimoY = 0, pedido = false, navAberta = false;
  function aoRolar() {
    pedido = false;
    var y = window.scrollY || 0, max = d.documentElement.scrollHeight - window.innerHeight, p = max > 0 ? Math.min(1, y / max) : 0;
    var topo = $("#topo");
    if (topo) {
      topo.classList.toggle("topo--rolado", y > 24);
      topo.classList.toggle("topo--escondido", y > ultimoY && y > 480 && !navAberta && !d.activeElement.closest("#topo"));
    }
    ultimoY = y;
    var pr = $(".progresso"); if (pr) pr.style.setProperty("--p", p.toFixed(4));
    var v = $(".voltar"); if (v) { v.style.setProperty("--p", p.toFixed(4)); v.classList.toggle("voltar--ver", y > 700); }
    if (!REDUZ) {
      var img = $(".arco--hero img");
      if (img && y < window.innerHeight * 1.2) img.style.transform = "translateY(" + (y * .09).toFixed(1) + "px) scale(1.08)";
    }
  }
  function aoRolarPedido() { if (!pedido) { pedido = true; requestAnimationFrame(aoRolar); } }

  /* -------------------------------------------------- revelar e navegação ativa */
  var obsRevela, obsNav;
  function observarRevelacoes() {
    var alvos = $$("[data-revela]:not(.revelado)");
    if (!("IntersectionObserver" in window) || REDUZ) { alvos.forEach(function (n) { n.classList.add("revelado"); }); return; }
    if (!obsRevela) obsRevela = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("revelado"); obsRevela.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: .12 });
    alvos.forEach(function (n) {
      var irmaos = n.parentNode ? $$("[data-revela]", n.parentNode) : [];
      n.style.setProperty("--ordem", Math.max(0, irmaos.indexOf(n)) % 4);
      obsRevela.observe(n);
    });
  }
  function observarNav() {
    if (PAGINA !== "inicio" || !("IntersectionObserver" in window)) return;
    if (obsNav) obsNav.disconnect();
    var links = $$("#nav a");
    obsNav = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.setAttribute("aria-current", a.hash === "#" + en.target.id ? "true" : "false"); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["especialidades", "menu", "encomendas", "casa", "visitar"].forEach(function (id) { var s = d.getElementById(id); if (s) obsNav.observe(s); });
  }

  /* -------------------------------------------------- mapa (só carrega com autorização) */
  var CHAVE_COOKIES = "cookies-consentimento";
  function consentimento() { try { return JSON.parse(localStorage.getItem(CHAVE_COOKIES) || "null"); } catch (e) { return null; } }
  function guardarConsentimento(terceiros) {
    try { localStorage.setItem(CHAVE_COOKIES, JSON.stringify({ terceiros: !!terceiros, data: new Date().toISOString() })); } catch (e) {}
  }
  function carregarMapa() {
    var box = $("[data-mapa]"), src = mapaSeguro(get(C, "contacto.mapaEmbed"));
    if (!box || !src || $("iframe", box)) return;
    var f = d.createElement("iframe");
    f.src = src; f.loading = "lazy"; f.referrerPolicy = "no-referrer-when-downgrade";
    f.title = "Mapa: " + txt(get(C, "contacto.morada"));
    f.setAttribute("allowfullscreen", "");
    box.appendChild(f);
    var av = $(".mapa__aviso", box); if (av) av.hidden = true;
  }

  /* -------------------------------------------------- cookies */
  function mostrarCookies() {
    if (EDITOR || $(".cookies")) return;
    var c = el("section", "cookies");
    c.setAttribute("aria-label", "Cookies");
    c.innerHTML =
      '<h2 class="cookies__tit">Cookies, só os precisos</h2>' +
      "<p>Usamos armazenamento local para lembrar esta escolha. O mapa do Google só é carregado se aceitar. " +
      '<a class="link" href="' + RAIZ + 'cookies.html">Saber mais</a></p>' +
      '<div class="cookies__botoes"><button type="button" class="btn btn--pequeno" data-cookies="sim">Aceitar</button>' +
      '<button type="button" class="btn btn--linha btn--pequeno" data-cookies="nao">Só os essenciais</button></div>';
    d.body.appendChild(c);
  }

  /* -------------------------------------------------- pesquisa */
  var indicePesquisa = null, resAtivo = -1;
  function construirIndice() {
    var ix = [], inicio = PAGINA === "inicio" ? "" : RAIZ + "index.html";
    lista(C.menu).forEach(function (c, i) {
      lista(c && c.itens).forEach(function (it, j) {
        if (it && it.nome) ix.push({ grupo: "Menu", titulo: it.nome, sub: c.nome + (it.descricao ? " · " + it.descricao : ""), preco: it.preco, href: inicio + "#item-" + i + "-" + j, texto: [it.nome, it.descricao, c.nome, lista(it.etiquetas).join(" ")].join(" ") });
      });
    });
    lista(C.especialidades).forEach(function (e) { if (e && e.nome) ix.push({ grupo: "Especialidades", titulo: e.nome, sub: e.descricao, preco: e.preco, href: inicio + "#especialidades", texto: e.nome + " " + e.descricao }); });
    lista(C.faq).forEach(function (q, i) { if (q && q.pergunta) ix.push({ grupo: "Perguntas", titulo: q.pergunta, sub: q.resposta, href: inicio + "#pergunta-" + i, texto: q.pergunta + " " + q.resposta }); });
    [["Menu e preços", "#menu", "menu preços carta"], ["Bolos por encomenda", "#encomendas", "encomenda bolo aniversário casamento orçamento"], ["A casa", "#casa", "história sobre nós quem somos"],
     ["Galeria", "#galeria", "fotografias fotos"], ["Horário e morada", "#visitar", "horário morada contactos telefone mapa como chegar aberto"]].forEach(function (s) {
      if (s[1] === "#encomendas" && get(C, "encomendas.ativo") === false) return;
      ix.push({ grupo: "Secções", titulo: s[0], href: inicio + s[1], texto: s[0] + " " + s[2] });
    });
    [["Política de privacidade", "privacidade.html", "privacidade dados rgpd"], ["Termos e condições", "termos.html", "termos condições"], ["Política de cookies", "cookies.html", "cookies"]].forEach(function (p) {
      ix.push({ grupo: "Páginas", titulo: p[0], href: RAIZ + p[1], texto: p[0] + " " + p[2] });
    });
    ix.forEach(function (r) { r.norm = semAcentos(r.texto).toLowerCase(); });
    return ix;
  }
  function realcar(t, q) {
    var tt = txt(t), n = semAcentos(tt).toLowerCase(), i = q ? n.indexOf(q) : -1;
    if (i < 0) return esc(tt);
    return esc(tt.slice(0, i)) + "<mark>" + esc(tt.slice(i, i + q.length)) + "</mark>" + esc(tt.slice(i + q.length));
  }
  function pesquisar(qBruto) {
    var box = $(".pesquisa__resultados");
    if (!box) return;
    if (!indicePesquisa) indicePesquisa = construirIndice();
    var q = semAcentos(qBruto).toLowerCase().trim();
    box.textContent = ""; resAtivo = -1;
    if (!q) { box.appendChild(el("p", "pesquisa__vazio", "Escreva o nome de um bolo, salgado ou bebida — ou “horário”.")); return; }
    var termos = q.split(/\s+/);
    var res = indicePesquisa.filter(function (r) { return termos.every(function (t) { return r.norm.indexOf(t) >= 0; }); }).slice(0, 14);
    if (!res.length) { box.appendChild(el("p", "pesquisa__vazio", "Nada encontrado para “" + qBruto.trim() + "”. Experimente “nata”, “bolo” ou “café”.")); return; }
    var grupo = "";
    res.forEach(function (r, k) {
      if (r.grupo !== grupo) { grupo = r.grupo; box.appendChild(el("p", "pesquisa__grupo", grupo)); }
      var a = el("a", "pesquisa__res"); a.href = r.href; a.id = "res-" + k;
      a.setAttribute("role", "option"); a.setAttribute("aria-selected", "false");
      a.innerHTML = "<span><span>" + realcar(r.titulo, termos[0]) + "</span>" + (r.sub ? "<small>" + esc(txt(r.sub).slice(0, 90)) + "</small>" : "") + "</span>" + (r.preco ? '<span class="pesquisa__preco">' + esc(r.preco) + "</span>" : "");
      box.appendChild(a);
    });
    marcarRes(0);
  }
  function marcarRes(k) {
    var rs = $$(".pesquisa__res"); if (!rs.length) return;
    resAtivo = (k + rs.length) % rs.length;
    rs.forEach(function (r, i) { r.setAttribute("aria-selected", i === resAtivo ? "true" : "false"); });
    rs[resAtivo].scrollIntoView({ block: "nearest" });
    var inp = $(".pesquisa input"); if (inp) inp.setAttribute("aria-activedescendant", rs[resAtivo].id);
  }
  function abrirPesquisa() {
    var dlg = $(".pesquisa");
    if (!dlg) {
      dlg = el("dialog", "pesquisa"); dlg.setAttribute("aria-label", "Pesquisar no site");
      dlg.innerHTML =
        '<div class="pesquisa__caixa"><div class="pesquisa__campo">' + svg("pesquisa") +
        '<input type="search" placeholder="Pesquisar no menu e no site…" aria-label="Pesquisar" role="combobox" aria-expanded="true" aria-controls="pesq-res" autocomplete="off" spellcheck="false">' +
        '<button type="button" class="btn-icone" data-fechar-pesquisa aria-label="Fechar">Esc</button></div>' +
        '<div class="pesquisa__resultados" id="pesq-res" role="listbox"></div>' +
        '<div class="pesquisa__rodape"><span><kbd>↑</kbd> <kbd>↓</kbd> escolher</span><span><kbd>Enter</kbd> abrir</span></div></div>';
      d.body.appendChild(dlg);
      dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
      $("input", dlg).addEventListener("input", function (e) { pesquisar(e.target.value); });
    }
    if (typeof dlg.showModal !== "function") { var q = prompt("Pesquisar no site:"); if (q) { pesquisar(q); var r = $(".pesquisa__res"); if (r) location.href = r.href; } return; }
    if (!dlg.open) dlg.showModal();
    var inp = $("input", dlg); inp.value = ""; pesquisar(""); inp.focus();
  }

  /* -------------------------------------------------- galeria em ecrã inteiro */
  var fotoAtual = 0;
  function abrirFoto(i) {
    var fotos = lista(C.galeria).filter(function (f) { return f && imgSegura(f.src); });
    if (!fotos.length) return;
    var dlg = $(".caixa");
    if (!dlg) {
      dlg = el("dialog", "caixa"); dlg.setAttribute("aria-label", "Fotografia");
      dlg.innerHTML = '<figure class="caixa__fig"><img alt=""><figcaption></figcaption></figure>' +
        '<button type="button" class="caixa__btn caixa__fechar" data-caixa="fechar" aria-label="Fechar">' + svg("fechar") + "</button>" +
        '<button type="button" class="caixa__btn caixa__ant" data-caixa="-1" aria-label="Fotografia anterior">' + svg("anterior") + "</button>" +
        '<button type="button" class="caixa__btn caixa__seg" data-caixa="1" aria-label="Fotografia seguinte">' + svg("seguinte") + "</button>";
      d.body.appendChild(dlg);
      dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
      var x0 = null;
      dlg.addEventListener("pointerdown", function (e) { x0 = e.clientX; });
      dlg.addEventListener("pointerup", function (e) { if (x0 != null && Math.abs(e.clientX - x0) > 50) abrirFoto(fotoAtual + (e.clientX < x0 ? 1 : -1)); x0 = null; });
    }
    fotoAtual = (i + fotos.length) % fotos.length;
    var f = fotos[fotoAtual], img = $("img", dlg);
    porImagem(img, txt(f.src).replace(/([?&])w=\d+/, "$1w=1600"), f.alt, "100vw");
    $("figcaption", dlg).textContent = (f.alt || "") + "  —  " + (fotoAtual + 1) + " de " + fotos.length;
    if (!dlg.open) { if (typeof dlg.showModal === "function") dlg.showModal(); else window.open(img.src, "_blank", "noopener"); }
  }

  /* -------------------------------------------------- pedido de encomenda */
  function validarPedido(f) {
    var ok = true, primeiro = null;
    function marca(id, mal) { var c = $("#" + id, f).closest(".campo"); c.classList.toggle("campo--erro", mal); $("#" + id, f).setAttribute("aria-invalid", mal ? "true" : "false"); if (mal && !primeiro) primeiro = $("#" + id, f); if (mal) ok = false; }
    marca("p-nome", !$("#p-nome", f).value.trim());
    var dv = $("#p-data", f).value;
    marca("p-data", !dv || dv < isoLocal(dataMinima()));
    var pe = $("#p-pessoas", f), n = parseInt(pe.value, 10);
    if (!isFinite(n) || n < +pe.min) pe.value = pe.min;
    if (primeiro) primeiro.focus();
    return ok;
  }
  function enviarPedido(f, via) {
    if (!validarPedido(f)) { aviso("Falta completar o pedido — veja os campos a vermelho."); return; }
    var v = function (n) { var x = f.elements[n]; return x ? txt(x.value).trim() : ""; };
    var dt = new Date(v("data") + "T12:00:00");
    var linhas = [
      "Olá! Queria pedir um orçamento para um bolo.", "",
      "• Tipo: " + v("tipo"), "• Sabor: " + v("sabor"), "• Pessoas: " + v("pessoas"),
      "• Data: " + dt.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" }),
      "• " + v("entrega")
    ];
    if (v("notas")) linhas.push("• Notas: " + v("notas"));
    linhas.push("", "Obrigado, " + v("nome") + ".");
    var msg = linhas.join("\n"), email = txt(get(C, "contacto.email")).trim();
    if (via === "whatsapp" && waHref()) { window.open(waHref(msg), "_blank", "noopener"); aviso("A abrir o WhatsApp com o pedido…"); return; }
    if (/^[^\s@]+@[^\s@]+$/.test(email)) { location.href = "mailto:" + email + "?subject=" + encodeURIComponent("Pedido de bolo — " + v("nome")) + "&body=" + encodeURIComponent(msg); aviso("A abrir o seu email com o pedido…"); return; }
    aviso("Não há WhatsApp nem email configurados. Ligue-nos, por favor.");
  }

  /* -------------------------------------------------- ir para um item do menu / pergunta pelo endereço */
  function tratarEndereco() {
    var h = location.hash, m = /^#item-(\d+)-(\d+)$/.exec(h), q = /^#pergunta-(\d+)$/.exec(h);
    if (m) {
      menuEstado.filtro = ""; menuEstado.cat = +m[1]; desenharMenu();
      var it = d.getElementById("item-" + m[1] + "-" + m[2]);
      if (it) { it.scrollIntoView({ behavior: REDUZ ? "auto" : "smooth", block: "center" }); it.classList.remove("item--realce"); void it.offsetWidth; it.classList.add("item--realce"); }
    } else if (q) {
      var det = $$(".pergunta")[+q[1]];
      if (det) { det.open = true; det.scrollIntoView({ behavior: REDUZ ? "auto" : "smooth", block: "center" }); }
    }
  }

  /* -------------------------------------------------- eventos (delegação: sobrevivem aos redesenhos) */
  function ligarEventos() {
    window.addEventListener("scroll", aoRolarPedido, { passive: true });
    window.addEventListener("resize", aoRolarPedido, { passive: true });
    window.addEventListener("hashchange", tratarEndereco);

    var fl = el("div", "flutuantes");
    fl.innerHTML = (waHref() && !EDITOR ? '<a class="zap" href="' + esc(waHref("Olá! Tenho uma pergunta.")) + '" target="_blank" rel="noopener" aria-label="Falar por WhatsApp">' + svg("whatsapp") + "</a>" : "") +
      '<button type="button" class="voltar" aria-label="Voltar ao topo">' + svg("seta") + "</button>";
    d.body.appendChild(fl);

    d.addEventListener("click", function (e) {
      var t = e.target;
      if (!t.closest) return;
      var a;
      if (t.closest(".voltar")) { window.scrollTo({ top: 0, behavior: REDUZ ? "auto" : "smooth" }); var mc = $("#conteudo"); if (mc) mc.focus({ preventScroll: true }); return; }
      if (t.closest(".menu-btn")) { var nav = $("#nav"), b = t.closest(".menu-btn"); navAberta = !nav.classList.contains("nav--aberta"); nav.classList.toggle("nav--aberta", navAberta); b.setAttribute("aria-expanded", navAberta ? "true" : "false"); b.setAttribute("aria-label", navAberta ? "Fechar menu" : "Abrir menu"); return; }
      if ((a = t.closest("#nav a")) && navAberta) { $("#nav").classList.remove("nav--aberta"); $(".menu-btn").setAttribute("aria-expanded", "false"); navAberta = false; }
      if ((a = t.closest(".menu__tab"))) { escolherCategoria(+a.getAttribute("data-cat")); return; }
      if ((a = t.closest("[data-filtro]"))) { var fv = a.getAttribute("data-filtro"); menuEstado.filtro = menuEstado.filtro === fv ? "" : fv; desenharMenu(); var nf = $('[data-filtro="' + CSS.escape(fv) + '"]'); if (nf) nf.focus(); return; }
      if ((a = t.closest("[data-contador]"))) { var inp = $("#p-pessoas"), n = (parseInt(inp.value, 10) || 0) + (+a.getAttribute("data-contador")); inp.value = Math.max(+inp.min, Math.min(+inp.max, n)); atualizarEstimativa(); return; }
      if (t.closest("[data-carregar-mapa]")) { carregarMapa(); return; }
      if ((a = t.closest("[data-cookies]"))) { var sim = a.getAttribute("data-cookies") === "sim"; guardarConsentimento(sim); var ck = $(".cookies"); if (ck) ck.parentNode.removeChild(ck); if (sim) carregarMapa(); aviso(sim ? "Preferências guardadas. O mapa já pode ser mostrado." : "Preferências guardadas. Só usamos o essencial."); return; }
      if (t.closest("[data-abrir-cookies]")) { mostrarCookies(); var bt = $(".cookies button"); if (bt) bt.focus(); return; }
      if (t.closest("[data-abrir-pesquisa]")) { abrirPesquisa(); return; }
      if (t.closest("[data-fechar-pesquisa]")) { $(".pesquisa").close(); return; }
      if ((a = t.closest(".pesquisa__res"))) { var dl = $(".pesquisa"); if (dl && dl.open) dl.close(); if (a.getAttribute("href").charAt(0) === "#") setTimeout(tratarEndereco, 30); }
      if ((a = t.closest("[data-foto]"))) { abrirFoto(+a.getAttribute("data-foto")); return; }
      if ((a = t.closest("[data-caixa]"))) { var acc = a.getAttribute("data-caixa"); if (acc === "fechar") $(".caixa").close(); else abrirFoto(fotoAtual + (+acc)); return; }
      /* na pré-visualização do editor, mantém o modo editor ao mudar de página */
      if (EDITOR && (a = t.closest("a[href]"))) {
        var hr = a.getAttribute("href");
        if (/^[a-z0-9-]+\.html(#.*)?$/i.test(hr)) { e.preventDefault(); var pp = hr.split("#"); location.href = pp[0] + "?editor=1" + (pp[1] ? "#" + pp[1] : ""); }
        else if (/^(https?:|mailto:|tel:)/i.test(hr)) { e.preventDefault(); }
      }
    });

    d.addEventListener("keydown", function (e) {
      var alvo = e.target, escrevendo = /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName) || alvo.isContentEditable;
      if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) { e.preventDefault(); abrirPesquisa(); return; }
      if (e.key === "/" && !escrevendo) { e.preventDefault(); abrirPesquisa(); return; }
      if (e.key === "Escape" && navAberta) { $(".menu-btn").click(); $(".menu-btn").focus(); return; }
      var pq = $(".pesquisa");
      if (pq && pq.open && alvo.closest(".pesquisa")) {
        if (e.key === "ArrowDown") { e.preventDefault(); marcarRes(resAtivo + 1); }
        else if (e.key === "ArrowUp") { e.preventDefault(); marcarRes(resAtivo - 1); }
        else if (e.key === "Enter" && alvo.tagName === "INPUT") { var r = $$(".pesquisa__res")[resAtivo]; if (r) { e.preventDefault(); r.click(); location.href = r.href; } }
        return;
      }
      var cx = $(".caixa");
      if (cx && cx.open) { if (e.key === "ArrowRight") abrirFoto(fotoAtual + 1); if (e.key === "ArrowLeft") abrirFoto(fotoAtual - 1); return; }
      if (alvo.classList && alvo.classList.contains("menu__tab")) {
        var tabs = $$(".menu__tab"), i = tabs.indexOf(alvo), nx = null;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") nx = i + 1;
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") nx = i - 1;
        if (e.key === "Home") nx = 0; if (e.key === "End") nx = tabs.length - 1;
        if (nx != null) { e.preventDefault(); escolherCategoria((nx + tabs.length) % tabs.length, true); }
      }
    });

    var f = $("[data-pedido]");
    if (f) {
      var via = "whatsapp";
      $$("[data-via]", f).forEach(function (b) { b.addEventListener("click", function () { via = b.getAttribute("data-via"); }); });
      f.addEventListener("submit", function (e) { e.preventDefault(); enviarPedido(f, (e.submitter && e.submitter.getAttribute("data-via")) || via); });
      f.addEventListener("input", function (e) {
        if (e.target.id === "p-pessoas") atualizarEstimativa();
        var c = e.target.closest(".campo"); if (c && c.classList.contains("campo--erro")) { c.classList.remove("campo--erro"); e.target.setAttribute("aria-invalid", "false"); }
      });
    }

    /* o mapa só carrega sozinho se a pessoa já aceitou */
    var mp = $("[data-mapa]"), cs = consentimento();
    if (mp && cs && cs.terceiros && "IntersectionObserver" in window) {
      var om = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { carregarMapa(); om.disconnect(); } }, { rootMargin: "400px" });
      om.observe(mp);
    }
  }

  /* -------------------------------------------------- ligação ao editor */
  function ligarEditor() {
    window.addEventListener("message", function (e) {
      if (e.source !== window.parent) return;
      var m = e.data;
      if (!m || m.tipo !== "pastelaria:config" || !m.config || typeof m.config !== "object") return;
      C = m.config; window.SITE_CONFIG = C;
      aplicarCores(); desenharTudo(); aoRolar();
    });
    window.parent.postMessage({ tipo: "pastelaria:pronto", pagina: PAGINA }, "*");
  }

  /* ================================================== arrancar */
  if (!REDUZ) html.classList.add("anima");
  desenharTudo();
  ligarEventos();
  aoRolar();
  intro();
  if (location.hash) setTimeout(tratarEndereco, 400);
  if (!EDITOR && !consentimento()) setTimeout(mostrarCookies, html.classList.contains("com-intro") ? 3600 : 900);
  setInterval(desenharHorario, 60000);
  if (EDITOR) ligarEditor();
})();
