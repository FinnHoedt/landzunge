import { Module } from '@nestjs/common'
import { SupabaseAuthGuard } from './supabase-auth.guard'
import { AdminGuard } from './admin.guard'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'

@Module({
  providers: [SupabaseAuthGuard, AdminGuard, AuthService],
  controllers: [AuthController],
  exports: [SupabaseAuthGuard, AdminGuard],
})
export class AuthModule {}
