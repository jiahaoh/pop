import type {
  HttpResponse,
  ServiceError,
  TextTranslateQuery,
  ValidationCompletion,
} from '@bob-translate/types';
import type { TypeCheckConfig } from '../types';

const createTypeGuard = <T>(config: TypeCheckConfig) => {
  return (value: unknown): value is T => {
    if (!value || typeof value !== 'object') {
      return false;
    }

    return Object.entries(config).every(([key, check]) => {
      if (!(key in value)) {
        return check.optional ?? false;
      }

      const fieldValue = (value as Record<string, unknown>)[key];
      if (check.nullable && fieldValue === null) {
        return true;
      }

      return typeof fieldValue === check.type;
    });
  };
};

const hasServiceErrorShape = createTypeGuard<ServiceError>({
  type: { type: 'string' },
  message: { type: 'string' },
  addition: { type: 'string', optional: true },
  troubleshootingLink: { type: 'string', optional: true },
});

export const isServiceError = createTypeGuard<ServiceError>({
  type: { type: 'string' },
  message: { type: 'string' },
});

export const convertToServiceError = (
  error: unknown,
  defaultMessage = '未知错误',
): ServiceError => {
  const generalServiceError: ServiceError = {
    type: 'api',
    message: defaultMessage,
    addition: JSON.stringify(error),
  };

  if (!error || typeof error !== 'object') {
    return {
      ...generalServiceError,
      type: 'unknown',
    };
  }

  if (hasServiceErrorShape(error)) {
    return error;
  }

  if (error instanceof Error) {
    return {
      ...generalServiceError,
      message: error.message,
    };
  }

  return generalServiceError;
};

export const handleGeneralError = (
  query: TextTranslateQuery,
  error: unknown | ServiceError | HttpResponse,
) => {
  if (error && typeof error === 'object' && 'response' in error) {
    // 如果是 HttpResponse，创建包含详细错误信息的 ServiceError
    const httpError = error as HttpResponse;
    const serviceError: ServiceError = {
      type: 'api',
      message: 'API 返回了错误响应',
      addition: JSON.stringify({
        status: httpError.response.statusCode,
        data: httpError.data,
      }),
    };
    query.onCompletion({ error: serviceError });
    return;
  }

  query.onCompletion({
    error: isServiceError(error) ? error : convertToServiceError(error),
  });
};

export const handleValidateError = (
  completion: ValidationCompletion,
  error: unknown,
) => {
  completion({
    result: false,
    error: isServiceError(error) ? error : convertToServiceError(error),
  });
};
