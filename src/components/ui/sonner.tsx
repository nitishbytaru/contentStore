"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      richColors
      closeButton
      duration={4000}
      offset="16px"
      mobileOffset={{ bottom: "16px", right: "16px", left: "auto", top: "auto" }}
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-white shrink-0" />
        ),
        info: (
          <InfoIcon className="size-4 shrink-0" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 shrink-0" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-white shrink-0" />
        ),
        loading: (
          <div className="size-4 rounded-full bg-muted animate-pulse shrink-0" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--success-bg": "#16a34a",
          "--success-text": "#ffffff",
          "--success-border": "#15803d",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          success: "!bg-green-600 !text-white !border-green-700 shadow-lg shadow-green-950/20",
          error: "!bg-red-600 !text-white !border-red-700 shadow-lg shadow-red-950/20",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
