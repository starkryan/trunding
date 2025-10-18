"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  className?: string
  size?: "sm" | "md" | "lg"
  showName?: boolean
}

export function UserAvatar({ user, className, size = "md", showName = false }: UserAvatarProps) {
  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map(part => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("")
    }

    if (email) {
      return email.charAt(0).toUpperCase()
    }

    return "U"
  }

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-12 w-12 text-lg"
  }

  const avatarSize = sizeClasses[size]

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Avatar className={avatarSize}>
        <AvatarImage
          src={user?.image || undefined}
          alt={user?.name || user?.email || "User"}
        />
        <AvatarFallback className="bg-primary/10 text-primary">
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      {showName && (
        <div className="flex flex-col">
          <span className="text-sm font-medium truncate">
            {user?.name || "Unknown User"}
          </span>
          {user?.email && (
            <span className="text-xs text-muted-foreground truncate">
              {user.email}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export function UserAvatarWithFallback({
  userId,
  name,
  email,
  className,
  size = "md"
}: {
  userId?: string
  name?: string | null
  email?: string | null
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map(part => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("")
    }

    if (email) {
      return email.charAt(0).toUpperCase()
    }

    return "U"
  }

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-12 w-12 text-lg"
  }

  const avatarSize = sizeClasses[size]

  return (
    <Avatar className={cn(avatarSize, className)}>
      <AvatarImage
        src={undefined} // No external images
        alt={name || email || "User"}
      />
      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary border border-primary/20">
        <span className="font-semibold">
          {getInitials(name, email)}
        </span>
      </AvatarFallback>
    </Avatar>
  )
}