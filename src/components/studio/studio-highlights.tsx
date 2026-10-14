const highlights = [
  { title: "Design freely", body: "Every tool is open to explore. No sign-up needed to design." },
  { title: "Share your build", body: "Copy a link or download a watermarked image for social media." },
  { title: "Approve the proof", body: "You sign off the exact design before anything is masked or dipped." },
]

export function StudioHighlights() {
  return (
    <ol className="grid gap-6 border-b border-carbon/10 pb-10 sm:grid-cols-3">
      {highlights.map((item, index) => (
        <li key={item.title} className="flex gap-4">
          <span className="font-display text-4xl font-bold leading-none text-carbon/30">{String(index + 1).padStart(2, "0")}</span>
          <span className="border-l border-carbon/10 pl-4">
            <span className="block font-semibold">{item.title}</span>
            <span className="mt-1 block text-sm text-muted-foreground">{item.body}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}
