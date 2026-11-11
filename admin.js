import * as B from './shared/backend.js';
import { HANDOFF_DEF, COURIER_DEF, parseAreas } from './shared/areas.js';
import { $, $$, esc, eur, toast, sheet, ago, copy, monthKey, fmtDay, waNumber, getTheme, setTheme, themeIcon, rid } from './shared/ui.js';
import { filamentsOf, filsOf, optionsOf, stockOf, wasPrice, pctOff } from './shared/stock.js';

const CFG = globalThis.GEWY_CONFIG || {};
const S = {
  view: 'home', user: null, products: [], requests: [], orders: [], subs: [], devices: [], accounts: [], blocks: [], verified: true, settings: {},
  ofilter: 'active', stops: [], threadRedraw: null,
  dv: { sel: new Set(), date: '', time: '', area: '' },
};
const digits = (s) => String(s || '').replace(/\D/g, '');
const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : 0; };
const ORDER_CHIP = { new: 'blue', making: 'acc', ready: 'warn', delivered: 'ok', cancelled: 'bad' };
const ORDER_LBL = { new: 'New', making: 'Printing', ready: 'Ready', delivered: 'Delivered', cancelled: 'Cancelled' };
const REQ_CHIP = { new: 'blue', discussing: 'acc', quoted: 'warn', approved: 'ok', printing: 'acc', done: 'ok', closed: 'bad' };
const REQ_LBL = { new: 'New', discussing: 'In talks', quoted: 'Quote sent', approved: 'Approved', printing: 'Printing', done: 'Done', closed: 'Closed' };
const REQ_OPEN = (r) => !['done', 'closed'].includes(r.status);
const needsReply = (r) => REQ_OPEN(r) && r.lastFrom === 'customer' && r.status !== 'approved';
const isPaid = (o) => o.payStatus === 'paid' && o.status !== 'cancelled';
const isDep = (o) => o.payStatus === 'deposit' && o.status !== 'cancelled';
const owed = (o) => (o.payStatus === 'paid' ? 0 : o.payStatus === 'deposit' ? Math.max(0, o.total - (o.paidAmount || 0)) : o.total);

/* ---------------------------------------------------------------- frame */
function frame(title, body, { back = true } = {}) {
  $('#app').innerHTML = `
    <header class="top"><div class="wrap">
      ${back ? '<button class="iconbtn" data-act="home" aria-label="Back">←</button>' : ''}
      <div class="logo grow">${back ? '' : '<svg class="mark" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="17" width="18" height="3" rx="1.5" fill="currentColor" opacity=".35"/><rect x="3" y="12" width="18" height="3" rx="1.5" fill="currentColor" opacity=".6"/><rect x="3" y="7" width="18" height="3" rx="1.5" fill="currentColor" opacity=".85"/><rect x="3" y="2" width="18" height="3" rx="1.5" style="fill:var(--acc)"/></svg>'}<span>${back ? esc(title) : 'GEWY <b>ADMIN</b>'}</span></div>
      ${B.mode === 'demo' ? '<span class="chip blue">DEMO</span>' : ''}
      <button class="iconbtn" data-act="theme" aria-label="Light or dark">${themeIcon()}</button>
      <button class="iconbtn" data-act="go" data-v="settings" aria-label="Settings">⚙️</button>
    </div></header>
    <main class="wrap" style="padding-bottom:60px">${body}</main>`;
}

function render() {
  document.body.dataset.bg = S.user ? { products: 'shop', filaments: 'shop', requests: 'custom', orders: 'orders' }[S.view] || '' : '';
  if (!S.user) return renderLogin();
  ({ home: viewHome, products: viewProducts, filaments: viewFilaments, requests: viewRequests, orders: viewOrders, delivery: viewDelivery, money: viewMoney, audience: viewAudience, notify: viewNotify, settings: viewSettings }[S.view] || viewHome)();
}

/* ---------------------------------------------------------------- login */
function renderLogin() {
  $('#app').innerHTML = `<main class="wrap" style="padding-top:12vh">
    <div class="logo" style="font-size:22px"><svg class="mark" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="17" width="18" height="3" rx="1.5" fill="currentColor" opacity=".35"/><rect x="3" y="12" width="18" height="3" rx="1.5" fill="currentColor" opacity=".6"/><rect x="3" y="7" width="18" height="3" rx="1.5" fill="currentColor" opacity=".85"/><rect x="3" y="2" width="18" height="3" rx="1.5" style="fill:var(--acc)"/></svg><span>GEWY <b>ADMIN</b></span></div>
    <p class="mut">Sign in to manage your shop.</p>
    ${B.mode === 'demo' ? '<div class="banner demo">🧪 <span><b>DEMO MODE</b> — any email and password works. Data stays in this browser.</span></div>' : ''}
    <button class="btn pri block" data-act="loginG">Sign in with Google</button>
    <p class="mut sm" style="margin:8px 0 0">Google will ask for your phone prompt or code to confirm it is you.</p>
    <details style="margin-top:22px" ${B.mode === 'demo' ? 'open' : ''}><summary class="mut sm" style="cursor:pointer">Use email and password instead</summary>
    <label class="f" style="margin-top:10px"><span>Email</span><input class="in" id="lE" type="email" autocomplete="username" inputmode="email"></label>
    <label class="f"><span>Password</span><input class="in" id="lP" type="password" autocomplete="current-password"></label>
    <div class="gap"></div><button class="btn block" data-act="login">Sign in</button></details></main>`;
}

/* ----------------------------------------------------------------- home */
function viewHome() {
  const openReq = S.requests.filter(needsReply).length;
  const newOrders = S.orders.filter((o) => o.status === 'new').length;
  const m = moneyStats();
  const tile = (v, ic, tt, st, bd) => `<button class="tile" data-act="go" data-v="${v}">${bd ? `<span class="bd">${bd}</span>` : ''}<span class="ic">${ic}</span><span><div class="tt">${tt}</div><div class="st">${st}</div></span></button>`;
  frame('', `<div class="gap"></div>
    ${pushNudge()}${verifyNudge()}
    <div class="tiles">
      ${tile('products', '🧩', 'PRODUCTS', `${S.products.filter((p) => p.published !== false).length} live`, 0)}
      ${tile('filaments', '🧵', 'FILAMENTS', filStatus(), 0)}
      ${tile('requests', '✏️', 'REQUESTS', openReq ? `${openReq} waiting for you` : 'all answered', openReq)}
      ${tile('orders', '📦', 'ORDERS', `${S.orders.filter((o) => ['new', 'making', 'ready'].includes(o.status)).length} active`, newOrders)}
      ${tile('delivery', '🚚', 'DELIVERY', `${S.orders.filter((o) => o.status === 'ready').length} ready`, S.orders.filter((o) => o.status === 'ready' && !o.deliveryMsg).length)}
      ${tile('money', '💶', 'MONEY', `${eur(m.profit)} profit`, 0)}
      ${tile('audience', '👥', 'AUDIENCE', `${S.devices.length} phones · ${S.accounts.length} accounts`, 0)}
      ${B.pushAvailable ? tile('notify', '🔔', 'NOTIFY', B.mode === 'demo' ? 'send an alert' : `${S.subs.filter((x) => x.role === 'shop').length} phones`, 0) : ''}
      ${tile('settings', '⚙️', 'SETTINGS', S.settings.payLink ? 'payments set up' : 'set up payments', S.settings.payLink ? 0 : '!')}
    </div>
    <p class="mut sm" style="text-align:center;margin-top:20px">Customer shop: <a href="./" target="_blank">${esc(new URL('./', location.href).href)}</a></p>`, { back: false });
}

function pushNudge() {
  if (!B.pushAvailable || B.pushEnabled('admin')) return '';
  return `<div class="banner">🔔 <span class="grow">Get an alert on this phone for new orders and messages.</span><button class="btn sm pri" data-act="pushAdmin">Turn on</button></div><div class="gap"></div>`;
}

/* ------------------------------------------------------------- products */
function viewProducts() {
  const rows = [...S.products].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  frame('PRODUCTS', `<div class="gap"></div><button class="btn pri block" data-act="editProd" data-id="">＋ Add product</button><div class="gap"></div>
    ${rows.length ? rows.map((p) => {
      const margin = p.cost ? ` · profit ${eur(p.price - p.cost)}` : '';
      return `<button class="card prod" style="padding:10px" data-act="editProd" data-id="${esc(p.id)}"><div class="row">
        <div style="width:64px;height:64px;border-radius:12px;overflow:hidden;background:var(--bg3);flex:none">${p.images && p.images[0] ? `<img src="${esc(p.images[0])}" style="width:100%;height:100%;object-fit:cover" alt="">` : '<div class="noimg">🧩</div>'}</div>
        <div class="grow"><b>${esc(p.name)}</b><div class="mono mut sm">${wasPrice(p) ? `<s>${eur(wasPrice(p))}</s> ` : ''}${eur(p.price)}${margin}</div>
        <div class="chips" style="margin-top:4px">${p.published === false ? '<span class="chip warn">hidden</span>' : '<span class="chip ok">live</span>'}${chipsStock(p)}${wasPrice(p) ? `<span class="chip acc">−${pctOff(p)}%</span>` : ''}${optionsOf(p).length ? `<span class="chip blue">${optionsOf(p).length} colors</span>` : ''}${p.custom && p.custom.on ? '<span class="chip acc">custom</span>' : ''}</div></div></div></button>`;
    }).join('') : `<div class="empty">No products yet. Tap “Add product”.</div>${B.mode === 'demo' ? '<div class="gap"></div><button class="btn block" data-act="seed">Load 3 demo products</button>' : ''}`}`);
}

function placeholderImg(label, c1, c2) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="600" height="600" fill="url(#g)"/><g fill="rgba(0,0,0,.18)">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="90" y="${150 + i * 38}" width="420" height="14" rx="7"/>`).join('')}</g><text x="300" y="320" font-family="monospace" font-size="56" font-weight="700" text-anchor="middle" fill="#fff">${label}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
async function seedDemo() {
  const now = Date.now();
  const items = [
    ['Hoodie Bunny', 8, 1.6, 'Cute desk figurine', ['Pink', 'Mint', 'Black'], '#ff9ec4', '#ff6a1a'],
    ['Phone Stand', 6, 1.1, 'Stable stand, any phone', ['Black', 'Orange'], '#4da3ff', '#2a4a78'],
    ['Cable Organizer', 4, 0.6, 'Keeps your desk tidy', ['Grey', 'White'], '#35d07f', '#0e5a3a'],
  ];
  for (const [name, price, cost, description, colors, c1, c2] of items) {
    await B.add('products', { name, price, cost, description, colors, category: 'Demo', images: [placeholderImg(name.split(' ')[0], c1, c2)], published: true, soldOut: false, createdAt: now, updatedAt: now });
  }
  toast('Demo products added');
}

function stockChip(st) { return st.out ? '<span class="chip bad">sold out</span>' : st.low ? '<span class="chip warn">low stock</span>' : ''; }
function chipsStock(p) {
  const st = stockOf(p, S.settings);
  const manual = p.soldOut ? '' : (st.out ? ' <span class="mut sm">(filament off)</span>' : '');
  return stockChip(st) + manual;
}
function filStatus() {
  const f = filamentsOf(S.settings);
  if (!f.length) return 'add your filaments';
  return `${f.filter((x) => x.on === false).length} off · ${f.filter((x) => x.low && x.on !== false).length} low`;
}
const r2 = (n) => Math.round(n * 100) / 100;

// Tells every shop app that the product list changed, so they reload it right away instead of waiting for their saved copy to expire.
const bumpCat = () => B.set('settings', 'shop', { catRev: Date.now() }).catch((e) => console.warn('catRev', e));

function openProductEditor(id) {
  const old = S.products.find((p) => p.id === id);
  const p = old || { name: '', price: '', listPrice: 0, cost: '', category: '', colors: [], options: [], filament: '', description: '', images: [], published: true, soldOut: false };
  const imgs = [...(p.images || [])];
  const files = [];
  const opts = (old ? optionsOf(p) : []).map((o) => ({ name: o.name, filament: o.filament || '', images: [...(o.images || [])], files: [] }));
  const fils = filamentsOf(S.settings);
  const pfils = filsOf(p).slice();
  if (!pfils.length) pfils.push('');
  const filOpts = (sel) => '<option value="">— none —</option>' + fils.map((f) => `<option value="${esc(f.id)}"${f.id === sel ? ' selected' : ''}>${esc(f.name)}${f.on === false ? ' (OFF)' : ''}</option>`).join('');
  const hasDisc = !!wasPrice(p);
  const s = sheet(`
    <div class="hd"><div class="ttl">${old ? 'Edit product' : 'New product'}</div><button class="xbtn" data-close>✕</button></div>
    <div class="h2">Photos</div><div class="thumbs" id="eTh"></div><input type="file" id="eF" accept="image/*" multiple class="hide">
    <label class="f"><span>Name</span><input class="in" id="eN" value="${esc(p.name)}"></label>
    <div class="two"><label class="f"><span>Normal price (${esc(CFG.currency || 'EUR')})</span><input class="in" id="eP" inputmode="decimal" value="${esc(hasDisc ? wasPrice(p) : p.price)}"></label>
    <label class="f"><span>Cost to make</span><input class="in" id="eC" inputmode="decimal" value="${esc(p.cost)}"></label></div>
    <div class="h2">Discount</div>
    <div class="two"><label class="f"><span>Type</span><select class="in" id="eDm"><option value="none">No discount</option><option value="percent">Percent off</option><option value="price"${hasDisc ? ' selected' : ''}>New lower price</option></select></label>
    <label class="f"><span id="eDl">Value</span><input class="in" id="eDv" inputmode="decimal" value="${hasDisc ? esc(p.price) : ''}"></label></div>
    <div class="card" id="ePrev" style="margin-top:8px"></div>
    <div class="h2">Filament</div>
    <div class="f"><span>Which filaments does this product use?</span><div id="eFils"></div></div>
    <button class="btn block" data-a="addFil">＋ Add another filament</button>
    ${fils.length ? '' : '<p class="mut sm">Add your filaments first in the FILAMENTS tab, then pick one here.</p>'}
    <div class="h2">Color options <span class="mut sm">(optional)</span></div>
    <p class="mut sm">Leave empty for a one-color product. Add options (green, red, orange…) and each gets its own photos and its own filament, so only that color goes out of stock when its filament is off.</p>
    <div id="eOpts"></div><input type="file" id="eOF" accept="image/*" multiple class="hide">
    <button class="btn block" data-a="addOpt">＋ Add color option</button>
    <label class="f"><span>Category</span><input class="in" id="eCa" value="${esc(p.category || '')}"></label>
    <label class="f"><span>Description</span><textarea class="in" id="eD">${esc(p.description || '')}</textarea></label>
    <div class="h2">Personalise <span class="mut sm">(optional)</span></div>
    <label class="check"><input type="checkbox" id="eCu" ${p.custom && p.custom.on ? 'checked' : ''}> <span>Customer types something (name, number…)</span></label>
    <div id="eCuBox" class="${p.custom && p.custom.on ? '' : 'hide'}">
      <label class="f"><span>Text shown above the box</span><input class="in" id="eCl" maxlength="80" placeholder="Choose your name" value="${esc((p.custom && p.custom.label) || '')}"></label>
      <div class="two"><label class="f"><span>Max letters</span><input class="in" id="eCm" inputmode="numeric" value="${esc((p.custom && p.custom.max) || 12)}"></label>
      <label class="f"><span>Required?</span><select class="in" id="eCr"><option value="1"${!p.custom || p.custom.required !== false ? ' selected' : ''}>Yes, must fill</option><option value="0"${p.custom && p.custom.required === false ? ' selected' : ''}>No, optional</option></select></label></div>
    </div>
    <label class="check"><input type="checkbox" id="eV" ${p.published !== false ? 'checked' : ''}> <span>Visible in the shop</span></label>
    <label class="check"><input type="checkbox" id="eS" ${p.soldOut ? 'checked' : ''}> <span>Mark as sold out by hand (all colors)</span></label>
    ${B.pushAvailable ? `<label class="check"><input type="checkbox" id="eNo" ${old ? '' : 'checked'}> <span>🔔 Notify customers about this product</span></label>` : ''}
    <div class="gap"></div><button class="btn pri block" data-a="save">${old ? 'Save changes' : 'Publish product'}</button>
    ${old ? '<div class="gap-s"></div><button class="btn bad block" data-a="del">Delete product</button>' : ''}`);
  $('#eCu', s.el).addEventListener('change', (e) => $('#eCuBox', s.el).classList.toggle('hide', !e.target.checked));
  const draw = () => {
    $('#eTh', s.el).innerHTML = imgs.map((u, i) => `<div class="thumb"><img src="${esc(u)}" alt=""><button data-a="rmI" data-i="${i}">✕</button></div>`).join('') +
      files.map((f, i) => `<div class="thumb"><img src="${URL.createObjectURL(f)}" alt=""><button data-a="rmF" data-i="${i}">✕</button></div>`).join('') +
      (imgs.length + files.length < B.MAX_PHOTOS ? '<button class="addimg" data-a="pick">＋</button>' : '<span class="mut sm" style="align-self:center">max ' + B.MAX_PHOTOS + ' photos</span>');
  };
  const drawFils = () => {
    $('#eFils', s.el).innerHTML = pfils.map((fid, i) => `<div class="row" style="margin-bottom:6px"><select class="in grow" data-f="pfil" data-i="${i}">${filOpts(fid)}</select>${pfils.length > 1 ? `<button class="xbtn" data-a="rmFil" data-i="${i}" aria-label="Remove">🗑</button>` : ''}</div>`).join('');
  };
  const drawOpts = () => {
    $('#eOpts', s.el).innerHTML = opts.map((o, i) => `<div class="card" style="margin-bottom:8px"><div class="row"><input class="in grow" data-f="name" data-i="${i}" placeholder="Color name, e.g. Red" value="${esc(o.name)}"><button class="xbtn" data-a="rmO" data-i="${i}" aria-label="Remove">🗑</button></div>
      <label class="f"><span>Filament for this color</span><select class="in" data-f="fil" data-i="${i}">${filOpts(o.filament)}</select></label>
      <div class="thumbs">${o.images.map((u, j) => `<div class="thumb"><img src="${esc(u)}" alt=""><button data-a="rmOI" data-i="${i}" data-j="${j}">✕</button></div>`).join('')}${o.files.map((f, j) => `<div class="thumb"><img src="${URL.createObjectURL(f)}" alt=""><button data-a="rmOF" data-i="${i}" data-j="${j}">✕</button></div>`).join('')}${o.images.length + o.files.length < B.MAX_PHOTOS ? `<button class="addimg" data-a="pickO" data-i="${i}">＋</button>` : ''}</div></div>`).join('');
  };
  const final = () => {
    const normal = num($('#eP', s.el).value);
    const mode = $('#eDm', s.el).value;
    const v = num($('#eDv', s.el).value);
    let price = normal;
    if (mode === 'percent' && v > 0 && v < 100) price = r2(normal * (1 - v / 100));
    if (mode === 'price' && v > 0) price = r2(v);
    return { normal, price, disc: mode !== 'none' && price < normal, bad: mode !== 'none' && (!(v > 0) || price >= normal) };
  };
  const preview = () => {
    const f = final(); const cost = num($('#eC', s.el).value);
    $('#eDl', s.el).textContent = $('#eDm', s.el).value === 'percent' ? 'Percent off (%)' : 'New price';
    $('#eDv', s.el).disabled = $('#eDm', s.el).value === 'none';
    let h = '';
    if (!f.normal) h = '<span class="mut">Type the normal price to see the preview.</span>';
    else {
      const pr = f.price - cost;
      h = `<div class="row between"><span class="mut">Customer pays</span><b class="mono" style="font-size:20px">${f.disc ? `<s class="mut" style="font-size:14px">${eur(f.normal)}</s> ` : ''}${eur(f.price)}</b></div>`;
      if (f.disc) h += `<div class="row between"><span class="mut">Discount</span><b class="mono">−${Math.round((1 - f.price / f.normal) * 100)}% · saves them ${eur(f.normal - f.price)}</b></div>`;
      if (cost > 0) h += `<div class="row between"><span class="mut">You earn per item</span><b class="mono" style="color:${pr < 0 ? 'var(--bad, #ff5d5d)' : 'var(--ok, #35d07f)'}">${eur(pr)}${f.disc ? ` <span class="mut sm">(was ${eur(f.normal - cost)})</span>` : ''}</b></div>`;
      if (cost > 0 && pr < 0) h += '<div class="mut sm" style="color:var(--bad, #ff5d5d)">⚠ The discounted price is below your cost.</div>';
      if (f.bad) h += '<div class="mut sm" style="color:var(--bad, #ff5d5d)">⚠ The discount needs a value that makes the price lower than the normal price.</div>';
    }
    $('#ePrev', s.el).innerHTML = h;
  };
  draw(); drawFils(); drawOpts(); preview();
  let pickIdx = -1;
  $('#eF', s.el).addEventListener('change', (e) => {
    const room = Math.max(0, B.MAX_PHOTOS - imgs.length - files.length);
    if (e.target.files.length > room) toast('Up to ' + B.MAX_PHOTOS + ' photos per product');
    files.push(...[...e.target.files].slice(0, room)); e.target.value = ''; draw();
  });
  $('#eOF', s.el).addEventListener('change', (e) => {
    const o = opts[pickIdx]; if (!o) return;
    const room = Math.max(0, B.MAX_PHOTOS - o.images.length - o.files.length);
    o.files.push(...[...e.target.files].slice(0, room)); e.target.value = ''; drawOpts();
  });
  s.el.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset && t.dataset.f === 'name') opts[+t.dataset.i].name = t.value;
    if (['eP', 'eC', 'eDv'].includes(t.id)) preview();
  });
  s.el.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset && t.dataset.f === 'fil') opts[+t.dataset.i].filament = t.value;
    if (t.dataset && t.dataset.f === 'pfil') pfils[+t.dataset.i] = t.value;
    if (t.id === 'eDm') preview();
  });
  s.el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const a = b.dataset.a;
    if (a === 'pick') $('#eF', s.el).click();
    if (a === 'rmI') { imgs.splice(+b.dataset.i, 1); draw(); }
    if (a === 'rmF') { files.splice(+b.dataset.i, 1); draw(); }
    if (a === 'addFil') { pfils.push(''); drawFils(); }
    if (a === 'rmFil') { pfils.splice(+b.dataset.i, 1); drawFils(); }
    if (a === 'addOpt') { opts.push({ name: '', filament: '', images: [], files: [] }); drawOpts(); }
    if (a === 'rmO') { opts.splice(+b.dataset.i, 1); drawOpts(); }
    if (a === 'pickO') { pickIdx = +b.dataset.i; $('#eOF', s.el).click(); }
    if (a === 'rmOI') { opts[+b.dataset.i].images.splice(+b.dataset.j, 1); drawOpts(); }
    if (a === 'rmOF') { opts[+b.dataset.i].files.splice(+b.dataset.j, 1); drawOpts(); }
    if (a === 'del') {
      if (!confirm('Delete this product for good?')) return;
      await B.del('products', id); await bumpCat(); s.close(); toast('Deleted');
    }
    if (a === 'save') {
      const name = $('#eN', s.el).value.trim();
      const f = final();
      if (!name || !f.normal) return toast('Add a name and a price');
      if (f.bad) return toast('Fix the discount value first');
      const names = opts.map((o) => o.name.trim());
      if (names.some((n) => !n)) return toast('Give every color option a name');
      if (new Set(names.map((n) => n.toLowerCase())).size !== names.length) return toast('Two color options have the same name');
      b.disabled = true; b.textContent = 'Saving…';
      try {
        const urls = [...imgs];
        for (const x of files) urls.push(await B.uploadImage(x, 'products'));
        const options = [];
        for (const o of opts) {
          const oi = [...o.images];
          for (const x of o.files) oi.push(await B.uploadImage(x, 'products'));
          options.push({ name: o.name.trim(), filament: o.filament || '', images: oi });
        }
        const published = $('#eV', s.el).checked;
        const data = {
          name, price: f.price, listPrice: f.disc ? f.normal : null, cost: num($('#eC', s.el).value), category: $('#eCa', s.el).value.trim(),
          filaments: [...new Set(pfils.filter(Boolean))], filament: pfils.find(Boolean) || '', options, colors: options.map((o) => o.name),
          custom: $('#eCu', s.el).checked ? { on: true, label: $('#eCl', s.el).value.trim().slice(0, 80) || 'Your text', max: Math.min(40, Math.max(1, parseInt($('#eCm', s.el).value, 10) || 12)), required: $('#eCr', s.el).value !== '0' } : null,
          description: $('#eD', s.el).value.trim(), images: urls, published, soldOut: $('#eS', s.el).checked, updatedAt: Date.now(),
        };
        if (JSON.stringify(data).length > 900000) { toast('Too many photos for one product. Remove a few.', 5000); b.disabled = false; b.textContent = old ? 'Save changes' : 'Publish product'; return; }
        let pid = id;
        if (old) await B.set('products', id, data);
        else pid = await B.add('products', { ...data, createdAt: Date.now() });
        await bumpCat();
        if ($('#eNo', s.el) && $('#eNo', s.el).checked && published && !data.soldOut) {
          await B.add('broadcasts', { title: (old ? 'Update: ' : 'New: ') + name, body: `${eur(data.price)}${data.description ? ' · ' + data.description.slice(0, 80) : ''}`, productId: pid, at: Date.now() });
          toast('Saved · customers notified 🔔');
        } else toast('Saved');
        s.close();
      } catch (err) { console.error(err); toast('Could not save: ' + (err.code || err.message)); b.disabled = false; b.textContent = old ? 'Save changes' : 'Publish product'; }
    }
  });
}

/* ------------------------------------------------------------- filaments */
const usesFil = (p, fid) => filsOf(p).includes(fid) || optionsOf(p).some((o) => o.filament === fid);
async function saveFilaments(list) { await B.set('settings', 'shop', { filaments: list, updatedAt: Date.now() }); }
function viewFilaments() {
  const fs = filamentsOf(S.settings);
  frame('FILAMENTS', `<div class="gap"></div>
    <p class="mut sm">Add each filament you use. Switch one OFF when it runs out: every product (or color) that uses it shows as sold out in the shop right away. Switch it back ON when you restock.</p>
    <button class="btn pri block" data-act="filEdit" data-id="">＋ Add filament</button><div class="gap"></div>
    ${fs.length ? fs.map((f) => {
      const on = f.on !== false; const n = S.products.filter((p) => usesFil(p, f.id)).length;
      return `<div class="card"><div class="row between"><div class="row"><span style="width:22px;height:22px;border-radius:50%;flex:none;background:${esc(f.color || '#888')};border:1px solid var(--line)"></span><b>${esc(f.name)}</b></div>
        <div class="chips">${on ? '<span class="chip ok">IN STOCK</span>' : '<span class="chip bad">OFF · sold out</span>'}${f.low && on ? '<span class="chip warn">low</span>' : ''}</div></div>
        <div class="mut sm" style="margin:4px 0 8px">${n} product${n === 1 ? '' : 's'} use it</div>
        <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn sm${on ? '' : ' pri'}" data-act="filOn" data-id="${esc(f.id)}">${on ? 'Switch OFF (sold out)' : 'Switch ON (back in stock)'}</button>
        <button class="btn sm" data-act="filLow" data-id="${esc(f.id)}">${f.low ? '✓ Low stock · clear' : 'Mark low stock'}</button>
        <button class="btn sm" data-act="filEdit" data-id="${esc(f.id)}">✎ Edit</button></div></div>`;
    }).join('') : '<div class="empty">No filaments yet. Tap “Add filament”, for example “Orange PLA”.</div>'}`);
}
function openFilament(id) {
  const old = filamentsOf(S.settings).find((f) => f.id === id);
  const s = sheet(`<div class="hd"><div class="ttl">${old ? 'Edit filament' : 'New filament'}</div><button class="xbtn" data-close>✕</button></div>
    <label class="f"><span>Name</span><input class="in" id="fN" placeholder="Orange PLA" value="${esc(old ? old.name : '')}"></label>
    <label class="f"><span>Color</span><input class="in" id="fC" type="color" value="${esc(old && old.color ? old.color : '#ff6a1a')}" style="height:48px;padding:4px"></label>
    <div class="gap"></div><button class="btn pri block" data-a="save">Save</button>
    ${old ? '<div class="gap-s"></div><button class="btn bad block" data-a="del">Delete filament</button>' : ''}`);
  s.el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const list = [...filamentsOf(S.settings)];
    if (b.dataset.a === 'save') {
      const name = $('#fN', s.el).value.trim(); if (!name) return toast('Add a name');
      if (old) { const f = list.find((x) => x.id === id); f.name = name; f.color = $('#fC', s.el).value; }
      else list.push({ id: rid(), name, color: $('#fC', s.el).value, on: true, low: false });
      await saveFilaments(list); s.close(); toast('Saved');
    }
    if (b.dataset.a === 'del') {
      if (!confirm('Delete this filament? Products using it stay, but are no longer linked.')) return;
      await saveFilaments(list.filter((x) => x.id !== id)); s.close(); toast('Deleted');
    }
  });
}

/* ------------------------------------------------------- v15 helpers */
const phoneKey = (p) => String(p || '').replace(/\D/g, '').replace(/^00/, '').replace(/^30/, '');
const trackWa = (o) => {
  const c = o.customer || {};
  const txt = `Hi ${c.name || ''}! Your order ${o.no} is on its way. Tracking number: ${o.tracking}.${o.delivery === 'boxnow' ? ' Box Now will text you the locker and the pickup code when it arrives.' : ''}`;
  return `https://wa.me/${waNumber(c.phone)}?text=${encodeURIComponent(txt)}`;
};
function preorderInfo(r) {
  if (r.kind !== 'preorder') return '';
  const p = S.products.find((x) => x.id === r.pid);
  let st = '';
  if (p) {
    const sk = stockOf(p, S.settings);
    const o = r.option ? sk.opts.find((x) => x.name === r.option) : null;
    st = (o ? o.out : sk.out) ? '<span class="chip bad">still sold out</span>' : '<span class="chip ok">back in stock now</span>';
  }
  return `<div class="chips" style="margin:6px 0"><span class="chip acc">🔔 PRE-ORDER</span>${st}</div>`;
}
const verifyNudge = () => (S.verified ? '' : '<div class="banner">✉️ <span class="grow">Verify your own email for extra safety. I send you a link.</span><button class="btn sm pri" data-act="verifyAdmin">Send link</button></div><div class="gap"></div>');

// Block a sender: their phone number and their device. Blocked senders cannot send orders, requests or messages (the database refuses them).
async function blockSender({ uid, phone, label }) {
  const now = Date.now();
  const k = phoneKey(phone);
  let n = 0;
  if (uid && uid !== B.uid()) { await B.set('blocks', uid, { kind: 'device', label: label || '', at: now }); n++; }
  if (k.length >= 6) { await B.set('blocks', k, { kind: 'phone', label: label || '', at: now }); n++; }
  return n;
}
function blockedHtml() {
  const rows = [...S.blocks].sort((a, b) => (b.at || 0) - (a.at || 0));
  return rows.length ? rows.map((x) => `<div class="row between" style="margin:6px 0"><span>${x.kind === 'phone' ? '📞 ' + esc(x.id) : '📱 device'}${x.label ? ' · ' + esc(x.label) : ''}<span class="mut sm"> · ${esc(ago(x.at))}</span></span><button class="btn sm" data-act="unblock" data-id="${esc(x.id)}">Unblock</button></div>`).join('')
    : '<span class="mut">Nobody is blocked.</span>';
}
function drawBlocks() { const el = $('#blkList'); if (el) el.innerHTML = blockedHtml(); }

// Backup: spreadsheets for you, and one full file with everything.
const csvOf = (rows) => rows.map((r) => r.map((v) => '"' + String(v ?? '').replaceAll('"', '""') + '"').join(',')).join('\n');
function saveFile(name, text, type = 'text/csv') {
  const blob = new Blob([type === 'text/csv' ? '\ufeff' + text : text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
const today = () => new Date().toISOString().slice(0, 10);
function backupOrders() {
  const rows = [['Date', 'Order', 'Customer', 'Phone', 'Area', 'Address / locker', 'Items', 'Total', 'Cost', 'Payment', 'Paid status', 'Status', 'Tracking']];
  [...S.orders].sort((a, b) => a.createdAt - b.createdAt).forEach((o) => { const c = o.customer || {}; rows.push([new Date(o.createdAt).toISOString().slice(0, 10), o.no, c.name, c.phone, c.area, c.address, (o.items || []).map((i) => `${i.name} x${i.qty}`).join('; '), o.total, o.costTotal || 0, o.payMethod, o.payStatus, o.status, o.tracking || '']); });
  saveFile(`gewy-orders-${today()}.csv`, csvOf(rows));
}
function backupCustomers() {
  const m = new Map();
  S.orders.filter((o) => o.source !== 'manual').forEach((o) => {
    const c = o.customer || {}; const k = phoneKey(c.phone) || 'o' + o.id;
    const e = m.get(k) || { name: '', phone: '', area: '', address: '', orders: 0, requests: 0, spent: 0, last: 0 };
    e.name = c.name || e.name; e.phone = c.phone || e.phone; e.area = c.area || e.area; e.address = c.address || e.address;
    e.orders++; if (o.payStatus === 'paid') e.spent += o.total; e.last = Math.max(e.last, o.createdAt || 0); m.set(k, e);
  });
  S.requests.forEach((r) => {
    const k = phoneKey(r.phone); if (!k) return;
    const e = m.get(k) || { name: r.name, phone: r.phone, area: r.area || '', address: '', orders: 0, requests: 0, spent: 0, last: 0 };
    e.requests++; e.last = Math.max(e.last, r.createdAt || 0); m.set(k, e);
  });
  const rows = [['Name', 'Phone', 'Area', 'Address', 'Orders', 'Requests', 'Paid total', 'Last activity']];
  [...m.values()].sort((a, b) => b.last - a.last).forEach((e) => rows.push([e.name, e.phone, e.area, e.address, e.orders, e.requests, e.spent, e.last ? new Date(e.last).toISOString().slice(0, 10) : '']));
  saveFile(`gewy-customers-${today()}.csv`, csvOf(rows));
}
async function backupAll() {
  const out = { app: 'gewy-builds', exportedAt: new Date().toISOString(), data: {} };
  for (const c of ['products', 'orders', 'requests', 'messages', 'settings', 'accounts', 'devices', 'blocks']) out.data[c] = await B.getAll(c);
  saveFile(`gewy-backup-${today()}.json`, JSON.stringify(out), 'application/json');
}

/* ------------------------------------------------------------- requests */
async function deleteRequest(id) {
  const msgs = await B.getAll('messages', { where: [['requestId', '==', id]] });
  for (const m of msgs) await B.del('messages', m.id);
  await B.del('requests', id);
}

function viewRequests() {
  const rows = [...S.requests].sort((a, b) => (needsReply(b) - needsReply(a)) || (b.updatedAt || 0) - (a.updatedAt || 0));
  frame('REQUESTS', `<div class="gap"></div>${rows.length ? rows.map((r) => `<div class="row" style="align-items:stretch;gap:8px;margin-bottom:10px"><button class="card prod grow" style="padding:14px;margin:0" data-act="thread" data-id="${esc(r.id)}">
      <div class="row between"><b>${esc(r.title)}</b><span class="chip ${REQ_CHIP[r.status] || ''}">${esc(REQ_LBL[r.status] || r.status)}</span></div>
      <div class="mut sm">${r.kind === 'preorder' ? '🔔 pre-order · ' : ''}${esc(r.name)} · ${esc(ago(r.updatedAt))}${needsReply(r) ? ' · <span style="color:var(--acc2)">● needs reply</span>' : ''}</div></button>
      <button class="btn bad" style="width:48px" data-act="delreq" data-id="${esc(r.id)}" aria-label="Delete">🗑</button></div>`).join('')
    : '<div class="empty">No custom requests yet. When a customer asks for something, it shows up here.</div>'}`);
}

function openThread(id) {
  const getReq = () => S.requests.find((r) => r.id === id);
  if (!getReq()) return;
  let msgs = [];
  const s = sheet(`<div class="hd"><div class="ttl" id="tTitle"></div><button class="xbtn" data-close>✕</button></div>
    <div id="tInfo"></div><div class="chat" id="tChat"></div>
    <div class="composer"><button class="iconbtn" data-a="att" aria-label="Photo">📷</button><input type="file" id="tF" accept="image/*" class="hide">
      <textarea id="tM" rows="1" placeholder="Reply…"></textarea><button class="btn pri" data-a="send">Send</button></div>`,
    { full: true, onClose: () => { un(); S.threadRedraw = null; } });
  const drawInfo = () => {
    const r = getReq();
    if (!r) return;
    $('#tTitle', s.el).textContent = r.title;
    const q = r.quote;
    $('#tInfo', s.el).innerHTML = `<div class="card"><div class="row between"><b>${esc(r.name)}</b>
        <span class="row"><a class="btn sm" href="tel:${esc(String(r.phone).replace(/[^\d+]/g, ''))}">📞</a><a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/${waNumber(r.phone)}">💬</a></span></div>
      <div class="mono mut sm">${esc(r.phone)}</div>
      ${r.area ? `<div>📍 ${esc(r.area)}</div>` : ''}
      ${preorderInfo(r)}
      <div style="white-space:pre-wrap;margin-top:6px">${esc(r.desc)}</div>
      ${r.budget ? `<div class="mut sm" style="margin-top:4px">Budget: ${esc(r.budget)}</div>` : ''}
      ${(r.refImages || []).length ? `<div class="thumbs">${r.refImages.map((u) => `<div class="thumb"><img src="${esc(u)}" data-zoom alt=""></div>`).join('')}</div>` : ''}
      <div class="gap-s"></div>
      <div class="two"><select class="in" id="tSt">${Object.keys(REQ_LBL).map((k) => `<option value="${k}"${k === r.status ? ' selected' : ''}>${REQ_LBL[k]}</option>`).join('')}</select>
        <button class="btn" data-a="quote">${q ? `Quote ${eur(q.price)} · edit` : '💶 Send price'}</button></div>
      <div class="gap-s"></div><button class="btn sm ghost block" data-a="blk">🚫 Block this sender (phone + device)</button>
      <div class="gap-s"></div><button class="btn bad sm block" data-a="delreq">🗑 Delete this request (spam)</button></div>`;
    $('#tSt', s.el).onchange = (e) => B.set('requests', id, { status: e.target.value, updatedAt: Date.now() });
  };
  const drawChat = () => {
    const box = $('#tChat', s.el);
    const atEnd = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
    box.innerHTML = [...msgs].sort((a, b) => a.at - b.at).map((m) => `<div class="bub${m.from === 'admin' ? ' me' : ''}">${m.image ? `<img src="${esc(m.image)}" data-zoom alt="">` : ''}${m.text ? esc(m.text) : ''}<div class="t">${m.from === 'admin' ? 'You' : esc(getReq()?.name || 'Customer')} · ${esc(ago(m.at))}</div></div>`).join('');
    if (atEnd) box.scrollTop = box.scrollHeight;
  };
  const un = B.watch('messages', (rows) => { msgs = rows; drawChat(); }, { where: [['requestId', '==', id]] });
  S.threadRedraw = () => { drawInfo(); drawChat(); };
  drawInfo();
  const post = async (text, image, extra = {}) => {
    const now = Date.now();
    await B.add('messages', { requestId: id, ownerUid: getReq().ownerUid, from: 'admin', text: text || '', image: image || '', at: now });
    const r = getReq();
    await B.set('requests', id, { updatedAt: now, lastFrom: 'admin', ...(r.status === 'new' ? { status: 'discussing' } : {}), ...extra });
  };
  const send = async () => {
    const ta = $('#tM', s.el);
    const text = ta.value.trim();
    if (!text) return;
    ta.value = '';
    try { await post(text); } catch (e) { console.error(e); toast('Could not send'); }
  };
  $('#tF', s.el).addEventListener('change', async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try { toast('Uploading preview…'); await post($('#tM', s.el).value.trim(), await B.uploadImage(f, 'previews')); $('#tM', s.el).value = ''; } catch (err) { console.error(err); toast('Upload failed'); }
  });
  s.el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    if (b.dataset.a === 'att') $('#tF', s.el).click();
    if (b.dataset.a === 'delreq') {
      if (!confirm('Delete this request and its whole chat for good?')) return;
      try { await deleteRequest(id); s.close(); toast('Deleted'); } catch (err) { console.error(err); toast('Failed: ' + (err.code || err.message)); }
    }
    if (b.dataset.a === 'blk') {
      const r = getReq();
      if (!confirm('Block this sender? They will not be able to send orders, requests or messages.')) return;
      try { const n = await blockSender({ uid: r.ownerUid, phone: r.phone, label: r.name }); toast(n ? 'Blocked ✓' : 'Nothing to block'); } catch (err) { console.error(err); toast('Failed: ' + (err.code || err.message)); }
    }
    if (b.dataset.a === 'send') send();
    if (b.dataset.a === 'quote') {
      const r = getReq();
      const q = sheet(`<div class="hd"><div class="ttl">Send price</div><button class="xbtn" data-close>✕</button></div>
        <p class="mut sm">The customer will see the price and an “Approve and order” button. They pay nothing until they approve.</p>
        <label class="f"><span>Price (${esc(CFG.currency || 'EUR')})</span><input class="in" id="qP" inputmode="decimal" value="${esc(r.quote ? r.quote.price : (r.kind === 'preorder' ? ((S.products.find((x) => x.id === r.pid) || {}).price || '') : ''))}"></label>
        <label class="f"><span>Note (optional)</span><input class="in" id="qN" placeholder="e.g. ready in 3 days" value="${esc(r.quote ? r.quote.note || '' : '')}"></label>
        <div class="gap"></div><button class="btn pri block" data-a="go">Send to customer</button>`);
      q.el.addEventListener('click', async (ev) => {
        if (!ev.target.closest('[data-a=go]')) return;
        const price = num($('#qP', q.el).value);
        if (!price) return toast('Enter a price');
        const note = $('#qN', q.el).value.trim();
        try { await post(`💶 Price: ${eur(price)}${note ? ' — ' + note : ''}`, '', { quote: { price, note, at: Date.now() }, status: 'quoted' }); q.close(); toast('Price sent'); }
        catch (err) { console.error(err); toast('Could not send'); }
      });
    }
  });
  $('#tM', s.el).addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 700) { e.preventDefault(); send(); } });
}


/* ------------------------------------------------- messages to customers */
const VIA = { whatsapp: 'WhatsApp', viber: 'Viber', both: 'WhatsApp or Viber' };
const dmy = (iso) => (iso ? iso.split('-').reverse().slice(0, 2).join('/') : '');
const TPL = {
  ready: 'Hi {name}! Your order {order} is ready 🎉 I will let you know when I can deliver it.\nΓεια σου {name}! Η παραγγελία {order} είναι έτοιμη 🎉 Θα σε ενημερώσω πότε θα την παραδώσω.',
  when: 'Hi {name}! Your order {order} will be delivered on {date} at {time}. Please reply to confirm 🙌\nΓεια σου {name}! Η παραγγελία {order} θα παραδοθεί στις {date} και ώρα {time}. Απάντησε για να επιβεβαιώσεις 🙌',
  thanks: 'Hi {name}! Thank you for your order {order} 💛 Enjoy it, and tell me if anything is wrong.\nΓεια σου {name}! Ευχαριστώ για την παραγγελία {order} 💛 Πες μου αν υπάρχει οποιοδήποτε θέμα.',
};
// The same fixed wording every time. You can change it in Settings. {name} {order} {date} {time} {items} {total} fill themselves in.
function msgText(o, kind, date, time) {
  const c = o.customer || {};
  const tpl = ((S.settings.msgTpl || {})[kind] || '').trim() || TPL[kind] || TPL.when;
  return tpl.replace(/\{(\w+)\}/g, (m, k) => ({
    name: (c.name || '').split(' ')[0] || '', order: o.no || '', date: dmy(date) || '…', time: time || '…',
    items: (o.items || []).map((i) => i.name + ' ×' + i.qty).join(', '), total: eur(o.total), phone: c.phone || '', area: c.area || '',
  }[k] ?? m));
}
const waUrl = (o, txt) => `https://wa.me/${waNumber((o.customer || {}).phone)}?text=${encodeURIComponent(txt)}`;
// Viber cannot start a chat with a ready-written text, so the text is copied and Viber opens on the right person: just paste and send.
const viberUrl = (o) => 'viber://chat?number=' + encodeURIComponent('+' + waNumber((o.customer || {}).phone));
function viaButtons(o, attr) {
  const v = (o.customer && o.customer.via) || 'both';
  const one = v === 'viber' || v === 'whatsapp';
  return `${v !== 'viber' ? `<button class="btn ${one ? 'pri ' : ''}sm grow" ${attr} data-app="whatsapp">💬 Send on WhatsApp</button>` : ''}${v !== 'whatsapp' ? `<button class="btn ${one ? 'pri ' : ''}sm grow" ${attr} data-app="viber">🟣 Send on Viber</button>` : ''}`;
}
async function sendVia(o, app, txt, when, track = true) {
  if (app === 'viber') { Promise.resolve(copy(txt)).catch(() => {}); toast('Message copied. Paste it in Viber and send.', 4500); window.open(viberUrl(o), '_blank'); }
  else window.open(waUrl(o, txt), '_blank');
  if (track) await B.set('orders', o.id, { deliveryMsg: { at: Date.now(), via: app, when: when || '', confirmed: false } });
}

/* ------------------------------------------------------------- delivery */
function viewDelivery() {
  const D = S.dv;
  const ready = S.orders.filter((o) => o.status === 'ready').sort((a, b) => a.createdAt - b.createdAt);
  const areas = [...new Set(ready.map((o) => (o.customer && o.customer.area) || '').filter(Boolean))];
  const shown = ready.filter((o) => !D.area || (o.customer && o.customer.area) === D.area);
  const waiting = S.orders.filter((o) => o.deliveryMsg && !o.deliveryMsg.confirmed && o.status !== 'delivered' && o.status !== 'cancelled');
  const picked = shown.filter((o) => D.sel.has(o.id));
  frame('DELIVERY', `<div class="gap"></div>
    <div class="card"><b>1. Pick the day and hour</b>
      <div class="two" style="margin-top:8px"><label class="f"><span>Date</span><input class="in" type="date" id="dvD" value="${esc(D.date)}"></label>
      <label class="f"><span>Time</span><input class="in" type="time" id="dvT" value="${esc(D.time)}"></label></div></div>
    <div class="h2">2. Tick who you are visiting (${ready.length} ready)</div>
    ${areas.length > 1 ? `<div class="chips"><button class="pill${D.area ? '' : ' on'}" data-act="dvArea" data-v="">All</button>${areas.map((x) => `<button class="pill${D.area === x ? ' on' : ''}" data-act="dvArea" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div><div class="gap-s"></div>` : ''}
    ${shown.length ? shown.map((o) => { const c = o.customer || {}; return `<label class="card row" style="gap:12px;align-items:center;cursor:pointer"><input type="checkbox" data-act="dvTick" data-id="${esc(o.id)}" ${D.sel.has(o.id) ? 'checked' : ''} style="width:22px;height:22px">
      <div class="grow"><b>${esc(c.name || '—')}</b> <span class="mono mut">${esc(o.no)}</span><div class="mut sm">${esc(c.area || '')} · ${esc(c.address || '')}</div><div class="mut sm">${(o.items || []).map((i) => esc(i.name) + ' ×' + i.qty).join(', ')}</div></div>
      <span class="chip ${o.deliveryMsg ? 'ok' : ''}">${o.deliveryMsg ? 'sent' : esc(VIA[c.via] || 'any app')}</span></label>`; }).join('') : '<div class="empty">No order is marked Ready yet.</div>'}
    ${picked.length ? `<div class="h2">3. Send the message (${D.date || D.time ? dmy(D.date) + ' ' + esc(D.time) : 'no time set yet'})</div>
      ${picked.map((o) => `<div class="card"><div class="row between"><b>${esc((o.customer || {}).name || '—')}</b><span class="mut sm">${esc(VIA[(o.customer || {}).via] || '')}</span></div>
        <div class="row" style="margin-top:8px">${viaButtons(o, `data-act="dvSend" data-id="${esc(o.id)}"`)}<a class="btn sm" href="tel:${esc(String((o.customer || {}).phone || '').replace(/[^\d+]/g, ''))}">📞</a></div></div>`).join('')}` : ''}
    ${waiting.length ? `<div class="h2">Waiting for a reply · call these (${waiting.length})</div>
      ${waiting.map((o) => { const c = o.customer || {}; return `<div class="card"><div class="row between"><b>${esc(c.name || '—')}</b><span class="mut sm">sent ${esc(ago(o.deliveryMsg.at))} on ${esc(o.deliveryMsg.via)}${o.deliveryMsg.when ? ' · ' + esc(o.deliveryMsg.when) : ''}</span></div>
        <div class="row" style="margin-top:8px"><a class="btn sm grow" href="tel:${esc(String(c.phone || '').replace(/[^\d+]/g, ''))}">📞 ${esc(c.phone || '')}</a><button class="btn sm ok grow" data-act="dvOk" data-id="${esc(o.id)}">✅ Confirmed</button></div></div>`; }).join('')}` : ''}`);
}

/* --------------------------------------------------------------- orders */
function viewOrders() {
  const F = {
    active: (o) => ['new', 'making', 'ready'].includes(o.status),
    unpaid: (o) => o.payStatus !== 'paid' && o.status !== 'cancelled',
    done: (o) => o.status === 'delivered' || o.status === 'cancelled',
    all: () => true,
  };
  const rows = S.orders.filter(F[S.ofilter]).sort((a, b) => b.createdAt - a.createdAt);
  frame('ORDERS', `<div class="gap"></div><div class="chips">${Object.keys(F).map((k) => `<button class="pill${S.ofilter === k ? ' on' : ''}" data-act="ofilter" data-v="${k}">${k[0].toUpperCase() + k.slice(1)} (${S.orders.filter(F[k]).length})</button>`).join('')}</div><div class="gap"></div>
    ${rows.length ? rows.map((o) => `<button class="card prod" style="padding:14px" data-act="order" data-id="${esc(o.id)}">
      <div class="row between"><b class="mono">${esc(o.no)}</b><span class="chip ${ORDER_CHIP[o.status] || ''}">${esc(ORDER_LBL[o.status] || o.status)}</span></div>
      <div>${esc(o.customer?.name || '—')} · <span class="mono">${eur(o.total)}</span></div>
      <div class="mut sm">${o.items.map((i) => esc(i.name) + ' ×' + i.qty).join(', ')}</div>
      <div class="chips" style="margin-top:6px"><span class="chip ${o.payStatus === 'paid' ? 'ok' : 'warn'}">${o.payStatus === 'paid' ? 'paid' : o.payStatus === 'deposit' ? 'deposit paid · ' + eur(owed(o)) + ' left' : o.payMethod === 'deposit' ? 'waiting for deposit' : o.payMethod === 'online' ? 'waiting for payment' : 'pay at handoff'}</span>${o.tracking ? `<span class="chip blue">📦 ${esc(o.tracking)}</span>` : ''}<span class="chip">${esc(ago(o.createdAt))}</span></div></button>`).join('')
      : '<div class="empty">Nothing here.</div>'}`);
}

// Customers' phones write the prices into the order, so check them against your catalogue before you trust them.
function priceWarning(o) {
  if (o.source === 'manual') return '';
  const probs = [];
  const sum = (o.items || []).reduce((n, i) => n + (+i.price || 0) * (+i.qty || 0), 0) + (+o.fee || 0);
  if (Math.abs(sum - o.total) > 0.011) probs.push(`The total (${eur(o.total)}) does not match the items (${eur(sum)}).`);
  if (!o.requestId) (o.items || []).forEach((i) => {
    const p = S.products.find((x) => x.id === i.id);
    if (p && Math.abs((+p.price || 0) - (+i.price || 0)) > 0.011) probs.push(`${i.name}: ordered at ${eur(i.price)}, but your price is ${eur(p.price)}.`);
  });
  return probs.length ? `<div class="card" style="border-color:var(--bad);margin-top:10px"><b style="color:var(--bad)">⚠ Check this order</b>${probs.map((x) => `<div class="sm">${esc(x)}</div>`).join('')}<div class="sm mut">Do not ship until it looks right. You can cancel it.</div></div>` : '';
}

function openOrder(id, focusMsg) {
  const o = S.orders.find((x) => x.id === id);
  if (!o) return;
  const c = o.customer || {};
  const s = sheet(`
    <div class="hd"><div class="ttl mono">${esc(o.no)}</div><span class="chip ${ORDER_CHIP[o.status] || ''}">${esc(ORDER_LBL[o.status] || o.status)}</span><button class="xbtn" data-close>✕</button></div>
    <div class="card"><b>${esc(c.name || '—')}</b>
      <div class="row" style="margin:6px 0"><a class="btn sm grow" href="tel:${esc(String(c.phone || '').replace(/[^\d+]/g, ''))}">📞 ${esc(c.phone || '')}</a>
      <a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/${waNumber(c.phone)}">💬</a></div>
      ${c.via ? `<div class="mut sm">Wants delivery news on: <b>${esc({ whatsapp: 'WhatsApp', viber: 'Viber', both: 'WhatsApp or Viber' }[c.via] || c.via)}</b></div>` : ''}
      ${c.area ? `<div>📍 ${esc(c.area)}</div>` : ''}
      <div>${o.delivery === 'boxnow' ? '📦 Box Now locker: ' : o.delivery === 'deliver' ? '🚚 Deliver to: ' : '🤝 Meet-up: '}${esc(c.address || '—')}</div>
      ${c.note ? `<div class="mut" style="margin-top:4px">“${esc(c.note)}”</div>` : ''}
      <div class="mut sm" style="margin-top:6px">${esc(fmtDay(o.createdAt))}${o.source === 'manual' ? ' · manual sale' : ''}</div></div>
    ${priceWarning(o)}
    <div class="h2">Items</div>
    <div class="card">${o.items.map((i) => `<div class="row between"><span>${esc(i.name)} × ${i.qty}${i.custom ? `<br><b style="color:var(--acc2)">✍️ ${esc(i.custom)}</b>` : ''}</span><b class="mono">${eur(i.price * i.qty)}</b></div>`).join('')}
      ${o.fee ? `<div class="row between mut"><span>Delivery fee</span><span class="mono">${eur(o.fee)}</span></div>` : ''}
      <div class="sep"></div><div class="row between"><b>Total</b><b class="mono" style="font-size:20px">${eur(o.total)}</b></div></div>
    <div class="h2">Payment</div>
    <div class="card"><div class="row between"><span>${o.payMethod === 'deposit' ? 'Box Now: deposit + rest at locker' : o.payMethod === 'online' ? 'Online prepay' : 'Pay at handoff'}</span><span class="chip ${o.payStatus === 'paid' ? 'ok' : 'warn'}">${o.payStatus === 'paid' ? 'PAID' : o.payStatus === 'deposit' ? 'DEPOSIT PAID' : 'NOT PAID'}</span></div>
      ${o.payMethod === 'deposit' ? `<div class="row between" style="margin-top:6px"><span class="mut">Deposit (card, now)</span><b class="mono">${eur(o.deposit)}</b></div>
        <div class="row between"><span class="mut">Rest (Box Now COD)</span><b class="mono">${eur(o.balance)}</b></div>
        ${o.payStatus !== 'paid' ? `<p class="mut sm" style="margin:8px 0 0">Create the Box Now COD shipment for <b class="mono">${eur(o.balance)}</b>. Ship only after the deposit is in.</p>` : ''}` : ''}
      <div class="gap-s"></div>${o.payStatus === 'paid'
        ? `<div class="mut sm">Paid ${esc(fmtDay(o.paidAt || o.createdAt))}</div><div class="gap-s"></div><button class="btn sm ghost" data-a="unpay">Undo paid</button>`
        : o.payMethod === 'deposit' && o.payStatus === 'unpaid'
          ? `<button class="btn ok block" data-a="paydep">✅ Deposit received (${eur(o.deposit)})</button>`
          : o.payStatus === 'deposit'
            ? `<button class="btn ok block" data-a="pay">✅ Rest received from Box Now (${eur(o.balance)}) · fully paid</button><div class="gap-s"></div><button class="btn sm ghost" data-a="unpay">Undo deposit</button>`
            : '<button class="btn ok block" data-a="pay">✅ Mark as paid</button>'}
      <label class="f"><span>What it cost you to make (${esc(CFG.currency || 'EUR')})</span><div class="row"><input class="in grow" id="oC" inputmode="decimal" value="${esc(o.costTotal ?? 0)}"><button class="btn" data-a="cost">Save</button></div></label></div>
    <div class="h2">Shipping</div>
    <div class="card">
      ${o.delivery === 'boxnow' ? `<p class="mut sm" style="margin:0 0 8px">Create the shipment in Box Now's own system. Tap to copy:</p><div class="chips">${[['Name', c.name], ['Phone', c.phone], ['Area', c.area], ['Address / locker', c.address], ...(o.payMethod === 'deposit' ? [['Rest to collect', String(o.balance)]] : [])].map(([l, v]) => (v ? `<button class="pill" data-a="cp" data-v="${esc(v)}">${l}</button>` : '')).join('')}</div><div class="gap-s"></div>` : ''}
      <label class="f"><span>Tracking number (the customer sees it in “My orders”)</span><div class="row"><input class="in grow" id="oT" maxlength="40" value="${esc(o.tracking || '')}"><button class="btn" data-a="trk">Save</button></div></label>
      ${o.tracking && c.phone ? `<a class="btn sm block" target="_blank" rel="noopener" href="${esc(trackWa(o))}">💬 Send tracking on WhatsApp</a>` : ''}
    </div>
    <div class="h2">Message the customer</div>
    <div class="card" id="msgCard">
      <div class="mut sm" style="margin-bottom:6px">${c.via ? `They prefer: <b>${esc(VIA[c.via] || c.via)}</b>` : 'No app chosen, use any'}${o.deliveryMsg ? ` · last message ${esc(ago(o.deliveryMsg.at))}` : ''}</div>
      <div class="chips"><button class="pill on" data-a="mk" data-v="ready">Ready</button><button class="pill" data-a="mk" data-v="when">Delivery time</button><button class="pill" data-a="mk" data-v="thanks">Thank you</button></div>
      <div id="whenRow" class="two hide" style="margin-top:8px"><label class="f"><span>Date</span><input class="in" type="date" id="mD"></label><label class="f"><span>Time</span><input class="in" type="time" id="mH"></label></div>
      <textarea class="in" id="mT" rows="5" style="margin-top:8px">${esc(msgText(o, 'ready'))}</textarea>
      <div class="row" style="margin-top:8px">${viaButtons(o, 'data-a="msg"')}<a class="btn sm" href="tel:${esc(String(c.phone || '').replace(/[^\d+]/g, ''))}">📞</a></div>
    </div>
    <div class="h2">Status</div>
    <div class="chips">${['new', 'making', 'ready', 'delivered'].map((k) => `<button class="pill${o.status === k ? ' on' : ''}" data-a="st" data-v="${k}">${ORDER_LBL[k]}</button>`).join('')}</div>
    <div class="gap-s"></div>${o.source === 'manual' ? '' : '<button class="btn sm ghost block" data-a="blk">🚫 Block this customer (phone + device)</button>'}
    <div class="gap"></div><div class="row"><button class="btn bad grow" data-a="cancel">Cancel order</button><button class="btn ghost" data-a="rm">🗑</button></div>`);
  if (focusMsg) setTimeout(() => { const m = $('#msgCard', s.el); if (m) m.scrollIntoView({ block: 'center' }); }, 120);
  let mkKind = 'ready';
  s.el.addEventListener('change', (e) => { if (e.target.id === 'mD' || e.target.id === 'mH') $('#mT', s.el).value = msgText(o, 'when', $('#mD', s.el).value, $('#mH', s.el).value); });
  s.el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const a = b.dataset.a;
    try {
      if (a === 'paydep') await B.set('orders', id, { payStatus: 'deposit', paidAmount: o.deposit, depositAt: Date.now() });
      if (a === 'pay') await B.set('orders', id, { payStatus: 'paid', paidAt: Date.now(), paidAmount: o.total });
      if (a === 'unpay') await B.set('orders', id, { payStatus: 'unpaid', paidAt: null, paidAmount: null });
      if (a === 'cost') { await B.set('orders', id, { costTotal: num($('#oC', s.el).value) }); toast('Saved'); return; }
      if (a === 'mk') {
        $$('[data-a=mk]', s.el).forEach((x) => x.classList.toggle('on', x === b));
        $('#whenRow', s.el).classList.toggle('hide', b.dataset.v !== 'when');
        $('#mT', s.el).value = msgText(o, b.dataset.v, $('#mD', s.el).value, $('#mH', s.el).value); mkKind = b.dataset.v; return;
      }
      if (a === 'msg') { const when = [dmy($('#mD', s.el).value), $('#mH', s.el).value].filter(Boolean).join(' '); await sendVia(o, b.dataset.app, $('#mT', s.el).value, when, mkKind === 'when'); return; }
      if (a === 'cp') { await copy(b.dataset.v); toast('Copied: ' + b.dataset.v); return; }
      if (a === 'trk') { await B.set('orders', id, { tracking: $('#oT', s.el).value.trim().slice(0, 40) }); toast('Tracking saved'); return; }
      if (a === 'blk') { if (!confirm('Block this customer? They will not be able to send orders, requests or messages.')) return; const n = await blockSender({ uid: o.uid, phone: c.phone, label: c.name }); toast(n ? 'Blocked ✓' : 'Nothing to block'); return; }
      if (a === 'st') {
        const v = b.dataset.v;
        const extra = {};
        if (v === 'delivered' && o.payStatus !== 'paid' && confirm(o.payStatus === 'deposit' ? 'Delivered. Did Box Now pay you the rest? Tap OK to mark as fully paid.' : 'Delivered. Did the customer pay you? Tap OK to mark as paid.')) Object.assign(extra, { payStatus: 'paid', paidAt: Date.now(), paidAmount: o.total });
        await B.set('orders', id, { status: v, ...extra });
      }
      if (a === 'cancel') { if (!confirm('Cancel this order?')) return; await B.set('orders', id, { status: 'cancelled' }); }
      if (a === 'rm') { if (!confirm('Delete this order record for good?')) return; await B.del('orders', id); }
      s.close();
      // Just marked Ready: come straight back to the order with the message waiting, one tap to send.
      if (a === 'st' && b.dataset.v === 'ready') { toast('Marked Ready ✓ Now send them the message', 3500); setTimeout(() => openOrder(id, true), 350); }
    } catch (err) { console.error(err); toast('Failed: ' + (err.code || err.message)); }
  });
}

/* ---------------------------------------------------------------- money */
function moneyStats() {
  const paid = S.orders.filter(isPaid);
  const paidSum = paid.reduce((n, o) => n + (o.paidAmount ?? o.total), 0);
  const deposits = S.orders.filter(isDep).reduce((n, o) => n + (o.paidAmount || 0), 0);
  const costs = paid.reduce((n, o) => n + (o.costTotal || 0), 0);
  const waiting = S.orders.filter((o) => o.status !== 'cancelled').reduce((n, o) => n + owed(o), 0);
  return { paid, received: paidSum + deposits, costs, profit: paidSum - costs, waiting };
}

function viewMoney() {
  const m = moneyStats();
  const months = [];
  const d = new Date();
  for (let i = 5; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    months.push({ key: monthKey(x), label: x.toLocaleDateString('en-GB', { month: 'short' }), rev: 0, profit: 0 });
  }
  m.paid.forEach((o) => {
    const mm = months.find((q) => q.key === monthKey(o.paidAt || o.createdAt));
    if (mm) { mm.rev += o.paidAmount ?? o.total; mm.profit += (o.paidAmount ?? o.total) - (o.costTotal || 0); }
  });
  const max = Math.max(1, ...months.map((q) => q.rev));
  const byProd = {};
  m.paid.forEach((o) => o.items.forEach((i) => { const k = i.name; byProd[k] = byProd[k] || { n: 0, rev: 0 }; byProd[k].n += i.qty; byProd[k].rev += i.price * i.qty; }));
  const top = Object.entries(byProd).sort((a, b) => b[1].rev - a[1].rev).slice(0, 5);
  const cur = months[months.length - 1];
  frame('MONEY', `<div class="gap"></div>
    <div class="stats">
      <div class="stat"><div class="l">Received</div><div class="v">${eur(m.received)}</div></div>
      <div class="stat"><div class="l">Profit</div><div class="v" style="color:var(--ok)">${eur(m.profit)}</div></div>
      <div class="stat"><div class="l">Costs</div><div class="v">${eur(m.costs)}</div></div>
      <div class="stat"><div class="l">Still to collect</div><div class="v" style="color:var(--warn)">${eur(m.waiting)}</div></div>
    </div>
    <div class="h2">Last 6 months · sales</div>
    <div class="card"><div class="bars">${months.map((q) => `<div class="b"><small>${q.rev ? Math.round(q.rev) : ''}</small><i style="height:${Math.max(2, (q.rev / max) * 90)}%"></i><small>${esc(q.label)}</small></div>`).join('')}</div>
      <div class="mut sm" style="margin-top:8px">This month: ${eur(cur.rev)} sales · ${eur(cur.profit)} profit</div></div>
    <div class="h2">Best sellers</div>
    ${top.length ? `<div class="card">${top.map(([k, v]) => `<div class="row between"><span>${esc(k)} <span class="mut sm">×${v.n}</span></span><b class="mono">${eur(v.rev)}</b></div>`).join('<div class="sep" style="margin:8px 0"></div>')}</div>` : '<div class="empty">No paid orders yet.</div>'}
    <div class="gap"></div><button class="btn pri block" data-act="manual">＋ Add a sale I made myself</button>
    <div class="gap-s"></div><button class="btn block" data-act="csv">⬇ Download sales (CSV for your accountant)</button>
    <p class="mut sm">Profit counts only orders marked as paid. Set “cost to make” on each product and it is filled in automatically.</p>`);
}

function openManualSale() {
  const s = sheet(`<div class="hd"><div class="ttl">Add a sale</div><button class="xbtn" data-close>✕</button></div>
    <label class="f"><span>What did you sell?</span><input class="in" id="mI"></label>
    <div class="two"><label class="f"><span>Price</span><input class="in" id="mP" inputmode="decimal"></label><label class="f"><span>Cost to make</span><input class="in" id="mC" inputmode="decimal"></label></div>
    <label class="f"><span>Customer (optional)</span><input class="in" id="mN"></label>
    <label class="check"><input type="checkbox" id="mPd" checked><span>Already paid</span></label>
    <div class="gap"></div><button class="btn pri block" data-a="go">Add sale</button>`);
  s.el.addEventListener('click', async (e) => {
    if (!e.target.closest('[data-a=go]')) return;
    const name = $('#mI', s.el).value.trim();
    const price = num($('#mP', s.el).value);
    if (!name || !price) return toast('Add what you sold and the price');
    const paid = $('#mPd', s.el).checked;
    const now = Date.now();
    await B.add('orders', { uid: B.uid(), no: 'GB-M' + Math.random().toString(36).slice(2, 5).toUpperCase(), items: [{ id: null, name, price, cost: num($('#mC', s.el).value), qty: 1, color: '', image: '' }], total: price, costTotal: num($('#mC', s.el).value), customer: { name: $('#mN', s.el).value.trim(), phone: '', address: '', note: '' }, delivery: 'meetup', payMethod: 'handoff', payStatus: paid ? 'paid' : 'unpaid', paidAt: paid ? now : null, paidAmount: paid ? price : null, status: 'delivered', requestId: null, source: 'manual', createdAt: now });
    s.close(); toast('Sale added');
  });
}

function downloadCsv() {
  const q = (v) => '"' + String(v ?? '').replaceAll('"', '""') + '"';
  const rows = [['Date', 'Order', 'Customer', 'Items', 'Total', 'Cost', 'Paid', 'Status', 'Payment method']];
  [...S.orders].sort((a, b) => a.createdAt - b.createdAt).forEach((o) => rows.push([new Date(o.createdAt).toISOString().slice(0, 10), o.no, o.customer?.name || '', o.items.map((i) => `${i.name} x${i.qty}`).join('; '), o.total, o.costTotal || 0, o.payStatus, o.status, o.payMethod]));
  const blob = new Blob(['﻿' + rows.map((r) => r.map(q).join(',')).join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gewy-builds-sales.csv';
  a.click();
}

/* ------------------------------------------------------------- audience */
const dayKey = (ts) => { const d = new Date(ts); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
function viewAudience() {
  const D = S.devices;
  const now = Date.now(), DAY = 86400000;
  const total = D.length;
  const A = S.accounts;
  const accIds = new Set(A.map((a) => a.id));
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const T0 = t0.getTime();
  const aNow = A.filter((a) => now - (a.lastSeen || 0) < 5 * 60000).length;
  const aToday = A.filter((a) => (a.createdAt || 0) >= T0).length;
  const aWeek = A.filter((a) => now - (a.createdAt || 0) < 7 * DAY).length;
  const aActiveToday = A.filter((a) => (a.lastSeen || 0) >= T0).length;
  const G = D.filter((d) => !accIds.has(d.id));
  const gToday = G.filter((d) => (d.lastSeen || 0) >= T0).length;
  const gHour = G.filter((d) => now - (d.lastSeen || 0) < 3600000).length;
  const gWeek = G.filter((d) => now - (d.lastSeen || 0) < 7 * DAY).length;
  const gOpens = G.reduce((n, d) => n + (d.visits || 0), 0);
  const byArea = {};
  G.forEach((d) => { const k = d.area || 'not chosen yet'; byArea[k] = (byArea[k] || 0) + 1; });
  const areaRows = Object.entries(byArea).sort((x, y) => y[1] - x[1]).slice(0, 8).map(([k, v]) => `<div class="row between" style="margin:6px 0"><span>📍 ${esc(k)}</span><b class="mono">~${v}</b></div>`).join('');
  const installed = D.filter((d) => d.installed).length;
  const newWeek = D.filter((d) => now - d.firstSeen < 7 * DAY).length;
  const active = D.filter((d) => now - d.lastSeen < 7 * DAY).length;
  const back = D.filter((d) => (d.visits || 0) > 1).length;
  const pct = (n) => (total ? Math.round((n / total) * 100) + '%' : '0%');
  const plat = { android: 0, ios: 0, desktop: 0 };
  D.forEach((d) => { plat[d.platform] = (plat[d.platform] || 0) + 1; });
  const days = [];
  for (let i = 13; i >= 0; i--) { const t0 = new Date(now - i * DAY); days.push({ key: dayKey(t0), label: String(t0.getDate()), n: 0, inst: 0 }); }
  D.forEach((d) => {
    const x = days.find((q) => q.key === dayKey(d.firstSeen)); if (x) x.n++;
    if (d.installedAt) { const y = days.find((q) => q.key === dayKey(d.installedAt)); if (y) y.inst++; }
  });
  const SRC_LBL = { tiktok: '🎵 TikTok', instagram: '📸 Instagram', facebook: '👍 Facebook', friends: '🧑‍🤝‍🧑 Friends', other: '✨ Other', unknown: '❔ Not answered' };
  const bySrc = {};
  D.forEach((d) => { const k = d.src || 'unknown'; bySrc[k] = bySrc[k] || { n: 0, ord: 0 }; bySrc[k].n++; if ((d.stage || 0) >= 4) bySrc[k].ord++; });
  const byLink = {};
  D.forEach((d) => { if (d.link) { byLink[d.link] = byLink[d.link] || { n: 0, ord: 0 }; byLink[d.link].n++; if ((d.stage || 0) >= 4) byLink[d.link].ord++; } });
  const steps = [['Visited the shop', 0], ['Looked at a product', 1], ['Added to cart', 2], ['Opened checkout', 3], ['Ordered or sent a request', 4]].map(([l, n]) => ({ l, n: D.filter((d) => (d.stage || 0) >= n).length }));
  const rowsOf = (o, lbl) => Object.entries(o).sort((x, y) => y[1].n - x[1].n).map(([k, v]) => `<div class="row between" style="margin:6px 0"><span>${esc(lbl(k))}</span><b class="mono">${v.n} <span class="mut sm">· ${v.ord} ordered</span></b></div>`).join('');
  const max = Math.max(1, ...days.map((q) => q.n));
  frame('AUDIENCE', `<div class="gap"></div>
    <div class="h2" style="margin-top:0">👤 Logged-in accounts · exact numbers</div>
    <div class="stats">
      <div class="stat"><div class="l">Accounts</div><div class="v">${A.length}</div></div>
      <div class="stat"><div class="l">Active now</div><div class="v" style="color:var(--ok)">${aNow}</div><div class="mut sm">last 5 minutes</div></div>
      <div class="stat"><div class="l">Joined today</div><div class="v">${aToday}</div></div>
      <div class="stat"><div class="l">Joined this week</div><div class="v">${aWeek}</div></div>
    </div>
    <div class="mut sm" style="margin-top:6px">Active today: ${aActiveToday}. Accounts are counted once each, on any phone.</div>
    <div class="h2">🕶 Visitors without an account · rough numbers</div>
    <div class="stats">
      <div class="stat"><div class="l">Opened today</div><div class="v">~${gToday}</div></div>
      <div class="stat"><div class="l">Opened last hour</div><div class="v">~${gHour}</div></div>
      <div class="stat"><div class="l">Opened this week</div><div class="v">~${gWeek}</div></div>
      <div class="stat"><div class="l">Times opened, ever</div><div class="v">~${gOpens}</div></div>
    </div>
    <div class="card" style="margin-top:10px"><div class="mut sm" style="margin-bottom:4px">Where they are (the delivery area they picked)</div>${areaRows || '<span class="mut">No areas yet.</span>'}</div>
    <p class="mut sm">Guests are counted by phone or browser, so these are estimates: one person with two phones counts twice, and clearing the browser makes a new guest.</p>
    <div class="h2">Everyone together</div>
    <div class="stats">
      <div class="stat"><div class="l">People</div><div class="v">${total}</div></div>
      <div class="stat"><div class="l">Installed</div><div class="v" style="color:var(--ok)">${installed}</div><div class="mut sm">${pct(installed)} of people</div></div>
      <div class="stat"><div class="l">New this week</div><div class="v">${newWeek}</div></div>
      <div class="stat"><div class="l">Active this week</div><div class="v">${active}</div></div>
    </div>
    <div class="h2">New people per day · last 14 days</div>
    <div class="card"><div class="bars">${days.map((q) => `<div class="b"><small>${q.n || ''}</small><i style="height:${Math.max(2, (q.n / max) * 90)}%"></i><small>${esc(q.label)}</small></div>`).join('')}</div>
      <div class="mut sm" style="margin-top:8px">Installs in the last 14 days: ${days.reduce((n, q) => n + q.inst, 0)}</div></div>
    <div class="h2">Phones</div>
    <div class="card"><div class="row between"><span>Android</span><b class="mono">${plat.android || 0}</b></div><div class="sep" style="margin:8px 0"></div>
      <div class="row between"><span>iPhone</span><b class="mono">${plat.ios || 0}</b></div><div class="sep" style="margin:8px 0"></div>
      <div class="row between"><span>Computer</span><b class="mono">${plat.desktop || 0}</b></div></div>
    <div class="h2">Where people come from</div>
    <div class="card">${Object.keys(bySrc).length ? rowsOf(bySrc, (k) => SRC_LBL[k] || k) : '<span class="mut">Nobody yet.</span>'}
      <p class="mut sm" style="margin:8px 0 0">From the "How did you find us?" question in the welcome screen.</p></div>
    <div class="h2">Your tagged links</div>
    <div class="card">${Object.keys(byLink).length ? rowsOf(byLink, (k) => '?src=' + k) : '<span class="mut">No tagged links used yet.</span>'}
      <div class="gap-s"></div><label class="f"><span>Make a link for one video or post (letters and numbers only)</span><div class="row"><input class="in grow" id="lkTag" maxlength="30" placeholder="tiktok-video1"><button class="btn" data-act="copyTagged">Copy link</button></div></label>
      <p class="mut sm" style="margin:0">Use a different tag in each TikTok bio, video or post. This list then shows which one brings people and orders.</p></div>
    <div class="h2">From visit to order</div>
    <div class="card">${steps.map((x) => `<div style="margin:8px 0"><div class="row between"><span>${esc(x.l)}</span><b class="mono">${x.n}${total ? ' · ' + Math.round((x.n / total) * 100) + '%' : ''}</b></div><div style="height:8px;border-radius:4px;background:var(--bg3);margin-top:4px;overflow:hidden"><i style="display:block;height:100%;width:${total ? Math.max(2, (x.n / total) * 100) : 0}%;background:linear-gradient(90deg,var(--acc),var(--acc2));border-radius:4px"></i></div></div>`).join('')}</div>
    <div class="h2">Loyalty</div>
    <div class="card"><div class="row between"><span>Came back at least once</span><b class="mono">${back} · ${pct(back)}</b></div></div>
    <p class="mut sm">A "person" is one phone or browser, so someone with two devices counts twice. "Installed" means they added it with the install button or opened it from the home screen icon, so iPhones are counted too. Your own test phones are included: use the button below to reset the counts before you launch.</p>
    <div class="gap-s"></div><button class="btn bad block" data-act="resetAudience">Reset all counts</button>`);
}

/* --------------------------------------------------------------- notify */
function viewNotify() {
  const subs = S.subs.filter((x) => x.role === 'shop').length;
  frame('NOTIFY', `<div class="gap"></div>
    <div class="card"><div class="h2" style="margin-top:0">Reach</div>${B.mode === 'demo'
      ? '<div>Demo mode: alerts show up in the shop app on this device.</div>'
      : `<div><b class="mono" style="font-size:24px">${subs}</b> phones will get your alert</div>`}</div>
    <div class="h2">Send an alert to all customers</div>
    <label class="f"><span>Title</span><input class="in" id="nT" placeholder="🔥 New print just dropped"></label>
    <label class="f"><span>Message</span><textarea class="in" id="nB" placeholder="Limited stock — grab yours"></textarea></label>
    <label class="f"><span>About a product (optional)</span><select class="in" id="nP"><option value="">—</option>${S.products.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select></label>
    <div class="gap"></div><button class="btn pri block" data-act="sendNotify">Send alert</button>
    <p class="mut sm">Tip: new products notify automatically when you publish them. Use this for sales, restocks or news. Do not overdo it, one or two alerts a week keeps people happy.</p>`);
}

/* ------------------------------------------------------------- settings */
function viewSettings() {
  const st = S.settings;
  frame('SETTINGS', `<div class="gap"></div>
    <div class="h2" style="margin-top:0">Shop info</div>
    <label class="f"><span>Shop name</span><input class="in" id="sN" value="${esc(st.shopName || '')}" placeholder="${esc(CFG.shopName || 'GEWY BUILDS')}"></label>
    <label class="f"><span>Short intro (shown on the shop home)</span><textarea class="in" id="sA">${esc(st.about || '')}</textarea></label>
    <label class="f"><span>Your phone / WhatsApp (with country code, e.g. 3069…)</span><input class="in" id="sPh" inputmode="tel" value="${esc(st.phone || '')}" placeholder="${esc(CFG.contactPhone || '')}"></label>
    <div class="h2">Messages to customers (same text every time)</div>
    <p class="mut sm" style="margin:0 0 8px">These fill in by themselves: {name} {order} {date} {time} {items} {total}. Leave a box empty to use the standard text.</p>
    <label class="f"><span>"Ready" message</span><textarea class="in" id="sMR" rows="4" placeholder="${esc(TPL.ready)}">${esc((st.msgTpl || {}).ready || '')}</textarea></label>
    <label class="f"><span>"Delivery time" message</span><textarea class="in" id="sMW" rows="4" placeholder="${esc(TPL.when)}">${esc((st.msgTpl || {}).when || '')}</textarea></label>
    <label class="f"><span>"Thank you" message</span><textarea class="in" id="sMT" rows="4" placeholder="${esc(TPL.thanks)}">${esc((st.msgTpl || {}).thanks || '')}</textarea></label>
    <label class="f"><span>About page: your story (shown in the shop's About tab)</span><textarea class="in" id="sAS" rows="5" placeholder="Who you are, why you make these, how it works…">${esc(st.aboutStory || '')}</textarea></label>
    <div class="h2">Business details (shown in Terms and Privacy)</div>
    <label class="f"><span>Business or your full name</span><input class="in" id="sBN" value="${esc(st.businessName || '')}"></label>
    <label class="f"><span>Tax ID (AFM), if you have one</span><input class="in" id="sTX" inputmode="numeric" value="${esc(st.taxId || '')}"></label>
    <label class="f"><span>Contact email</span><input class="in" id="sEM" type="email" value="${esc(st.contactEmail || '')}" placeholder="${esc(CFG.contactEmail || '')}"></label>
    <p class="mut sm">The Terms and Privacy pages are a plain-language template. Have an accountant or lawyer read them before you launch.</p>
    <div class="h2">How customers can pay</div>
    <label class="check"><input type="checkbox" id="sH" ${st.payHandoff !== false ? 'checked' : ''}><span><b>Pay at handoff</b><br><span class="mut sm">No payment in the app. They pay you when they receive it.</span></span></label>
    <label class="f"><span>Handoff note (optional)</span><input class="in" id="sHN" value="${esc(st.handoffNote || '')}" placeholder="Cash or Revolut at the door"></label>
    <label class="check"><input type="checkbox" id="sO" ${st.payOnline !== false ? 'checked' : ''}><span><b>Pay online now</b><br><span class="mut sm">Customer is sent to a hosted payment page (PayPal, Revolut, Stripe, Viva…). Needs a payment link below.</span></span></label>
    <label class="f"><span>Payment link</span><input class="in" id="sL" inputmode="url" value="${esc(st.payLink || '')}" placeholder="https://www.paypal.me/yourname/{amount}EUR"></label>
    <div class="chips" style="margin-top:8px"><button class="pill" data-act="presetPaypal">PayPal.me</button><button class="pill" data-act="presetRevolut">Revolut</button><button class="pill" data-act="presetOther">Stripe / Viva / other</button></div>
    <label class="f"><span>Label shown to customers</span><input class="in" id="sLb" value="${esc(st.payLabel || '')}" placeholder="Card / PayPal / Revolut"></label>
    <p class="mut sm">In the link, <span class="mono">{amount}</span> becomes the order total (e.g. 12.50), <span class="mono">{order}</span> the order number. PayPal.me links with {amount} open with the amount filled in. A plain Revolut or Stripe link works too: the app shows the customer the exact amount and order number to use. These pages do not tell the app when someone paid, so you mark orders as paid yourself.</p>
    <div class="h2">Where you deliver</div>
    <label class="f"><span>Areas for hand-off / my own delivery (one per line)</span><textarea class="in" id="sHA" rows="3">${esc(parseAreas(st.handoffAreas, HANDOFF_DEF).join('\n'))}</textarea></label>
    <label class="f"><span>Areas for Box Now / ACS courier (one per line, Greece only)</span><textarea class="in" id="sCA" rows="8">${esc(parseAreas(st.courierAreas, COURIER_DEF).join('\n'))}</textarea></label>
    <p class="mut sm">Customers must pick one of these before they can order or send a request. Places not on the list (other countries, far areas) simply cannot be chosen.</p>
    <div class="h2">Box Now delivery</div>
    <label class="check"><input type="checkbox" id="sB" ${st.boxnow ? 'checked' : ''}><span><b>Offer Box Now locker delivery</b><br><span class="mut sm">Customer pays a deposit online now (needs the payment link above). The rest is collected by Box Now COD when the parcel is in the locker.</span></span></label>
    <label class="f"><span>Deposit is</span><select class="in" id="sDM"><option value="cost"${st.depositMode !== 'percent' ? ' selected' : ''}>What it cost you to make (from each product's cost)</option><option value="percent"${st.depositMode === 'percent' ? ' selected' : ''}>A percentage of the price</option></select></label>
    <label class="f"><span>Percentage (used for "percentage", and for products with no cost set)</span><input class="in" id="sDP" inputmode="numeric" value="${esc(st.depositPct || 30)}"></label>
    <label class="f"><span>Delivery fee added to the order (${esc(CFG.currency || 'EUR')}, 0 = none)</span><input class="in" id="sBF" inputmode="decimal" value="${esc(st.boxFee || 0)}"></label>
    <div class="h2">Parcel tracking link (optional)</div>
    <label class="f"><span>Link where customers follow a parcel. Put {id} where the tracking number goes. Empty = they go to Box Now's website.</span><input class="in" id="sTU" inputmode="url" value="${esc(st.trackUrl || '')}" placeholder="https://…{id}"></label>
    <div class="gap"></div><button class="btn pri block" data-act="saveSettings">Save settings</button>
    <div class="h2">Blocked senders</div>
    <div class="card" id="blkList">${blockedHtml()}</div>
    <p class="mut sm">Block someone from an order or a request. A blocked phone number or device cannot send orders, requests or messages. They can still browse.</p>
    <div class="h2">Backup</div>
    <button class="btn block" data-act="bkOrders">⬇ Orders (spreadsheet)</button><div class="gap-s"></div>
    <button class="btn block" data-act="bkCust">⬇ Customers (spreadsheet)</button><div class="gap-s"></div>
    <button class="btn block" data-act="bkAll">⬇ Everything (full backup file)</button>
    <p class="mut sm">Do this now and then, so you always have your own copy. The full file holds products, orders, requests, chats, settings and counts (photos too, so it can be big).</p>
    <div class="h2">This phone</div>
    ${B.pushAvailable ? `<button class="btn block" data-act="pushAdmin">${B.pushEnabled('admin') ? '🔔 Alerts are on' : '🔔 Turn on alerts for new orders & messages'}</button><div class="gap-s"></div>` : ''}<button class="btn block" data-act="copyShop">🔗 Copy customer shop link</button>
    <div class="gap-s"></div><button class="btn bad block" data-act="logout">Sign out</button>
    ${B.mode === 'demo' ? `<div class="gap-s"></div><button class="btn ghost block sm" data-act="wipe">Reset demo data</button>` : ''}`);
}

/* --------------------------------------------------------------- events */
document.addEventListener('change', (e) => {
  if (e.target.id === 'dvD') S.dv.date = e.target.value;
  if (e.target.id === 'dvT') S.dv.time = e.target.value;
});
document.addEventListener('click', async (e) => {
  const z = e.target.closest('img[data-zoom]');
  if (z) { sheet(`<img src="${esc(z.src)}" alt="" style="width:100%;border-radius:14px"><div class="gap-s"></div><button class="btn block" data-close>✕</button>`); return; }
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const a = b.dataset.act;
  try {
    if (a === 'loginG') {
      b.disabled = true;
      try { await B.adminLoginGoogle(); }
      catch (err) {
        console.error(err);
        const c = (err && err.code) || '';
        toast(c === 'auth/popup-blocked' ? 'Your browser blocked the Google window. Allow pop-ups for this page and try again.' : c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request' ? 'Sign-in cancelled.' : c === 'auth/unauthorized-domain' ? 'Add gewybuilds.github.io to Firebase > Authentication > Settings > Authorized domains.' : c === 'auth/operation-not-allowed' ? 'Turn on Google in Firebase > Authentication > Sign-in method.' : 'Google sign-in failed (' + (c || 'unknown') + ').', 6000);
        b.disabled = false;
      }
    }
    if (a === 'login') {
      b.disabled = true;
      try { await B.adminLogin($('#lE').value.trim(), $('#lP').value); }
      catch (err) { toast('Sign-in failed. Check email and password.'); b.disabled = false; }
    }
    if (a === 'home') { S.view = 'home'; render(); }
    if (a === 'go') { S.view = b.dataset.v; render(); scrollTo(0, 0); }
    if (a === 'editProd') openProductEditor(b.dataset.id);
    if (a === 'filEdit') openFilament(b.dataset.id);
    if (a === 'filOn' || a === 'filLow') {
      const list = filamentsOf(S.settings).map((f) => ({ ...f }));
      const f = list.find((x) => x.id === b.dataset.id); if (!f) return;
      if (a === 'filOn') { f.on = f.on === false; if (f.on) f.low = false; } else f.low = !f.low;
      await saveFilaments(list); toast(a === 'filOn' ? (f.on ? f.name + ' is back in stock ✓' : f.name + ' is OFF · its products show as sold out') : 'Saved');
    }
    if (a === 'seed') await seedDemo();
    if (a === 'thread') openThread(b.dataset.id);
    if (a === 'delreq') {
      if (!confirm('Delete this request and its whole chat for good?')) return;
      await deleteRequest(b.dataset.id); toast('Deleted');
    }
    if (a === 'order') openOrder(b.dataset.id);
    if (a === 'ofilter') { S.ofilter = b.dataset.v; render(); }
    if (a === 'dvArea') { S.dv.area = b.dataset.v; render(); }
    if (a === 'dvTick') { b.checked ? S.dv.sel.add(b.dataset.id) : S.dv.sel.delete(b.dataset.id); render(); return; }
    if (a === 'dvSend') {
      const o = S.orders.find((x) => x.id === b.dataset.id); if (!o) return;
      if (!S.dv.date) return toast('Pick the date first (step 1)', 3500);
      await sendVia(o, b.dataset.app, msgText(o, 'when', S.dv.date, S.dv.time), [dmy(S.dv.date), S.dv.time].filter(Boolean).join(' '));
    }
    if (a === 'dvOk') { const o = S.orders.find((x) => x.id === b.dataset.id); if (o) await B.set('orders', o.id, { deliveryMsg: { ...o.deliveryMsg, confirmed: true } }); }
    if (a === 'manual') openManualSale();
    if (a === 'csv') downloadCsv();
    if (a === 'logout') await B.adminLogout();
    if (a === 'wipe') { if (confirm('Delete ALL demo data in this browser?')) { Object.keys(localStorage).filter((k) => k.startsWith('gewy:')).forEach((k) => localStorage.removeItem(k)); location.reload(); } }
    if (a === 'resetAudience') {
      if (!confirm('Reset all audience counts to zero? Orders and products are not affected.')) return;
      for (const d of [...S.devices]) await B.del('devices', d.id);
      toast('Counts reset');
    }
    if (a === 'openShop') window.open(new URL('./', location.href).href, '_blank');
    if (a === 'theme') { setTheme(getTheme() === 'light' ? 'dark' : 'light'); b.textContent = themeIcon(); }
    if (a === 'copyTagged') {
      const tag = ($('#lkTag').value || '').replace(/[^a-z0-9_-]/gi, '').slice(0, 30);
      if (!tag) return toast('Type a short tag first, for example tiktok-video1');
      await copy(new URL('./', location.href).href + '?src=' + tag); toast('Link copied: ?src=' + tag, 4000);
    }
    if (a === 'copyShop') { await copy(new URL('./', location.href).href); toast('Shop link copied'); }
    if (a === 'pushAdmin') {
      const r = await B.enablePush('admin');
      toast(r.ok ? '🔔 Alerts on' : r.reason === 'denied' ? 'Alerts are blocked in your phone settings' : r.reason === 'no-vapid' ? 'Add your vapidKey to config.js first' : 'Alerts are not available here. On iPhone: Share > Add to Home Screen, then open from there.', 5000);
      render();
    }
    if (a === 'presetPaypal') {
      const u = prompt('Your PayPal.me name (the part after paypal.me/)');
      if (u) { $('#sL').value = `https://www.paypal.me/${u.trim().replace(/^.*paypal\.me\//i, '')}/{amount}${CFG.currency || 'EUR'}`; if (!$('#sLb').value) $('#sLb').value = 'PayPal'; }
    }
    if (a === 'presetRevolut') {
      const u = prompt('Your revolut.me name (the part after revolut.me/)');
      if (u) { $('#sL').value = `https://revolut.me/${u.trim().replace(/^.*revolut\.me\//i, '')}`; if (!$('#sLb').value) $('#sLb').value = 'Revolut'; }
    }
    if (a === 'presetOther') {
      const u = prompt('Paste your payment link (Stripe Payment Link, Viva, etc.). You can use {amount} and {order} in it.');
      if (u) $('#sL').value = u.trim();
    }
    if (a === 'saveSettings') {
      const link = $('#sL').value.trim();
      if (link && !/^https:\/\//i.test(link)) return toast('The payment link must start with https://');
      const trk = $('#sTU').value.trim();
      if (trk && !/^https:\/\//i.test(trk)) return toast('The tracking link must start with https://');
      await B.set('settings', 'shop', {
        shopName: $('#sN').value.trim(), about: $('#sA').value.trim(), phone: $('#sPh').value.trim(),
        aboutStory: $('#sAS').value.trim(), trackUrl: trk,
        msgTpl: { ready: $('#sMR').value.trim().slice(0, 600), when: $('#sMW').value.trim().slice(0, 600), thanks: $('#sMT').value.trim().slice(0, 600) },
        businessName: $('#sBN').value.trim(), taxId: $('#sTX').value.trim(), contactEmail: $('#sEM').value.trim(),
        payHandoff: $('#sH').checked, handoffNote: $('#sHN').value.trim(), payOnline: $('#sO').checked,
        payLink: link, payLabel: $('#sLb').value.trim(),
        handoffAreas: $('#sHA').value.split('\n').map((x) => x.trim()).filter(Boolean).join('\n'), courierAreas: $('#sCA').value.split('\n').map((x) => x.trim()).filter(Boolean).join('\n'),
        boxnow: $('#sB').checked, depositMode: $('#sDM').value, depositPct: Math.min(100, Math.max(5, num($('#sDP').value) || 30)), boxFee: Math.max(0, num($('#sBF').value) || 0),
        updatedAt: Date.now(),
      });
      toast('Settings saved ✓');
    }
    if (a === 'unblock') { await B.del('blocks', b.dataset.id); toast('Unblocked'); }
    if (a === 'bkOrders') backupOrders();
    if (a === 'bkCust') backupCustomers();
    if (a === 'bkAll') { b.disabled = true; try { await backupAll(); toast('Backup downloaded'); } finally { b.disabled = false; } }
    if (a === 'verifyAdmin') { await B.adminSendVerification(); toast('Check your inbox and tap the link, then reopen this app', 6000); }
    if (a === 'sendNotify') {
      const title = $('#nT').value.trim();
      if (!title) return toast('Add a title');
      const pid = $('#nP').value;
      b.disabled = true;
      await B.add('broadcasts', { title, body: $('#nB').value.trim(), productId: pid || '', at: Date.now() });
      toast('Alert sent 🔔'); $('#nT').value = ''; $('#nB').value = ''; b.disabled = false;
    }
  } catch (err) { console.error(err); toast('Error: ' + (err.code || err.message)); }
});
globalThis.addEventListener('gewy:push', (e) => toast('🔔 ' + [e.detail.title, e.detail.body].filter(Boolean).join(' — '), 6000));
// Re-draw the current screen after a sheet closes, so it shows anything that changed meanwhile.
document.addEventListener('gewy:sheetclosed', () => { if (S.user && !document.querySelector('.sheet-back') && S.view !== 'settings' && S.view !== 'notify') render(); });

/* ----------------------------------------------------------------- data */
function startData() {
  stopData();
  const known = { orders: null, requests: null };
  S.stops.push(B.watch('products', (r) => { S.products = r; refresh(['home', 'products']); }));
  S.stops.push(B.watch('devices', (r) => { S.devices = r; refresh(['home', 'audience']); }));
  S.stops.push(B.watch('accounts', (r) => { S.accounts = r; refresh(['home', 'audience']); }));
  S.stops.push(B.watch('blocks', (r) => { S.blocks = r; drawBlocks(); }));
  S.stops.push(B.watchDoc('settings', 'shop', (d) => { S.settings = d || {}; refresh(['home', 'filaments', 'products']); }));
  S.stops.push(B.watch('orders', (r) => {
    if (known.orders) r.filter((o) => !known.orders.has(o.id) && o.source !== 'manual').forEach((o) => toast(`📦 New order ${o.no} · ${eur(o.total)}`, 6000));
    known.orders = new Set(r.map((o) => o.id));
    S.orders = r; refresh(['home', 'orders', 'money', 'delivery']);
  }));
  S.stops.push(B.watch('requests', (r) => {
    if (known.requests) {
      r.forEach((q) => {
        const prev = known.requests.get(q.id);
        if (!prev) toast(`✏️ New custom request: ${q.title}`, 6000);
        else if (q.lastFrom === 'customer' && (q.updatedAt || 0) > prev) toast(`💬 ${q.name}: new message`, 5000);
      });
    }
    known.requests = new Map(r.map((q) => [q.id, q.updatedAt || 0]));
    S.requests = r; refresh(['home', 'requests']);
    S.threadRedraw && S.threadRedraw();
  }));
  if (B.mode === 'live' && B.pushAvailable) S.stops.push(B.watch('subscribers', (r) => { S.subs = r; refresh(['home', 'notify']); }));
}
function stopData() { S.stops.forEach((f) => f && f()); S.stops = []; }
function refresh(views) {
  if (S.user && views.includes(S.view) && !document.querySelector('.sheet-back')) render();
}

(async function boot() {
  render();
  try { await B.init({ role: 'admin' }); } catch (err) { console.error(err); $('#app').innerHTML = '<div class="wrap"><div class="empty">Could not start. Check config.js</div></div>'; return; }
  B.onAdmin((u) => {
    S.user = u; if (u) startData(); else stopData(); render();
    // A customer account must never get into the admin screens, even though the database would refuse it anyway.
    if (u) B.isOwner().then((isOwner) => {
      if (!isOwner) { toast('This account is not the shop admin.', 5000); B.adminLogout(); return; }
      B.adminEmailVerified().then((v) => { S.verified = v; refresh(['home']); });
    });
  });
  if (B.pushAvailable) B.enablePush('admin', { silent: true });
})();
