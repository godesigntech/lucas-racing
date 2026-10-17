// Draws simple product illustrations for the placeholder catalogue (public/images/catalogue),
// used until real product photos arrive.
// Usage: node scripts/catalogue-images.mjs
import { mkdirSync, writeFileSync } from "node:fs"

const out = "public/images/catalogue"
mkdirSync(out, { recursive: true })

const ORANGE = "#f95312"
const CARBON = "#111412"
const GREY = "#c4c7c9"

function frame(body, { bg = "#f4f3ee" } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <radialGradient id="glow" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="${bg}"/></radialGradient>
  </defs>
  <rect width="800" height="800" fill="url(#glow)"/>
  ${body}
</svg>`
}

const drawings = {
  "kart": frame(`
    <g transform="translate(400 430)">
      <rect x="-260" y="-30" width="520" height="40" rx="20" fill="${CARBON}"/>
      <path d="M-210 -40 L-120 -110 L120 -110 L210 -40 Z" fill="${ORANGE}"/>
      <path d="M-60 -110 L-20 -190 L40 -190 L60 -110 Z" fill="${CARBON}"/>
      <circle cx="10" cy="-205" r="26" fill="${GREY}" stroke="${CARBON}" stroke-width="8"/>
      <rect x="-300" y="-10" width="80" height="40" rx="10" fill="${ORANGE}"/>
      <rect x="220" y="-10" width="80" height="40" rx="10" fill="${ORANGE}"/>
      <circle cx="-190" cy="40" r="62" fill="${CARBON}"/><circle cx="-190" cy="40" r="26" fill="${GREY}"/>
      <circle cx="190" cy="40" r="72" fill="${CARBON}"/><circle cx="190" cy="40" r="30" fill="${GREY}"/>
    </g>`),
  "chassis": frame(`
    <g transform="translate(400 400)" fill="none" stroke="${CARBON}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round">
      <path d="M-220 -160 L220 -160 L260 160 L-260 160 Z"/>
      <path d="M-120 -160 L-150 160 M120 -160 L150 160 M-240 0 L240 0"/>
      <circle cx="0" cy="0" r="40" stroke="${ORANGE}"/>
    </g>`),
  "steering-wheel": frame(`
    <g transform="translate(400 410)">
      <circle r="230" fill="none" stroke="${CARBON}" stroke-width="54"/>
      <rect x="-230" y="-26" width="460" height="52" rx="26" fill="${CARBON}"/>
      <rect x="-26" y="0" width="52" height="220" rx="26" fill="${CARBON}"/>
      <circle r="70" fill="${ORANGE}"/><circle r="22" fill="${GREY}"/>
    </g>`),
  "brake-disc": frame(`
    <g transform="translate(400 410)">
      <circle r="250" fill="${GREY}" stroke="${CARBON}" stroke-width="10"/>
      ${Array.from({ length: 12 }, (_, i) => `<circle cx="${Math.cos((i / 12) * Math.PI * 2) * 180}" cy="${Math.sin((i / 12) * Math.PI * 2) * 180}" r="14" fill="${CARBON}" opacity="0.6"/>`).join("")}
      <circle r="110" fill="${ORANGE}"/><circle r="40" fill="#f4f3ee"/>
    </g>`),
  "sprocket": frame(`
    <g transform="translate(400 410)">
      ${Array.from({ length: 36 }, (_, i) => `<rect x="-14" y="-262" width="28" height="44" rx="6" fill="${CARBON}" transform="rotate(${i * 10})"/>`).join("")}
      <circle r="225" fill="${CARBON}"/>
      <circle r="150" fill="${ORANGE}"/>
      ${Array.from({ length: 6 }, (_, i) => `<circle cx="${Math.cos((i / 6) * Math.PI * 2) * 95}" cy="${Math.sin((i / 6) * Math.PI * 2) * 95}" r="20" fill="#f4f3ee"/>`).join("")}
      <circle r="40" fill="#f4f3ee"/>
    </g>`),
  "seat": frame(`
    <g transform="translate(400 420)">
      <path d="M-170 -220 C-170 -280 170 -280 170 -220 L150 140 C140 220 -140 220 -150 140 Z" fill="${CARBON}"/>
      <path d="M-120 -170 C-120 -210 120 -210 120 -170 L105 110 C95 160 -95 160 -105 110 Z" fill="#2a2e2b"/>
      <rect x="-150" y="-40" width="300" height="24" fill="${ORANGE}"/>
    </g>`),
  "chain": frame(`
    <g transform="translate(400 400)" fill="none" stroke="${CARBON}" stroke-width="20">
      ${Array.from({ length: 7 }, (_, i) => `<rect x="${-330 + i * 92}" y="-40" width="110" height="80" rx="40" ${i % 2 ? `stroke="${ORANGE}"` : ""}/>`).join("")}
    </g>`),
  "nose-cone": frame(`
    <g transform="translate(400 430)">
      <path d="M-290 60 C-280 -60 -150 -150 0 -150 C150 -150 280 -60 290 60 Z" fill="${ORANGE}"/>
      <path d="M-290 60 L290 60 L260 110 L-260 110 Z" fill="${CARBON}"/>
      <rect x="-80" y="-90" width="160" height="70" rx="12" fill="#ffffff" opacity="0.85"/>
    </g>`),
  "tyres": frame(`
    <g transform="translate(400 420)">
      <ellipse cx="-110" cy="0" rx="150" ry="220" fill="${CARBON}"/><ellipse cx="-110" cy="0" rx="70" ry="110" fill="${GREY}"/>
      <ellipse cx="120" cy="20" rx="150" ry="220" fill="#2a2e2b"/><ellipse cx="120" cy="20" rx="70" ry="110" fill="${GREY}"/>
      <rect x="-30" y="-12" width="60" height="24" fill="${ORANGE}"/>
    </g>`),
  "hoodie": frame(`
    <g transform="translate(400 430)">
      <path d="M-120 -240 C-60 -290 60 -290 120 -240 L260 -170 L300 60 L220 80 L200 -60 L200 230 L-200 230 L-200 -60 L-220 80 L-300 60 L-260 -170 Z" fill="${CARBON}"/>
      <path d="M-100 -240 C-60 -170 60 -170 100 -240 C60 -300 -60 -300 -100 -240 Z" fill="#2a2e2b"/>
      <rect x="-130" y="60" width="260" height="90" rx="20" fill="#2a2e2b"/>
      <text x="0" y="10" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="58" font-weight="900" fill="${ORANGE}">LUCAS</text>
    </g>`),
  "tshirt": frame(`
    <g transform="translate(400 430)">
      <path d="M-110 -230 C-60 -200 60 -200 110 -230 L290 -150 L240 -40 L180 -70 L180 230 L-180 230 L-180 -70 L-240 -40 L-290 -150 Z" fill="${CARBON}"/>
      <text x="0" y="0" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="58" font-weight="900" fill="${ORANGE}">LUCAS</text>
    </g>`),
  "polo": frame(`
    <g transform="translate(400 430)">
      <path d="M-110 -230 L-40 -200 L0 -130 L40 -200 L110 -230 L290 -150 L240 -40 L180 -70 L180 230 L-180 230 L-180 -70 L-240 -40 L-290 -150 Z" fill="#f4f3ee" stroke="${CARBON}" stroke-width="10"/>
      <path d="M-40 -200 L0 -130 L40 -200 L0 -215 Z" fill="${ORANGE}"/>
      <circle cx="0" cy="-90" r="8" fill="${CARBON}"/><circle cx="0" cy="-55" r="8" fill="${CARBON}"/>
      <text x="110" y="-60" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="26" font-weight="900" fill="${ORANGE}">LUCAS</text>
    </g>`),
  "cap": frame(`
    <g transform="translate(400 450)">
      <path d="M-230 40 C-230 -170 230 -170 230 40 Z" fill="${CARBON}"/>
      <path d="M-40 40 C60 40 260 50 330 110 C230 120 40 100 -40 80 Z" fill="#2a2e2b"/>
      <text x="0" y="-20" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="48" font-weight="900" fill="${ORANGE}">LUCAS</text>
    </g>`),
  "fairing": frame(`
    <g transform="translate(400 430)">
      <path d="M-300 80 L-240 -120 L240 -120 L300 80 Z" fill="${GREY}" stroke="${CARBON}" stroke-width="10"/>
      <path d="M-240 -120 L-200 -40 L200 -40 L240 -120 Z" fill="#ffffff" opacity="0.6"/>
      <circle cx="-120" cy="20" r="26" fill="${CARBON}"/><circle cx="120" cy="20" r="26" fill="${CARBON}"/>
    </g>`, { bg: "#e8e7e0" }),
  "side-pods": frame(`
    <g transform="translate(400 420)">
      <path d="M-320 60 C-320 -60 -200 -110 -60 -110 L-60 110 L-280 110 Z" fill="${GREY}" stroke="${CARBON}" stroke-width="10"/>
      <path d="M320 60 C320 -60 200 -110 60 -110 L60 110 L280 110 Z" fill="${GREY}" stroke="${CARBON}" stroke-width="10"/>
    </g>`, { bg: "#e8e7e0" }),
  "wheel-cover": frame(`
    <g transform="translate(400 410)">
      <circle r="230" fill="none" stroke="${GREY}" stroke-width="70"/>
      <circle r="230" fill="none" stroke="${CARBON}" stroke-width="6" stroke-dasharray="14 18"/>
    </g>`, { bg: "#e8e7e0" }),
  "race-suit": frame(`
    <g transform="translate(400 420)">
      <path d="M-90 -290 L90 -290 L120 -240 L250 -170 L280 40 L200 50 L170 -60 L150 60 L130 300 L20 300 L0 80 L-20 300 L-130 300 L-150 60 L-170 -60 L-200 50 L-280 40 L-250 -170 L-120 -240 Z" fill="#14254d"/>
      <path d="M-250 -170 L-120 -240 L-60 -120 L-170 -60 Z M250 -170 L120 -240 L60 -120 L170 -60 Z" fill="${ORANGE}"/>
      <rect x="-150" y="20" width="300" height="34" fill="#ffffff"/>
    </g>`),
  "gloves": frame(`
    <g transform="translate(400 430)">
      <path d="M-60 220 L-60 -20 L-90 -170 C-95 -200 -55 -210 -50 -180 L-25 -60 L-25 -230 C-25 -260 15 -260 15 -230 L15 -60 L35 -220 C40 -250 80 -245 75 -215 L55 -50 L95 -170 C105 -200 140 -190 132 -160 L90 20 L90 220 Z" fill="${CARBON}"/>
      <rect x="-70" y="150" width="170" height="60" rx="10" fill="${ORANGE}"/>
    </g>`),
  "boots": frame(`
    <g transform="translate(400 430)">
      <path d="M-200 -220 L-60 -220 L-50 60 L160 90 C220 100 240 160 220 200 L-210 200 Z" fill="${CARBON}"/>
      <rect x="-210" y="170" width="430" height="30" fill="${ORANGE}"/>
      <path d="M-190 -120 L-70 -120 M-190 -60 L-70 -60" stroke="#ffffff" stroke-width="14"/>
    </g>`),
}

for (const [name, svg] of Object.entries(drawings)) writeFileSync(`${out}/${name}.svg`, svg)
console.log(`Wrote ${Object.keys(drawings).length} product illustrations to ${out}`)
