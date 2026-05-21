# Weather Backend Module — Design Spec

**Date:** 2026-05-21
**Issue:** #19 — Move Open-Meteo connection to backend API and add water temperature
**Branch:** `19-feat-move-open-meteo-connection-to-backend-api-and-add-water-temperature`

---

## Goal

Move the frontend's direct Open-Meteo API call to the backend. Add real water temperature from a sensor at Cospudener See. Cache both data sources independently.

---

## Architecture

New NestJS module `weather` following the existing tracker/guestbook pattern:

```
backend/src/weather/
  weather.module.ts
  weather.controller.ts
  weather.service.ts
  weather.controller.spec.ts
```

`WeatherModule` registered in `AppModule`. `CacheModule.register({ isGlobal: true })` added to `AppModule` imports (no default TTL — each cache key sets its own).

---

## Endpoint

```
GET /api/weather
```

Public, no auth. Subject to global throttler (60 req/min).

### Response shape

```json
{
  "temperature_2m": 18.9,
  "weather_code": 80,
  "wind_speed_10m": 10.6,
  "wind_direction_10m": 252,
  "relative_humidity_2m": 64,
  "water_temperature": 15.6
}
```

`water_temperature` is `number | null`. Null when the sensor fetch fails.

---

## Data Sources

### 1. Weather forecast — open-meteo.com

```
GET https://api.open-meteo.com/v1/forecast
  ?latitude=51.2614894&longitude=12.339342
  &current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m
  &wind_speed_unit=kmh&timezone=Europe/Berlin
```

Cache key: `weather:forecast` — TTL: **1 hour** (open-meteo updates hourly).

### 2. Lake water temperature — openmeteo.com sensor

```
GET http://api.openmeteo.com/observations/openmeteo/1001/t2
```

Returns `[unix_timestamp, celsius]`. Take index `[1]`.

Source: Vantage Pro 2 station at Zöbigker Hafen, Cospudener See. No auth required.

Cache key: `weather:water_temp` — TTL: **3 hours**.

---

## Service Logic

`WeatherService` injects `CACHE_MANAGER` from `@nestjs/cache-manager`.

`getWeather()`:
1. Check `weather:forecast` cache → if miss, fetch open-meteo.com, store with 3600s TTL
2. Check `weather:water_temp` cache → if miss, fetch openmeteo.com sensor, store with 10800s TTL
3. Water temp fetch failure → log warning, return `null` (non-blocking)
4. Forecast fetch failure → throw `502 Bad Gateway` ("weather fetch failed")
5. Return merged object

---

## Caching

`@nestjs/cache-manager` with `cache-manager` v5. In-memory store (no Redis). TTLs set programmatically per key via `cacheManager.set(key, value, ttlMs)` where TTL is in **milliseconds** (cache-manager v5).

`AppModule` change:
```typescript
import { CacheModule } from '@nestjs/cache-manager'
// in imports:
CacheModule.register({ isGlobal: true })
```

---

## Frontend Changes

`frontend/src/weather.js`:
- Replace direct `https://api.open-meteo.com/...` fetch with `fetch(\`${API_URL}/api/weather\`)`
- WMO lookup table and `windDir()` helper stay in frontend (pure display logic)
- Add water temperature line to terminal output: `WASSERTEMP` / `WATER TEMP`
- Null water temp → display `--`
- Error handling unchanged

---

## Tests

`weather.controller.spec.ts`: mock `WeatherService.getWeather()`, assert `GET /api/weather` returns 200 with the correct shape. Follows `tracker.controller.spec.ts` pattern.

No service spec — two `fetch()` calls with a merge; the controller spec plus manual testing is sufficient.

---

## Out of Scope

- Response DTO class / validation (not used elsewhere in this codebase)
- Redis or persistent cache
- Exposing raw sensor timestamp in the API response
