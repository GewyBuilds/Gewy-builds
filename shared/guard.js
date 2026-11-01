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
