# Weather Backend Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move weather fetching to a NestJS backend module, add real water temperature from the Cospudener See sensor, cache both sources independently.

**Architecture:** New `WeatherModule` in `backend/src/weather/` following the existing tracker pattern. `WeatherService` fetches from open-meteo.com (1h cache) and openmeteo.com sensor t2 (3h cache) using `@nestjs/cache-manager` with programmatic per-key TTLs. Frontend calls `GET /api/weather` instead of open-meteo directly.

**Tech Stack:** NestJS 11, `@nestjs/cache-manager` v2, `cache-manager` v5 (in-memory, TTLs in milliseconds), vanilla JS frontend.

---

## File Map

**Create:**
- `backend/src/weather/weather.module.ts` — declares controller + service
- `backend/src/weather/weather.controller.ts` — `GET /api/weather` endpoint
- `backend/src/weather/weather.service.ts` — fetches + caches forecast and water temp
- `backend/src/weather/weather.controller.spec.ts` — controller unit test

**Modify:**
- `backend/src/app.module.ts` — add `CacheModule.register({ isGlobal: true })` and `WeatherModule`
- `frontend/src/weather.js` — replace direct open-meteo call with backend call, add water temp line

---

### Task 1: Install cache-manager packages

**Files:**
- Modify: `backend/package.json` (via npm install)

- [ ] **Step 1: Install dependencies**

```bash
cd backend && npm install @nestjs/cache-manager cache-manager
```

Expected: `added N packages` with no errors.

- [ ] **Step 2: Verify install**

```bash
cd backend && node -e "require('@nestjs/cache-manager'); console.log('ok')"
```

Expected: `ok`

---

### Task 2: Write the controller test (failing)

**Files:**
- Create: `backend/src/weather/weather.controller.spec.ts`

- [ ] **Step 1: Create the spec file**

```typescript
// backend/src/weather/weather.controller.spec.ts
import { WeatherController } from './weather.controller'

describe('WeatherController', () => {
  it('delegates to service.getWeather()', async () => {
    const mockData = {
      temperature_2m: 18.9,
      weather_code: 80,
      wind_speed_10m: 10.6,
      wind_direction_10m: 252,
      relative_humidity_2m: 64,
      water_temperature: 15.6,
    }
    const service = { getWeather: jest.fn().mockResolvedValue(mockData) }
    const controller = new WeatherController(service as any)
    expect(await controller.getWeather()).toEqual(mockData)
    expect(service.getWeather).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd backend && npm test -- --testPathPattern=weather.controller
```

Expected: FAIL — `Cannot find module './weather.controller'`

---

### Task 3: Implement controller, service, module

**Files:**
- Create: `backend/src/weather/weather.controller.ts`
- Create: `backend/src/weather/weather.service.ts`
- Create: `backend/src/weather/weather.module.ts`

- [ ] **Step 1: Create the controller**

```typescript
// backend/src/weather/weather.controller.ts
import { Controller, Get } from '@nestjs/common'
import { WeatherService } from './weather.service'

@Controller('api/weather')
export class WeatherController {
  constructor(private service: WeatherService) {}

  @Get()
  getWeather() {
    return this.service.getWeather()
  }
}
```

- [ ] **Step 2: Create the service**

```typescript
// backend/src/weather/weather.service.ts
import { Injectable, BadGatewayException, Inject } from '@nestjs/common'
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager'

const LAT = 51.2614894
const LON = 12.339342
const FORECAST_TTL = 60 * 60 * 1000      // 1h in ms (cache-manager v5 uses ms)
const WATER_TEMP_TTL = 3 * 60 * 60 * 1000 // 3h in ms

export interface WeatherData {
  temperature_2m: number
  weather_code: number
  wind_speed_10m: number
  wind_direction_10m: number
  relative_humidity_2m: number
  water_temperature: number | null
}

type ForecastData = Omit<WeatherData, 'water_temperature'>

@Injectable()
export class WeatherService {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async getWeather(): Promise<WeatherData> {
    const [forecast, waterTemp] = await Promise.all([
      this.getForecast(),
      this.getWaterTemp(),
    ])
    return { ...forecast, water_temperature: waterTemp }
  }

  private async getForecast(): Promise<ForecastData> {
    const cached = await this.cache.get<ForecastData>('weather:forecast')
    if (cached !== undefined) return cached

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m` +
      `&wind_speed_unit=kmh&timezone=Europe/Berlin`

    const res = await fetch(url).catch(() => null)
    if (!res?.ok) throw new BadGatewayException('weather fetch failed')

    const data = await res.json()
    const c = data.current
    const result: ForecastData = {
      temperature_2m: c.temperature_2m,
      weather_code: c.weather_code,
      wind_speed_10m: c.wind_speed_10m,
      wind_direction_10m: c.wind_direction_10m,
      relative_humidity_2m: c.relative_humidity_2m,
    }

    await this.cache.set('weather:forecast', result, FORECAST_TTL)
    return result
  }

  private async getWaterTemp(): Promise<number | null> {
    const cached = await this.cache.get<number>('weather:water_temp')
    if (cached !== undefined) return cached

    try {
      const res = await fetch('http://api.openmeteo.com/observations/openmeteo/1001/t2')
      if (!res.ok) return null
      const data: [number, number] = await res.json()
      const temp = data[1]
      await this.cache.set('weather:water_temp', temp, WATER_TEMP_TTL)
      return temp
    } catch {
      return null
    }
  }
}
```

- [ ] **Step 3: Create the module**

```typescript
// backend/src/weather/weather.module.ts
import { Module } from '@nestjs/common'
import { WeatherController } from './weather.controller'
import { WeatherService } from './weather.service'

@Module({
  controllers: [WeatherController],
  providers: [WeatherService],
})
export class WeatherModule {}
```

- [ ] **Step 4: Run the controller test — should pass now**

```bash
cd backend && npm test -- --testPathPattern=weather.controller
```

Expected: PASS — `1 passed`

- [ ] **Step 5: Commit**

```bash
git add backend/src/weather/ backend/package.json backend/package-lock.json
git commit -m "feat(backend): add weather module with forecast and water temp caching"
```

---

### Task 4: Wire WeatherModule into AppModule

**Files:**
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Update AppModule**

Add `CacheModule` import and `WeatherModule` to the imports array. The full updated file:

```typescript
// backend/src/app.module.ts
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
```

- [ ] **Step 2: Run all backend tests**

```bash
cd backend && npm test
```

Expected: all pass, no regressions.

- [ ] **Step 3: Smoke-test the endpoint manually**

Start the dev server (`npm run start:dev` in the backend directory or `docker compose up`), then:

```bash
curl -s http://localhost:3000/api/weather
```

Expected: JSON object with keys `temperature_2m`, `weather_code`, `wind_speed_10m`, `wind_direction_10m`, `relative_humidity_2m`, `water_temperature`. `water_temperature` should be a number (e.g. `15.6`).

- [ ] **Step 4: Commit**

```bash
git add backend/src/app.module.ts
git commit -m "feat(backend): register CacheModule and WeatherModule in AppModule"
```

---

### Task 5: Update frontend to use backend weather endpoint

**Files:**
- Modify: `frontend/src/weather.js`

- [ ] **Step 1: Replace weather.js with the updated version**

The full updated `frontend/src/weather.js`:

```javascript
const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.finnslandzunge.com'

const WMO = {
  0:  ['CLEAR SKY',        'KLARER HIMMEL'],
  1:  ['MAINLY CLEAR',     'ÜBERWIEGEND KLAR'],
  2:  ['PARTLY CLOUDY',    'TEILWEISE BEWÖLKT'],
  3:  ['OVERCAST',         'BEDECKT'],
  45: ['FOG',              'NEBEL'],
  48: ['ICING FOG',        'GEFRIERENDER NEBEL'],
  51: ['LIGHT DRIZZLE',    'LEICHTER NIESELREGEN'],
  53: ['DRIZZLE',          'NIESELREGEN'],
  55: ['HEAVY DRIZZLE',    'STARKER NIESELREGEN'],
  61: ['LIGHT RAIN',       'LEICHTER REGEN'],
  63: ['RAIN',             'REGEN'],
  65: ['HEAVY RAIN',       'STARKER REGEN'],
  71: ['LIGHT SNOW',       'LEICHTER SCHNEE'],
  73: ['SNOW',             'SCHNEE'],
  75: ['HEAVY SNOW',       'STARKER SCHNEE'],
  77: ['SNOW GRAINS',      'SCHNEEKÖRNER'],
  80: ['SHOWERS',          'SCHAUER'],
  81: ['SHOWERS',          'SCHAUER'],
  82: ['HEAVY SHOWERS',    'STARKE SCHAUER'],
  85: ['SNOW SHOWERS',     'SCHNEESCHAUER'],
  86: ['HEAVY SNOW SHOWERS','STARKE SCHNEESCHAUER'],
  95: ['THUNDERSTORM',     'GEWITTER'],
  96: ['THUNDERSTORM',     'GEWITTER'],
  99: ['THUNDERSTORM',     'GEWITTER'],
}

function windDir(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

function renderWeather() {
  const el = document.getElementById('weather-terminal')
  if (!el) return

  const lang = localStorage.getItem('lang') || 'en'
  const de = lang === 'de'

  el.innerHTML = `<span>&gt; ${de ? 'WETTER-UPLINK INITIALISIEREN...' : 'INITIALIZING WEATHER UPLINK...'}</span>`

  fetch(`${API_URL}/api/weather`)
    .then(r => r.json())
    .then(data => {
      const idx = de ? 1 : 0
      const condition = (WMO[data.weather_code] || ['UNKNOWN', 'UNBEKANNT'])[idx]
      const now = new Date().toLocaleString('de-DE').replace('T', ' ').slice(0, 16)
      const sep = '─'.repeat(36)
      const waterTemp = data.water_temperature != null ? `${data.water_temperature}°C` : '--'

      const lines = [
        `> ${de ? 'WETTER-UPLINK: LANDZUNGE-NODE' : 'WEATHER UPLINK: LANDZUNGE NODE'}`,
        `> ${de ? 'ZEITSTEMPEL  ' : 'TIMESTAMP    '}: ${now}`,
        `> ${de ? 'KOORDINATEN  ' : 'COORDINATES  '}: 51.2615°N 12.3393°E`,
        `> ${sep}`,
        `> ${de ? 'TEMP         ' : 'TEMP         '}: ${data.temperature_2m}°C`,
        `> ${de ? 'FEUCHTIGKEIT ' : 'HUMIDITY     '}: ${data.relative_humidity_2m}%`,
        `> ${de ? 'WIND         ' : 'WIND         '}: ${data.wind_speed_10m} km/h ${windDir(data.wind_direction_10m)}`,
        `> ${de ? 'WASSERTEMP   ' : 'WATER TEMP   '}: ${waterTemp}`,
        `> ${de ? 'STATUS       ' : 'STATUS       '}: ${condition}`,
        `> ${sep}`,
        `> ${de ? 'VERBINDUNG: STABIL' : 'CONNECTION: STABLE'}`,
      ]

      el.innerHTML = lines.map(l => `<span>${l}</span>`).join('\n')
    })
    .catch(() => {
      el.innerHTML = `<span>&gt; CONNECTION FAILED — NODE OFFLINE</span>`
    })
}

export function initWeather() {
  document.addEventListener('landzunge:langchange', renderWeather)
  renderWeather()
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/weather.js
git commit -m "feat(frontend): consume weather from backend API, add water temperature display"
```

---

### Task 6: End-to-end smoke test with Docker

**Files:** none

- [ ] **Step 1: Start all services**

```bash
docker compose up --build
```

Wait until all three services are ready (look for `Nest application successfully started` in backend logs).

- [ ] **Step 2: Check backend endpoint**

```bash
curl -s http://localhost:3000/api/weather
```

Expected: JSON object with all 6 fields, `water_temperature` is a number.

- [ ] **Step 3: Check frontend displays water temperature**

Open http://localhost:5173 in a browser. The weather terminal block should show a `WATER TEMP` line with a value in °C (not `--`).

- [ ] **Step 4: Stop services**

```bash
docker compose down
```

- [ ] **Step 5: Close issue**

```bash
gh issue close 19 --comment "Implemented: weather fetching moved to backend, water temp from Cospudener See sensor (openmeteo.com station 1001/t2). Forecast cached 1h, water temp cached 3h."
```
