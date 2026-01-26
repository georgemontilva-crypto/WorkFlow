/**
 * Language Selector Component
 * Allows users to switch between English and Spanish using i18next
 */

import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export function LanguageSelector() {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center gap-2 border border-border rounded-lg p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => i18n.changeLanguage('es')}
        className={`h-8 px-3 text-xs ${
          i18n.language === 'es' 
            ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground' 
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        ES
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => i18n.changeLanguage('en')}
        className={`h-8 px-3 text-xs ${
          i18n.language === 'en' 
            ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground' 
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        EN
      </Button>
    </div>
  );
}
