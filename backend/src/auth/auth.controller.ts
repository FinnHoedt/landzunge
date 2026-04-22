import { Body, Controller, HttpCode, Post, UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service'

class LoginDto {
  email: string
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
