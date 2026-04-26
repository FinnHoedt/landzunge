import { BadRequestException, InternalServerErrorException } from '@nestjs/common'
import { GuestbookService } from './guestbook.service'

const makeSupabase = () => ({
  client: {
    from: jest.fn(),
    storage: { from: jest.fn() },
  },
})

const makeConfig = () => ({
  getOrThrow: (k: string) => k === 'SUPABASE_URL' ? 'https://test.supabase.co' : '',
})

describe('GuestbookService', () => {
  describe('getEntries', () => {
    it('returns entries with image_url set for approved images only', async () => {
      const rows = [
        { id: '1', name: 'Finn', message: 'Hello', created_at: '2026-01-01T00:00:00Z', image_path: 'img.jpg', image_approved: true },
        { id: '2', name: 'Guest', message: 'Hi', created_at: '2026-01-02T00:00:00Z', image_path: 'other.jpg', image_approved: false },
      ]
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: rows, error: null }),
      }
      const supabase = makeSupabase()
      supabase.client.from.mockReturnValue(mockChain)

      const service = new GuestbookService(supabase as any, makeConfig() as any)
      const result = await service.getEntries(1, 20)

      expect(result[0].image_url).toBe('https://test.supabase.co/storage/v1/object/public/guestbook-images/img.jpg')
      expect(result[1].image_url).toBeNull()
    })

    it('throws InternalServerErrorException on Supabase error', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: null, error: new Error('db error') }),
      }
      const supabase = makeSupabase()
      supabase.client.from.mockReturnValue(mockChain)

      const service = new GuestbookService(supabase as any, makeConfig() as any)
      await expect(service.getEntries()).rejects.toThrow(InternalServerErrorException)
    })
  })

  describe('getAllAdmin', () => {
    it('returns all entries including unapproved images with image_url', async () => {
      const rows = [
        { id: '1', name: 'Finn', message: 'Hi', created_at: '2026-01-01T00:00:00Z', image_path: 'img.jpg', image_approved: false },
        { id: '2', name: 'Guest', message: 'Hey', created_at: '2026-01-02T00:00:00Z', image_path: null, image_approved: false },
      ]
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: rows, error: null }),
      }
      const supabase = makeSupabase()
      supabase.client.from.mockReturnValue(mockChain)

      const service = new GuestbookService(supabase as any, makeConfig() as any)
      const result = await service.getAllAdmin()

      expect(result[0].image_url).toBe('https://test.supabase.co/storage/v1/object/public/guestbook-images/img.jpg')
      expect(result[0].image_approved).toBe(false)
      expect(result[1].image_url).toBeNull()
    })
  })

  describe('createEntry', () => {
    it('throws BadRequestException for profane name', async () => {
      const supabase = makeSupabase()
      const service = new GuestbookService(supabase as any, makeConfig() as any)
      await expect(
        service.createEntry({ name: 'fuck', message: 'hello' })
      ).rejects.toThrow(BadRequestException)
    })
  })
})
