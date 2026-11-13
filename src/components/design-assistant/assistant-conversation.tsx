"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle2, FileText, RotateCcw, Sparkles } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { analyseDesignBrief } from "@/lib/actions/design-assistant"
import type { PreparedPhoto } from "@/lib/design-assistant/photo"
import type { DesignAnalysis } from "@/types/design-assistant"

import { ConceptDetails, MatchingTemplates } from "./analysis-card"
import { AssistantStage } from "./assistant-stage"
import { BriefForm } from "./brief-form"
import { useConceptImage } from "./concept-image"
import { QuoteForm } from "./quote-form"

type Stage = "brief" | "analysing" | "result" | "quote" | "sent"

interface AssistantConversationProps {
  /** Called when a link takes the customer to another page. */
  onNavigate?: () => void
}

/** On phones the columns stack: bring the result into view. */
function showResult() {
  if (window.matchMedia("(max-width: 1023px)").matches) document.getElementById("ai-result")?.scrollIntoView({ behavior: "smooth", block: "start" })
}

/**
 * The AI designer in two columns: the brief (photo and description) on the left, the
 * result on the right (concept picture, colours, quote), and the templates from our
 * range that match it underneath. The brief stays editable to try again.
 */
export function AssistantConversation({ onNavigate }: AssistantConversationProps) {
  const [stage, setStage] = useState<Stage>("brief")
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null)
  const [note, setNote] = useState("")
  const [analysis, setAnalysis] = useState<DesignAnalysis | null>(null)
  const [reference, setReference] = useState("")
  const [briefKey, setBriefKey] = useState(0)
  const conceptImage = useConceptImage()

  async function analyse(nextPhoto: PreparedPhoto | null, nextNote: string) {
    const previous = stage
    setPhoto(nextPhoto)
    setNote(nextNote)
    setStage("analysing")
    conceptImage.reset()
    showResult()
    try {
      const result = await analyseDesignBrief({ palette: nextPhoto?.palette ?? [], note: nextNote, photo: nextPhoto?.aiDataUrl })
      // There are no form fields to highlight here, so surface the specific reason.
      if (!result.ok) throw new Error(Object.values(result.fieldErrors ?? {})[0] ?? result.message)
      if (!result.data) throw new Error()
      setAnalysis(result.data)
      setStage("result")
      // With AI set up, paint a concept image of the redesign while they look at the templates.
      if (result.data.imageAvailable) {
        void conceptImage.start({ photo: nextPhoto?.aiDataUrl, note: nextNote, summary: result.data.summary, number: result.data.concept.number, concept: result.data.concept })
      }
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : "Something went wrong. Please try again.")
      setStage(analysis && previous !== "brief" ? "result" : "brief")
    }
  }

  function paintAgain() {
    if (!analysis) return
    void conceptImage.start({ photo: photo?.aiDataUrl, note, summary: analysis.summary, number: analysis.concept.number, concept: analysis.concept })
  }

  function restart() {
    if (photo) URL.revokeObjectURL(photo.previewUrl)
    conceptImage.reset()
    setPhoto(null)
    setNote("")
    setAnalysis(null)
    setReference("")
    setStage("brief")
    // A fresh brief form (its photo and text are its own).
    setBriefKey((key) => key + 1)
    document.getElementById("assistant")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const hasResult = analysis !== null && stage !== "brief" && stage !== "analysing"
  const painting = conceptImage.state.status === "working"

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start lg:gap-8">
        <section aria-labelledby="ai-designer-title" className="flex min-w-0 flex-col rounded-[1.75rem] border border-carbon/10 bg-card lg:sticky lg:top-24">
          <header className="flex items-start justify-between gap-3 border-b border-carbon/10 px-5 py-5 sm:px-6">
            <div className="min-w-0">
              <p className="eyebrow text-muted-foreground">AI helmet designer</p>
              <h1 id="ai-designer-title" className="mt-1 font-display text-3xl font-bold uppercase leading-none sm:text-4xl">
                Design my helmet
              </h1>
            </div>
            <p className="shrink-0 text-right">
              <span className="block font-display text-2xl font-bold uppercase leading-none sm:text-3xl">Free</span>
              <span className="text-xs text-muted-foreground">Unlimited changes</span>
            </p>
          </header>

          <div className="px-5 py-5 sm:px-6">
            <BriefForm key={briefKey} onSubmit={analyse} busy={stage === "analysing" || painting} submitLabel={analysis ? "Update my design" : "Design my helmet"} />
          </div>

          <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 rounded-b-[1.75rem] border-t border-carbon/10 px-5 py-3 text-sm sm:px-6">
            <span className="text-muted-foreground">Prefer to choose every colour yourself?</span>
            <Link href="/helmet-builder" onClick={onNavigate} className="inline-flex items-center gap-1 font-semibold text-brand-ink hover:underline">
              Open the 3D builder <ArrowRight className="size-4" aria-hidden />
            </Link>
          </footer>
        </section>

        <div id="ai-result" className="min-w-0 scroll-mt-24 space-y-4" aria-live="polite">
          <AssistantStage concept={conceptImage.state} analysing={stage === "analysing"} photo={hasResult ? photo : null} onRetry={paintAgain} />

          {hasResult && analysis && (
            <div className="space-y-5 rounded-[1.75rem] border border-carbon/10 bg-card p-5 sm:p-6">
              {stage === "sent" ? (
                <div className="text-center">
                  <CheckCircle2 className="mx-auto size-9 text-brand-ink" aria-hidden />
                  <h2 className="mt-2 font-display text-3xl font-bold uppercase">Request sent</h2>
                  <p className="mt-1 text-sm">
                    Your reference is <strong className="font-semibold">{reference}</strong>. The workshop will email you with a price and a proof,
                    usually within one working day.
                  </p>
                  <Button variant="secondary" className="mt-4" onClick={restart}>
                    <Sparkles aria-hidden /> Design another
                  </Button>
                </div>
              ) : stage === "quote" ? (
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
              ) : (
                <>
                  <ConceptDetails analysis={analysis} />
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button className="sm:flex-1" onClick={() => setStage("quote")} disabled={painting}>
                      <FileText aria-hidden /> Get a quote for this design
                    </Button>
                    <Button variant="outline" onClick={restart}>
                      <RotateCcw aria-hidden /> Start again
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Not quite right? Change your description on the left and press &ldquo;Update my design&rdquo;, or use &ldquo;New version&rdquo; under
                    the picture.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {hasResult && analysis && <MatchingTemplates analysis={analysis} onNavigate={onNavigate} />}
    </div>
  )
}
