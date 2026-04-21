import { InternalServerErrorException } from '@nestjs/common'
import { DispatchesService } from './dispatches.service'

const makeSupabase = () => ({
  client: { from: jest.fn() },
})

describe('DispatchesService', () => {
  describe('getPublished', () => {
    it('returns teaser fields for published dispatches', async () => {
      const rows = [
        {
          id: '1',
          slug: 'test-post',
          title: 'Test Post',
          body: '<p>Hello world from the Landzunge.</p>',
          created_at: '2026-01-01T00:00:00Z',
        },
      ]
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: rows, error: null }),
      }
      const supabase = makeSupabase()
      supabase.client.from.mockReturnValue(mockChain)

      const service = new DispatchesService(supabase as any)
      const result = await service.getPublished()

      expect(result[0].slug).toBe('test-post')
      expect(result[0].excerpt).toBe('Hello world from the Landzunge.')
      expect((result[0] as any).body).toBeUndefined()
    })
  })

  describe('getBySlug', () => {
    it('throws NotFoundException when dispatch not found', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('not found') }),
      }
      const supabase = makeSupabase()
      supabase.client.from.mockReturnValue(mockChain)

      const service = new DispatchesService(supabase as any)
      await expect(service.getBySlug('missing')).rejects.toThrow()
    })
  })

  describe('toSlug (private)', () => {
    it('converts title to url-safe slug', () => {
      const service = new DispatchesService({ client: { from: jest.fn() } } as any)
      expect((service as any).toSlug('Hello World! A Test')).toBe('hello-world-a-test')
    })
  })
})
