/* Lucas Racing — 2D helmet renderer used for the homepage builder teaser,
   hero showcase and template gallery. The full builder (Milestone 3) uses
   the 3D Arai SK6 / Bell KC7 models; this keeps the same config shape. */
(function (global) {
  'use strict';

  const SHELLS = {
    sk6: 'M130 382 C96 312 98 190 188 112 C262 50 408 46 474 112 C510 146 528 186 534 222 L544 300 C552 346 532 388 490 406 C430 432 330 428 260 418 C200 410 152 402 130 382 Z',
    kc7: 'M128 386 C90 318 92 186 186 108 C264 44 414 42 482 114 C518 152 534 194 538 228 L548 310 C556 356 532 396 486 412 C424 436 326 432 256 422 C194 414 150 406 128 386 Z'
  };
  const EYEPORT = {
    sk6: 'M338 208 C382 180 470 176 534 196 L541 274 C482 264 404 266 352 282 C334 262 330 228 338 208 Z',
    kc7: 'M342 212 C386 184 474 180 538 202 L545 282 C486 270 408 272 356 288 C338 268 334 232 342 212 Z'
  };
  const VISOR = {
    sk6: 'M316 212 C378 172 478 166 540 188 L548 282 C486 270 402 272 340 292 C314 282 304 236 316 212 Z',
    kc7: 'M320 216 C382 176 482 170 544 194 L552 290 C490 276 406 278 344 298 C318 288 308 240 320 216 Z'
  };
  const RUBBER = {
    sk6: 'M136 386 C154 404 200 412 260 420 C330 430 430 434 490 408',
    kc7: 'M134 390 C152 408 198 416 258 424 C328 434 428 438 486 414'
  };

  const TEMPLATES = {
    apex: {
      name: 'Apex',
      draw: (c) => `
        <path d="M600 372 C486 314 342 248 196 112 L262 64 C384 196 500 262 600 304 Z" fill="${c.c1}" data-zone="lines"/>
        <path d="M600 396 C482 340 330 268 168 126 L182 116 C340 254 488 326 600 380 Z" fill="${c.c2}"/>
        <path d="M600 288 C500 250 392 192 276 58 L290 50 C402 182 506 238 600 272 Z" fill="${c.c2}"/>`
    },
    crown: {
      name: 'Crown',
      draw: (c) => `
        <path d="M0 0 H600 V168 C470 140 320 150 90 270 V0 Z" fill="${c.c1}" data-zone="lines"/>
        <path d="M90 270 C320 150 470 140 600 168 V186 C470 160 324 170 90 292 Z" fill="${c.c2}"/>
        <path d="M90 306 C326 186 470 176 600 202 V210 C470 186 330 196 90 316 Z" fill="${c.c2}" opacity=".9"/>`
    },
    arrow: {
      name: 'Arrowhead',
      draw: (c) => `
        <path d="M120 230 L300 300 L120 370 L120 334 L220 300 L120 266 Z" fill="${c.c1}" data-zone="lines"/>
        <path d="M200 230 L380 300 L200 370 L200 334 L300 300 L200 266 Z" fill="${c.c1}" data-zone="lines"/>
        <path d="M280 236 L440 300 L280 364 L280 340 L380 300 L280 260 Z" fill="${c.c2}"/>
        <path d="M0 0 H600 V96 C460 70 300 80 140 150 V0 Z" fill="${c.c1}" data-zone="lines"/>`
    },
    split: {
      name: 'Split',
      draw: (c) => `
        <path d="M40 480 L40 318 C200 262 400 236 600 226 L600 480 Z" fill="${c.c1}" data-zone="lines"/>
        <path d="M40 318 C200 262 400 236 600 226 L600 240 C400 252 200 278 40 334 Z" fill="${c.c2}"/>
        <path d="M40 300 C200 244 400 218 600 208 L600 214 C400 226 200 252 40 308 Z" fill="${c.c2}" opacity=".85"/>`
    },
    velocity: {
      name: 'Velocity',
      draw: (c) => `
        <path d="M560 420 L120 150 L148 128 L590 390 Z" fill="${c.c1}" data-zone="lines"/>
        <path d="M600 372 L172 112 L186 102 L610 356 Z" fill="${c.c2}"/>
        <path d="M600 342 L206 92 L214 86 L610 332 Z" fill="${c.c1}" data-zone="lines"/>
        <path d="M520 448 L90 190 L98 178 L532 436 Z" fill="${c.c2}"/>
        <path d="M480 470 L70 224 L74 216 L488 462 Z" fill="${c.c1}" data-zone="lines"/>`
    },
    halo: {
      name: 'Halo',
      draw: (c) => `
        <ellipse cx="300" cy="118" rx="230" ry="62" transform="rotate(-10 300 118)" fill="none" stroke="${c.c1}" stroke-width="46" data-zone="lines"/>
        <ellipse cx="300" cy="118" rx="230" ry="62" transform="rotate(-10 300 118)" fill="none" stroke="${c.c2}" stroke-width="8"/>
        <path d="M0 480 L0 372 C180 352 360 360 600 340 V480 Z" fill="${c.c1}" data-zone="lines"/>`
    }
  };

  const FILMS = {
    none: { name: 'Solid colour' },
    carbon: { name: 'Carbon Fibre', tint: '#3b3d42' },
    forged: { name: 'Forged Carbon', tint: '#45474d' },
    hex: { name: 'Hex Mesh', tint: '#2a2c31' },
    camo: { name: 'Urban Camo', tint: '#6b7280' },
    marble: { name: 'Marble', tint: '#1d2433' },
    holo: { name: 'Holographic', tint: '#9aa7ff' }
  };

  /* ---------- colour helpers ---------- */
  function rgb(hex) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function toHex(r, g, b) {
    return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  }
  function mix(a, b, t) {
    const x = rgb(a), y = rgb(b);
    return toHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t);
  }

  /* ---------- film layers (tintable: carbon + blue = blue carbon) ---------- */
  function filmDefs(id, film, tint) {
    const t = tint || FILMS[film].tint;
    const dark = mix(t, '#000000', 0.72);
    const lite = mix(t, '#ffffff', 0.18);
    switch (film) {
      case 'carbon':
        return `
          <linearGradient id="${id}-tv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lite}"/><stop offset=".55" stop-color="${t}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
          <linearGradient id="${id}-th" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${dark}"/><stop offset=".45" stop-color="${mix(t, '#000', 0.35)}"/><stop offset="1" stop-color="${mix(t, '#000', 0.55)}"/></linearGradient>
          <pattern id="${id}-film" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="10" height="10" fill="${dark}"/>
            <rect x="0" y="0" width="5" height="5" fill="url(#${id}-tv)"/><rect x="5" y="5" width="5" height="5" fill="url(#${id}-tv)"/>
            <rect x="5" y="0" width="5" height="5" fill="url(#${id}-th)"/><rect x="0" y="5" width="5" height="5" fill="url(#${id}-th)"/>
          </pattern>`;
      case 'hex':
        return `
          <pattern id="${id}-film" width="24" height="41.57" patternUnits="userSpaceOnUse">
            <rect width="24" height="41.57" fill="${dark}"/>
            <path d="M12 0 L24 6.93 L24 20.78 L12 27.71 L0 20.78 L0 6.93 Z M0 34.64 L12 41.57 M24 34.64 L12 41.57 M12 27.71 L12 41.57" fill="none" stroke="${lite}" stroke-width="2.2" opacity=".75"/>
          </pattern>`;
      case 'camo':
        return `
          <pattern id="${id}-film" width="160" height="160" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)">
            <rect width="160" height="160" fill="${t}"/>
            <path d="M10 20 C40 0 70 30 60 50 C50 70 20 60 14 46 C8 34 0 28 10 20 Z M90 10 C120 0 150 20 140 40 C130 58 100 50 96 34 Z M30 90 C60 70 100 90 90 120 C80 146 40 140 30 120 C22 106 18 98 30 90 Z M110 90 C140 80 160 110 150 130 C140 150 116 140 112 120 Z" fill="${dark}"/>
            <path d="M60 60 C80 50 100 70 90 82 C80 94 64 86 60 76 Z M130 50 C146 48 156 62 148 72 C140 80 128 74 128 64 Z M10 130 C24 120 44 132 38 148 C30 160 12 154 10 142 Z M70 140 C84 136 96 148 88 158 C80 166 68 158 70 148 Z" fill="${lite}"/>
            <path d="M40 40 C50 34 58 44 52 50 C46 56 38 50 40 40 Z M120 120 C128 114 138 122 134 130 C128 138 118 130 120 120 Z M100 60 C106 56 112 62 108 68 Z" fill="${mix(t, '#000', 0.4)}"/>
          </pattern>`;
      case 'holo':
        return `
          <linearGradient id="${id}-film" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#ff6ad5"/><stop offset=".2" stop-color="#c774e8"/><stop offset=".4" stop-color="#94d0ff"/>
            <stop offset=".6" stop-color="#8affc1"/><stop offset=".8" stop-color="#fff39e"/><stop offset="1" stop-color="${t}"/>
          </linearGradient>
          <pattern id="${id}-hs" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
            <rect width="14" height="3" fill="#fff" opacity=".35"/><rect y="7" width="14" height="1.5" fill="#000" opacity=".12"/>
          </pattern>`;
      case 'marble':
        return `
          <filter id="${id}-mf" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="turbulence" baseFrequency="0.006 0.022" numOctaves="4" seed="7"/>
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -2.6 0 0 0 1.08"/>
          </filter>`;
      case 'forged':
        return `
          <filter id="${id}-ff" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="2" seed="3"/>
            <feComponentTransfer>
              <feFuncR type="discrete" tableValues="0 .3 .55 1"/><feFuncG type="discrete" tableValues="0 .3 .55 1"/><feFuncB type="discrete" tableValues="0 .3 .55 1"/>
              <feFuncA type="discrete" tableValues="1 1"/>
            </feComponentTransfer>
            <feColorMatrix type="saturate" values="0"/>
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  .7 0 0 0 -.12"/>
          </filter>`;
      default:
        return '';
    }
  }

  function filmLayer(id, film, tint) {
    const t = tint || (FILMS[film] && FILMS[film].tint);
    switch (film) {
      case 'carbon':
      case 'hex':
      case 'camo':
        return `<rect width="600" height="480" fill="url(#${id}-film)"/>`;
      case 'holo':
        return `<rect width="600" height="480" fill="url(#${id}-film)"/><rect width="600" height="480" fill="${t}" opacity=".18"/><rect width="600" height="480" fill="url(#${id}-hs)"/>`;
      case 'marble':
        return `<rect width="600" height="480" fill="${t}"/><rect width="600" height="480" filter="url(#${id}-mf)" opacity=".85"/>`;
      case 'forged':
        return `<rect width="600" height="480" fill="${mix(t, '#000', 0.6)}"/><rect width="600" height="480" fill="${t}" filter="url(#${id}-ff)" opacity=".9"/>`;
      default:
        return '';
    }
  }

  let uid = 0;

  /**
   * Render a helmet as an SVG string.
   * cfg: { model, template, base, c1, c2, film, filmTint, filmZone ('base'|'lines'),
   *        finish ('gloss'|'matte'|'chrome'), rubber, plastic, spoiler, number, name }
   */
  function render(cfg) {
    const c = Object.assign({
      model: 'sk6', template: 'apex', base: '#f4f4f5', c1: '#e8261c', c2: '#111114',
      film: 'none', filmTint: null, filmZone: 'lines', finish: 'gloss',
      rubber: '#111114', plastic: '#111114', spoiler: true, number: '', name: ''
    }, cfg || {});
    const id = 'h' + (++uid);
    const tpl = TEMPLATES[c.template] || TEMPLATES.apex;
    const hasFilm = c.film && c.film !== 'none';
    const chrome = c.finish === 'chrome';
    const gloss = c.finish === 'matte' ? 0.14 : 0.62;

    // base layer
    let base;
    if (chrome) {
      base = `<rect width="600" height="480" fill="url(#${id}-chrome)"/>` +
        (c.base.toLowerCase() !== '#f4f4f5' && c.base.toLowerCase() !== '#ffffff'
          ? `<rect width="600" height="480" fill="${c.base}" opacity=".42" style="mix-blend-mode:multiply"/>` : '');
    } else {
      base = `<rect width="600" height="480" fill="${c.base}"/>`;
    }
    if (hasFilm && c.filmZone === 'base') base += filmLayer(id, c.film, c.filmTint);

    // template lines; when film goes on the lines, the c1 zones use the film
    let lines = tpl.draw(c);
    if (hasFilm && c.filmZone === 'lines') {
      lines = `<g>${lines}</g>
        <mask id="${id}-lm" maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="480">
          ${tpl.draw({ c1: '#fff', c2: '#000' }).replace(/opacity="[^"]*"/g, '')}
        </mask>
        <g mask="url(#${id}-lm)">${filmLayer(id, c.film, c.filmTint)}</g>`;
    }

    const shell = SHELLS[c.model] || SHELLS.sk6;
    const eye = EYEPORT[c.model] || EYEPORT.sk6;
    const visor = VISOR[c.model] || VISOR.sk6;
    const rubber = RUBBER[c.model] || RUBBER.sk6;

    const number = c.number ? `
      <text x="226" y="352" text-anchor="middle" font-family="'Saira Condensed', 'Arial Narrow', sans-serif" font-weight="800" font-style="italic"
        font-size="96" fill="${c.c2}" stroke="${c.base}" stroke-width="6" paint-order="stroke" letter-spacing="-2">${escape(c.number)}</text>` : '';
    const name = c.name ? `
      <text x="420" y="380" text-anchor="middle" transform="rotate(-8 420 380)" font-family="'Saira Condensed', 'Arial Narrow', sans-serif" font-weight="700"
        font-size="26" letter-spacing="3" fill="${c.c2}" stroke="${c.base}" stroke-width="4" paint-order="stroke">${escape(c.name.toUpperCase())}</text>` : '';

    const spoilerD = 'M150 156 C164 126 190 102 228 88 L218 74 C176 82 136 100 106 124 C100 130 104 138 112 138 C126 140 140 146 150 156 Z';
    const spoiler = c.spoiler ? `
      <path d="${spoilerD}" fill="${c.plastic}"/>
      <path d="M218 74 C176 82 136 100 106 124 C104 127 104 130 107 131 C140 108 180 92 222 82 Z" fill="#fff" opacity=".22"/>
      <path d="${spoilerD}" fill="none" stroke="#000" stroke-opacity=".6" stroke-width="2"/>` : '';

    const vents = c.model === 'kc7' ? `
      <path d="M490 330 C510 326 530 330 544 340 L542 366 C526 358 508 356 488 358 Z" fill="${c.plastic}" stroke="#000" stroke-opacity=".5" stroke-width="2"/>
      <path d="M498 340 L534 346 M496 350 L534 356" stroke="#000" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>
      <path d="M150 300 C160 296 176 296 186 300 L184 336 C174 332 162 332 152 336 Z" fill="${c.plastic}" stroke="#000" stroke-opacity=".5" stroke-width="2"/>` : `
      <path d="M488 318 C506 314 526 318 540 326 L538 354 C522 346 504 344 486 346 Z" fill="${c.plastic}" stroke="#000" stroke-opacity=".5" stroke-width="2"/>
      <path d="M496 326 L532 332 M494 336 L532 342" stroke="#000" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>
      <path d="M266 68 C298 54 340 52 370 58 L366 76 C336 70 300 72 270 84 Z" fill="${c.plastic}" stroke="#000" stroke-opacity=".5" stroke-width="2"/>`;

    return `
<svg class="helmet-svg" viewBox="40 30 540 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${c.model === 'kc7' ? 'Bell KC7' : 'Arai SK6'} helmet, ${tpl.name} template">
  <defs>
    <clipPath id="${id}-clip"><path d="${shell}"/></clipPath>
    <linearGradient id="${id}-chrome" x1="0" y1="0" x2=".25" y2="1">
      <stop offset="0" stop-color="#fbfcfd"/><stop offset=".22" stop-color="#b9c1ca"/><stop offset=".40" stop-color="#4b525b"/>
      <stop offset=".44" stop-color="#1c2026"/><stop offset=".47" stop-color="#e6eaee"/><stop offset=".62" stop-color="#8e979f"/>
      <stop offset=".8" stop-color="#d9dee3"/><stop offset="1" stop-color="#5b636c"/>
    </linearGradient>
    <radialGradient id="${id}-hl" cx=".36" cy=".2" r=".55"><stop offset="0" stop-color="#fff" stop-opacity="${gloss}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}-sh" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>
    <linearGradient id="${id}-sh2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".38"/><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset=".85" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
    <linearGradient id="${id}-visor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0f16" stop-opacity=".92"/><stop offset=".6" stop-color="#1b2433" stop-opacity=".72"/><stop offset="1" stop-color="#2b3a52" stop-opacity=".55"/></linearGradient>
    <filter id="${id}-blur"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="${id}-drop" x="-20%" y="-20%" width="140%" height="150%"><feGaussianBlur stdDeviation="14"/></filter>
    ${hasFilm ? filmDefs(id, c.film, c.filmTint) : ''}
  </defs>

  <ellipse cx="330" cy="436" rx="220" ry="14" fill="#000" opacity=".55" filter="url(#${id}-drop)"/>
  <g clip-path="url(#${id}-clip)">
    ${base}
    ${lines}
    ${number}
    ${name}
    <rect width="600" height="480" fill="url(#${id}-sh2)"/>
    <rect width="600" height="480" fill="url(#${id}-sh)"/>
    <rect width="600" height="480" fill="url(#${id}-hl)"/>
    <path d="M200 120 C260 74 380 70 440 108" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity="${gloss * 0.8}" filter="url(#${id}-blur)"/>
  </g>
  <path d="${shell}" fill="none" stroke="#000" stroke-opacity=".7" stroke-width="3"/>
  ${spoiler}
  ${vents}
  <path d="${rubber}" fill="none" stroke="${c.rubber}" stroke-width="13" stroke-linecap="round"/>
  <path d="${rubber}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="2" transform="translate(0 6)"/>
  <path d="${eye}" fill="#07090c"/>
  <path d="${eye}" fill="none" stroke="${c.rubber}" stroke-width="8" stroke-linejoin="round"/>
  <path d="${visor}" fill="url(#${id}-visor)"/>
  <path d="M352 206 C400 186 470 182 524 196" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="5" stroke-linecap="round"/>
  <path d="${visor}" fill="none" stroke="#000" stroke-opacity=".8" stroke-width="2.5"/>
  <circle cx="${c.model === 'kc7' ? 326 : 322}" cy="${c.model === 'kc7' ? 254 : 250}" r="17" fill="${c.plastic}" stroke="#000" stroke-opacity=".6" stroke-width="2"/>
  <circle cx="${c.model === 'kc7' ? 326 : 322}" cy="${c.model === 'kc7' ? 254 : 250}" r="5" fill="#9ca3af"/>
</svg>`;
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  /** Small square swatch of a film (used in the film library). */
  function swatch(film, tint) {
    const id = 's' + (++uid);
    const body = film === 'none'
      ? `<rect width="600" height="480" fill="${tint || '#e8261c'}"/>`
      : filmLayer(id, film, tint);
    return `<svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>${film === 'none' ? '' : filmDefs(id, film, tint)}
        <linearGradient id="${id}-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
      </defs>${body}<rect width="600" height="480" fill="url(#${id}-g)"/></svg>`;
  }

  /** A kart nose fairing finished in a film, for the hydro-dipped parts teaser. */
  function part(film, tint) {
    const id = 'p' + (++uid);
    const d = 'M18 78 C34 52 84 36 148 32 L184 36 C192 48 192 68 182 80 L28 92 C20 90 16 84 18 78 Z';
    return `<svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>${filmDefs(id, film, tint)}<clipPath id="${id}-c"><path d="${d}"/></clipPath>
        <linearGradient id="${id}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient></defs>
      <ellipse cx="100" cy="98" rx="80" ry="5" fill="#000" opacity=".5"/>
      <g clip-path="url(#${id}-c)"><g transform="scale(.4)">${filmLayer(id, film, tint)}</g><rect width="200" height="110" fill="url(#${id}-g)"/></g>
      <path d="${d}" fill="none" stroke="#000" stroke-opacity=".6" stroke-width="1.5"/>
      <rect x="120" y="50" width="34" height="22" rx="4" fill="#f4f4f5"/><text x="137" y="67" text-anchor="middle" font-family="'Saira Condensed',sans-serif" font-weight="800" font-style="italic" font-size="18" style="fill:#111">29</text>
    </svg>`;
  }

  global.Helmet = { render, swatch, part, TEMPLATES, FILMS };
})(window);
