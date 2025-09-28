"use client"

import type React from "react"

import { useEffect, useState } from "react"

// Detect on-screen keyboard height (best-effort, supported on modern mobile browsers)
function useKeyboardInset() {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    const vv = (typeof window !== "undefined" && window.visualViewport) || null
    if (!vv) return

    const onResize = () => {
      const heightDiff = Math.max(0, window.innerHeight - vv.height)
      // add a small cushion for comfort
      setInset(heightDiff > 0 ? heightDiff + 8 : 0)
    }

    onResize()
    vv.addEventListener("resize", onResize)
    return () => vv.removeEventListener("resize", onResize)
  }, [])

  return inset
}

type KeyboardAwareBottomBarProps = {
  children: React.ReactNode
  className?: string
  // Optional: provide extra padding when keyboard is not shown for visual spacing
  basePadding?: number // in px
}

export function KeyboardAwareBottomBar({ children, className = "", basePadding = 12 }: KeyboardAwareBottomBarProps) {
  const inset = useKeyboardInset()

  return (
    <div
      role="region"
      aria-label="Primary actions"
      className={[
        "sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-t",
        "px-4",
        className,
      ].join(" ")}
      style={{
        paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${Math.max(inset, basePadding)}px)`,
        paddingTop: 12,
      }}
    >
      {children}
    </div>
  )
}
