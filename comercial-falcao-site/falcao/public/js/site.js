(() => {
  'use strict';
  const D = JSON.parse(document.getElementById('boot').textContent);
  const S = D.settings;
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const wa = (text) => `https://wa.me/${S.whatsapp_number}?text=${encodeURIComponent(text)}`;
  const safeUrl = (u) => (/^(https?:\/\/|\/|#)/i.test(u || '') ? u : '#');

  /* ---------- ícones ---------- */
  const I = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const ICONS = {
    brick: I('<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9.3h18M3 14.7h18M9 4v5.3M15 9.3v5.4M9 14.7V20"/>'),
    hammer: I('<path d="m14 5 5 5-2.5 2.5-5-5z"/><path d="M12 7.5 5 14.500 7.500 17 14.500 10M6.500 15.500 3 19l2 2 3.500-3.500"/>'),
    pipe: I('<path d="M3 8h8a3 3 0 0 1 3 3v10M3 8v5h5M14 21h6M17 13h4v-3"/><path d="M12 3c1.500 2 2.500 3 2.500 4.200a2.500 2.500 0 0 1-5 0C9.500 6 10.500 5 12 3z"/>'),
    bolt: I('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
    roller: I('<rect x="3" y="3" width="15" height="6" rx="1.500"/><path d="M18 6h3v5h-9v3"/><rect x="10" y="14" width="4" height="7" rx="1"/>'),
    nut: I('<path d="M12 2.500 20 7v10l-8 4.500L4 17V7z"/><circle cx="12" cy="12" r="3"/>'),
    tile: I('<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>'),
    helmet: I('<path d="M3 17h18M5 17a7 7 0 0 1 14 0M12 5v5M9 7.500V10M15 7.500V10"/><path d="M4 17v2h16v-2"/>'),
    box: I('<path d="m3 7.500 9-4.500 9 4.500v9L12 21l-9-4.500z"/><path d="m3 7.500 9 4.500 9-4.500M12 12v9"/>'),
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 3 6.500 7 .8-5.200 4.800 1.400 7L12 17.600 5.800 21.100l1.400-7L2 9.300l7-.8z"/></svg>',
    pin: I('<path d="M12 21s7-6.200 7-11.500a7 7 0 0 0-14 0C5 14.800 12 21 12 21z"/><circle cx="12" cy="9.500" r="2.500"/>'),
    phone: I('<path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
    clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    heart: I('<path d="M12 20s-8-4.800-8-11a4.500 4.500 0 0 1 8-2.800A4.500 4.500 0 0 1 20 9c0 6.200-8 11-8 11z"/>'),
    grid: I('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
    tag: I('<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.500" cy="8.500" r="1.500"/>'),
    smile: I('<circle cx="12" cy="12" r="9"/><path d="M8 14s1.500 2.500 4 2.500S16 14 16 14M9 9.500h.01M15 9.500h.01"/>'),
    route: I('<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h8"/>'),
    chat: I('<path d="M21 12a8 8 0 0 1-11.800 7L3 21l2-5.500A8 8 0 1 1 21 12z"/>'),
  };
  const catIcon = (name) => {
    const n = norm(name);
    if (/basic|cimento|areia|tijolo/.test(n)) return ICONS.brick;
    if (/ferrament/.test(n)) return ICONS.hammer;
    if (/hidraul|tubo|agua/.test(n)) return ICONS.pipe;
    if (/eletric|fio|luz/.test(n)) return ICONS.bolt;
    if (/tinta|pintur/.test(n)) return ICONS.roller;
    if (/ferragem|parafus/.test(n)) return ICONS.nut;
    if (/acabament|piso|revest/.test(n)) return ICONS.tile;
    if (/utilidad|epi|seguran/.test(n)) return ICONS.helmet;
    return ICONS.box;
  };
  const stars = (n) => `<span class="stars" role="img" aria-label="${n} de 5 estrelas">${[1, 2, 3, 4, 5].map((i) => (i <= n ? ICONS.star : ICONS.star.replace('<svg', '<svg class="off"'))).join('')}</span>`;

  /* ---------- animação ao rolar ---------- */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .12 }) : null;
  function observe(root = document) { root.querySelectorAll('.reveal:not(.in)').forEach((el) => (io ? io.observe(el) : el.classList.add('in'))); }

  const catById = Object.fromEntries(D.categories.map((c) => [c.id, c]));
  const logoMark = `<svg class="brand__mark" viewBox="0 0 48 48" aria-hidden="true"><path fill="#ffc20e" d="M4 4h32l8 8v32H4z"/><path fill="#0c0c0d" d="M12 34 24 14l10 8-6 3 8 3-4 4-10-5-6 5zM30 13l5 4-3 1z"/></svg>`;
  const brandHtml = S.logo_image
    ? `<img src="${esc(S.logo_image)}" alt="${esc(S.site_name)}" height="44">`
    : `${logoMark}<span class="brand__txt"><b>${esc(S.site_name)}</b><small>Materiais de construção</small></span>`;

  /* ---------- aviso, marca, hero ---------- */
  if (S.promo_notice) { $('notice').hidden = false; $('notice').textContent = S.promo_notice; }
  $('brand').innerHTML = brandHtml; $('fBrand').innerHTML = brandHtml;
  $('heroTitle').textContent = S.hero_title; $('heroSub').textContent = S.hero_subtitle;
  if (S.hero_image) {
    const b = $('heroBg');
    b.classList.add('has-img');
    b.style.backgroundImage = `linear-gradient(105deg,rgba(12,12,13,.95) 20%,rgba(12,12,13,.55)),url("${S.hero_image}")`;
  }
  const countNum = parseInt(S.google_count, 10) || 0;
  const countTxt = countNum >= 20 ? `+${Math.floor(countNum / 10) * 10}` : String(countNum);
  $('proof').innerHTML = `
    <li><b>${esc(S.google_rating)} ★</b><span>Nota no Google</span></li>
    <li><b>${esc(countTxt)}</b><span>Avaliações de clientes</span></li>
    <li><b>${ICONS.smile.replace('<svg', '<svg width="34" height="34" style="color:var(--yellow)"')}</b><span>Atendimento de qualidade</span></li>
    <li><b>${ICONS.grid.replace('<svg', '<svg width="34" height="34" style="color:var(--yellow)"')}</b><span>Grande variedade de produtos</span></li>`;

  /* ---------- WhatsApp: qualquer elemento com data-wa ---------- */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-wa]');
    if (!el) return;
    e.preventDefault();
    window.open(wa(el.dataset.wa), '_blank', 'noopener');
  });
  document.querySelectorAll('[data-wa]').forEach((a) => { if (a.tagName === 'A') a.href = wa(a.dataset.wa); a.target = '_blank'; a.rel = 'noopener'; });

  /* ---------- banners ---------- */
  if (D.banners.length) {
    $('banners').hidden = false;
    const sl = $('slider');
    sl.innerHTML = D.banners.map((b, i) => `
      <div class="slide${i === 0 ? ' on' : ''}" ${b.image ? `style="background-image:url('${esc(b.image)}')"` : 'style="background:linear-gradient(120deg,#26282c,#0c0c0d)"'}>
        <div><h3>${esc(b.title)}</h3>${b.subtitle ? `<p>${esc(b.subtitle)}</p>` : ''}
        ${b.link ? `<a class="btn btn--yellow" href="${esc(safeUrl(b.link))}">${esc(b.button_text || 'Saiba mais')}</a>` : ''}</div>
      </div>`).join('') + (D.banners.length > 1 ? `<div class="dots">${D.banners.map((_, i) => `<button aria-label="Banner ${i + 1}" ${i === 0 ? 'aria-current="true"' : ''}></button>`).join('')}</div>` : '');
    if (D.banners.length > 1) {
      let cur = 0; const slides = [...sl.querySelectorAll('.slide')]; const dots = [...sl.querySelectorAll('.dots button')];
      const go = (n) => { cur = (n + slides.length) % slides.length; slides.forEach((s, i) => s.classList.toggle('on', i === cur)); dots.forEach((d, i) => d.toggleAttribute('aria-current', i === cur)); dots.forEach((d, i) => d.setAttribute('aria-current', i === cur)); };
      dots.forEach((d, i) => d.addEventListener('click', () => { go(i); }));
      setInterval(() => { if (!document.hidden) go(cur + 1); }, 6000);
    }
  }

  /* ---------- produtos ---------- */
  const mediaHtml = (p) => p.image
    ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" decoding="async" width="480" height="360">`
    : `<div class="ph">${catIcon(catById[p.category_id]?.name)}</div>`;
  const cardHtml = (p) => `
    <article class="card reveal">
      <button class="card__media" data-open="${p.id}" aria-label="Ver detalhes de ${esc(p.name)}">${mediaHtml(p)}
        ${p.demo ? '<span class="badge badge--demo">Exemplo</span>' : p.featured ? '<span class="badge">Destaque</span>' : ''}</button>
      <div class="card__body">
        <span class="card__cat">${esc(catById[p.category_id]?.name || 'Produtos')}</span>
        <h3>${esc(p.name)}</h3>
        ${p.description ? `<p>${esc(p.description)}</p>` : ''}
        <div class="price ${p.price == null ? 'price--ask' : ''}">${p.price == null ? 'Consulte o preço' : money(p.price)}</div>
        <a class="btn btn--wa" href="#" data-wa="${esc(`Olá! Gostaria de consultar o preço e a disponibilidade do produto ${p.name}.`)}">Consultar pelo WhatsApp</a>
      </div>
    </article>`;

  const SYN = { cano: 'tubo', canos: 'tubos', lampada: 'luz', fio: 'cabo', fios: 'cabos', saco: 'cimento', verniz: 'tinta', prego: 'parafuso', pregos: 'parafusos', chuveiro: 'eletric', piso: 'revestimento' };
  const state = { q: '', cat: 0, shown: 12 };
  const PAGE = 12;
  const haystack = D.products.map((p) => ({ p, name: norm(p.name), all: norm(`${p.name} ${p.description} ${catById[p.category_id]?.name || ''}`) }));

  function filtered() {
    const tokens = norm(state.q).split(/\s+/).filter(Boolean);
    let list = haystack.filter((h) => !state.cat || h.p.category_id === state.cat);
    if (tokens.length) {
      list = list.map((h) => {
        let score = 0;
        for (const t of tokens) {
          const alts = [t, SYN[t]].filter(Boolean);
          const hit = alts.some((a) => h.all.includes(a));
          if (!hit) return null;
          if (alts.some((a) => h.name.split(/\s+/).some((w) => w.startsWith(a)))) score += 3;
          else if (alts.some((a) => h.name.includes(a))) score += 2; else score += 1;
        }
        return { ...h, score };
      }).filter(Boolean).sort((a, b) => b.score - a.score);
    }
    return list.map((h) => h.p);
  }

  function renderGrid() {
    const list = filtered();
    const grid = $('grid');
    $('count').textContent = list.length ? `${list.length} ${list.length === 1 ? 'produto encontrado' : 'produtos encontrados'}` : '';
    if (!list.length) {
      const term = state.q.trim();
      grid.innerHTML = `<div class="empty"><h3>Não achou o que procura?</h3><p>${term ? `Não encontramos “${esc(term)}” no catálogo online, mas isso não significa que não temos.` : 'Nenhum produto nesta categoria ainda.'} Pergunte direto para a nossa equipe.</p>
        <a class="btn btn--wa" href="#" data-wa="${esc(term ? `Olá! Procuro por: ${term}. Vocês têm?` : 'Olá! Gostaria de saber quais produtos vocês têm.')}">Perguntar pelo WhatsApp</a></div>`;
      $('more').hidden = true; return;
    }
    grid.innerHTML = list.slice(0, state.shown).map(cardHtml).join('');
    $('more').hidden = list.length <= state.shown;
    observe(grid);
  }

  function renderChips() {
    const counts = {}; D.products.forEach((p) => { counts[p.category_id] = (counts[p.category_id] || 0) + 1; });
    const used = D.categories.filter((c) => counts[c.id]);
    $('chips').innerHTML = [`<button class="chip" role="tab" data-cat="0" aria-selected="${state.cat === 0}">Todos<i>${D.products.length}</i></button>`]
      .concat(used.map((c) => `<button class="chip" role="tab" data-cat="${c.id}" aria-selected="${state.cat === c.id}">${esc(c.name)}<i>${counts[c.id]}</i></button>`)).join('');
  }
  $('chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]'); if (!b) return;
    state.cat = +b.dataset.cat; state.shown = PAGE; renderChips(); renderGrid();
  });
  let t; $('q').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { state.q = e.target.value; state.shown = PAGE; renderGrid(); }, 120); });
  $('more').addEventListener('click', () => { state.shown += PAGE; renderGrid(); });

  /* categorias */
  const catCounts = {}; D.products.forEach((p) => { catCounts[p.category_id] = (catCounts[p.category_id] || 0) + 1; });
  $('cats').innerHTML = D.categories.map((c) => `
    <button class="cat" data-pickcat="${c.id}"><span class="cat__ic">${catIcon(c.name)}</span><b>${esc(c.name)}</b>
    <small>${catCounts[c.id] || 0} ${(catCounts[c.id] || 0) === 1 ? 'item' : 'itens'} no catálogo</small></button>`).join('');
  $('cats').addEventListener('click', (e) => {
    const b = e.target.closest('[data-pickcat]'); if (!b) return;
    state.cat = +b.dataset.pickcat; state.q = ''; $('q').value = ''; state.shown = PAGE; renderChips(); renderGrid();
    $('produtos').scrollIntoView({ behavior: 'smooth' });
  });

  /* destaques */
  const feat = D.products.filter((p) => p.featured && !p.demo).slice(0, 8);
  const featList = feat.length ? feat : D.products.filter((p) => p.featured).slice(0, 4);
  if (featList.length) { $('destaques').hidden = false; $('featured').innerHTML = featList.map(cardHtml).join(''); }

  if (D.products.some((p) => p.demo)) $('demoNote').hidden = false;
  renderChips(); renderGrid();

  /* detalhe do produto */
  const dlg = $('dlg');
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-open]'); if (!b) return;
    const p = D.products.find((x) => x.id === +b.dataset.open); if (!p) return;
    $('dlgBody').innerHTML = `<div class="pd"><div class="card__media">${mediaHtml(p)}</div><div class="pd__body">
      <span class="card__cat">${esc(catById[p.category_id]?.name || 'Produtos')}</span><h3>${esc(p.name)}</h3>
      ${p.demo ? '<p><strong>Item demonstrativo</strong> — ilustra como o produto será exibido.</p>' : ''}
      ${p.description ? `<p>${esc(p.description)}</p>` : ''}
      <div class="price ${p.price == null ? 'price--ask' : ''}">${p.price == null ? 'Consulte o preço e a disponibilidade' : money(p.price)}</div>
      <a class="btn btn--wa btn--lg" href="#" data-wa="${esc(`Olá! Gostaria de consultar o preço e a disponibilidade do produto ${p.name}.`)}">Consultar pelo WhatsApp</a></div></div>`;
    dlg.showModal();
  });
  $('dlgX').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

  /* ---------- ofertas ---------- */
  const fmtDate = (d) => d.split('-').reverse().slice(0, 2).join('/');
  $('offers').innerHTML = D.offers.length ? D.offers.map((o) => `
    <article class="offer reveal">
      <div class="card__media">${o.image ? `<img src="${esc(o.image)}" alt="${esc(o.title)}" loading="lazy" decoding="async">` : `<div class="ph">${ICONS.tag}</div>`}<span class="badge">Oferta</span></div>
      <div class="offer__body"><h3>${esc(o.title)}</h3>${o.description ? `<p>${esc(o.description)}</p>` : ''}
        <div class="offer__price">${o.price_old != null ? `<s>${money(o.price_old)}</s>` : ''}${o.price_new != null ? `<b>${money(o.price_new)}</b>` : ''}</div>
        ${o.ends_at ? `<small>Válido até ${fmtDate(o.ends_at)}</small>` : ''}
        <a class="btn btn--yellow" href="#" data-wa="${esc(`Olá! Tenho interesse na oferta: ${o.title}.`)}">Aproveitar oferta</a></div>
    </article>`).join('')
    : `<div class="offer-empty reveal"><div><h3>Promoções da semana pelo WhatsApp</h3><p>Pergunte pelas ofertas e condições especiais para sua obra.</p></div>
       <a class="btn btn--yellow btn--lg" href="#" data-wa="Olá! Quais são as promoções da semana?">Ver promoções</a></div>`;

  /* ---------- sobre ---------- */
  $('aboutTitle').textContent = S.about_title; $('aboutText').textContent = S.about_text;
  const VAL = [['heart', 'Atendimento familiar', 'Próximo, atencioso e sem pressa.'], ['grid', 'Grande variedade', 'Do básico ao acabamento, em um só lugar.'],
    ['tag', 'Preços justos', 'Condições honestas para o seu orçamento.'], ['smile', 'Cliente satisfeito', 'Nosso compromisso em cada venda.']];
  $('values').innerHTML = VAL.map(([i, a, b]) => `<li>${ICONS[i]}<b>${a}</b><span>${b}</span></li>`).join('');

  /* ---------- galeria ---------- */
  if (D.gallery.length) {
    $('galeria').hidden = false;
    $('gallery').innerHTML = D.gallery.map((g) => `<figure class="reveal"><img src="${esc(g.image)}" alt="${esc(g.caption || 'Foto da loja Comercial Falcão')}" loading="lazy" decoding="async">${g.caption ? `<figcaption>${esc(g.caption)}</figcaption>` : ''}</figure>`).join('');
  }

  /* ---------- avaliações ---------- */
  $('score').innerHTML = `<b>${esc(S.google_rating)}</b>${stars(Math.round(parseFloat(S.google_rating.replace(',', '.')) || 5))}<p>${esc(S.google_count)} avaliações no Google</p>
    <a class="btn btn--dark" href="${esc(S.google_reviews_url)}" target="_blank" rel="noopener">Ver avaliações no Google</a>`;
  $('reviews').innerHTML = D.testimonials.map((r) => `<figure class="rev reveal" style="margin:0">${stars(r.rating)}<p>${esc(r.text)}</p><cite>${esc(r.author || 'Cliente')}</cite></figure>`).join('');

  /* ---------- contato ---------- */
  const mapsQ = encodeURIComponent(`Comercial Falcão, ${S.address}, ${S.cep}`);
  $('cName').textContent = S.site_name;
  $('info').innerHTML = `
    <li>${ICONS.pin}<span>${esc(S.address)}<br>CEP ${esc(S.cep)}</span></li>
    <li>${ICONS.phone}<a href="tel:${esc(S.phone_tel)}">${esc(S.phone_display)}</a></li>
    <li>${ICONS.clock}<span>${S.hours ? esc(S.hours).replace(/\n/g, '<br>') : 'Consulte nosso horário de funcionamento pelo WhatsApp'}</span></li>`;
  $('cBtns').innerHTML = `
    <a class="btn btn--wa" href="#" data-wa="Olá! Gostaria de tirar uma dúvida.">${ICONS.chat}WhatsApp</a>
    <a class="btn btn--line" href="tel:${esc(S.phone_tel)}">${ICONS.phone}Ligar</a>
    <a class="btn btn--dark" href="https://www.google.com/maps/dir/?api=1&destination=${mapsQ}" target="_blank" rel="noopener">${ICONS.route}Traçar rota</a>`;
  $('cBtns').querySelectorAll('[data-wa]').forEach((a) => { a.href = wa(a.dataset.wa); });
  $('map').src = `https://www.google.com/maps?q=${mapsQ}&output=embed`;

  /* formulário de orçamento */
  $('orcamento').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target, nome = f.nome.value.trim(), itens = f.itens.value.trim(), err = $('qErr');
    f.nome.classList.toggle('invalid', nome.length < 2); f.itens.classList.toggle('invalid', itens.length < 5);
    if (nome.length < 2 || itens.length < 5) { err.hidden = false; err.textContent = 'Informe seu nome e descreva o que precisa (mínimo de 5 letras).'; return; }
    err.hidden = true;
    window.open(wa(`Olá! Meu nome é ${nome}. Gostaria de solicitar um orçamento:\n${itens}`), '_blank', 'noopener');
  });

  /* ---------- rodapé ---------- */
  $('fDesc').textContent = S.footer_desc;
  $('fInfo').innerHTML = `<li>${esc(S.address)} — CEP ${esc(S.cep)}</li><li>Telefone: <a href="tel:${esc(S.phone_tel)}">${esc(S.phone_display)}</a></li>
    <li>WhatsApp: <a href="#" data-wa="Olá!">${esc(S.phone_display)}</a></li><li>${S.hours ? esc(S.hours).replace(/\n/g, '<br>') : 'Horário: consulte pelo WhatsApp'}</li>`;
  $('social').innerHTML = [['Instagram', S.instagram], ['Facebook', S.facebook]].filter(([, u]) => u).map(([n, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${n}</a>`).join('');
  $('copy').textContent = `© ${new Date().getFullYear()} ${S.site_name}. Todos os direitos reservados.`;

  /* ---------- navegação ---------- */
  const header = $('header'), nav = $('nav'), burger = $('burger');
  const onScroll = () => header.classList.toggle('is-stuck', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  burger.addEventListener('click', () => { const o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); } });

  observe();
})();
