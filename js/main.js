/* =========================================================
   MCKMED — interações da página
   ========================================================= */
(function () {
  var d = document;
  var raiz = d.documentElement;
  var calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WHATSAPP = 'https://wa.me/5511900000000';

  raiz.classList.add('js');

  var header = d.querySelector('.header');
  var hero = d.getElementById('inicio');

  /* ---------- Idiomas (português, inglês e chinês) ----------
     O HTML fica em português. Ao trocar o idioma, cada texto da página
     é procurado no dicionário de js/idiomas.js e substituído. */
  var TRAD = window.MCKMED_TRADUCOES || {};
  var IDIOMAS = { pt: { lang: 'pt-BR', i: -1 }, en: { lang: 'en', i: 0 }, zh: { lang: 'zh-CN', i: 1 } };
  var idiomaAtual = 'pt';
  var ATRIBUTOS = ['alt', 'aria-label', 'title', 'content'];
  var originais = [];   // guarda os textos em português para poder voltar

  function limpa(s) { return s.replace(/\s+/g, ' ').trim(); }

  // Traduz um texto avulso (usado pelo script, ex.: mensagem do WhatsApp)
  function t(textoPt) {
    var i = IDIOMAS[idiomaAtual].i;
    var par = TRAD[textoPt];
    return i < 0 || !par ? textoPt : par[i];
  }

  // Na primeira vez, registra cada texto e atributo da página que tem tradução
  (function registrar() {
    var andar = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT);
    var no;
    while ((no = andar.nextNode())) {
      if (no.parentNode.closest('script, style, .idiomas')) continue;
      var chave = limpa(no.nodeValue);
      if (TRAD[chave]) {
        var m = no.nodeValue.match(/^(\s*)[\s\S]*?(\s*)$/);
        originais.push({ no: no, chave: chave, antes: m[1], depois: m[2] });
      }
    }
    d.querySelectorAll('[alt], [aria-label], [title], meta[name="description"]').forEach(function (el) {
      if (el.closest('.idiomas')) return;
      ATRIBUTOS.forEach(function (attr) {
        var v = el.getAttribute(attr);
        if (v && TRAD[limpa(v)]) originais.push({ el: el, attr: attr, chave: limpa(v) });
      });
    });
    var grupo = d.querySelector('.idiomas');
    if (grupo) originais.push({ el: grupo, attr: 'aria-label', chave: 'Idioma' });
    originais.push({ titulo: true, chave: limpa(d.title) });
  })();

  function aplicarIdioma(cod) {
    if (!IDIOMAS[cod]) cod = 'pt';
    idiomaAtual = cod;
    raiz.lang = IDIOMAS[cod].lang;
    originais.forEach(function (o) {
      var texto = t(o.chave);
      if (o.no) o.no.nodeValue = o.antes + texto + o.depois;
      else if (o.titulo) d.title = texto;
      else o.el.setAttribute(o.attr, texto);
    });
    d.querySelectorAll('.idioma').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-idioma') === cod ? 'true' : 'false');
    });
    atualizarLinksWhatsApp();
    try { localStorage.setItem('mckmed-idioma', cod); } catch (e) {}
  }

  // "Pedir orçamento" de cada produto abre o WhatsApp com o nome do produto
  function atualizarLinksWhatsApp() {
    d.querySelectorAll('.produto').forEach(function (p) {
      var link = p.querySelector('.produto__pedir');
      var nome = p.querySelector('h4').textContent;
      if (link) link.href = WHATSAPP + '?text=' + encodeURIComponent(t('Olá! Gostaria de um orçamento de: ') + nome);
    });
  }

  d.querySelectorAll('.idioma').forEach(function (b) {
    b.addEventListener('click', function () { aplicarIdioma(b.getAttribute('data-idioma')); });
  });

  // Idioma inicial: o do link (ex.: index.html?lang=en) ou o último escolhido pelo visitante
  var salvo = null;
  try { salvo = new URLSearchParams(location.search).get('lang'); } catch (e) {}
  if (!salvo) { try { salvo = localStorage.getItem('mckmed-idioma'); } catch (e) {} }
  aplicarIdioma(salvo || 'pt');

  /* ---------- Barra de progresso ---------- */
  var barra = d.createElement('div');
  barra.id = 'progresso';
  d.body.appendChild(barra);

  /* ---------- Menu "hambúrguer" (telas menores) ---------- */
  var menuBtn = d.querySelector('.menu-btn');

  function menuAberto(abrir) {
    header.classList.toggle('menu-aberto', abrir);
    menuBtn.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', t(abrir ? 'Fechar menu' : 'Abrir menu'));
  }
  menuBtn.addEventListener('click', function () {
    menuAberto(!header.classList.contains('menu-aberto'));
  });
  // Fecha ao escolher um item, ao apertar Esc ou ao clicar fora
  d.querySelectorAll('.nav a').forEach(function (a) {
    a.addEventListener('click', function () { menuAberto(false); });
  });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') menuAberto(false); });
  d.addEventListener('click', function (e) { if (!header.contains(e.target)) menuAberto(false); });

  /* ---------- Ao rolar: sombra no cabeçalho e barra de progresso ---------- */
  function rolar() {
    var y = scrollY;
    var max = raiz.scrollHeight - innerHeight;
    header.classList.toggle('scrolled', y > 8);
    barra.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
  }
  addEventListener('scroll', rolar, { passive: true });
  rolar();

  /* ---------- Elementos surgem ao rolar, em cascata ---------- */
  var alvos = d.querySelectorAll(
    '.hero > div > *, .sobretitulo, section h2, .sobre__texto > p, .sobre__visual, .mvv__card,' +
    '.produto, .segmento, .steps li, .duvidas__intro p, .faq details, .cards > *'
  );

  alvos.forEach(function (el) {
    var i = Array.prototype.indexOf.call(el.parentNode.children, el);
    el.classList.add('reveal');
    el.style.setProperty('--d', (i % 4) * 0.1 + 's');
  });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visivel');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    alvos.forEach(function (el) { io.observe(el); });

    /* ---------- Destaca no menu a seção visível ---------- */
    var links = {};
    d.querySelectorAll('.nav a').forEach(function (a) {
      links[a.getAttribute('href').slice(1)] = a;
    });
    var menu = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        var a = links[e.target.id];
        if (a) a.classList.toggle('ativo', e.isIntersecting);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) {
      var s = d.getElementById(id);
      if (s) menu.observe(s);
    });
  } else {
    alvos.forEach(function (el) { el.classList.add('visivel'); });
  }

  /* ---------- Logo do hero inclina seguindo o mouse ---------- */
  var logo = d.querySelector('.hero img');
  if (logo && !calmo && matchMedia('(hover: hover)').matches) {
    hero.addEventListener('mousemove', function (e) {
      var r = logo.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width / 2) / innerWidth;
      var y = (e.clientY - r.top - r.height / 2) / innerHeight;
      logo.style.transform = 'perspective(800px) rotateY(' + x * 30 + 'deg) rotateX(' + -y * 30 + 'deg) scale(1.03)';
    });
    hero.addEventListener('mouseleave', function () { logo.style.transform = ''; });
  }
})();
