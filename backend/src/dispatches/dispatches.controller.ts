import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { AdminGuard } from '../auth/admin.guard'
import { Roles } from '../auth/roles.decorator'
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard'
import { DispatchesService } from './dispatches.service'
import { CreateDispatchDto } from './dto/create-dispatch.dto'
import { UpdateDispatchDto } from './dto/update-dispatch.dto'

@Controller('api/dispatches')
export class DispatchesController {
  constructor(private service: DispatchesService) {}

  @Get()
  getPublished() {
    return this.service.getPublished()
  }

  @Get('admin/all')
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  @Roles('admin', 'super_admin')
  getAllAdmin() {
    return this.service.getAllAdmin()
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.service.getBySlug(slug)
  }

  @Post()
  @HttpCode(201)
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  @Roles('admin', 'super_admin')
  create(@Body() dto: CreateDispatchDto) {
    return this.service.create(dto)
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  @Roles('admin', 'super_admin')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDispatchDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  @Roles('admin', 'super_admin')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.delete(id)
  }
}
