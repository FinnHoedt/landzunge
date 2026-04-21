import { Module } from '@nestjs/common'
import { SupabaseAuthGuard } from './supabase-auth.guard'
import { AdminGuard } from './admin.guard'

@Module({
  providers: [SupabaseAuthGuard, AdminGuard],
  exports: [SupabaseAuthGuard, AdminGuard],
})
export class AuthModule {}
