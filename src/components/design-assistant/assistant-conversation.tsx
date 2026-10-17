"use client"

import { useEffect, useRef, useState } from "react"
import { CheckCircle2, Sparkles } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { analyseDesignBrief } from "@/lib/actions/design-assistant"
import type { PreparedPhoto } from "@/lib/design-assistant/photo"
import type { DesignAnalysis } from "@/types/design-assistant"

import { AnalysisCard } from "./analysis-card"
import { AssistantBubble, TypingDots } from "./assistant-bubble"
import { BriefForm } from "./brief-form"
import { ConceptImage, useConceptImage } from "./concept-image"
import { QuoteForm } from "./quote-form"

type Stage = "brief" | "analysing" | "result" | "quote" | "sent"

interface AssistantConversationProps {
  /** Called when a link takes the customer to another page. */
  onNavigate: () => void
}

/** The assistant's steps, shown as a conversation: brief → concept → quote → done. */
export function AssistantConversation({ onNavigate }: AssistantConversationProps) {
  const [stage, setStage] = useState<Stage>("brief")
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null)
  const [note, setNote] = useState("")
  const [analysis, setAnalysis] = useState<DesignAnalysis | null>(null)
  const [reference, setReference] = useState("")
  const conceptImage = useConceptImage()
  const scroller = useRef<HTMLDivElement>(null)

  // Bring each new step into view.
  useEffect(() => {
    const element = scroller.current
    if (element) element.scrollTo({ top: element.scrollHeight, behavior: "smooth" })
  }, [stage])

  async function analyse(nextPhoto: PreparedPhoto | null, nextNote: string) {
    setPhoto(nextPhoto)
    setNote(nextNote)
    setStage("analysing")
    try {
      const result = await analyseDesignBrief({ palette: nextPhoto?.palette ?? [], note: nextNote, photo: nextPhoto?.aiDataUrl })
      // This step has no form fields to highlight, so surface the specific reason.
      if (!result.ok) throw new Error(Object.values(result.fieldErrors ?? {})[0] ?? result.message)
      if (!result.data) throw new Error()
      setAnalysis(result.data)
      setStage("result")
      // With AI set up, paint a concept image of the redesign while they browse the suggestions.
      if (result.data.imageAvailable) {
        void conceptImage.start({ photo: nextPhoto?.aiDataUrl, note: nextNote, summary: result.data.summary, number: result.data.concept.number, concept: result.data.concept })
      }
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : "Something went wrong. Please try again.")
      setStage("brief")
    }
  }

  function paintAgain() {
    if (!analysis) return
    void conceptImage.start({ photo: photo?.aiDataUrl, note, summary: analysis.summary, number: analysis.concept.number, concept: analysis.concept })
  }

  function restart() {
    conceptImage.reset()
    if (photo) URL.revokeObjectURL(photo.previewUrl)
    setPhoto(null)
    setNote("")
    setAnalysis(null)
    setReference("")
    setStage("brief")
  }

  return (
    <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-paper px-4 py-5">
      <div className="flex min-h-full flex-col justify-end gap-4" aria-live="polite">
        <AssistantBubble>
          <p className="font-semibold">Let&apos;s design your helmet</p>
          <p className="mt-1 text-carbon/80">
            Add a photo of your helmet or a design you like, and tell me anything you have in mind. I&apos;ll sketch a
            concept in your colours and show you our closest designs.
          </p>
        </AssistantBubble>

        {stage === "brief" ? (
          <BriefForm onSubmit={analyse} />
        ) : (
          <div className="ml-auto flex max-w-[85%] flex-col items-end gap-1.5">
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element -- local preview of the customer's photo
              <img src={photo.previewUrl} alt="Your photo" className="max-h-40 rounded-3xl rounded-br-lg object-cover" />
            )}
            {note && <p className="rounded-3xl rounded-br-lg bg-carbon px-4 py-2.5 text-sm text-paper">{note}</p>}
          </div>
        )}

        {stage === "analysing" && (
          <AssistantBubble>
            <span className="flex items-center gap-2">
              <TypingDots /> Sketching your concept…
            </span>
          </AssistantBubble>
        )}

        {analysis && (stage === "result" || stage === "quote" || stage === "sent") && (
          <>
            <AssistantBubble>
              {conceptImage.state.status === "idle"
                ? "Here's a concept in your colours, plus the designs closest to it."
                : "Here's an AI concept of your helmet, plus our templates closest to it. Pick one to request a quote."}
            </AssistantBubble>
            <ConceptImage state={conceptImage.state} onRetry={paintAgain} />
            <AnalysisCard
              analysis={analysis}
              showActions={stage === "result"}
              onQuote={() => setStage("quote")}
              onRestart={restart}
              onNavigate={onNavigate}
            />
          </>
        )}

        {stage === "quote" && analysis && (
          <QuoteForm
            photo={photo}
            note={note}
            analysis={analysis}
            aiImage={conceptImage.state.status === "done" ? conceptImage.state.image : null}
            onBack={() => setStage("result")}
            onSent={(value) => {
              setReference(value)
              setStage("sent")
            }}
          />
        )}

        {stage === "sent" && (
          <div className="rounded-3xl border border-brand-ink/20 bg-accent p-5 text-center">
            <CheckCircle2 className="mx-auto size-8 text-brand-ink" aria-hidden />
            <h3 className="mt-2 font-display text-2xl font-bold uppercase">Request sent</h3>
            <p className="mt-1 text-sm">
              Your reference is <strong className="font-semibold">{reference}</strong>. The workshop will email you with a
              price and a proof, usually within one working day.
            </p>
            <Button variant="secondary" className="mt-4" onClick={restart}>
              <Sparkles aria-hidden /> Design another
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
