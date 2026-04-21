import { Module } from '@nestjs/common'
import { DispatchesController } from './dispatches.controller'
import { DispatchesService } from './dispatches.service'

@Module({
  controllers: [DispatchesController],
  providers: [DispatchesService],
})
export class DispatchesModule {}
