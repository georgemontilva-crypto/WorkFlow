import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
  {
    variants: {
      variant: {
        // Default: outline naranja, sin fondo - estilo principal
        default: "border-2 border-[#FF9500] bg-transparent text-white hover:bg-[#FF9500]/10 hover:border-[#FFA500]",
        destructive:
          "border-2 border-destructive bg-transparent text-destructive hover:bg-destructive/10 hover:border-destructive/80",
        // Outline: borde blanco/gris, sin fondo
        outline:
          "border-2 border-[#FF9500] bg-transparent text-white hover:bg-[#FF9500]/10 hover:border-[#FFA500]",
        secondary:
          "border-2 border-muted-foreground/30 bg-transparent text-muted-foreground hover:bg-muted/20 hover:border-muted-foreground/50",
        ghost:
          "bg-transparent hover:bg-muted/20 border-0",
        link: "text-primary underline-offset-4 hover:underline border-0",
      },
      size: {
        default: "h-10 px-5 py-2 has-[>svg]:px-4",
        sm: "h-8 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 rounded-xl px-7 has-[>svg]:px-5 text-base",
        icon: "size-10 border-2",
        "icon-sm": "size-8 border-2",
        "icon-lg": "size-12 border-2",
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
      {...props}
    />
  );
}

export { Button, buttonVariants };
