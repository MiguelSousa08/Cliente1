/* Corre no <head>, antes de a página ser desenhada:
   aplica as cores do config e decide se a animação de entrada corre.
   (Ficheiro externo e não inline, para funcionar com a CSP estrita.) */
(function () {
  "use strict";
  var d = document.documentElement;
  var C = window.SITE_CONFIG || {};
  d.classList.add("js");

  var cores = C.cores || {};
  var mapa = { fundo: "--c-fundo", creme: "--c-creme", areia: "--c-areia", destaque: "--c-destaque", texto: "--c-texto" };
  Object.keys(mapa).forEach(function (k) {
    if (typeof cores[k] === "string" && /^#[0-9a-f]{6}$/i.test(cores[k])) d.style.setProperty(mapa[k], cores[k]);
  });

  var editor = /[?&]editor=1(&|$)/.test(location.search) && window.parent !== window;
  if (editor) { d.classList.add("modo-editor"); return; }

  var reduz = false, vista = false;
  try { reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  try { vista = sessionStorage.getItem("intro-vista") === "1"; } catch (e) {}
  var ligada = !C.intro || C.intro.ativar !== false;
  if (ligada && !reduz && !vista && d.getAttribute("data-pagina") === "inicio") d.classList.add("com-intro");
})();
