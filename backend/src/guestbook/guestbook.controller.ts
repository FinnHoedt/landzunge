import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Throttle } from '@nestjs/throttler'
import { memoryStorage } from 'multer'
import { AdminGuard } from '../auth/admin.guard'
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard'
import { GuestbookService } from './guestbook.service'
import { CreateEntryDto } from './dto/create-entry.dto'

@Controller('api/guestbook')
export class GuestbookController {
  constructor(private service: GuestbookService) {}

  @Get('admin/all')
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  getAllAdmin() {
    return this.service.getAllAdmin()
  }

  @Get()
  getEntries(@Query('page') page = 1) {
    return this.service.getEntries(Number(page), 20)
  }

  @Post()
  @HttpCode(201)
  @Throttle({ default: { limit: 1, ttl: 3_600_000 } })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
          cb(null, true)
        } else {
          cb(new BadRequestException('Only JPG, PNG, or WEBP allowed'), false)
        }
      },
    }),
  )
  createEntry(
    @Body() dto: CreateEntryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.createEntry(dto, file)
  }

  @Patch(':id/approve-image')
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  approveImage(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.approveImage(id)
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  deleteEntry(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.deleteEntry(id)
  }
}
