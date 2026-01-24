/**
 * Landing Language Context
 * Manages language switching for landing page (English/Spanish)
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'es';

interface LandingLanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
}

const translations = {
  en: {
    nav: {
      features: 'Features',
      pricing: 'Pricing',
      security: 'Security',
      startTrial: 'Start Free Trial',
    },
    hero: {
      title1: 'Financial Management',
      title2: 'Simple and Powerful',
      subtitle: 'The complete platform for freelancers and small businesses who want to take full control of their finances',
      cta1: 'Get Started Free',
      cta2: 'See Pricing',
      noCreditCard: 'No credit card required • Start with Free Plan',
    },
    features: {
      title: 'Everything you need',
      subtitle: 'A complete suite of tools designed to simplify your financial management',
      clients: {
        title: 'Client Management',
        description: 'Organize and manage your client base with ease',
      },
      invoices: {
        title: 'Smart Invoicing',
        description: 'Create and send professional invoices in seconds',
      },
      finances: {
        title: 'Financial Control',
        description: 'Monitor income, expenses, and cash flow in real-time',
      },
      goals: {
        title: 'Savings Goals',
        description: 'Define and achieve your financial objectives',
      },
      reminders: {
        title: 'Automatic Reminders',
        description: 'Never miss a payment with smart alerts',
      },
      security: {
        title: 'Guaranteed Security',
        description: 'Your data protected with the highest standards',
      },
    },
    pricing: {
      title: 'Simple and Fair Pricing',
      subtitle: 'One payment, lifetime access',
      badge: 'Launch Offer',
      price: '$199',
      currency: 'USD',
      period: 'One-time payment • Lifetime access',
      benefits: [
        'Start with Free Plan',
        'Upgrade to Pro anytime',
        'No monthly subscriptions',
        'All future updates included',
        'Priority technical support',
        'Export your data anytime',
      ],
      cta: 'Get Started',
      afterTrial: 'After 7 days, decide if you want to continue',
    },
    compliance: {
      title: 'Compliance and Security',
      subtitle: 'Your data is protected under the highest international security and privacy standards',
      gdpr: 'EU Data Protection',
      iso27001: 'Information Security',
      iso9001: 'Quality Management',
      soc2: 'AICPA Standards',
      hipaa: 'Healthcare Privacy',
    },
    security: {
      title: 'Military-Grade Security',
      subtitle: 'Your data is protected with the most advanced security technologies and international standards',
      encryption: {
        title: 'AES-256-GCM Encryption',
        description: 'All sensitive data is encrypted using military-grade AES-256-GCM encryption, the same standard used by governments and financial institutions worldwide.',
      },
      passwords: {
        title: 'Bcrypt Password Protection',
        description: 'Passwords are protected with bcrypt using 12 salt rounds, making them virtually impossible to crack even with advanced computing power.',
      },
      sessions: {
        title: 'Secure JWT Sessions',
        description: 'Authentication sessions use industry-standard JWT tokens with short expiration times and automatic renewal for maximum security.',
      },
      transport: {
        title: 'HTTPS & TLS 1.3',
        description: 'All data transmission is encrypted end-to-end using HTTPS with TLS 1.3, ensuring your information is protected in transit.',
      },
      protection: {
        title: 'Rate Limiting & DDoS Protection',
        description: 'Advanced protection against brute force attacks and DDoS with intelligent rate limiting and automatic threat detection.',
      },
      audits: {
        title: 'Security Audits & Monitoring',
        description: 'Continuous monitoring and regular security audits ensure your data remains protected against emerging threats.',
      },
    },
    footer: {
      description: 'Simple and powerful financial management for freelancers and small businesses.',
      product: 'Product',
      legal: 'Legal',
      support: 'Support',
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
      rights: 'All rights reserved.',
    },
  },
  es: {
    nav: {
      features: 'Características',
      pricing: 'Precio',
      security: 'Seguridad',
      startTrial: 'Comenzar Prueba Gratuita',
    },
    hero: {
      title1: 'Gestión Financiera',
      title2: 'Simple y Poderosa',
      subtitle: 'La plataforma completa para freelancers y pequeños negocios que quieren tomar control total de sus finanzas',
      cta1: 'Comenzar Gratis',
      cta2: 'Ver Precio',
      noCreditCard: 'No requiere tarjeta de crédito • Comienza con Plan Free',
    },
    features: {
      title: 'Todo lo que necesitas',
      subtitle: 'Una suite completa de herramientas diseñadas para simplificar tu gestión financiera',
      clients: {
        title: 'Gestión de Clientes',
        description: 'Organiza y administra tu base de clientes con facilidad',
      },
      invoices: {
        title: 'Facturación Inteligente',
        description: 'Crea y envía facturas profesionales en segundos',
      },
      finances: {
        title: 'Control Financiero',
        description: 'Monitorea ingresos, gastos y flujo de caja en tiempo real',
      },
      goals: {
        title: 'Metas de Ahorro',
        description: 'Define y alcanza tus objetivos financieros',
      },
      reminders: {
        title: 'Recordatorios Automáticos',
        description: 'Nunca pierdas un pago con alertas inteligentes',
      },
      security: {
        title: 'Seguridad Garantizada',
        description: 'Tus datos protegidos con los más altos estándares',
      },
    },
    pricing: {
      title: 'Precio Simple y Justo',
      subtitle: 'Un solo pago, acceso de por vida',
      badge: 'Oferta de Lanzamiento',
      price: '$199',
      currency: 'USD',
      period: 'Pago único • Acceso lifetime',
      benefits: [
        'Comienza con Plan Free',
        'Actualiza a Pro en cualquier momento',
        'Sin suscripciones mensuales',
        'Actualizaciones incluidas de por vida',
        'Soporte técnico prioritario',
        'Exportación de datos en cualquier momento',
      ],
      cta: 'Comenzar Ahora',
    },
    compliance: {
      title: 'Cumplimiento y Seguridad',
      subtitle: 'Tus datos están protegidos bajo los más altos estándares internacionales de seguridad y privacidad',
      gdpr: 'Protección de Datos UE',
      iso27001: 'Seguridad de la Información',
      iso9001: 'Gestión de Calidad',
      soc2: 'Estándares AICPA',
      hipaa: 'Privacidad Sanitaria',
    },
    security: {
      title: 'Seguridad de Grado Militar',
      subtitle: 'Tus datos están protegidos con las tecnologías de seguridad más avanzadas y estándares internacionales',
      encryption: {
        title: 'Encriptación AES-256-GCM',
        description: 'Todos los datos sensibles están encriptados usando encriptación de grado militar AES-256-GCM, el mismo estándar utilizado por gobiernos e instituciones financieras en todo el mundo.',
      },
      passwords: {
        title: 'Protección de Contraseñas Bcrypt',
        description: 'Las contraseñas están protegidas con bcrypt usando 12 rondas de salt, haciéndolas virtualmente imposibles de descifrar incluso con poder computacional avanzado.',
      },
      sessions: {
        title: 'Sesiones Seguras JWT',
        description: 'Las sesiones de autenticación utilizan tokens JWT estándar de la industria con tiempos de expiración cortos y renovación automática para máxima seguridad.',
      },
      transport: {
        title: 'HTTPS & TLS 1.3',
        description: 'Toda la transmisión de datos está encriptada de extremo a extremo usando HTTPS con TLS 1.3, asegurando que tu información esté protegida en tránsito.',
      },
      protection: {
        title: 'Rate Limiting & Protección DDoS',
        description: 'Protección avanzada contra ataques de fuerza bruta y DDoS con rate limiting inteligente y detección automática de amenazas.',
      },
      audits: {
        title: 'Auditorías de Seguridad & Monitoreo',
        description: 'Monitoreo continuo y auditorías de seguridad regulares aseguran que tus datos permanezcan protegidos contra amenazas emergentes.',
      },
    },
    footer: {
      description: 'Gestión financiera simple y poderosa para freelancers y pequeños negocios.',
      product: 'Producto',
      legal: 'Legal',
      support: 'Soporte',
      terms: 'Términos de Servicio',
      privacy: 'Política de Privacidad',
      rights: 'Todos los derechos reservados.',
    },
  },
};

const LandingLanguageContext = createContext<LandingLanguageContextType | undefined>(undefined);

export function LandingLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Get saved language from localStorage or default to Spanish
    const saved = localStorage.getItem('landing-language');
    return (saved === 'en' || saved === 'es') ? saved : 'es';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('landing-language', lang);
  };

  useEffect(() => {
    // Update HTML lang attribute
    document.documentElement.lang = language;
  }, [language]);

  const value = {
    language,
    setLanguage,
    t: translations[language],
  };

  return (
    <LandingLanguageContext.Provider value={value}>
      {children}
    </LandingLanguageContext.Provider>
  );
}

export function useLandingLanguage() {
  const context = useContext(LandingLanguageContext);
  if (!context) {
    throw new Error('useLandingLanguage must be used within LandingLanguageProvider');
  }
  return context;
}
