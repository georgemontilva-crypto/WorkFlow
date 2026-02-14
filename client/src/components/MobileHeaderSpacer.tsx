/**
 * MobileHeaderSpacer - Espaciador para compensar el header fijo en móvil
 */

export function MobileHeaderSpacer() {
  return (
    <div 
      className="md:hidden" 
      style={{ height: 'calc(4rem + env(safe-area-inset-top))' }}
    />
  );
}
