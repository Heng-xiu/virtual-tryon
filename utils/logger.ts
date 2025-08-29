type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMessage {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: string;
  data?: any;
}

class Logger {
  private isProduction = process.env.NODE_ENV === 'production';
  private isDevelopment = process.env.NODE_ENV === 'development' || typeof __DEV__ !== 'undefined' && __DEV__;

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    if (this.isProduction) {
      // In production, only log warnings and errors
      return level === 'warn' || level === 'error';
    }
    // Default: log everything except debug
    return level !== 'debug';
  }

  private formatMessage(level: LogLevel, message: string, context?: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}] ` : '';
    const prefix = `[Virtual Try-On] ${timestamp} ${level.toUpperCase()}: ${contextStr}`;
    
    if (data !== undefined) {
      return `${prefix}${message} | Data: ${JSON.stringify(data)}`;
    }
    
    return `${prefix}${message}`;
  }

  private log(level: LogLevel, message: string, context?: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, context, data);

    switch (level) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
    }
  }

  debug(message: string, context?: string, data?: any): void {
    this.log('debug', message, context, data);
  }

  info(message: string, context?: string, data?: any): void {
    this.log('info', message, context, data);
  }

  warn(message: string, context?: string, data?: any): void {
    this.log('warn', message, context, data);
  }

  error(message: string, context?: string, data?: any): void {
    this.log('error', message, context, data);
  }

  // Convenience method for logging errors with Error objects
  logError(error: Error | unknown, context?: string, additionalData?: any): void {
    if (error instanceof Error) {
      this.error(error.message, context, {
        stack: error.stack,
        name: error.name,
        ...additionalData
      });
    } else {
      this.error(String(error), context, additionalData);
    }
  }

  // Performance logging
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(`[Virtual Try-On] ${label}`);
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(`[Virtual Try-On] ${label}`);
    }
  }

  // Context-specific loggers
  background = {
    debug: (message: string, data?: any) => this.debug(message, 'background', data),
    info: (message: string, data?: any) => this.info(message, 'background', data),
    warn: (message: string, data?: any) => this.warn(message, 'background', data),
    error: (message: string, data?: any) => this.error(message, 'background', data),
  };

  content = {
    debug: (message: string, data?: any) => this.debug(message, 'content', data),
    info: (message: string, data?: any) => this.info(message, 'content', data),
    warn: (message: string, data?: any) => this.warn(message, 'content', data),
    error: (message: string, data?: any) => this.error(message, 'content', data),
  };

  popup = {
    debug: (message: string, data?: any) => this.debug(message, 'popup', data),
    info: (message: string, data?: any) => this.info(message, 'popup', data),
    warn: (message: string, data?: any) => this.warn(message, 'popup', data),
    error: (message: string, data?: any) => this.error(message, 'popup', data),
  };

  tryon = {
    debug: (message: string, data?: any) => this.debug(message, 'tryon', data),
    info: (message: string, data?: any) => this.info(message, 'tryon', data),
    warn: (message: string, data?: any) => this.warn(message, 'tryon', data),
    error: (message: string, data?: any) => this.error(message, 'tryon', data),
  };
}

// Export singleton instance
export const logger = new Logger();

// Export type for external use
export type { LogLevel, LogMessage };