/**
 * LIST ROW / TABLE ROW COMPONENT - FASE 3
 * 
 * REGLAS ESTRICTAS:
 * - Fondo: transparente por defecto
 * - Hover: #4ADE80/5 (verde muy sutil)
 * - Border bottom: 1px rgba(255,255,255,0.06)
 * - Padding: 16px (generoso)
 * - Cursor pointer si clickeable
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ListRowProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  noBorder?: boolean;
  selected?: boolean;
}

export function ListRow({ 
  children, 
  onClick, 
  className = '',
  noBorder = false,
  selected = false,
}: ListRowProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        // Base styles
        "flex items-center gap-4 px-4 py-4",
        // Border
        !noBorder && "border-b border-[rgba(255,255,255,0.06)]",
        // Hover state
        onClick && "cursor-pointer hover:bg-[#4ADE80]/5 transition-colors duration-150",
        // Selected state
        selected && "bg-[#4ADE80]/10",
        className
      )}
      style={{
        fontFamily: 'var(--font-family-base)',
      }}
    >
      {children}
    </div>
  );
}

/**
 * TABLE ROW - Variante específica para tablas
 */
interface TableRowProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  selected?: boolean;
}

export function TableRow({ 
  children, 
  onClick, 
  className = '',
  selected = false,
}: TableRowProps) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        // Border
        "border-b border-[rgba(255,255,255,0.06)]",
        // Hover state
        onClick && "cursor-pointer hover:bg-[#4ADE80]/5 transition-colors duration-150",
        // Selected state
        selected && "bg-[#4ADE80]/10",
        className
      )}
      style={{
        fontFamily: 'var(--font-family-base)',
      }}
    >
      {children}
    </tr>
  );
}

/**
 * TABLE CELL - Celda de tabla
 */
interface TableCellProps {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export function TableCell({ 
  children, 
  className = '',
  align = 'left',
}: TableCellProps) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <td
      className={cn(
        "px-4 py-3 text-sm",
        alignClasses[align],
        className
      )}
      style={{
        color: 'var(--color-text-primary)',
      }}
    >
      {children}
    </td>
  );
}

/**
 * TABLE HEADER CELL - Celda de header de tabla
 */
interface TableHeaderCellProps {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export function TableHeaderCell({ 
  children, 
  className = '',
  align = 'left',
}: TableHeaderCellProps) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <th
      className={cn(
        "px-4 py-3 text-xs font-medium uppercase tracking-wider",
        "border-b border-[rgba(255,255,255,0.06)]",
        alignClasses[align],
        className
      )}
      style={{
        color: 'var(--color-text-secondary)',
        fontWeight: 'var(--font-weight-medium)',
      }}
    >
      {children}
    </th>
  );
}

/**
 * LIST ITEM - Item de lista simple
 */
interface ListItemProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  icon?: ReactNode;
  selected?: boolean;
}

export function ListItem({ 
  children, 
  onClick, 
  className = '',
  icon,
  selected = false,
}: ListItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        // Base styles
        "flex items-center gap-3 px-4 py-3 rounded-[10px]",
        // Hover state
        onClick && "cursor-pointer hover:bg-[#4ADE80]/5 transition-colors duration-150",
        // Selected state
        selected && "bg-[#4ADE80]/10",
        className
      )}
      style={{
        fontFamily: 'var(--font-family-base)',
      }}
    >
      {icon && <div className="flex-shrink-0">{icon}</div>}
      <div className="flex-1">{children}</div>
    </div>
  );
}
