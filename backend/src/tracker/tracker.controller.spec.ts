import { TrackerController } from './tracker.controller'

describe('TrackerController', () => {
  it('delegates to service.track()', async () => {
    const service = { track: jest.fn().mockResolvedValue({ count: 7 }) }
    const controller = new TrackerController(service as any)
    expect(await controller.track()).toEqual({ count: 7 })
    expect(service.track).toHaveBeenCalledTimes(1)
  })
})
