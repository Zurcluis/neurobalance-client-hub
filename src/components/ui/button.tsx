import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#3A726D] text-white hover:bg-[#2A5854]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-[#E6ECEA] hover:text-[#3A726D]",
        secondary:
          "bg-[#E6ECEA] text-[#3A726D] hover:bg-[#d5dfdd]",
        ghost: "hover:bg-[#E6ECEA] hover:text-[#3A726D]",
        link: "text-[#3A726D] underline-offset-4 hover:underline",
        danger: "bg-red-500 text-white hover:bg-red-600",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
      mobile: {
        true: "min-h-[44px] min-w-[44px]",
        false: "",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      mobile: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, mobile, ...props }, ref) => {
    const isMobile = useIsMobile();
    // Aplicar o valor 'mobile' automaticamente com base no hook useIsMobile
    const mobileValue = mobile !== undefined ? mobile : isMobile;
    
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, mobile: mobileValue, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
