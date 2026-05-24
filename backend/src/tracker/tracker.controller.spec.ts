import { TrackerController } from './tracker.controller'

describe('TrackerController', () => {
  it('delegates to service.track() on POST', async () => {
    const service = { track: jest.fn().mockResolvedValue({ count: 7 }), getCount: jest.fn() }
    const controller = new TrackerController(service as any)
    expect(await controller.track()).toEqual({ count: 7 })
    expect(service.track).toHaveBeenCalledTimes(1)
  })

  it('delegates to service.getCount() on GET', async () => {
    const service = { track: jest.fn(), getCount: jest.fn().mockResolvedValue({ count: 42 }) }
    const controller = new TrackerController(service as any)
    expect(await controller.getCount()).toEqual({ count: 42 })
    expect(service.getCount).toHaveBeenCalledTimes(1)
  })
})
