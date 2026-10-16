"use client"

import { useRef, useState } from "react"
import { Bold, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Loader2, Quote } from "lucide-react"
import { toast } from "react-toastify"

import { NewsMarkdown } from "@/components/news/news-markdown"
import { uploadNewsImage } from "@/lib/news/news-image"
import { cn } from "@/lib/utils"

interface MarkdownEditorProps {
  id: string
  value: string
  onChange: (value: string) => void
  invalid?: boolean
  describedBy?: string
}

type Edit = { before: string; after?: string; placeholder: string; line?: boolean }

const tools: { label: string; icon: typeof Bold; edit: Edit }[] = [
  { label: "Heading", icon: Heading2, edit: { before: "## ", placeholder: "Heading", line: true } },
  { label: "Subheading", icon: Heading3, edit: { before: "### ", placeholder: "Subheading", line: true } },
  { label: "Bold", icon: Bold, edit: { before: "**", after: "**", placeholder: "bold text" } },
  { label: "Italic", icon: Italic, edit: { before: "_", after: "_", placeholder: "italic text" } },
  { label: "Link", icon: Link2, edit: { before: "[", after: "](https://)", placeholder: "link text" } },
  { label: "Bulleted list", icon: List, edit: { before: "- ", placeholder: "List item", line: true } },
  { label: "Numbered list", icon: ListOrdered, edit: { before: "1. ", placeholder: "List item", line: true } },
  { label: "Quote", icon: Quote, edit: { before: "> ", placeholder: "Quote", line: true } },
]

/**
 * Markdown with a toolbar and a live preview that matches the website. Photos are
 * resized in the browser and uploaded, then added where the cursor is.
 */
export function MarkdownEditor({ id, value, onChange, invalid, describedBy }: MarkdownEditorProps) {
  const area = useRef<HTMLTextAreaElement>(null)
  const file = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<"write" | "preview">("write")
  const [uploading, setUploading] = useState(false)

  function apply({ before, after = "", placeholder, line }: Edit) {
    const element = area.current
    if (!element) return
    const start = element.selectionStart
    const end = element.selectionEnd
    const selected = value.slice(start, end) || placeholder
    // Line formats start on a new line.
    const prefix = line && start > 0 && value[start - 1] !== "\n" ? `\n\n${before}` : before
    const next = `${value.slice(0, start)}${prefix}${selected}${after}${value.slice(end)}`
    onChange(next)
    requestAnimationFrame(() => {
      element.focus()
      const from = start + prefix.length
      element.setSelectionRange(from, from + selected.length)
    })
  }

  async function addImage(chosen: File | undefined) {
    if (!chosen) return
    setUploading(true)
    try {
      const url = await uploadNewsImage(chosen)
      const alt = chosen.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ")
      const position = area.current?.selectionStart ?? value.length
      const snippet = `${position > 0 ? "\n\n" : ""}![${alt}](${url})\n\n`
      onChange(`${value.slice(0, position)}${snippet}${value.slice(position)}`)
      toast.success("Photo added. Edit the words in [ ] to describe it.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The photo didn't upload.")
    } finally {
      setUploading(false)
      if (file.current) file.current.value = ""
    }
  }

  return (
    <div className={cn("overflow-hidden rounded-2xl border bg-card", invalid ? "border-destructive" : "border-input")}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-carbon/10 bg-carbon/[0.03] px-2 py-1.5">
        <div className="flex flex-wrap items-center gap-0.5" role="toolbar" aria-label="Formatting">
          {tools.map(({ label, icon: Icon, edit }) => (
            <button
              key={label}
              type="button"
              title={label}
              aria-label={label}
              disabled={mode === "preview"}
              onClick={() => apply(edit)}
              className="grid size-9 place-items-center rounded-lg text-carbon/70 transition-colors hover:bg-carbon/5 hover:text-carbon disabled:opacity-40"
            >
              <Icon className="size-4" aria-hidden />
            </button>
          ))}
          <button
            type="button"
            title="Add a photo"
            aria-label="Add a photo"
            disabled={mode === "preview" || uploading}
            onClick={() => file.current?.click()}
            className="grid size-9 place-items-center rounded-lg text-carbon/70 transition-colors hover:bg-carbon/5 hover:text-carbon disabled:opacity-40"
          >
            {uploading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}
          </button>
          <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} onChange={(event) => addImage(event.target.files?.[0])} />
        </div>
        <div className="flex rounded-full bg-carbon/5 p-0.5 text-sm font-medium" role="tablist" aria-label="Editor view">
          {(["write", "preview"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={mode === tab}
              onClick={() => setMode(tab)}
              className={cn("rounded-full px-3.5 py-1.5 capitalize transition-colors", mode === tab ? "bg-card shadow-sm" : "text-muted-foreground hover:text-carbon")}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {mode === "write" ? (
        <textarea
          ref={area}
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          rows={22}
          placeholder={"Write the article here.\n\nStart a new paragraph with a blank line. Use the toolbar for headings, lists, links and photos."}
          className="block min-h-[26rem] w-full resize-y bg-transparent p-4 font-mono text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
        />
      ) : (
        <div className="min-h-[26rem] p-5 sm:p-8">
          {value.trim() ? <NewsMarkdown>{value}</NewsMarkdown> : <p className="text-muted-foreground">Nothing to preview yet.</p>}
        </div>
      )}
    </div>
  )
}
