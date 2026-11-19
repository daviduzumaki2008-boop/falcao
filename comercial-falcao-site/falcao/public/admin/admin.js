(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => (n == null ? '' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n));
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  /* ---------- API ---------- */
  async function api(method, path, body) {
    const r = await fetch('/api/admin/' + path, {
      method, credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let data = {};
    try { data = await r.json(); } catch { /* vazio */ }
    if (r.status === 401 && path !== 'login') { showLogin(); throw new Error('Sessão expirada. Entre novamente.'); }
    if (!r.ok) throw new Error(data.error || 'Algo deu errado. Tente novamente.');
    return data;
  }
  let toastT;
  function toast(msg, bad) { const t = $('toast'); t.textContent = msg; t.className = 'toast on' + (bad ? ' bad' : ''); clearTimeout(toastT); toastT = setTimeout(() => (t.className = 'toast'), 2800); }

  /* ---------- definição dos recursos ---------- */
  const RES = {
    products: { label: 'Produtos', one: 'produto', icon: '📦', img: 'image', fields: [
      { k: 'name', l: 'Nome do produto', t: 'text', req: 1, max: 120 },
      { k: 'category_id', l: 'Categoria', t: 'cat' },
      { k: 'price', l: 'Preço (R$)', t: 'price', help: 'Deixe em branco para mostrar “Consulte o preço” no site.' },
      { k: 'description', l: 'Descrição', t: 'area', max: 1200 },
      { k: 'image', l: 'Foto do produto', t: 'image' },
      { k: 'featured', l: 'Mostrar em destaque na página inicial', t: 'bool' },
      { k: 'active', l: 'Visível no site', t: 'bool', def: 1 }] },
    categories: { label: 'Categorias', one: 'categoria', icon: '🗂️', fields: [
      { k: 'name', l: 'Nome da categoria', t: 'text', req: 1, max: 80 },
      { k: 'position', l: 'Ordem (menor aparece primeiro)', t: 'int' }] },
    offers: { label: 'Ofertas', one: 'oferta', icon: '🏷️', img: 'image', fields: [
      { k: 'title', l: 'Título da oferta', t: 'text', req: 1, max: 120 },
      { k: 'description', l: 'Descrição', t: 'area', max: 600 },
      { k: 'price_old', l: 'Preço antigo (R$)', t: 'price' }, { k: 'price_new', l: 'Preço da oferta (R$)', t: 'price' },
      { k: 'ends_at', l: 'Válida até', t: 'date', help: 'Depois dessa data a oferta sai do site sozinha. Deixe vazio para não expirar.' },
      { k: 'image', l: 'Foto', t: 'image' }, { k: 'active', l: 'Visível no site', t: 'bool', def: 1 }] },
    banners: { label: 'Banners', one: 'banner', icon: '🖼️', img: 'image', fields: [
      { k: 'title', l: 'Título', t: 'text', req: 1, max: 120 }, { k: 'subtitle', l: 'Texto de apoio', t: 'text', max: 240 },
      { k: 'image', l: 'Imagem de fundo (ideal: horizontal, 1600×500)', t: 'image' },
      { k: 'button_text', l: 'Texto do botão', t: 'text', max: 40 }, { k: 'link', l: 'Link do botão', t: 'text', help: 'Ex.: #produtos ou https://…' },
      { k: 'position', l: 'Ordem', t: 'int' }, { k: 'active', l: 'Visível no site', t: 'bool', def: 1 }] },
    testimonials: { label: 'Avaliações', one: 'avaliação', icon: '⭐', fields: [
      { k: 'text', l: 'Depoimento', t: 'area', req: 1, max: 800 }, { k: 'author', l: 'Nome de quem avaliou', t: 'text', max: 80 },
      { k: 'rating', l: 'Estrelas (1 a 5)', t: 'int', def: 5 }, { k: 'position', l: 'Ordem', t: 'int' }, { k: 'active', l: 'Visível no site', t: 'bool', def: 1 }] },
    gallery: { label: 'Galeria', one: 'foto', icon: '📷', img: 'image', fields: [
      { k: 'image', l: 'Foto da loja', t: 'image', req: 1 }, { k: 'caption', l: 'Legenda (opcional)', t: 'text', max: 140 }, { k: 'position', l: 'Ordem', t: 'int' }] },
  };
  const TABS = [['home', '🏠', 'Resumo'], ['products', '📦', 'Produtos'], ['categories', '🗂️', 'Categorias'], ['offers', '🏷️', 'Ofertas'],
    ['banners', '🖼️', 'Banners'], ['testimonials', '⭐', 'Avaliações'], ['gallery', '📷', 'Galeria'], ['settings', '✏️', 'Textos e contato'], ['security', '🔒', 'Segurança']];
  let cats = [];
  let tab = 'home';

  /* ---------- login / sessão ---------- */
  function showLogin() { $('app').hidden = true; $('login').hidden = false; }
  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target, err = $('loginErr'); err.hidden = true;
    try { await api('POST', 'login', { username: f.username.value.trim(), password: f.password.value }); f.password.value = ''; await boot(); }
    catch (x) { err.textContent = x.message; err.hidden = false; }
  });
  $('logout').addEventListener('click', async () => { try { await api('POST', 'logout', {}); } catch { /* ok */ } showLogin(); });

  async function boot() {
    let me;
    try { me = await api('GET', 'me'); } catch { return showLogin(); }
    $('login').hidden = true; $('app').hidden = false;
    $('menu').innerHTML = TABS.map(([k, i, l]) => `<button data-tab="${k}">${i} ${l}</button>`).join('');
    $('warn').innerHTML = me.must_change ? `<div class="warn"><p><b>Troque a senha inicial.</b> Por segurança, crie sua própria senha agora.</p><button class="btn btn--y btn--s" data-go="security">Trocar senha</button></div>` : '';
    go(location.hash.slice(1) || 'home');
  }
  $('menu').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) { go(b.dataset.tab); $('side').classList.remove('open'); } });
  $('menuBtn').addEventListener('click', () => $('side').classList.toggle('open'));
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); });

  async function go(t) {
    if (!TABS.some(([k]) => k === t)) t = 'home';
    tab = t; history.replaceState(null, '', '#' + t);
    document.querySelectorAll('#menu button').forEach((b) => b.toggleAttribute('aria-current', false) || b.setAttribute('aria-current', b.dataset.tab === t ? 'page' : 'false'));
    $('title').textContent = TABS.find(([k]) => k === t)[2];
    const v = $('view'); v.innerHTML = '<p>Carregando…</p>';
    try {
      cats = await api('GET', 'categories');
      if (t === 'home') await viewHome(); else if (t === 'settings') await viewSettings(); else if (t === 'security') viewSecurity(); else await viewList(t);
    } catch (x) { v.innerHTML = `<p class="err">${esc(x.message)}</p>`; }
  }

  /* ---------- Resumo ---------- */
  async function viewHome() {
    const st = await api('GET', 'stats');
    const names = { products: 'Produtos', categories: 'Categorias', offers: 'Ofertas', banners: 'Banners', testimonials: 'Avaliações', gallery: 'Fotos' };
    $('view').innerHTML = `
      <div class="stats">${Object.keys(names).map((k) => `<button class="stat" data-go="${k === 'gallery' ? 'gallery' : k}"><b>${st[k]}</b><span>${names[k]}</span></button>`).join('')}</div>
      ${st.demo ? `<div class="panel"><h2>Catálogo de exemplo</h2><p>Há ${st.demo} produtos demonstrativos no site (marcados como “Exemplo”). Edite um para torná-lo real, ou remova todos de uma vez quando tiver cadastrado os seus.</p>
        <button class="btn btn--d" id="purge">Remover todos os exemplos</button></div>` : ''}
      <div class="panel"><h2>Por onde começar</h2><p>As mudanças aparecem no site assim que você salva.</p>
        <div class="bar"><button class="btn btn--y" data-go="products">+ Cadastrar produtos</button><button class="btn btn--g" data-go="settings">Editar textos e horário</button>
        <button class="btn btn--g" data-go="gallery">Adicionar fotos da loja</button><a class="btn btn--g" href="/" target="_blank" rel="noopener">Ver o site ↗</a></div></div>`;
    const p = $('purge');
    if (p) p.onclick = async () => { if (!confirm('Remover todos os produtos de exemplo? Os produtos que você cadastrou não serão afetados.')) return; const r = await api('POST', 'products/purge-demo', {}); toast(`${r.removed} exemplos removidos`); go('home'); };
  }

  /* ---------- Listas (CRUD) ---------- */
  async function viewList(t) {
    const R = RES[t]; const items = await api('GET', t);
    const v = $('view');
    v.innerHTML = `<div class="bar"><button class="btn btn--y" id="add">+ Novo ${R.one}</button>
      ${t === 'products' ? `<input id="fq" type="search" placeholder="Buscar produto…"><select id="fc"><option value="">Todas as categorias</option>${cats.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>` : ''}</div>
      <div class="list" id="list"></div>`;
    const draw = () => {
      let L = items;
      if (t === 'products') { const q = norm($('fq').value), c = $('fc').value; L = items.filter((p) => (!c || String(p.category_id) === c) && (!q || norm(p.name + ' ' + p.description).includes(q))); }
      $('list').innerHTML = L.length ? L.map((it) => rowHtml(t, it)).join('') : `<div class="empty">Nada por aqui ainda. Clique em “+ Novo ${R.one}”.</div>`;
    };
    draw();
    if (t === 'products') { $('fq').oninput = draw; $('fc').onchange = draw; }
    $('add').onclick = () => openForm(t, null, () => go(t));
    $('list').onclick = async (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const it = items.find((x) => x.id === +b.dataset.id);
      if (b.dataset.act === 'edit') openForm(t, it, () => go(t));
      if (b.dataset.act === 'del') {
        if (!confirm(`Excluir ${R.one} “${it.name || it.title || it.caption || it.text?.slice(0, 30) || ''}”? Não dá para desfazer.`)) return;
        try { await api('DELETE', `${t}/${it.id}`); toast('Excluído'); go(t); } catch (x) { toast(x.message, true); }
      }
      if (b.dataset.act === 'toggle') {
        try { await api('PUT', `${t}/${it.id}`, { [b.dataset.k]: it[b.dataset.k] ? 0 : 1 }); go(t); } catch (x) { toast(x.message, true); }
      }
    };
  }
  function rowHtml(t, it) {
    const R = RES[t]; const title = it.name || it.title || it.caption || (it.text ? it.text.slice(0, 80) : '(sem título)');
    const cat = cats.find((c) => c.id === it.category_id);
    let sub = '';
    if (t === 'products') sub = `${esc(cat?.name || 'Sem categoria')} · ${it.price != null ? money(it.price) : 'Sem preço'}`;
    if (t === 'offers') sub = `${money(it.price_new) || 'Sem preço'}${it.ends_at ? ' · até ' + it.ends_at.split('-').reverse().join('/') : ''}`;
    if (t === 'banners') sub = esc(it.subtitle);
    if (t === 'testimonials') sub = `${'★'.repeat(it.rating)} ${esc(it.author)}`;
    if (t === 'categories') sub = `Ordem ${it.position}`;
    const tags = [it.demo ? '<span class="tag">EXEMPLO</span>' : '', it.featured ? '<span class="tag tag--y">DESTAQUE</span>' : '', 'active' in it ? (it.active ? '<span class="tag tag--g">NO SITE</span>' : '<span class="tag tag--r">OCULTO</span>') : ''].join('');
    const thumb = R.img ? (it.image ? `<img src="${esc(it.image)}" alt="" loading="lazy">` : `<div class="th">${R.icon}</div>`) : '';
    return `<div class="row ${R.img ? '' : 'noimg'}">${thumb}<div><h3>${esc(title)}</h3><small>${sub}</small><div>${tags}</div></div>
      <div class="acts">${t === 'products' ? `<button class="btn btn--g btn--s" data-act="toggle" data-k="featured" data-id="${it.id}">${it.featured ? '★ Tirar destaque' : '☆ Destacar'}</button>` : ''}
      ${'active' in it ? `<button class="btn btn--g btn--s" data-act="toggle" data-k="active" data-id="${it.id}">${it.active ? 'Ocultar' : 'Mostrar'}</button>` : ''}
      <button class="btn btn--g btn--s" data-act="edit" data-id="${it.id}">Editar</button><button class="btn btn--d btn--s" data-act="del" data-id="${it.id}">Excluir</button></div></div>`;
  }

  /* ---------- Formulário em modal ---------- */
  const modal = $('modal');
  const priceIn = (v) => (v == null || v === '' ? '' : String(v).replace('.', ','));
  function fieldHtml(f, val) {
    const id = 'f_' + f.k, help = f.help ? `<span class="help">${esc(f.help)}</span>` : '';
    if (f.t === 'bool') return `<label class="chk"><input type="checkbox" id="${id}" ${val ? 'checked' : ''}> ${esc(f.l)}</label>`;
    if (f.t === 'area') return `<label class="field">${esc(f.l)}<textarea id="${id}" rows="4" maxlength="${f.max || 1000}">${esc(val)}</textarea>${help}</label>`;
    if (f.t === 'cat') return `<label class="field">${esc(f.l)}<select id="${id}"><option value="">Sem categoria</option>${cats.map((c) => `<option value="${c.id}" ${c.id === val ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>`;
    if (f.t === 'date') return `<label class="field">${esc(f.l)}<input type="date" id="${id}" value="${esc(val)}">${help}</label>`;
    if (f.t === 'int') return `<label class="field">${esc(f.l)}<input type="number" id="${id}" value="${esc(val)}" min="0" max="999">${help}</label>`;
    if (f.t === 'price') return `<label class="field">${esc(f.l)}<input type="text" inputmode="decimal" id="${id}" value="${esc(priceIn(val))}" placeholder="Ex.: 12,90">${help}</label>`;
    if (f.t === 'image') return `<div class="field">${esc(f.l)}<div class="imgf"><div class="pv" id="${id}_pv" style="${val ? `background-image:url('${esc(val)}')` : ''}">${val ? '' : 'Sem foto'}</div>
      <div class="btns"><input type="file" id="${id}_file" accept="image/jpeg,image/png,image/webp" hidden><button type="button" class="btn btn--g btn--s" data-pick="${f.k}">Escolher foto…</button>
      <button type="button" class="btn btn--g btn--s" data-clear="${f.k}">Remover foto</button></div><input type="hidden" id="${id}" value="${esc(val)}"></div>${help}</div>`;
    return `<label class="field">${esc(f.l)}<input type="text" id="${id}" value="${esc(val)}" maxlength="${f.max || 200}">${help}</label>`;
  }
  function readField(f) {
    const el = $('f_' + f.k);
    if (f.t === 'bool') return el.checked ? 1 : 0;
    if (f.t === 'int') return el.value === '' ? 0 : +el.value;
    return el.value.trim();
  }

  async function resizeImage(file, { max = 1600, png = false } = {}) {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    const g = c.getContext('2d');
    if (!png) { g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); }
    g.drawImage(bmp, 0, 0, c.width, c.height);
    return c.toDataURL(png ? 'image/png' : 'image/jpeg', 0.85);
  }
  async function uploadFile(file, opts) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Use uma foto JPG, PNG ou WebP.');
    const data = await resizeImage(file, opts);
    return (await api('POST', 'upload', { data })).url;
  }
  function wireImages(root, opts = {}) {
    root.querySelectorAll('[data-pick]').forEach((b) => {
      const k = b.dataset.pick, file = $(`f_${k}_file`);
      b.onclick = () => file.click();
      file.onchange = async () => {
        if (!file.files[0]) return; b.disabled = true; const old = b.textContent; b.textContent = 'Enviando…';
        try { const url = await uploadFile(file.files[0], opts[k] || {}); $('f_' + k).value = url; const pv = $(`f_${k}_pv`); pv.style.backgroundImage = `url('${url}')`; pv.textContent = ''; }
        catch (x) { toast(x.message, true); } finally { b.disabled = false; b.textContent = old; file.value = ''; }
      };
    });
    root.querySelectorAll('[data-clear]').forEach((b) => { b.onclick = () => { const k = b.dataset.clear; $('f_' + k).value = ''; const pv = $(`f_${k}_pv`); pv.style.backgroundImage = ''; pv.textContent = 'Sem foto'; }; });
  }

  function openForm(t, item, done) {
    const R = RES[t];
    $('mTitle').textContent = item ? `Editar ${R.one}` : `Novo ${R.one}`;
    $('mBody').innerHTML = R.fields.map((f) => fieldHtml(f, item ? item[f.k] : (f.def ?? (f.t === 'text' || f.t === 'area' || f.t === 'image' || f.t === 'date' ? '' : null)))).join('');
    $('mErr').hidden = true; wireImages($('mBody'));
    $('modalForm').onsubmit = async (e) => {
      e.preventDefault(); const body = {};
      for (const f of R.fields) {
        body[f.k] = readField(f);
        if (f.req && (body[f.k] === '' || body[f.k] == null)) { $('mErr').textContent = `Preencha: ${f.l}`; $('mErr').hidden = false; return; }
        if (f.t === 'price' && body[f.k] !== '' && !/^\d+([.,]\d{1,2})?$/.test(body[f.k])) { $('mErr').textContent = 'Preço inválido. Use o formato 12,90'; $('mErr').hidden = false; return; }
        if (f.t === 'cat') body[f.k] = body[f.k] ? +body[f.k] : null;
        if (f.t === 'price') body[f.k] = body[f.k] === '' ? null : body[f.k];
      }
      if (t === 'testimonials') body.rating = Math.min(5, Math.max(1, body.rating || 5));
      const btn = $('mSave'); btn.disabled = true;
      try { await api(item ? 'PUT' : 'POST', item ? `${t}/${item.id}` : t, body); modal.close(); toast('Salvo! Já está no site.'); done(); }
      catch (x) { $('mErr').textContent = x.message; $('mErr').hidden = false; } finally { btn.disabled = false; }
    };
    modal.showModal();
  }
  $('mClose').onclick = $('mCancel').onclick = () => modal.close();

  /* ---------- Textos e contato ---------- */
  const SET_GROUPS = [
    ['Página inicial', [['hero_title', 'Título principal', 'text'], ['hero_subtitle', 'Subtítulo', 'area'], ['hero_image', 'Imagem de fundo da página inicial (opcional)', 'image'], ['promo_notice', 'Faixa de aviso no topo do site (opcional)', 'text', 'Ex.: Promoção de fim de mês — consulte!']]],
    ['Sobre a empresa', [['about_title', 'Título da seção', 'text'], ['about_text', 'Texto', 'area'], ['footer_desc', 'Descrição curta (rodapé)', 'area']]],
    ['Contato e localização', [['phone_display', 'Telefone (como aparece)', 'text'], ['phone_tel', 'Telefone para ligar (com +55 e DDD)', 'text', 'Ex.: +553138218517'], ['whatsapp_number', 'WhatsApp (só números, com 55 e DDD)', 'text', 'Ex.: 553138218517'], ['address', 'Endereço', 'text'], ['cep', 'CEP', 'text'], ['hours', 'Horário de funcionamento', 'area', 'Ex.: Segunda a sexta, 8h às 18h. Deixe vazio enquanto não confirmar.']]],
    ['Avaliações do Google', [['google_rating', 'Nota (ex.: 4,6)', 'text'], ['google_count', 'Quantidade de avaliações', 'text'], ['google_reviews_url', 'Link para as avaliações no Google', 'text']]],
    ['Redes sociais e marca', [['instagram', 'Link do Instagram', 'text', 'https://instagram.com/…'], ['facebook', 'Link do Facebook', 'text', 'https://facebook.com/…'], ['logo_image', 'Logotipo (imagem; substitui o logotipo provisório)', 'image'], ['site_name', 'Nome da loja', 'text'], ['site_url', 'Endereço do site (para o Google, ex.: https://www.seusite.com.br)', 'text']]],
  ];
  async function viewSettings() {
    const S = await api('GET', 'settings');
    $('view').innerHTML = `<form id="sform" class="formgrid" novalidate>${SET_GROUPS.map(([g, fs]) => `<div class="panel"><h2>${g}</h2><div class="formgrid" style="margin-top:14px">${fs.map(([k, l, t, h]) => fieldHtml({ k, l, t, help: h, max: 2000 }, S[k])).join('')}</div></div>`).join('')}
      <p class="err" id="sErr" hidden></p><div><button class="btn btn--y" type="submit">Salvar alterações</button></div></form>`;
    wireImages($('view'), { logo_image: { max: 700, png: true }, hero_image: { max: 1920 } });
    $('sform').onsubmit = async (e) => {
      e.preventDefault(); const body = {};
      SET_GROUPS.forEach(([, fs]) => fs.forEach(([k, , t]) => { body[k] = readField({ k, t }); }));
      try { await api('PUT', 'settings', body); toast('Salvo! O site já foi atualizado.'); $('sErr').hidden = true; }
      catch (x) { $('sErr').textContent = x.message; $('sErr').hidden = false; window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }
    };
  }

  /* ---------- Segurança ---------- */
  function viewSecurity() {
    $('view').innerHTML = `<form id="pform" class="panel formgrid" novalidate><h2>Trocar usuário e senha</h2>
      <label class="field">Senha atual<input type="password" id="pcur" autocomplete="current-password"></label>
      <label class="field">Usuário<input type="text" id="puser" autocomplete="username" placeholder="Deixe vazio para manter o atual"></label>
      <label class="field">Nova senha<input type="password" id="pnew" autocomplete="new-password"><span class="help">Mínimo de 8 caracteres. Use letras e números.</span></label>
      <label class="field">Repita a nova senha<input type="password" id="pnew2" autocomplete="new-password"></label>
      <p class="err" id="pErr" hidden></p><div><button class="btn btn--y" type="submit">Salvar nova senha</button></div></form>`;
    $('pform').onsubmit = async (e) => {
      e.preventDefault(); const err = $('pErr'); err.hidden = true;
      if ($('pnew').value !== $('pnew2').value) { err.textContent = 'As senhas novas não são iguais.'; err.hidden = false; return; }
      try { await api('PUT', 'password', { current: $('pcur').value, new: $('pnew').value, username: $('puser').value.trim() }); toast('Senha alterada!'); $('warn').innerHTML = ''; e.target.reset(); }
      catch (x) { err.textContent = x.message; err.hidden = false; }
    };
  }

  boot();
})();
