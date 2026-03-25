import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extract tenant ID from request (set by TenantGuard from X-Tenant-Id).
 */
export const TenantId = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest();
  return req.tenantId ?? '';
});

/**
 * Extract user ID from request (set by TenantGuard from X-User-Id).
 */
export const UserId = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest();
  return req.userId ?? '';
});
