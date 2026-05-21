import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { CacheModule } from '@nestjs/cache-manager'
import { ProxyAwareThrottlerGuard } from './throttler.guard'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'
import { SupabaseModule } from './supabase/supabase.module'
import { AuthModule } from './auth/auth.module'
import { GuestbookModule } from './guestbook/guestbook.module'
import { DispatchesModule } from './dispatches/dispatches.module'
import { TrackerModule } from './tracker/tracker.module'
import { WeatherModule } from './weather/weather.module'
import { HealthController } from './health.controller'
import { SpaController } from './admin/spa.controller'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    CacheModule.register({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public', 'admin'),
      serveRoot: '/',
      serveStaticOptions: { fallthrough: true },
      exclude: ['/api/*path'],
    }),
    SupabaseModule,
    AuthModule,
    GuestbookModule,
    DispatchesModule,
    TrackerModule,
    WeatherModule,
  ],
  controllers: [HealthController, SpaController],
  providers: [{ provide: APP_GUARD, useClass: ProxyAwareThrottlerGuard }],
})
export class AppModule {}
