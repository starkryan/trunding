"use client"

import { useTheme } from "next-themes"
import { Toaster } from "react-hot-toast"

const CustomToaster = () => {
  const { theme = "system" } = useTheme()

  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        className: '',
        duration: 5000,
        removeDelay: 1000,
        style: {
          background: 'var(--popover)',
          color: 'var(--popover-foreground)',
          border: '1px solid var(--border)',
        },
        success: {
          duration: 3000,
          style: {
            background: 'var(--popover)',
            color: 'var(--popover-foreground)',
            border: '1px solid var(--border)',
          },
        },
        error: {
          duration: 4000,
          style: {
            background: 'var(--popover)',
            color: 'var(--popover-foreground)',
            border: '1px solid var(--border)',
          },
        },
      }}
    />
  )
}

export { CustomToaster as Toaster }
