// How much of the helmet shell each template colour zone covers, from its mask. Dips and
// prints are priced by coverage (a zone covering 30% costs 30% of a whole-helmet dip), so
// this writes the shares as SQL for a migration.
//
//   node --env-file=.env.local scripts/compute-zone-coverage.mjs > coverage.sql

import { createRequire } from "node:module"
import path from "node:path"

import sharp from "sharp"

const require = createRequire(import.meta.url)
const pg = require("pg")

const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } })
await client.connect()
const { rows } = await client.query(`
  select t.product_slug, r.key, r.mask_url
  from public.template_regions r
  join public.design_templates t on t.id = r.template_id
  where t.is_active and r.kind = 'fill' and r.mask_url like '/models/%'
  order by t.product_slug, r.sort_order`)
await client.end()

const bySlug = new Map()
for (const row of rows) {
  if (!bySlug.has(row.product_slug)) bySlug.set(row.product_slug, [])
  bySlug.get(row.product_slug).push(row)
}

const lines = []
for (const [slug, zones] of bySlug) {
  const masks = await Promise.all(
    zones.map((zone) => sharp(path.join("public", zone.mask_url)).extractChannel(0).raw().toBuffer({ resolveWithObject: true })),
  )
  const size = masks[0].data.length
  // The shell is everything any zone covers; each zone's share is its part of that.
  let shell = 0
  const totals = new Array(masks.length).fill(0)
  for (let index = 0; index < size; index++) {
    let union = 0
    masks.forEach(({ data }, zone) => {
      totals[zone] += data[index]
      if (data[index] > union) union = data[index]
    })
    shell += union
  }
  zones.forEach((zone, index) => {
    const share = Math.min(1, totals[index] / shell)
    lines.push(`  ('${slug}', '${zone.key}', ${share.toFixed(4)}),`)
  })
}
console.log(lines.join("\n").replace(/,$/, ""))
