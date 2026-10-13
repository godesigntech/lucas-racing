/* Lucas Racing — homepage interactions */
(function () {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  const COLOURS = [
    ['White', '#f4f4f5'], ['Black', '#111114'], ['Racing Red', '#e8261c'], ['Electric Blue', '#1f6feb'],
    ['Signal Yellow', '#ffcc00'], ['Orange', '#ff6a13'], ['Green', '#16a34a'], ['Purple', '#7c3aed'],
    ['Pink', '#ec4899'], ['Silver', '#9ca3af']
  ];
  const TRIMS = [['Black', '#111114'], ['Red', '#e8261c'], ['Blue', '#1f6feb'], ['Yellow', '#ffcc00'], ['White', '#f4f4f5']];
  const TINTS = [['Natural', null]].concat(COLOURS.filter(([n]) => n !== 'White'));

  /* ---------------- page-in-progress links ---------------- */
  const toast = $('#toast');
  let toastT;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove('is-on'), 2800);
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-planned]');
    if (!a) return;
    e.preventDefault();
    const name = a.getAttribute('data-planned');
    const stage = /helmet|templates|competition|send your/i.test(name) ? 'Milestone 3 (helmet builder)'
      : /shop|kart|trolle|spares|frame|basket|search/i.test(name) ? 'Milestone 4 (shop)'
      : 'Milestone 2 (inner pages)';
    showToast(`"${name}" is built in ${stage}. This is the homepage preview.`);
  });

  /* ---------------- header ---------------- */
  const header = $('.header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const burger = $('.burger');
  const nav = $('#nav');
  function setNavTop() {
    const r = header.getBoundingClientRect();
    document.documentElement.style.setProperty('--nav-top', Math.max(0, r.bottom) + 'px');
  }
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    setNavTop();
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('.nav a').forEach((a) => a.addEventListener('click', () => {
    if (!nav.classList.contains('is-open') || a.hasAttribute('data-planned')) return;
    burger.click();
  }));

  // Shop mega menu: click on touch/mobile, hover on desktop
  const mega = $('.has-mega');
  const trigger = $('.nav__trigger');
  const setMega = (open) => { mega.classList.toggle('is-open', open); trigger.setAttribute('aria-expanded', open); };
  trigger.addEventListener('click', () => setMega(!mega.classList.contains('is-open')));
  const hoverable = window.matchMedia('(hover: hover) and (min-width: 1025px)');
  let megaT;
  mega.addEventListener('mouseenter', () => { if (hoverable.matches) { clearTimeout(megaT); setMega(true); } });
  mega.addEventListener('mouseleave', () => { if (hoverable.matches) megaT = setTimeout(() => setMega(false), 150); });
  document.addEventListener('click', (e) => { if (hoverable.matches && !mega.contains(e.target)) setMega(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    setMega(false);
    if (nav.classList.contains('is-open')) burger.click();
  });

  /* ---------------- hero showcase ---------------- */
  const SHOWCASE = [
    { model: 'sk6', template: 'apex', base: '#f4f4f5', c1: '#e8261c', c2: '#111114', number: '29', finish: 'gloss', rubber: '#111114', plastic: '#111114' },
    { model: 'sk6', template: 'velocity', base: '#111114', c1: '#1f6feb', c2: '#f4f4f5', film: 'carbon', filmTint: '#1f6feb', filmZone: 'base', number: '7', finish: 'gloss', rubber: '#1f6feb', plastic: '#111114' },
    { model: 'kc7', template: 'crown', base: '#f4f4f5', c1: '#7c3aed', c2: '#ffcc00', finish: 'chrome', number: '44', rubber: '#111114', plastic: '#111114' },
    { model: 'sk6', template: 'split', base: '#ffcc00', c1: '#111114', c2: '#e8261c', film: 'hex', filmTint: '#3f3f46', filmZone: 'lines', number: '11', rubber: '#111114', plastic: '#111114' },
    { model: 'kc7', template: 'halo', base: '#111114', c1: '#ec4899', c2: '#f4f4f5', film: 'holo', filmZone: 'lines', number: '88', finish: 'matte', rubber: '#f4f4f5', plastic: '#111114' }
  ];
  const FINISH = { gloss: 'Gloss', matte: 'Matte', chrome: 'Chrome' };
  const MODEL = { sk6: 'Arai SK6', kc7: 'Bell KC7' };
  const heroEl = $('#heroHelmet');
  const dots = $('#heroDots');
  let heroI = 0, heroTimer;

  function heroMeta(cfg) {
    const film = cfg.film && cfg.film !== 'none' ? Helmet.FILMS[cfg.film].name : FINISH[cfg.finish || 'gloss'];
    return `${MODEL[cfg.model]} · ${film}`;
  }
  function showHero(i) {
    heroI = (i + SHOWCASE.length) % SHOWCASE.length;
    const cfg = SHOWCASE[heroI];
    heroEl.classList.remove('is-swapping');
    heroEl.innerHTML = Helmet.render(cfg);
    void heroEl.offsetWidth;
    heroEl.classList.add('is-swapping');
    $('#heroTplName').textContent = Helmet.TEMPLATES[cfg.template].name;
    $('#heroTplMeta').textContent = heroMeta(cfg);
    $$('button', dots).forEach((b, j) => b.setAttribute('aria-selected', j === heroI));
  }
  SHOWCASE.forEach((cfg, i) => {
    const b = document.createElement('button');
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', `Show design ${i + 1}: ${Helmet.TEMPLATES[cfg.template].name}`);
    b.addEventListener('click', () => { showHero(i); restartHero(); });
    dots.appendChild(b);
  });
  function restartHero() {
    clearInterval(heroTimer);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) heroTimer = setInterval(() => showHero(heroI + 1), 4200);
  }
  showHero(0);
  restartHero();

  /* ---------------- builder teaser ---------------- */
  const state = {
    model: 'sk6', template: 'apex', base: '#f4f4f5', c1: '#e8261c', c2: '#111114',
    film: 'none', filmTint: null, filmZone: 'lines', finish: 'gloss',
    rubber: '#111114', plastic: '#111114', spoiler: true, number: '29', name: 'LUCAS'
  };
  const builderEl = $('#builderHelmet');
  const nameOf = (list, hex) => (list.find(([, h]) => h === hex) || ['Custom'])[0];

  function draw() {
    builderEl.innerHTML = Helmet.render(state);
    const film = state.film !== 'none' ? ` · ${Helmet.FILMS[state.film].name}` : '';
    $('#bMeta').textContent = `${Helmet.TEMPLATES[state.template].name} · ${FINISH[state.finish]}${film}`;
    $('#baseName').textContent = nameOf(COLOURS, state.base);
    $('#c1Name').textContent = nameOf(COLOURS, state.c1);
    $('#c2Name').textContent = nameOf(COLOURS, state.c2);
    $('#rubberName').textContent = nameOf(TRIMS, state.rubber);
    $('#plasticName').textContent = nameOf(TRIMS, state.plastic);
    syncControls();
  }

  // templates
  const tplChips = $('#tplChips');
  Object.entries(Helmet.TEMPLATES).forEach(([key, t]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.tpl = key;
    b.textContent = t.name;
    b.addEventListener('click', () => { state.template = key; draw(); });
    tplChips.appendChild(b);
  });

  // swatches
  $$('.swatches[data-target]').forEach((wrap) => {
    const target = wrap.dataset.target;
    const list = target === 'rubber' || target === 'plastic' ? TRIMS : target === 'filmTint' ? TINTS : COLOURS;
    list.forEach(([name, hex]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sw';
      b.title = name;
      b.setAttribute('aria-label', name);
      b.dataset.val = hex || '';
      b.style.background = hex || 'conic-gradient(#3b3d42 0 25%, #1c1d20 0 50%, #3b3d42 0 75%, #1c1d20 0)';
      b.addEventListener('click', () => {
        state[target] = hex;
        if (target === 'filmTint' && state.film === 'none') state.film = 'carbon';
        draw();
      });
      wrap.appendChild(b);
    });
  });

  // films
  const filmPick = $('#filmPick');
  Object.entries(Helmet.FILMS).forEach(([key, f]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'film';
    b.dataset.film = key;
    b.innerHTML = (key === 'none' ? '<span class="film__solid">∅</span>' : Helmet.swatch(key)) + `<span>${key === 'none' ? 'None' : f.name}</span>`;
    b.addEventListener('click', () => { state.film = key; draw(); });
    filmPick.appendChild(b);
  });

  // segmented controls
  function bindSeg(attr, key) {
    $$(`[data-${attr}]`).forEach((b) => b.addEventListener('click', () => { state[key] = b.dataset[attr]; draw(); }));
  }
  bindSeg('model', 'model');
  bindSeg('zone', 'filmZone');
  bindSeg('finish', 'finish');

  $('#numInput').addEventListener('input', (e) => { state.number = e.target.value.replace(/[^0-9]/g, '').slice(0, 3); e.target.value = state.number; draw(); });
  $('#nameInput').addEventListener('input', (e) => { state.name = e.target.value.slice(0, 14); draw(); });
  $('#spoilerToggle').addEventListener('change', (e) => { state.spoiler = e.target.checked; draw(); });

  function syncControls() {
    $$('[data-tpl]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.tpl === state.template));
    $$('[data-film]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.film === state.film));
    $$('.swatches[data-target]').forEach((w) => {
      const v = state[w.dataset.target] || '';
      $$('.sw', w).forEach((b) => b.setAttribute('aria-pressed', b.dataset.val === v));
    });
    $$('[data-model]').forEach((b) => b.setAttribute('aria-checked', b.dataset.model === state.model));
    $$('[data-zone]').forEach((b) => b.setAttribute('aria-checked', b.dataset.zone === state.filmZone));
    $$('[data-finish]').forEach((b) => b.setAttribute('aria-checked', b.dataset.finish === state.finish));
  }

  // tabs
  const tabs = $$('.tabs [role="tab"]');
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(i));
    t.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        selectTab(n); tabs[n].focus();
      }
    });
  });
  function selectTab(i) {
    tabs.forEach((t, j) => {
      t.setAttribute('aria-selected', i === j);
      t.tabIndex = i === j ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = i !== j;
    });
  }
  selectTab(0);

  // surprise me
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  $('#randomBtn').addEventListener('click', () => {
    const cols = COLOURS.map(([, h]) => h);
    state.template = pick(Object.keys(Helmet.TEMPLATES));
    state.base = pick(cols);
    do { state.c1 = pick(cols); } while (state.c1 === state.base);
    do { state.c2 = pick(cols); } while (state.c2 === state.c1);
    state.film = Math.random() < .6 ? pick(Object.keys(Helmet.FILMS).filter((f) => f !== 'none')) : 'none';
    state.filmTint = Math.random() < .5 ? null : pick(cols.slice(1));
    state.filmZone = Math.random() < .7 ? 'lines' : 'base';
    state.finish = pick(['gloss', 'gloss', 'matte', 'chrome']);
    state.rubber = pick(TRIMS)[1];
    state.plastic = pick(TRIMS)[1];
    draw();
  });

  draw();

  /* ---------------- template gallery ---------------- */
  const GALLERY = [
    { template: 'apex', base: '#f4f4f5', c1: '#e8261c', c2: '#111114', sub: 'Sweeping chin-to-crown band' },
    { template: 'crown', base: '#111114', c1: '#ffcc00', c2: '#e8261c', sub: 'Contrast crown with twin pinstripes' },
    { template: 'arrow', base: '#1f6feb', c1: '#f4f4f5', c2: '#ffcc00', sub: 'Forward chevrons, crown cap' },
    { template: 'split', base: '#f4f4f5', c1: '#16a34a', c2: '#111114', film: 'carbon', filmZone: 'lines', sub: 'Diagonal split, carbon lower' },
    { template: 'velocity', base: '#111114', c1: '#ff6a13', c2: '#f4f4f5', sub: 'Five-line speed stripe' },
    { template: 'halo', base: '#f4f4f5', c1: '#7c3aed', c2: '#ec4899', finish: 'chrome', sub: 'Crown ring on chrome' }
  ];
  const grid = $('#tplGrid');
  GALLERY.forEach((g, i) => {
    const cfg = Object.assign({ model: i % 2 ? 'kc7' : 'sk6', rubber: '#111114', plastic: '#111114', spoiler: i % 3 !== 2 }, g);
    const el = document.createElement('article');
    el.className = 'tpl reveal';
    el.innerHTML = `
      <div class="tpl__art">${Helmet.render(cfg)}</div>
      <div class="tpl__meta">
        <div><p class="tpl__name">${Helmet.TEMPLATES[g.template].name}</p><p class="tpl__sub">${g.sub}</p></div>
        <a href="#builder" class="tpl__btn" data-use="${g.template}">Customise →</a>
      </div>`;
    grid.appendChild(el);
  });
  grid.addEventListener('click', (e) => {
    const a = e.target.closest('[data-use]');
    if (!a) return;
    const g = GALLERY.find((x) => x.template === a.dataset.use);
    Object.assign(state, { template: g.template, base: g.base, c1: g.c1, c2: g.c2, film: g.film || 'none', filmZone: g.filmZone || 'lines', finish: g.finish || 'gloss' });
    draw();
  });

  /* ---------------- competition ---------------- */
  $('#prizeHelmet').innerHTML = Helmet.render({ template: 'apex', base: '#f4f4f5', c1: '#e8261c', c2: '#111114', finish: 'chrome', number: '1' });
  const target = new Date('2026-11-14T09:00:00Z').getTime();
  const pad = (n) => String(n).padStart(2, '0');
  function tick() {
    let d = Math.max(0, target - Date.now());
    const days = Math.floor(d / 864e5); d -= days * 864e5;
    const hrs = Math.floor(d / 36e5); d -= hrs * 36e5;
    const mins = Math.floor(d / 6e4); d -= mins * 6e4;
    $('#cdD').textContent = pad(days);
    $('#cdH').textContent = pad(hrs);
    $('#cdM').textContent = pad(mins);
    $('#cdS').textContent = pad(Math.floor(d / 1e3));
  }
  tick();
  setInterval(tick, 1000);

  /* ---------------- film library ---------------- */
  const LIB = [
    ['carbon', null, 'Carbon'], ['forged', null, 'Forged Carbon'], ['hex', '#e8261c', 'Red Hex'], ['camo', null, 'Urban Camo'],
    ['marble', null, 'Midnight Marble'], ['holo', null, 'Holographic'], ['carbon', '#ffcc00', 'Gold Carbon'], ['camo', '#16a34a', 'Woodland Camo'],
    ['forged', '#7c3aed', 'Violet Forged'], ['marble', '#9ca3af', 'White Marble'], ['hex', '#1f6feb', 'Blue Hex'], ['holo', '#ec4899', 'Pink Holo']
  ];
  $('#filmGrid').innerHTML = LIB.map(([f, t, n]) => `<div class="film-card">${Helmet.swatch(f, t)}<span>${n}</span></div>`).join('');
  $('#mixA').innerHTML = Helmet.swatch('carbon');
  $('#mixB').innerHTML = Helmet.swatch('carbon', '#1f6feb');
  $('#soonDip').innerHTML = Helmet.part('camo', '#1f6feb');

  /* ---------------- sample products ---------------- */
  const ICONS = {
    kart: '<svg viewBox="0 0 120 70"><path d="M8 46h20l6-12h36l8 7h24l10 9H8z"/><circle cx="26" cy="52" r="9"/><circle cx="98" cy="52" r="9"/><path d="M56 34l4-12h10"/><circle cx="72" cy="18" r="6"/></svg>',
    wheel: '<svg viewBox="0 0 120 70"><circle cx="60" cy="35" r="28"/><circle cx="60" cy="35" r="7"/><path d="M60 7v21M36 46l18-7M84 46l-18-7"/></svg>',
    hub: '<svg viewBox="0 0 120 70"><rect x="34" y="20" width="52" height="30" rx="6"/><circle cx="60" cy="35" r="8"/><path d="M22 35h12M86 35h12"/><circle cx="42" cy="26" r="2"/><circle cx="78" cy="26" r="2"/><circle cx="42" cy="44" r="2"/><circle cx="78" cy="44" r="2"/></svg>',
    trolley: '<svg viewBox="0 0 120 70"><path d="M14 40h92v6H14z"/><path d="M26 46v8M94 46v8"/><circle cx="26" cy="58" r="5"/><circle cx="94" cy="58" r="5"/><path d="M14 40L6 14"/></svg>',
    disc: '<svg viewBox="0 0 120 70"><circle cx="60" cy="35" r="28"/><circle cx="60" cy="35" r="10"/><circle cx="60" cy="16" r="2"/><circle cx="60" cy="54" r="2"/><circle cx="41" cy="35" r="2"/><circle cx="79" cy="35" r="2"/><circle cx="47" cy="22" r="2"/><circle cx="73" cy="48" r="2"/></svg>',
    seat: '<svg viewBox="0 0 120 70"><path d="M36 10c0 20 2 34 10 44h34c4-6 6-14 6-22"/><path d="M36 10c6-2 12 0 14 6l6 30h24"/></svg>',
    sprocket: '<svg viewBox="0 0 120 70"><circle cx="60" cy="35" r="22"/><circle cx="60" cy="35" r="8"/><path d="M60 6v6M60 58v6M31 35h6M83 35h6M40 15l4 4M76 51l4 4M40 55l4-4M76 19l4-4"/></svg>',
    axle: '<svg viewBox="0 0 120 70"><path d="M8 35h104"/><rect x="20" y="28" width="10" height="14" rx="2"/><rect x="90" y="28" width="10" height="14" rx="2"/><path d="M50 30h20v10H50z"/></svg>'
  };
  const PRODUCTS = [
    ['kart', 'ProKart racing chassis', '£3,450', 'New'],
    ['wheel', 'Steering wheel 320mm', '£89'],
    ['hub', 'Front hub kit, 25mm', '£64'],
    ['trolley', 'Kart transport trolley', '£215', 'Customise soon'],
    ['disc', 'Rear brake disc, vented', '£72'],
    ['seat', 'Fibreglass seat, medium', '£118'],
    ['sprocket', 'Rear sprocket 219', '£19'],
    ['axle', 'Rear axle 50mm, medium', '£149']
  ];
  $('#products').innerHTML = PRODUCTS.map(([icon, name, price, tag]) => `
    <article class="product reveal">
      <div class="product__img">${tag ? `<span class="tag ${tag === 'New' ? 'tag--red' : 'tag--soon'}">${tag}</span>` : ''}${ICONS[icon]}</div>
      <div class="product__body">
        <span class="product__brand">MS Kart</span>
        <h3 class="product__name">${name}</h3>
        <div class="product__foot">
          <span class="product__price">${price}</span>
          <button class="product__add" aria-label="Add ${name} to basket" data-planned="Basket"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
        </div>
      </div>
    </article>`).join('');

  /* ---------------- notify forms ---------------- */
  $$('[data-notify]').forEach((f) => f.addEventListener('submit', (e) => {
    e.preventDefault();
    f.reset();
    showToast("Thanks! You're on the list. (Email capture goes live in Milestone 2.)");
  }));

  /* ---------------- reveal on scroll ---------------- */
  const revealEls = $$('.path, .step, .cat, .svc, .soon, .event, .section-head, .dip__lib, .team__visual, .builder__layout').concat($$('.reveal'));
  revealEls.forEach((el) => el.classList.add('reveal'));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  $('#year').textContent = new Date().getFullYear();
})();
