
"use client"

import { CheckCircle, XCircle, Info } from 'lucide-react'; // Import icons

import { useToast, type ToasterToast } from "@/hooks/use-toast" // Import updated hook and type
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

// Helper function to get the icon based on variant
const getIcon = (variant: ToasterToast['variant']) => {
  switch (variant) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-current" />; // Use text-current for automatic color
    case 'destructive':
      return <XCircle className="h-5 w-5 text-current" />;
    case 'default':
    default:
      return <Info className="h-5 w-5 text-current" />; // Default icon
  }
};

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) { // Destructure variant
        const Icon = getIcon(variant); // Get the appropriate icon

        return (
          <Toast key={id} variant={variant} {...props}>
             {/* Icon added here, before the text content */}
            <div className="flex items-start space-x-3">
              <div className="mt-0.5 shrink-0"> {/* Container for the icon */}
                {Icon}
              </div>
              <div className="grid gap-1 flex-1"> {/* Text content */}
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
