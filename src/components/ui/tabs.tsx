"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & {
  variant?: "default" | "mobile" | "pills"
}) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        // Default variant
        variant === "default" && "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
        // Mobile variant - scrollable horizontal tabs
        variant === "mobile" && "border-b bg-background overflow-x-auto scrollbar-hide",
        // Pills variant - modern mobile style
        variant === "pills" && "bg-muted/50 inline-flex h-10 w-full items-center justify-start rounded-lg p-1 gap-1 overflow-x-auto scrollbar-hide",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & {
  variant?: "default" | "mobile" | "pills"
}) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Default variant
        variant === "default" && "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",

        // Mobile variant - bottom border indicator
        variant === "mobile" && "relative text-muted-foreground hover:text-foreground data-[state=active]:text-primary data-[state=active]:border-primary border-b-2 border-transparent px-4 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap data-[state=active]:font-semibold min-w-fit",

        // Pills variant - modern mobile pills
        variant === "pills" && "data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0",

        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
