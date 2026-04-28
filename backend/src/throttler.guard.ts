import { ForbiddenException, Injectable } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'
import { Request } from 'express'

@Injectable()
export class ProxyAwareThrottlerGuard extends ThrottlerGuard {
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
}
