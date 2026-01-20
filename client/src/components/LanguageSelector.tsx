/**
 * Language Selector Component
 * Allows users to switch between English and Spanish
 */

import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 border border-border rounded-lg p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLanguage('es')}
        className={`h-8 px-3 text-xs ${
          language === 'es' 
            ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground' 
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        ES
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLanguage('en')}
        className={`h-8 px-3 text-xs ${
          language === 'en' 
            ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground' 
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        EN
      </Button>
    </div>
  );
}
