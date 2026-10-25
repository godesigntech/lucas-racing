"use client"

import { Component, type ReactNode, useSyncExternalStore } from "react"
import dynamic from "next/dynamic"
import { Hand } from "lucide-react"

import { cn } from "@/lib/utils"

import type { HelmetSceneProps } from "./helmet-scene"
import { SceneLoading } from "./scene-loading"

// three.js is large, so it's only downloaded when a 3D view is actually shown.
const HelmetScene = dynamic(() => import("./helmet-scene"), { ssr: false, loading: () => <SceneLoading /> })

let webglSupport: boolean | undefined

/** Checked once per page load: each test opens a GPU context, and browsers only allow a few. */
function hasWebGL(): boolean {
  if (webglSupport === undefined) {
    try {
      const canvas = document.createElement("canvas")
      const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl")
      webglSupport = Boolean(context)
      context?.getExtension("WEBGL_lose_context")?.loseContext()
    } catch {
      webglSupport = false
    }
  }
  return webglSupport
}

const subscribeNever = () => () => {}

/** Shows `fallback` if the 3D scene throws (bad file, lost GPU context) instead of breaking the page. */
class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.error("3D helmet viewer failed:", error)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

interface HelmetViewerProps extends HelmetSceneProps {
  /** Shown when the device can't display 3D, e.g. the illustrated helmet. */
  fallback: ReactNode
  label: string
  className?: string
}

/** Interactive 3D helmet: drag to turn, scroll or pinch to zoom. */
export function HelmetViewer({ fallback, label, className, ...scene }: HelmetViewerProps) {
  // WebGL can only be checked in the browser. Until then (server render, hydration) a loading
  // state shows, so the illustration only appears on devices that really can't do 3D.
  const supported = useSyncExternalStore<boolean | null>(subscribeNever, hasWebGL, () => null)

  return (
    <div className={cn("relative size-full min-w-0", className)} role="img" aria-label={label}>
      {supported === null ? (
        <SceneLoading />
      ) : supported ? (
        <SceneBoundary fallback={fallback}>
          <HelmetScene {...scene} />
          <p className="pointer-events-none absolute bottom-3 left-1/2 flex w-max max-w-[calc(100%-1rem)] -translate-x-1/2 items-center gap-1.5 rounded-full bg-card/80 px-3 py-1 text-center text-[0.68rem] font-medium text-muted-foreground ring-1 ring-carbon/10">
            <Hand className="size-3" aria-hidden /> Drag to turn, then scroll or pinch to zoom
          </p>
        </SceneBoundary>
      ) : (
        fallback
      )}
    </div>
  )
}
