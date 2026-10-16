/**
 * Renders the helmet preview SVG to a watermarked PNG and downloads it.
 * Runs in the browser only.
 */
export async function downloadPreviewImage(svg: SVGSVGElement, fileName: string, caption: string): Promise<void> {
  const width = 1600
  const height = 1200
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute("width", String(width * 0.8))
  clone.setAttribute("height", String(height * 0.6))
  await inlineImages(clone)
  const markup = new XMLSerializer().serializeToString(clone)
  const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml;charset=utf-8" }))

  try {
    const image = await loadImage(url)
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Canvas is not supported")

    const background = context.createRadialGradient(width / 2, height * 0.4, 50, width / 2, height * 0.4, width * 0.7)
    background.addColorStop(0, "#ffffff")
    background.addColorStop(1, "#e3e2da")
    context.fillStyle = background
    context.fillRect(0, 0, width, height)
    context.drawImage(image, width * 0.1, height * 0.12, width * 0.8, height * 0.6)

    context.fillStyle = "#111412"
    context.font = "700 64px 'Barlow Condensed', 'Arial Narrow', sans-serif"
    context.fillText(caption.toUpperCase(), 80, height - 130)
    context.fillStyle = "#5c635d"
    context.font = "500 28px system-ui, sans-serif"
    context.fillText("Designed with Lucas Racing by HydroKarts", 80, height - 80)

    // Unpaid previews are watermarked.
    context.save()
    context.translate(width / 2, height * 0.45)
    context.rotate(-0.35)
    context.fillStyle = "rgba(17, 20, 18, 0.08)"
    context.font = "700 72px 'Barlow Condensed', 'Arial Narrow', sans-serif"
    context.textAlign = "center"
    context.fillText("LUCAS RACING · UNPAID PREVIEW", 0, 0)
    context.restore()

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
    if (!blob) throw new Error("Could not create the image")
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = fileName
    link.click()
    setTimeout(() => URL.revokeObjectURL(link.href), 1000)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** An SVG drawn onto a canvas can't fetch outside images, so film photos are embedded first. */
async function inlineImages(svg: SVGSVGElement): Promise<void> {
  await Promise.all(
    Array.from(svg.querySelectorAll("image")).map(async (image) => {
      const href = image.getAttribute("href")
      if (!href || href.startsWith("data:")) return
      const blob = await (await fetch(href)).blob()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(blob)
      })
      image.setAttribute("href", dataUrl)
    }),
  )
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Could not load the preview"))
    image.src = src
  })
}
