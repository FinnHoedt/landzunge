import { ExecutionContext, ForbiddenException, Injectable, Logger } from '@nestjs/common'
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler'
import { Request } from 'express'

@Injectable()
export class ProxyAwareThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(ProxyAwareThrottlerGuard.name)

  protected async getTracker(req: Request): Promise<string> {
    const cfIp = req.headers['cf-connecting-ip']
    if (cfIp) {
      return typeof cfIp === 'string' ? cfIp : cfIp[0]
    }
    if (req.ip) {
      return req.ip
    }
    throw new ForbiddenException()
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const req = context.switchToHttp().getRequest<Request>()
    const ip = await this.getTracker(req)
    this.logger.warn(
      { ip, path: req.path, limit: throttlerLimitDetail.limit, ttl: throttlerLimitDetail.ttl },
      'request rate-limited',
    )
    return super.throwThrottlingException(context, throttlerLimitDetail)
  }
}
