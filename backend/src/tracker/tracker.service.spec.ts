import { InternalServerErrorException } from '@nestjs/common'
import { TrackerService } from './tracker.service'

const makeSupabase = () => ({
  client: { from: jest.fn() },
})

describe('TrackerService', () => {
  describe('track', () => {
    it('inserts a row and returns total count', async () => {
      const supabase = makeSupabase()
      const insertChain = { insert: jest.fn().mockResolvedValue({ error: null }) }
      const countChain = { select: jest.fn().mockResolvedValue({ count: 42, error: null }) }
      supabase.client.from
        .mockReturnValueOnce(insertChain)
        .mockReturnValueOnce(countChain)

      const service = new TrackerService(supabase as any)
      expect(await service.track()).toEqual({ count: 42 })
    })

    it('throws on insert error', async () => {
      const supabase = makeSupabase()
      supabase.client.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: new Error('db') }),
      })

      const service = new TrackerService(supabase as any)
      await expect(service.track()).rejects.toThrow(InternalServerErrorException)
    })

    it('throws on count error', async () => {
      const supabase = makeSupabase()
      supabase.client.from
        .mockReturnValueOnce({ insert: jest.fn().mockResolvedValue({ error: null }) })
        .mockReturnValueOnce({ select: jest.fn().mockResolvedValue({ count: null, error: new Error('db') }) })

      const service = new TrackerService(supabase as any)
      await expect(service.track()).rejects.toThrow(InternalServerErrorException)
    })

    it('returns 0 when count is null but no error', async () => {
      const supabase = makeSupabase()
      supabase.client.from
        .mockReturnValueOnce({ insert: jest.fn().mockResolvedValue({ error: null }) })
        .mockReturnValueOnce({ select: jest.fn().mockResolvedValue({ count: null, error: null }) })

      const service = new TrackerService(supabase as any)
      expect(await service.track()).toEqual({ count: 0 })
    })
  })
})
