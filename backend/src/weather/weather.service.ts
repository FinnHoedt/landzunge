import { Injectable, BadGatewayException, Inject, Logger } from '@nestjs/common'
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager'

const LAT = 51.2614894
const LON = 12.339342
const FORECAST_TTL = 60 * 60 * 1000       // 1h in ms (cache-manager v7 uses ms)
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
  private readonly logger = new Logger(WeatherService.name)

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

    const res = await fetch(url).catch((err: unknown) => {
      this.logger.warn({ err }, 'open-meteo forecast fetch failed')
      return null
    })
    if (!res?.ok) {
      if (res) this.logger.warn({ status: res.status }, 'open-meteo forecast returned non-OK status')
      throw new BadGatewayException('weather fetch failed')
    }

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
      const res = await fetch('https://api.openmeteo.com/observations/openmeteo/1001/t2')
      if (!res.ok) {
        this.logger.warn({ status: res.status }, 'water temp API returned non-OK status')
        return null
      }
      const data: [number, number] = await res.json()
      const temp = data[1]
      await this.cache.set('weather:water_temp', temp, WATER_TEMP_TTL)
      return temp
    } catch (err) {
      this.logger.warn({ err }, 'water temp fetch failed')
      return null
    }
  }
}
