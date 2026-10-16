"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ExternalLink, ImagePlus, Loader2, X } from "lucide-react"
import { toast } from "react-toastify"

import { AdminCard } from "@/components/admin/admin-card"
import { fieldA11y, FormField } from "@/components/forms/form-field"
import { runAction } from "@/components/forms/use-action-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { updateNewsPost } from "@/lib/actions/admin/news"
import { uploadNewsImage } from "@/lib/news/news-image"
import { isFuture, slugify, summaryOf } from "@/lib/news/text"
import { cn } from "@/lib/utils"
import { newsPostSchema, type NewsPostValues } from "@/lib/validations/news"
import type { NewsCategory, NewsPost } from "@/types/news"

import { DeleteNewsPostButton } from "./delete-news-post-button"
import { MarkdownEditor } from "./markdown-editor"

const NO_CATEGORY = "none"

/** ISO date-time to the value a datetime-local input expects, in the browser's time zone. */
function toLocalInput(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function CharCount({ value, max }: { value: string; max: number }) {
  return (
    <span className={cn("text-xs tabular-nums", value.length > max ? "font-semibold text-destructive" : "text-muted-foreground")}>
      {value.length}/{max}
    </span>
  )
}

/** Everything about a post: words, photo, category, publishing and search engine details. */
export function NewsPostEditor({ post, categories }: { post: NewsPost; categories: NewsCategory[] }) {
  const defaults: NewsPostValues = {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    body: post.body,
    coverUrl: post.coverUrl,
    coverAlt: post.coverAlt,
    categoryId: post.category?.id ?? null,
    status: post.status,
    publishedAt: toLocalInput(post.publishedAt),
    featured: post.featured,
    authorName: post.authorName,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
  }
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<NewsPostValues>({ resolver: zodResolver(newsPostSchema), defaultValues: defaults })
  const values = useWatch({ control }) as NewsPostValues
  const [uploading, setUploading] = useState(false)
  const coverInput = useRef<HTMLInputElement>(null)
  // The web address follows the title until it's edited by hand (or the post has gone live).
  const slugLocked = post.status === "published" || Boolean(dirtyFields.slug)

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!isDirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [isDirty])

  async function onSubmit(form: NewsPostValues) {
    // The browser's local time becomes an exact moment for the server.
    const payload = { ...form, publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null }
    const result = await runAction(() => updateNewsPost(post.id, payload), setError)
    if (result?.ok) reset(form)
  }

  async function uploadCover(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      setValue("coverUrl", await uploadNewsImage(file), { shouldDirty: true })
      if (!values.coverAlt) setValue("coverAlt", values.title, { shouldDirty: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The photo didn't upload.")
    } finally {
      setUploading(false)
      if (coverInput.current) coverInput.current.value = ""
    }
  }

  function setStatus(status: NewsPostValues["status"]) {
    setValue("status", status, { shouldDirty: true })
    if (status === "published" && !values.publishedAt) setValue("publishedAt", toLocalInput(new Date().toISOString()), { shouldDirty: true })
  }

  const scheduled = values.status === "published" && isFuture(values.publishedAt)
  const live = post.status === "published" && Boolean(post.publishedAt) && !isFuture(post.publishedAt)
  const searchTitle = values.seoTitle || values.title
  const searchDescription = values.seoDescription || summaryOf(values.excerpt ?? "", values.body ?? "", 155)

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 space-y-6">
        <AdminCard>
          <div className="grid gap-5">
            <FormField id="news-title" label="Title" error={errors.title?.message}>
              <Input
                {...register("title", {
                  onChange: (event) => {
                    if (!slugLocked) setValue("slug", slugify(event.target.value), { shouldDirty: true })
                  },
                })}
                {...fieldA11y("news-title", errors.title?.message)}
                className="h-12 font-display text-xl font-bold uppercase"
              />
            </FormField>
            <FormField
              id="news-slug"
              label="Web address"
              hint={post.status === "published" ? "Changing this breaks links people have shared." : undefined}
              error={errors.slug?.message}
            >
              <div className="flex items-center rounded-xl border border-input bg-card focus-within:ring-3 focus-within:ring-ring/30">
                <span className="pl-3 text-sm text-muted-foreground">/news/</span>
                <Input {...register("slug")} {...fieldA11y("news-slug", errors.slug?.message, post.status === "published")} className="border-0 pl-0.5 shadow-none focus-visible:ring-0" />
              </div>
            </FormField>
            <FormField id="news-excerpt" label="Summary" optional hint="One or two sentences shown on cards and under the title." error={errors.excerpt?.message}>
              <Textarea {...register("excerpt")} {...fieldA11y("news-excerpt", errors.excerpt?.message, true)} rows={3} className="min-h-20" />
              <div className="text-right">
                <CharCount value={values.excerpt ?? ""} max={320} />
              </div>
            </FormField>
          </div>
        </AdminCard>

        <div className="space-y-2">
          <Label htmlFor="news-body" className="text-sm font-medium">
            Article
          </Label>
          <Controller
            control={control}
            name="body"
            render={({ field }) => (
              <MarkdownEditor
                id="news-body"
                value={field.value}
                onChange={field.onChange}
                invalid={Boolean(errors.body)}
                describedBy={errors.body ? "news-body-error" : undefined}
              />
            )}
          />
          {errors.body?.message && (
            <p id="news-body-error" role="alert" className="text-xs font-medium text-destructive">
              {errors.body.message}
            </p>
          )}
        </div>

        <AdminCard title="Search engines" description="Optional. Leave blank to use the title and summary.">
          <div className="grid gap-5">
            <FormField id="news-seo-title" label="Search title" optional error={errors.seoTitle?.message}>
              <Input {...register("seoTitle")} {...fieldA11y("news-seo-title", errors.seoTitle?.message)} placeholder={values.title} />
              <div className="text-right">
                <CharCount value={values.seoTitle ?? ""} max={70} />
              </div>
            </FormField>
            <FormField id="news-seo-description" label="Search description" optional error={errors.seoDescription?.message}>
              <Textarea {...register("seoDescription")} {...fieldA11y("news-seo-description", errors.seoDescription?.message)} rows={3} className="min-h-20" />
              <div className="text-right">
                <CharCount value={values.seoDescription ?? ""} max={170} />
              </div>
            </FormField>
            <div className="rounded-xl border border-carbon/10 bg-white p-4" aria-label="How it may look in Google">
              <p className="text-xs text-muted-foreground">lucasracing.co.uk › news › {values.slug}</p>
              <p className="mt-1 line-clamp-1 text-lg text-[#1a0dab]">{searchTitle} | Lucas Racing</p>
              <p className="mt-0.5 line-clamp-2 text-sm text-carbon/75">{searchDescription || "Add a summary to describe this post."}</p>
            </div>
          </div>
        </AdminCard>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <AdminCard title="Publishing">
          <div className="grid gap-4">
            <div role="radiogroup" aria-label="Status" className="grid grid-cols-2 gap-1 rounded-2xl bg-carbon/5 p-1">
              {(["draft", "published"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  role="radio"
                  aria-checked={values.status === status}
                  onClick={() => setStatus(status)}
                  className={cn(
                    "h-10 rounded-xl text-sm font-semibold transition-all",
                    values.status === status ? "bg-card shadow-sm ring-1 ring-carbon/10" : "text-muted-foreground hover:text-carbon",
                  )}
                >
                  {status === "draft" ? "Draft" : "Published"}
                </button>
              ))}
            </div>
            {values.status === "published" && (
              <FormField id="news-published-at" label="Publish date and time" hint={scheduled ? "In the future: the post goes live then." : "Shown on the post."} error={errors.publishedAt?.message}>
                <Input
                  id="news-published-at"
                  type="datetime-local"
                  value={values.publishedAt ?? ""}
                  onChange={(event) => setValue("publishedAt", event.target.value || null, { shouldDirty: true, shouldValidate: true })}
                  aria-invalid={Boolean(errors.publishedAt) || undefined}
                />
              </FormField>
            )}
            <Controller
              control={control}
              name="featured"
              render={({ field }) => (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-carbon/10 p-3">
                  <Label htmlFor="news-featured" className="block">
                    <span className="font-semibold">Featured</span>
                    <span className="block text-xs font-normal text-muted-foreground">Shown first on the homepage.</span>
                  </Label>
                  <Switch id="news-featured" checked={field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />
            <Button type="submit" size="lg" disabled={isSubmitting || uploading || !isDirty}>
              {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
              {values.status === "draft" ? "Save draft" : scheduled ? "Schedule post" : post.status === "published" ? "Update post" : "Publish now"}
            </Button>
            {isDirty && <p className="text-center text-xs text-muted-foreground">You have unsaved changes.</p>}
            {live && (
              <Button asChild variant="outline">
                <Link href={`/news/${post.slug}`} target="_blank">
                  View on the website <ExternalLink />
                </Link>
              </Button>
            )}
          </div>
        </AdminCard>

        <AdminCard title="Category">
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select value={field.value ?? NO_CATEGORY} onValueChange={(value) => field.onChange(value === NO_CATEGORY ? null : value)}>
                <SelectTrigger aria-label="Category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>No category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <Link href="/admin/news/categories" className="mt-3 inline-block text-xs font-semibold underline-offset-4 hover:underline">
            Manage categories
          </Link>
        </AdminCard>

        <AdminCard title="Cover photo" description="Shown on cards, at the top of the post and when it's shared.">
          <div className="grid gap-3">
            {values.coverUrl ? (
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-carbon">
                <Image src={values.coverUrl} alt={values.coverAlt || ""} fill sizes="352px" className="object-cover" />
                <button
                  type="button"
                  onClick={() => setValue("coverUrl", null, { shouldDirty: true })}
                  className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-carbon/80 text-paper hover:bg-carbon"
                  aria-label="Remove the cover photo"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : null}
            <Button type="button" variant="outline" onClick={() => coverInput.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="animate-spin" aria-hidden /> : <ImagePlus />}
              {values.coverUrl ? "Replace photo" : "Upload a photo"}
            </Button>
            <input ref={coverInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} onChange={(event) => uploadCover(event.target.files?.[0])} />
            {values.coverUrl && (
              <FormField id="news-cover-alt" label="Describe the photo" hint="For screen readers and search engines." error={errors.coverAlt?.message}>
                <Input {...register("coverAlt")} {...fieldA11y("news-cover-alt", errors.coverAlt?.message, true)} />
              </FormField>
            )}
          </div>
        </AdminCard>

        <AdminCard title="Author">
          <FormField id="news-author" label="Shown as" error={errors.authorName?.message}>
            <Input {...register("authorName")} {...fieldA11y("news-author", errors.authorName?.message)} />
          </FormField>
        </AdminCard>

        <div className="flex justify-end">
          <DeleteNewsPostButton id={post.id} title={post.title} />
        </div>
      </aside>
    </form>
  )
}
