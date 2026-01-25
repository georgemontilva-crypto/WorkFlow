/**
 * Logger utility for consistent logging across the application
 * Provides structured logging with timestamps and context
 */

type LogLevel = 'info' | 'warn' | 'error' | 'success';

interface LogContext {
  module: string;
  action?: string;
  userId?: number;
  clientId?: number;
  email?: string;
  [key: string]: any;
}

class Logger {
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = this.formatTimestamp();
    const levelStr = level.toUpperCase().padEnd(7);
    const moduleStr = context?.module ? `[${context.module}]` : '';
    
    let msg = `${timestamp} ${levelStr} ${moduleStr} ${message}`;
    
    // Add context details
    if (context) {
      const { module, ...rest } = context;
      const contextStr = Object.entries(rest)
        .map(([key, value]) => `${key}=${value}`)
        .join(', ');
      
      if (contextStr) {
        msg += ` | ${contextStr}`;
      }
    }
    
    return msg;
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage('info', message, context));
  }

  success(message: string, context?: LogContext): void {
    console.log(this.formatMessage('success', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    const errorMsg = error?.message || error || '';
    const fullMessage = errorMsg ? `${message}: ${errorMsg}` : message;
    console.error(this.formatMessage('error', fullMessage, context));
    
    // Log stack trace if available
    if (error?.stack) {
      console.error(error.stack);
    }
  }
}

export const logger = new Logger();

// Convenience functions for common logging scenarios
export const logClientCreated = (clientId: number, name: string, email: string, userId: number) => {
  logger.success('Cliente creado exitosamente', {
    module: 'DB',
    action: 'createClient',
    clientId,
    name,
    email,
    userId,
  });
};

export const logClientDuplicate = (email: string, userId: number) => {
  logger.warn('Intento de crear cliente duplicado', {
    module: 'DB',
    action: 'createClient',
    email,
    userId,
  });
};

export const logClientCreateAttempt = (email: string, userId: number) => {
  logger.info('Intentando crear cliente', {
    module: 'API',
    action: 'createClient',
    email,
    userId,
  });
};

export const logClientCreateError = (email: string, userId: number, error: any) => {
  logger.error('Error al crear cliente', error, {
    module: 'API',
    action: 'createClient',
    email,
    userId,
  });
};

export const logValidationError = (field: string, message: string, userId?: number) => {
  logger.warn('Error de validación', {
    module: 'API',
    action: 'validation',
    field,
    message,
    userId,
  });
};
