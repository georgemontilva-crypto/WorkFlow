/**
 * BUTTON COMPONENT - FASE 3 Refactor
 * 
 * REGLAS ESTRICTAS:
 * - Fondo transparente (NO fondos sólidos)
 * - Border: 0.7px solid #C4FF3D
 * - Hover: aumentar intensidad del verde
 * - Sin fondos sólidos
 * 
 * VARIANTES:
 * - default: Verde (#4ADE80)
 * - destructive: Rojo (#EF4444)
 * - secondary: Gris
 * - ghost: Sin border
 * - link: Solo texto
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[9999px] text-sm font-medium transition-colors-smooth disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#C4FF3D]/30",
  {
    variants: {
      variant: {
        // Default: outline amarillo-verde, sin fondo - estilo principal
        default: "border-[0.7px] border-[#C4FF3D] bg-transparent text-[#C4FF3D] hover:bg-[#C4FF3D]/10 hover:border-[#D4FF6D] hover:shadow-[0_0_12px_rgba(196,255,61,0.4)]",
        
        // Destructive: outline rojo, sin fondo
        destructive: "border-[0.7px] border-[#EF4444] bg-transparent text-[#EF4444] hover:bg-[#EF4444]/10 hover:border-[#F87171] hover:shadow-[0_0_8px_rgba(239,68,68,0.3)]",
        
        // Secondary: outline gris, sin fondo
        secondary: "border-[0.7px] border-[#9AA0AA] bg-transparent text-[#9AA0AA] hover:bg-[#9AA0AA]/10 hover:border-[#B0B6C0]",
        
        // Warning: outline amarillo, sin fondo
        warning: "border-[0.7px] border-[#F59E0B] bg-transparent text-[#F59E0B] hover:bg-[#F59E0B]/10 hover:border-[#FBBF24] hover:shadow-[0_0_8px_rgba(245,158,11,0.3)]",
        
        // Ghost: sin border, solo hover
        ghost: "bg-transparent hover:bg-[#C4FF3D]/10 border-0 text-white",
        
        // Link: solo texto con underline
        link: "text-[#C4FF3D] underline-offset-4 hover:underline border-0 bg-transparent",
      },
      size: {
        default: "min-h-[44px] h-10 px-5 py-2 has-[>svg]:px-4",
        sm: "min-h-[36px] h-8 rounded-[9999px] gap-1.5 px-3 has-[>svg]:px-2.5 text-xs",
        lg: "min-h-[48px] h-12 rounded-[9999px] px-7 has-[>svg]:px-5 text-base",
        icon: "min-w-[44px] min-h-[44px] size-10 border-[0.7px] rounded-[9999px]",
        "icon-sm": "min-w-[36px] min-h-[36px] size-8 border-[0.7px] rounded-[9999px]",
        "icon-lg": "min-w-[48px] min-h-[48px] size-12 border-[0.7px] rounded-[9999px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      style={{
        fontFamily: 'var(--font-family-base)',
        fontWeight: 'var(--font-weight-medium)',
      }}
      {...props}
    />
  );
}

export { Button, buttonVariants };
