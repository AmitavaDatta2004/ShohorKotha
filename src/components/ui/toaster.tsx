"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { ShieldAlert, Zap, Info, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex gap-5 items-start">
              <div className={cn(
                "p-3 rounded-2xl shrink-0 shadow-lg",
                variant === 'destructive' 
                  ? "bg-red-500/20 text-red-400 shadow-red-900/20" 
                  : "bg-indigo-600/10 text-indigo-600 shadow-indigo-900/5"
              )}>
                {variant === 'destructive' ? (
                  <ShieldAlert className="h-5 w-5" />
                ) : (
                  <Zap className="h-5 w-5 fill-indigo-600" />
                )}
              </div>
              <div className="grid gap-1.5">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
