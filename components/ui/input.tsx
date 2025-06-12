import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-md border border-cyber-red/30 bg-black/40 backdrop-blur-sm px-4 py-3 text-base text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-foreground/50 transition-all duration-300",
          "focus-visible:outline-none focus-visible:border-cyber-red focus-visible:shadow-cyber focus-visible:bg-black/60",
          "hover:border-cyber-red/50 hover:shadow-cyber-lg",
          "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
