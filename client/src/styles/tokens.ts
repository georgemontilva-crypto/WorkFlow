/**
 * FINWRK DESIGN TOKENS - TypeScript
 * 
 * Sistema global de design tokens para uso en componentes React
 * Estos tokens deben coincidir exactamente con tokens.css
 * 
 * REGLAS ESTRICTAS:
 * - Prohibidos botones con fondo sólido
 * - Prohibidas sombras duras
 * - Outlines SOLO en botones e inputs
 * - No usar colores fuera del sistema
 * 
 * USO:
 * import { tokens } from '@/styles/tokens';
 * <div style={{ backgroundColor: tokens.colors.bg.primary }} />
 */

export const tokens = {
  /**
   * COLORES - Sistema de Color
   */
  colors: {
    bg: {
      primary: '#0E0F12',
      secondary: '#121212',
      card: '#121212',
    },
    text: {
      primary: '#EDEDED',
      secondary: '#9AA0AA',
      muted: '#6B7280',
    },
    accent: {
      primary: '#4ADE80',
    },
    status: {
      error: '#EF4444',
      warning: '#F59E0B',
      success: '#4ADE80', // Mismo que accent.primary
    },
    border: {
      subtle: 'rgba(255, 255, 255, 0.06)',
      default: 'rgba(255, 255, 255, 0.1)',
      hover: 'rgba(255, 255, 255, 0.15)',
    },
  },

  /**
   * FORMA - Border Radius
   */
  radius: {
    small: '6px',
    medium: '10px',
    large: '14px',
  },

  /**
   * TIPOGRAFÍA - Font System
   */
  typography: {
    fontFamily: {
      base: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  /**
   * ESPACIADO - Spacing System
   */
  spacing: {
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
  },

  /**
   * COMPONENTES - Component Tokens
   */
  components: {
    button: {
      borderWidth: '1px',
      paddingX: '1rem',      // spacing-4
      paddingY: '0.5rem',    // spacing-2
      fontWeight: 500,       // font-weight-medium
    },
    input: {
      borderWidth: '1px',
      paddingX: '0.75rem',   // spacing-3
      paddingY: '0.5rem',    // spacing-2
      bg: 'transparent',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderColorFocus: '#4ADE80',
    },
    card: {
      bg: '#121212',
      borderColor: 'rgba(255, 255, 255, 0.06)',
      borderWidth: '1px',
      padding: '1.5rem',     // spacing-6
      radius: '14px',        // radius-large
    },
  },

  /**
   * SOMBRAS - Shadows (PROHIBIDAS sombras duras)
   */
  shadows: {
    subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    none: 'none',
  },

  /**
   * TRANSICIONES - Transitions
   */
  transitions: {
    fast: '150ms ease-in-out',
    base: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },

  /**
   * Z-INDEX - Layering
   */
  zIndex: {
    dropdown: 1000,
    modal: 2000,
    tooltip: 3000,
    notification: 4000,
  },
} as const;

/**
 * TIPOS - TypeScript Types
 */
export type DesignTokens = typeof tokens;
export type ColorTokens = typeof tokens.colors;
export type RadiusTokens = typeof tokens.radius;
export type TypographyTokens = typeof tokens.typography;
export type SpacingTokens = typeof tokens.spacing;
export type ComponentTokens = typeof tokens.components;

/**
 * UTILIDADES - Helper Functions
 */

/**
 * Obtiene un valor de token de forma segura
 * @example getToken('colors.bg.primary') // '#0E0F12'
 */
export function getToken(path: string): string | number {
  const keys = path.split('.');
  let value: any = tokens;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      console.warn(`Token path "${path}" not found`);
      return '';
    }
  }
  
  return value;
}

/**
 * Valida que un color esté en el sistema de tokens
 * @example isValidColor('#0E0F12') // true
 */
export function isValidColor(color: string): boolean {
  const allColors = [
    ...Object.values(tokens.colors.bg),
    ...Object.values(tokens.colors.text),
    ...Object.values(tokens.colors.accent),
    ...Object.values(tokens.colors.status),
    ...Object.values(tokens.colors.border),
  ];
  
  return allColors.includes(color);
}

/**
 * REGLAS DE VALIDACIÓN
 */
export const designRules = {
  /**
   * Prohibidos botones con fondo sólido
   */
  noSolidButtons: true,
  
  /**
   * Prohibidas sombras duras
   */
  noHardShadows: true,
  
  /**
   * Outlines SOLO en botones e inputs
   */
  outlinesOnlyForInteractive: true,
  
  /**
   * No usar colores fuera del sistema
   */
  onlySystemColors: true,
} as const;

/**
 * VALIDACIÓN EN DESARROLLO
 */
if (process.env.NODE_ENV === 'development') {
  // Validar que los tokens CSS y TS coinciden
  console.log('[Design Tokens] TypeScript tokens loaded');
  console.log('[Design Tokens] Design rules:', designRules);
}

export default tokens;
