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
