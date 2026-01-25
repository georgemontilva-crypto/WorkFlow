/**
 * CARD COMPONENT - FASE 3 Refactor
 * 
 * REGLAS ESTRICTAS:
 * - Fondo: #121212 (--color-bg-card)
 * - Border: 1px rgba(255,255,255,0.06)
 * - Radius: 28px (--radius-large ultra-redondeado)
 * - Padding generoso (24px default)
 * - Todo el contenido debe estar dentro de Cards
 * - No debe existir contenido directamente sobre el fondo
 */

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
  noBorder?: boolean;
}

export function Card({ 
  children, 
  className = '', 
  padding = 'large',
  noBorder = false 
}: CardProps) {
  const paddingClasses = {
    none: '',
    small: 'p-4',      // 16px
    medium: 'p-6',     // 24px
    large: 'p-6',      // 24px (default)
  };

  return (
    <div 
      className={`
        bg-[var(--color-bg-card)]
        ${noBorder ? '' : 'border border-[var(--color-border-subtle)]'}
        rounded-[28px]
        transition-colors-smooth
        ${paddingClasses[padding]}
        ${className}
      `}
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: noBorder ? 'transparent' : 'var(--color-border-subtle)',
        borderWidth: noBorder ? '0' : '1px',
        borderRadius: '28px',
      }}
    >
      {children}
    </div>
  );
}

/**
 * CARD HEADER - Header de Card con título y acciones
 */
interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className = '' }: CardHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-6 ${className}`}>
      <div>
        <h2 
          className="text-xl font-semibold"
          style={{
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-semibold)',
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p 
            className="text-sm mt-1"
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/**
 * CARD SECTION - Sección dentro de un Card
 */
interface CardSectionProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function CardSection({ children, className = '', noPadding = false }: CardSectionProps) {
  return (
    <div className={`${noPadding ? '' : 'py-4'} ${className}`}>
      {children}
    </div>
  );
}

/**
 * CARD GRID - Grid de Cards
 */
interface CardGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'small' | 'medium' | 'large';
  className?: string;
}

export function CardGrid({ 
  children, 
  columns = 1, 
  gap = 'medium',
  className = '' 
}: CardGridProps) {
  const gapClasses = {
    small: 'gap-4',
    medium: 'gap-6',
    large: 'gap-8',
  };

  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}
