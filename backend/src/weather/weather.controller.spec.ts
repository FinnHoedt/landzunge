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
