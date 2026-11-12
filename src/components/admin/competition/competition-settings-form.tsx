"use client"

import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { updateCompetitionSettings } from "@/lib/actions/admin/competition"
import { competitionStatusMeta } from "@/lib/competition/status"
import { competitionStatuses, type Competition, type CompetitionStatus } from "@/types/competition"

/** An ISO time as the value of a datetime-local input, in the admin's own time zone. */
function toLocalInput(value: string | null): string {
  if (!value) return ""
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

/** Prize, dates, rules and whether entries are open. Saved straight to the live competition page. */
export function CompetitionSettingsForm({ competition }: { competition: Competition }) {
  const [title, setTitle] = useState(competition.title)
  const [prize, setPrize] = useState(competition.prize)
  const [description, setDescription] = useState(competition.description)
  const [rules, setRules] = useState(competition.rules.join("\n"))
  const [opensAt, setOpensAt] = useState(toLocalInput(competition.opensAt))
  const [closesAt, setClosesAt] = useState(toLocalInput(competition.closesAt))
  const [judgingDate, setJudgingDate] = useState(competition.judgingDate ?? "")
  const [votingOpensAt, setVotingOpensAt] = useState(toLocalInput(competition.votingOpensAt))
  const [votingClosesAt, setVotingClosesAt] = useState(toLocalInput(competition.votingClosesAt))
  const [status, setStatus] = useState<CompetitionStatus>(competition.status)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  function save() {
    startTransition(async () => {
      const result = await updateCompetitionSettings(competition.id, {
        title,
        prize,
        description,
        rules: rules
          .split("\n")
          .map((rule) => rule.replace(/^\s*\d+[.)]\s*/, "").trim())
          .filter(Boolean),
        // datetime-local is the admin's local time: send it as an exact moment.
        opensAt: opensAt ? new Date(opensAt).toISOString() : null,
        closesAt: closesAt ? new Date(closesAt).toISOString() : null,
        judgingDate: judgingDate || null,
        votingOpensAt: votingOpensAt ? new Date(votingOpensAt).toISOString() : null,
        votingClosesAt: votingClosesAt ? new Date(votingClosesAt).toISOString() : null,
        status,
      })
      setErrors(result.ok ? {} : (result.fieldErrors ?? {}))
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    })
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault()
        save()
      }}
    >
      <Field id="competition-status" label="Status" hint={competitionStatusMeta[status].description} error={errors.status}>
        <Select value={status} onValueChange={(value) => setStatus(value as CompetitionStatus)}>
          <SelectTrigger id="competition-status" className="w-full sm:max-w-xs">
            <SelectValue>{competitionStatusMeta[status].label}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {competitionStatuses.map((value) => (
              <SelectItem key={value} value={value}>
                {competitionStatusMeta[value].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field id="competition-title" label="Title" error={errors.title}>
          <Input id="competition-title" value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} />
        </Field>
        <Field id="competition-prize" label="Prize" error={errors.prize}>
          <Input id="competition-prize" value={prize} maxLength={500} onChange={(event) => setPrize(event.target.value)} />
        </Field>
      </div>

      <Field id="competition-description" label="Short description" hint="Shown under the title on the competition page." error={errors.description}>
        <Textarea id="competition-description" rows={2} maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} />
      </Field>

      <div className="grid gap-5 md:grid-cols-3">
        <Field id="competition-opens" label="Entries open" hint="Optional. Leave empty to open as soon as the status is Open." error={errors.opensAt}>
          <Input id="competition-opens" type="datetime-local" value={opensAt} onChange={(event) => setOpensAt(event.target.value)} />
        </Field>
        <Field id="competition-closes" label="Entries close" hint="Needed before opening entries." error={errors.closesAt}>
          <Input id="competition-closes" type="datetime-local" value={closesAt} onChange={(event) => setClosesAt(event.target.value)} />
        </Field>
        <Field id="competition-judging" label="Winner announced" error={errors.judgingDate}>
          <Input id="competition-judging" type="date" value={judgingDate} onChange={(event) => setJudgingDate(event.target.value)} />
        </Field>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Field id="competition-voting-opens" label="Voting opens" hint="The public vote on Facebook." error={errors.votingOpensAt}>
          <Input id="competition-voting-opens" type="datetime-local" value={votingOpensAt} onChange={(event) => setVotingOpensAt(event.target.value)} />
        </Field>
        <Field id="competition-voting-closes" label="Voting closes" error={errors.votingClosesAt}>
          <Input id="competition-voting-closes" type="datetime-local" value={votingClosesAt} onChange={(event) => setVotingClosesAt(event.target.value)} />
        </Field>
      </div>

      <Field id="competition-rules" label="Rules" hint="One rule per line. Entrants must agree to these, so they're needed before opening entries." error={errors.rules}>
        <Textarea
          id="competition-rules"
          rows={8}
          value={rules}
          onChange={(event) => setRules(event.target.value)}
          placeholder={"Free to enter. One entry per person.\nOpen to UK residents aged 16 and over (under 18s need a parent's permission).\nThe winner is chosen by the Lucas Racing team for the best design."}
        />
      </Field>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" aria-hidden />}
        Save competition
      </Button>
    </form>
  )
}
