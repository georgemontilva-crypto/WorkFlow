/**
 * LAYOUT COMPONENT - Layout Base Global
 * 
 * FASE 2: Layout Base
 * Estructura visual del layout global
 * 
 * REQUISITOS:
 * - Contenedor principal: max-width 1280px, centrado, padding 24px
 * - Todo el contenido debe estar dentro de Cards
 * - Jerarquía clara: Header, Actions, Content
 * - Grid/flex adaptables
 */

import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

/**
 * LAYOUT PRINCIPAL
 * Contenedor centrado con max-width y padding
 */
export function Layout({ children }: LayoutProps) {
  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundColor: 'var(--color-bg-primary)',
      }}
    >
      <div 
        className="mx-auto px-6 py-6"
        style={{
          maxWidth: '1280px',
          padding: '24px',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * PAGE HEADER
 * Header de página con título y descripción
 */
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className = '' }: PageHeaderProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <h1 
            className="text-3xl font-semibold"
            style={{
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-3xl)',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            {title}
          </h1>
          {description && (
            <p 
              className="mt-2"
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-base)',
              }}
            >
              {description}
            </p>
          )}
        </div>
        {action && <div className="ml-4">{action}</div>}
      </div>
    </div>
  );
}

/**
 * PAGE CONTENT
 * Contenedor de contenido con spacing consistente
 */
interface PageContentProps {
  children: ReactNode;
  className?: string;
}

export function PageContent({ children, className = '' }: PageContentProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {children}
    </div>
  );
}

/**
 * ACTION BAR
 * Barra de acciones con botones/filtros
 */
interface ActionBarProps {
  children: ReactNode;
  className?: string;
}

export function ActionBar({ children, className = '' }: ActionBarProps) {
  return (
    <div 
      className={`flex flex-wrap items-center gap-4 mb-6 ${className}`}
      style={{
        padding: 'var(--spacing-4) 0',
      }}
    >
      {children}
    </div>
  );
}

/**
 * CONTENT GRID
 * Grid adaptable para contenido
 */
interface ContentGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'small' | 'medium' | 'large';
  className?: string;
}

export function ContentGrid({ 
  children, 
  columns = 1, 
  gap = 'medium',
  className = '' 
}: ContentGridProps) {
  const gapClasses = {
    small: 'gap-4',
    medium: 'gap-6',
    large: 'gap-8',
  };

  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}

/**
 * FLEX CONTAINER
 * Contenedor flex adaptable
 */
interface FlexContainerProps {
  children: ReactNode;
  direction?: 'row' | 'column';
  gap?: 'small' | 'medium' | 'large';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: boolean;
  className?: string;
}

export function FlexContainer({ 
  children, 
  direction = 'row',
  gap = 'medium',
  align = 'start',
  justify = 'start',
  wrap = false,
  className = '' 
}: FlexContainerProps) {
  const gapClasses = {
    small: 'gap-2',
    medium: 'gap-4',
    large: 'gap-6',
  };

  const directionClasses = {
    row: 'flex-row',
    column: 'flex-col',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  };

  return (
    <div 
      className={`
        flex 
        ${directionClasses[direction]} 
        ${gapClasses[gap]} 
        ${alignClasses[align]} 
        ${justifyClasses[justify]}
        ${wrap ? 'flex-wrap' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
