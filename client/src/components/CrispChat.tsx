import { useEffect } from 'react';

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

const CRISP_WEBSITE_ID = 'YOUR_WEBSITE_ID'; // Replace with your Crisp Website ID

export function CrispChat() {
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

    return () => {
      // Cleanup on unmount
      if (window.$crisp) {
        window.$crisp.push(['do', 'chat:hide']);
      }
    };
  }, []);

  return null; // This component doesn't render anything
}

// TypeScript declarations for Crisp
declare global {
  interface Window {
    $crisp: any[];
    CRISP_WEBSITE_ID: string;
  }
}
