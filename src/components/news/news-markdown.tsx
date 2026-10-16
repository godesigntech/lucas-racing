import Markdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

const components: Components = {
  h2: ({ children }) => <h2 className="mt-12 font-display text-3xl font-bold uppercase leading-tight sm:text-4xl">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-10 font-display text-2xl font-bold uppercase leading-tight">{children}</h3>,
  h4: ({ children }) => <h4 className="mt-8 text-lg font-semibold">{children}</h4>,
  p: ({ children }) => <p className="mt-5 leading-[1.8]">{children}</p>,
  a: ({ href, children }) => {
    const external = Boolean(href && /^https?:\/\//.test(href) && !href.includes("lucasracing.co.uk"))
    return (
      <a
        href={href}
        className="font-medium text-brand-ink underline decoration-brand/40 underline-offset-4 transition-colors hover:decoration-brand"
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    )
  },
  ul: ({ children }) => <ul className="mt-5 list-disc space-y-2 pl-6 marker:text-brand">{children}</ul>,
  ol: ({ children }) => <ol className="mt-5 list-decimal space-y-2 pl-6 marker:font-semibold marker:text-brand-ink">{children}</ol>,
  li: ({ children }) => <li className="pl-1 leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="mt-8 border-l-4 border-brand bg-accent/50 py-2 pl-5 pr-4 font-display text-xl font-semibold uppercase leading-snug text-carbon [&>p]:mt-2">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-10 border-carbon/10" />,
  strong: ({ children }) => <strong className="font-semibold text-carbon">{children}</strong>,
  // Photos added in the editor are stored in our bucket; sizes are unknown, so a plain lazy image.
  img: ({ src, alt }) => (
    <span className="mt-8 block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" decoding="async" className="w-full rounded-2xl bg-carbon/5" />
      {alt && <span className="mt-2 block text-center text-sm text-muted-foreground">{alt}</span>}
    </span>
  ),
  table: ({ children }) => (
    <div className="mt-8 overflow-x-auto rounded-2xl border border-carbon/10">
      <table className="w-full min-w-[28rem] text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-carbon text-paper">{children}</thead>,
  th: ({ children }) => <th className="px-4 py-2.5 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-t border-carbon/10 px-4 py-2.5">{children}</td>,
  code: ({ children }) => <code className="rounded bg-carbon/5 px-1.5 py-0.5 font-mono text-[0.9em]">{children}</code>,
}

/**
 * An article body written in Markdown. Rendered on the server, so search engines get
 * plain HTML. Raw HTML in the text is ignored (react-markdown's default), so it's safe.
 */
export function NewsMarkdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("text-[1.05rem] text-carbon/85 [&>*:first-child]:mt-0", className)}>
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </Markdown>
    </div>
  )
}
