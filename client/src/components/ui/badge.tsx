/**
 * BADGE COMPONENT - FASE 3 Refactor
 * 
 * REGLAS ESTRICTAS:
 * - Positivo (success): verde (#4ADE80) con fondo muy sutil
 * - Negativo (error): rojo (#EF4444) con fondo muy sutil
 * - Warning: amarillo (#F59E0B) con fondo muy sutil
 * - Neutral: gris (#9AA0AA) con fondo muy sutil
 * - Border radius: 6px (--radius-small)
 * - Padding: px-2.5 py-1
 * - Texto pequeño: text-xs
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-[var(--radius-small)] px-2.5 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-colors duration-150",
  {
    variants: {
      variant: {
        // Success: verde con fondo muy sutil
        success: "bg-[#4ADE80]/10 text-[#4ADE80] border-[0.7px] border-[#4ADE80]/30",
        
        // Error: rojo con fondo muy sutil
        error: "bg-[#EF4444]/10 text-[#EF4444] border-[0.7px] border-[#EF4444]/30",
        
        // Warning: amarillo con fondo muy sutil
        warning: "bg-[#F59E0B]/10 text-[#F59E0B] border-[0.7px] border-[#F59E0B]/30",
        
        // Neutral: gris con fondo muy sutil
        neutral: "bg-[#9AA0AA]/10 text-[#9AA0AA] border-[0.7px] border-[#9AA0AA]/30",
        
        // Default (alias de neutral)
        default: "bg-[#9AA0AA]/10 text-[#9AA0AA] border-[0.7px] border-[#9AA0AA]/30",
        
        // Info: cyan con fondo muy sutil
        info: "bg-[#06B6D4]/10 text-[#06B6D4] border-[0.7px] border-[#06B6D4]/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      style={{
        fontFamily: 'var(--font-family-base)',
        fontWeight: 'var(--font-weight-medium)',
      }}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
