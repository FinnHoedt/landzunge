import { Controller, Get, Header, HttpCode, Post } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { TrackerService } from './tracker.service'

@Controller('api/tracker')
export class TrackerController {
  constructor(private service: TrackerService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  getCount() {
    return this.service.getCount()
  }

  @Post()
  @HttpCode(200)
  @Throttle({ default: { limit: 1, ttl: 600_000 } })
  track() {
    return this.service.track()
  }
}
