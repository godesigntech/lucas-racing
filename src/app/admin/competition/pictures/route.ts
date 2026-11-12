import { zipSync } from "fflate"

import { getAdminCompetition, getCompetitionPictures } from "@/lib/data/competition"

/**
 * Every eligible entry's picture in one zip, numbered 01, 02… and without names, for the
 * anonymous vote on Facebook. The numbers match the Vote & prizes tab in admin.
 */
export async function GET() {
  const competition = await getAdminCompetition()
  if (!competition) return new Response("No competition", { status: 404 })
  const pictures = await getCompetitionPictures(competition.id)
  const width = String(Math.max(2, pictures.length)).length
  const files: Record<string, Uint8Array> = {}
  const queue = pictures.filter((picture) => picture.url)
  // Eight downloads at a time: quick, without opening hundreds of connections at once.
  await Promise.all(
    Array.from({ length: Math.min(8, queue.length) }, async () => {
      for (let picture = queue.shift(); picture; picture = queue.shift()) {
        const response = await fetch(picture.url as string)
        if (response.ok) files[`${String(picture.number).padStart(width, "0")}.jpg`] = new Uint8Array(await response.arrayBuffer())
      }
    }),
  )
  if (Object.keys(files).length === 0) return new Response("No pictures yet", { status: 404 })
  // JPEGs are already compressed: store them as they are.
  const zip = zipSync(files, { level: 0 })
  return new Response(new Blob([zip as BlobPart]), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="competition-designs.zip"`,
      "Cache-Control": "no-store",
    },
  })
}
