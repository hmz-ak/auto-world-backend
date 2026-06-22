import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { PaginatedResult } from '../interfaces/paginated-result.interface';

interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: unknown;
}

function isPaginatedResult<T>(value: unknown): value is PaginatedResult<T> {
  const candidate = value as PaginatedResult<T>;
  return Boolean(candidate?.meta && Array.isArray(candidate.data));
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, SuccessResponse<T> | SuccessResponse<T[]>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>
  ): Observable<SuccessResponse<T> | SuccessResponse<T[]>> {
    return next.handle().pipe(
      map((response: unknown) => {
        if (isPaginatedResult<T>(response)) {
          return {
            success: true,
            data: response.data,
            meta: response.meta
          };
        }

        return {
          success: true,
          data: response as T
        };
      })
    );
  }
}
