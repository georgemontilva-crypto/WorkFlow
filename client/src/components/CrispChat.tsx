import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * CrispChat Component
 * Integrates Crisp live chat widget
 * 
 * Setup Instructions:
 * 1. Go to https://crisp.chat/
 * 2. Create a free account
 * 3. Get your Website ID from Settings > Setup instructions
 * 4. Replace 'YOUR_WEBSITE_ID' below with your actual Crisp Website ID
 * 5. Uncomment the component in App.tsx
 */

const CRISP_WEBSITE_ID = 'df45aad0-50ab-4415-b389-eff534fd5a80';

export function CrispChat() {
  const { language } = useLanguage();

  useEffect(() => {
    // Only load Crisp if website ID is configured
    if (CRISP_WEBSITE_ID === 'YOUR_WEBSITE_ID') {
      console.warn('Crisp chat not configured. Please add your Website ID in CrispChat.tsx');
      return;
    }

    // Load Crisp script
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;

    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    document.head.appendChild(script);

    // Wait for Crisp to load, then set language
    script.onload = () => {
      if (window.$crisp) {
        // Set Crisp language based on app language
        window.$crisp.push(['set', 'session:data', [['language', language]]]);
        window.$crisp.push(['set', 'user:nickname', ['Usuario']]);
      }
    };

    return () => {
      // Cleanup on unmount
      if (window.$crisp) {
        window.$crisp.push(['do', 'chat:hide']);
      }
    };
  }, []);

  // Language sync is now handled in LanguageContext

  return null; // This component doesn't render anything
}

// TypeScript declarations for Crisp
declare global {
  interface Window {
    $crisp: any[];
    CRISP_WEBSITE_ID: string;
  }
}
