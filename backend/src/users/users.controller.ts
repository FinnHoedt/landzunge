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
  Request,
  UseGuards,
} from '@nestjs/common'
import { IsEmail, IsIn } from 'class-validator'
import { AdminGuard } from '../auth/admin.guard'
import { Roles } from '../auth/roles.decorator'
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard'
import { UsersService } from './users.service'

const ROLE_NAMES = ['admin', 'super_admin', 'moderator', 'editor']

class AddUserDto {
  @IsEmail()
  email: string

  @IsIn(ROLE_NAMES)
  role: string
}

class UpdateRoleDto {
  @IsIn(ROLE_NAMES)
  role: string
}

@Controller('api/users')
@UseGuards(SupabaseAuthGuard, AdminGuard)
@Roles('super_admin')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  list() {
    return this.usersService.list()
  }

  @Post()
  @HttpCode(201)
  add(@Body() dto: AddUserDto) {
    return this.usersService.add(dto.email, dto.role)
  }

  @Patch(':id')
  @HttpCode(204)
  updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
    @Request() req: any,
  ) {
    if (req.user.id === id) throw new BadRequestException('Cannot change your own role')
    return this.usersService.updateRole(id, dto.role)
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    if (req.user.id === id) throw new BadRequestException('Cannot remove yourself')
    return this.usersService.remove(id)
  }
}
