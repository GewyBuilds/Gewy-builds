// Stock logic shared by the shop and the admin app.
// Filaments live inside the shop settings document (settings.filaments = [{id, name, color, on, low}]).
// A product is out of stock when it is marked sold out, or when the filament it needs is switched off.
// A product with color options is out of stock only when every option is out.

export const filamentsOf = (st) => (st && Array.isArray(st.filaments) ? st.filaments : []);
export const findFilament = (st, id) => (id ? filamentsOf(st).find((f) => f.id === id) || null : null);
// A print can use several filaments (a multi-color print). fidsOf gives the list for a product or a color option.
export const fidsOf = (x) => (x && Array.isArray(x.filaments) && x.filaments.length ? x.filaments : x && x.filament ? [x.filament] : []);
const allOn = (st, ids) => ids.every((id) => isOn(st, id));
const anyLow = (st, ids) => ids.some((id) => { const f = findFilament(st, id); return !!(f && f.low && f.on !== false); });
const isOn = (st, id) => { const f = findFilament(st, id); return !f || f.on !== false; };

// Options of a product. Older products only have a plain list of color names.
export const optionsOf = (p) => (Array.isArray(p.options) && p.options.length
  ? p.options
  : (p.colors || []).map((name) => ({ name, filament: '', images: [] })));

// { out, why: 'sold'|'filament'|'', low, opts:[{name,out,low,images}] }
export function stockOf(p, st) {
  const opts = optionsOf(p).map((o) => {
    const ids = fidsOf(o).length ? fidsOf(o) : fidsOf(p);
    return { name: o.name, images: o.images || [], out: !!p.soldOut || !allOn(st, ids), low: anyLow(st, ids) };
  });
  if (p.soldOut) return { out: true, why: 'sold', low: false, opts };
  if (opts.length) {
    const out = opts.every((o) => o.out);
    return { out, why: out ? 'filament' : '', low: !out && opts.some((o) => !o.out && o.low), opts };
  }
  const ids = fidsOf(p);
  const out = !allOn(st, ids);
  return { out, why: out ? 'filament' : '', low: !out && anyLow(st, ids), opts };
}

// Stock of one cart/order line (pid + chosen color name).
export function lineOut(products, st, line) {
  const p = products.find((x) => x.id === line.pid);
  if (!p) return false;
  const s = stockOf(p, st);
  if (s.out) return true;
  if (line.color) { const o = s.opts.find((x) => x.name === line.color); if (o) return o.out; }
  return false;
}

// Discount helpers (the price field always holds what the customer pays; listPrice holds the old price).
export const wasPrice = (p) => (+p.listPrice > +p.price ? +p.listPrice : 0);
export const pctOff = (p) => (wasPrice(p) ? Math.round((1 - p.price / p.listPrice) * 100) : 0);
