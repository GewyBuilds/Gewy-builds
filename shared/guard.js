// Runs first on every page. Hides the page if another site tries to show it inside a frame (clickjacking),
// and keeps the shop address tidy.
try {
  if (window.top !== window.self) document.documentElement.style.display = 'none';
} catch (e) { document.documentElement.style.display = 'none'; }
try {
  const me = document.currentScript;
  if (me && me.dataset.index && location.pathname.slice(-1) === '/' && history.replaceState) {
    history.replaceState(null, '', location.pathname + 'index.html' + location.search + location.hash);
  }
} catch (e) { /* ignore */ }

// Saved light/dark choice (dark is the default). Applied here so the page never flashes the wrong theme.
try {
  const th = localStorage.getItem('gewy:theme') === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = th;
  const m = document.querySelector('meta[name=theme-color]');
  if (m) m.setAttribute('content', th === 'light' ? '#f3f7fd' : '#0d0e10');
} catch (e) { /* ignore */ }
