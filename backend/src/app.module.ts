import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'
import { SupabaseModule } from './supabase/supabase.module'
import { AuthModule } from './auth/auth.module'
import { GuestbookModule } from './guestbook/guestbook.module'
import { DispatchesModule } from './dispatches/dispatches.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public', 'admin'),
      serveRoot: '/admin',
      serveStaticOptions: { fallthrough: true },
      exclude: ['/api/(.*)'],
    }),
    SupabaseModule,
    AuthModule,
    GuestbookModule,
    DispatchesModule,
  ],
})
export class AppModule {}
