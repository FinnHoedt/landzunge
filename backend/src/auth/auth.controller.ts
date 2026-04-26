import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { IsEmail, IsString } from 'class-validator'
import { AuthService } from './auth.service'

class LoginDto {
  @IsEmail()
  email: string

  @IsString()
  password: string
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password)
  }
}
