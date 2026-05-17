import type { ProviderError, ProviderErrorCode } from '@/types/provider';

interface HttpError {
  status?: number;
  statusText?: string;
  message?: string;
  code?: string;
}

function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('etimedout') ||
      message.includes('request timeout') ||
      message.includes('aborted')
    );
  }
  return false;
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return error.message.includes('fetch') || error.message.includes('network');
  }
  return false;
}

function classifyByHttpStatus(status?: number): ProviderErrorCode | null {
  if (!status) return null;

  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 429) return 'RATE_LIMIT';
  if (status >= 500) return 'SERVER_ERROR';

  return null;
}

function getDefaultMessage(code: ProviderErrorCode): string {
  const messages: Record<ProviderErrorCode, string> = {
    UNAUTHORIZED: 'API 密钥无效或已过期',
    FORBIDDEN: '无权访问该资源',
    RATE_LIMIT: '请求过于频繁，请稍后重试',
    SERVER_ERROR: '服务商服务器异常，请稍后重试',
    TIMEOUT: '请求超时，请检查网络后重试',
    NETWORK_ERROR: '网络连接失败，请检查网络',
    INVALID_RESPONSE: '服务商返回数据格式异常',
    UNKNOWN: '发生未知错误',
  };
  return messages[code];
}

function isRecoverable(code: ProviderErrorCode): boolean {
  return ['RATE_LIMIT', 'SERVER_ERROR', 'TIMEOUT', 'NETWORK_ERROR'].includes(code);
}

export function classifyProviderError(error: unknown, fallbackMessage?: string): ProviderError {
  const httpError = error as HttpError;

  if (isTimeoutError(error)) {
    return {
      code: 'TIMEOUT',
      message: fallbackMessage || getDefaultMessage('TIMEOUT'),
      recoverable: true,
      originalError: error,
    };
  }

  if (isNetworkError(error)) {
    return {
      code: 'NETWORK_ERROR',
      message: fallbackMessage || getDefaultMessage('NETWORK_ERROR'),
      recoverable: true,
      originalError: error,
    };
  }

  const httpCode = classifyByHttpStatus(httpError.status);
  if (httpCode) {
    return {
      code: httpCode,
      message: httpError.statusText || httpError.message || fallbackMessage || getDefaultMessage(httpCode),
      status: httpError.status,
      recoverable: isRecoverable(httpCode),
      originalError: error,
    };
  }

  if (error instanceof Error) {
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return {
        code: 'UNAUTHORIZED',
        message: fallbackMessage || getDefaultMessage('UNAUTHORIZED'),
        recoverable: false,
        originalError: error,
      };
    }
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      return {
        code: 'RATE_LIMIT',
        message: fallbackMessage || getDefaultMessage('RATE_LIMIT'),
        recoverable: true,
        originalError: error,
      };
    }
  }

  return {
    code: 'UNKNOWN',
    message: fallbackMessage || (error instanceof Error ? error.message : getDefaultMessage('UNKNOWN')),
    recoverable: false,
    originalError: error,
  };
}

export function logProviderRequest(
  service: 'chat' | 'image' | 'tts',
  provider: string,
  action: 'start' | 'end' | 'error',
  details: {
    duration?: number;
    status?: number;
    errorCode?: ProviderErrorCode;
    extra?: Record<string, unknown>;
  } = {}
): void {
  const timestamp = Date.now();
  const baseLog = {
    timestamp,
    service,
    provider,
    action,
    ...details,
  };

  if (action === 'error') {
    console.error(`[${service.toUpperCase()}]`, baseLog);
  } else if (action === 'start') {
    console.info(`[${service.toUpperCase()}] ${provider} 开始处理请求`);
  } else {
    const durationStr = details.duration ? `${details.duration}ms` : '';
    const statusStr = details.status ? `[${details.status}]` : '';
    console.info(`[${service.toUpperCase()}] ${provider} 请求完成 ${statusStr} ${durationStr}`);
  }
}
