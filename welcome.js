// First-open welcome: name -> how did you find us -> accept terms. Full-screen, animated.
import { esc } from './ui.js';

const TXT = {
  en: {
    nameH: "Hey! What's your name?", nameS: 'So I can say hi properly.', namePh: 'Your first name', next: 'Next', skip: 'Skip',
    srcH: (n) => (n ? `Nice to meet you, ${n}!` : 'Nice to meet you!'), srcS: 'How did you find us?',
    consH: 'One last thing', consS: 'Please read and accept our Terms and Privacy. They explain delivery areas, payments, deposits and how we look after your details.',
    terms: 'Terms', privacy: 'Privacy', accept: 'Accept and start', done: (n) => (n ? `Welcome, ${n}!` : 'Welcome!'),
    src: { tiktok: 'TikTok', instagram: 'Instagram', facebook: 'Facebook', friends: 'Friends', other: 'Other' },
    morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening', back: 'Welcome back',
  },
  el: {
    nameH: 'Γεια! Πώς σε λένε;', nameS: 'Για να σε καλωσορίσω σωστά.', namePh: 'Το όνομά σου', next: 'Επόμενο', skip: 'Παράλειψη',
    srcH: (n) => (n ? `Χαρήκαμε, ${n}!` : 'Χαρήκαμε!'), srcS: 'Πώς μας βρήκες;',
    consH: 'Ένα τελευταίο', consS: 'Διάβασε και αποδέξου τους Όρους και το Απόρρητο. Εξηγούν περιοχές παράδοσης, πληρωμές, προκαταβολές και πώς φροντίζουμε τα στοιχεία σου.',
    terms: 'Όροι', privacy: 'Απόρρητο', accept: 'Αποδοχή και έναρξη', done: (n) => (n ? `Καλώς ήρθες, ${n}!` : 'Καλώς ήρθες!'),
    src: { tiktok: 'TikTok', instagram: 'Instagram', facebook: 'Facebook', friends: 'Φίλοι', other: 'Άλλο' },
    morning: 'Καλημέρα', afternoon: 'Καλό απόγευμα', evening: 'Καλησπέρα', back: 'Καλώς ήρθες ξανά',
  },
};
const SRC = [['tiktok', '🎵'], ['instagram', '📸'], ['facebook', '👍'], ['friends', '🧑‍🤝‍🧑'], ['other', '✨']];

export function greeting(lang, name) {
  const T = TXT[lang] || TXT.en;
  const h = new Date().getHours();
  const g = h < 5 ? T.evening : h < 12 ? T.morning : h < 18 ? T.afternoon : T.evening;
  return name ? `${g}, ${name}` : g;
}
export const welcomeBack = (lang, name) => `${(TXT[lang] || TXT.en).back}${name ? ', ' + name : ''} 👋`;

// steps: any of 'name', 'src', 'consent'. onFinish({ name, src }) is called when the person is done.
export function startWelcome({ steps, getLang, setLang, openLegal, name = '', onFinish }) {
  const S = { i: 0, name, src: '', busy: false };
  const el = document.createElement('div');
  el.className = 'ob';
  el.innerHTML = `<div class="ob-bg"><i></i><i></i><i></i><span class="ob-bar b1"></span><span class="ob-bar b2"></span><span class="ob-bar b3"></span><span class="ob-bar b4"></span></div>
    <button class="ob-lang" data-ob="lang"></button><div class="ob-dots"></div><div class="ob-card"></div>`;
  document.body.appendChild(el);
  document.body.classList.add('noscroll');
  requestAnimationFrame(() => el.classList.add('in'));
  const card = el.querySelector('.ob-card');
  const T = () => TXT[getLang()] || TXT.en;

  const dots = () => { el.querySelector('.ob-dots').innerHTML = steps.map((_, k) => `<b class="${k === S.i ? 'on' : k < S.i ? 'done' : ''}"></b>`).join(''); };
  const finish = (celebrate) => {
    if (S.busy) return;
    S.busy = true;
    if (celebrate) {
      card.innerHTML = `<div class="ob-win"><svg viewBox="0 0 52 52" width="92" height="92"><circle class="ob-c" cx="26" cy="26" r="24" fill="none" stroke="var(--ok)" stroke-width="3"/><path class="ob-p" d="M15 27l8 8 14-16" fill="none" stroke="var(--ok)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <h1>${esc(T().done(S.name))}</h1></div>`;
      for (let k = 0; k < 42; k++) {
        const s = document.createElement('span');
        s.className = 'ob-conf';
        const a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 220;
        s.style.cssText = `--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d - 60}px;--r:${Math.random() * 720 - 360}deg;--c:${['#ff6a1a', '#ff8a45', '#ffc233', '#35d07f', '#4da3ff', '#eceef1'][k % 6]};animation-delay:${Math.random() * 0.15}s`;
        el.appendChild(s);
      }
    }
    setTimeout(() => {
      el.classList.remove('in');
      setTimeout(() => { el.remove(); if (!document.querySelector('.sheet-back')) document.body.classList.remove('noscroll'); }, 400);
      onFinish({ name: S.name, src: S.src });
    }, celebrate ? 1500 : 200);
  };
  const go = () => { if (S.i >= steps.length - 1) finish(steps.includes('consent')); else { S.i++; draw(); } };

  const draw = () => {
    const t = T();
    const kind = steps[S.i];
    el.querySelector('[data-ob=lang]').textContent = getLang() === 'el' ? 'EN' : 'ΕΛ';
    dots();
    let h = '';
    if (kind === 'name') {
      h = `<div class="ob-emoji">👋</div><h1>${esc(t.nameH)}</h1><p>${esc(t.nameS)}</p>
        <input class="ob-in" id="obName" maxlength="24" autocomplete="given-name" placeholder="${esc(t.namePh)}" value="${esc(S.name)}">
        <button class="ob-btn" data-ob="next" ${S.name.trim() ? '' : 'disabled'}>${esc(t.next)} →</button>
        <button class="ob-skip" data-ob="skip">${esc(t.skip)}</button>`;
    } else if (kind === 'src') {
      h = `<div class="ob-emoji">🔍</div><h1>${esc(t.srcH(S.name.trim()))}</h1><p>${esc(t.srcS)}</p>
        <div class="ob-grid">${SRC.map(([k, e], n) => `<button class="ob-chip${S.src === k ? ' on' : ''}" data-ob="src" data-v="${k}" style="animation-delay:${0.08 * n}s"><span>${e}</span>${esc(t.src[k])}</button>`).join('')}</div>
        <button class="ob-skip" data-ob="skip">${esc(t.skip)}</button>`;
    } else {
      h = `<div class="ob-emoji">📜</div><h1>${esc(t.consH)}</h1><p>${esc(t.consS)}</p>
        <div class="ob-links"><button data-ob="legal" data-v="terms">${esc(t.terms)}</button><button data-ob="legal" data-v="privacy">${esc(t.privacy)}</button></div>
        <button class="ob-btn" data-ob="accept">${esc(t.accept)} ✓</button>`;
    }
    card.classList.remove('ob-enter'); void card.offsetWidth;
    card.innerHTML = h;
    card.classList.add('ob-enter');
    const inp = card.querySelector('#obName');
    if (inp) {
      setTimeout(() => inp.focus({ preventScroll: true }), 350);
      inp.addEventListener('input', () => { S.name = inp.value; card.querySelector('[data-ob=next]').disabled = !inp.value.trim(); });
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && inp.value.trim()) { S.name = inp.value; go(); } });
    }
  };

  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ob]');
    if (!b || S.busy) return;
    const a = b.dataset.ob;
    if (a === 'lang') { setLang(getLang() === 'el' ? 'en' : 'el'); draw(); }
    if (a === 'next') go();
    if (a === 'skip') go();
    if (a === 'src') {
      S.src = b.dataset.v;
      card.querySelectorAll('.ob-chip').forEach((c) => c.classList.toggle('on', c === b));
      b.classList.add('pop');
      try { navigator.vibrate && navigator.vibrate(10); } catch (err) { /* ignore */ }
      S.busy = true;
      setTimeout(() => { S.busy = false; go(); }, 520);
    }
    if (a === 'legal') openLegal(b.dataset.v);
    if (a === 'accept') finish(true);
  });
  draw();
  return el;
}
