/**
 * INPUT COMPONENT - FASE 3 Refactor
 * 
 * REGLAS ESTRICTAS:
 * - Fondo: #121212 (--color-bg-secondary)
 * - Border: box-shadow inset 0.5px #C4FF3D
 * - Bordes redondeados tipo pill (9999px)
 * - Placeholder tenue (#6B7280)
 * - Focus: aumentar intensidad del verde
 */

import { useDialogComposition } from "@/components/ui/dialog";
import { useComposition } from "@/hooks/useComposition";
import { cn } from "@/lib/utils";
import * as React from "react";

function Input({
  className,
  type,
  onKeyDown,
  onCompositionStart,
  onCompositionEnd,
  ...props
}: React.ComponentProps<"input">) {
  // Get dialog composition context if available (will be no-op if not inside Dialog)
  const dialogComposition = useDialogComposition();

  // Add composition event handlers to support input method editor (IME) for CJK languages.
  const {
    onCompositionStart: handleCompositionStart,
    onCompositionEnd: handleCompositionEnd,
    onKeyDown: handleKeyDown,
  } = useComposition<HTMLInputElement>({
    onKeyDown: (e) => {
      // Check if this is an Enter key that should be blocked
      const isComposing = (e.nativeEvent as any).isComposing || dialogComposition.justEndedComposing();

      // If Enter key is pressed while composing or just after composition ended,
      // don't call the user's onKeyDown (this blocks the business logic)
      if (e.key === "Enter" && isComposing) {
        return;
      }

      // Otherwise, call the user's onKeyDown
      onKeyDown?.(e);
    },
    onCompositionStart: e => {
      dialogComposition.setComposing(true);
      onCompositionStart?.(e);
    },
    onCompositionEnd: e => {
      // Mark that composition just ended - this helps handle the Enter key that confirms input
      dialogComposition.markCompositionEnd();
      // Delay setting composing to false to handle Safari's event order
      // In Safari, compositionEnd fires before the ESC keydown event
      setTimeout(() => {
        dialogComposition.setComposing(false);
      }, 100);
      onCompositionEnd?.(e);
    },
  });

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles
        "min-h-[44px] h-10 w-full min-w-0 px-4 py-2 text-sm sm:text-base",
        // Background and border (FASE 3 specs)
        "bg-[#121212] border-0 shadow-[inset_0_0_0_0.5px_#C4FF3D]",
        "rounded-[9999px]",
        // Text and placeholder
        "text-white placeholder:text-[#6B7280]",
        // Focus state
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4FF3D]/20 focus-visible:shadow-[inset_0_0_0_0.5px_#D4FF6D,0_0_12px_rgba(196,255,61,0.3)]",
        // Invalid state
        "aria-invalid:shadow-[inset_0_0_0_0.5px_#EF4444] aria-invalid:ring-[#EF4444]/20]",
        // Disabled state
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // File input
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-white",
        // Selection
        "selection:bg-[#C4FF3D]/30 selection:text-black",
        // Transition
        "transition-colors-smooth",
        className
      )}
      style={{
        fontFamily: 'var(--font-family-base)',
        fontWeight: 'var(--font-weight-normal)',
      }}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}

export { Input };
