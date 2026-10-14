"use client"

import { useEffect, useId, useRef, useState } from "react"
import { ImagePlus, SendHorizontal, X } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { CHAT_IMAGE_ACCEPT, validateChatImage } from "@/lib/chat/attachments"
import { cn } from "@/lib/utils"
import { CHAT_MESSAGE_MAX } from "@/lib/validations/chat"

interface ChatComposerProps {
  onSend: (body: string, file: File | null) => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

/** Message box with photo attach. Enter sends, Shift+Enter adds a new line, pasted images attach. */
export function ChatComposer({ onSend, placeholder = "Write a message…", autoFocus, className }: ChatComposerProps) {
  const inputId = useId()
  const [body, setBody] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) textarea.current?.focus()
  }, [autoFocus])

  // Free the preview's memory when it's replaced or the composer unmounts.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function attach(picked: File | undefined) {
    if (!picked) return
    const problem = validateChatImage(picked)
    if (problem) {
      toast.error(problem)
      return
    }
    setFile(picked)
    setPreviewUrl(URL.createObjectURL(picked))
    textarea.current?.focus()
  }

  function clearAttachment() {
    setFile(null)
    setPreviewUrl(null)
    if (fileInput.current) fileInput.current.value = ""
  }

  const trimmed = body.trim()
  const tooLong = body.length > CHAT_MESSAGE_MAX
  const canSend = (trimmed.length > 0 || file !== null) && !tooLong

  function submit() {
    if (!canSend) return
    onSend(trimmed, file)
    setBody("")
    clearAttachment()
    textarea.current?.focus()
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className={cn("border-t border-carbon/10 bg-card p-3", className)}
    >
      {previewUrl && (
        <div className="mb-2 flex items-center gap-3 rounded-2xl bg-carbon/[0.04] p-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- local preview of a picked file */}
          <img src={previewUrl} alt="" className="size-14 rounded-xl object-cover" />
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{file?.name}</p>
          <Button type="button" variant="ghost" size="icon-sm" onClick={clearAttachment} aria-label="Remove photo">
            <X />
          </Button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <input
          ref={fileInput}
          type="file"
          accept={CHAT_IMAGE_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => attach(event.target.files?.[0])}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground"
          onClick={() => fileInput.current?.click()}
          aria-label="Add a photo"
        >
          <ImagePlus className="size-5" />
        </Button>
        <label htmlFor={inputId} className="sr-only">
          Message
        </label>
        <textarea
          id={inputId}
          ref={textarea}
          rows={1}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault()
              submit()
            }
          }}
          onPaste={(event) => {
            const pasted = Array.from(event.clipboardData.files).find((item) => item.type.startsWith("image/"))
            if (pasted) {
              event.preventDefault()
              attach(pasted)
            }
          }}
          placeholder={placeholder}
          aria-invalid={tooLong || undefined}
          className="field-sizing-content max-h-32 min-h-10 flex-1 resize-none rounded-2xl border border-input bg-paper px-3.5 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive md:text-sm"
        />
        <Button type="submit" size="icon" className="shrink-0" disabled={!canSend} aria-label="Send message">
          <SendHorizontal />
        </Button>
      </div>
      {tooLong && (
        <p className="mt-1.5 px-1 text-xs font-medium text-destructive">
          Keep messages under {CHAT_MESSAGE_MAX.toLocaleString("en-GB")} characters.
        </p>
      )}
    </form>
  )
}
