import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Guard: require X-Tenant-Id and X-User-Id (injected by API Gateway per AUTH_CONTRACT Option A).
 * Use on all project/task routes that require auth.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const tenantId = req.headers['x-tenant-id'];
    const userId = req.headers['x-user-id'];
    if (!tenantId || !userId) {
      throw new UnauthorizedException('Missing X-Tenant-Id or X-User-Id (call via API Gateway with valid token)');
    }
    (req as any).tenantId = String(tenantId);
    (req as any).userId = String(userId);
    return true;
  }
}
