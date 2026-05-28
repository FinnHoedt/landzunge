import { BadRequestException, InternalServerErrorException } from '@nestjs/common'
import { GuestbookService } from './guestbook.service'

const mockSharpBuffer = Buffer.from('fake-jpeg')
const mockSharpChain = {
  grayscale: jest.fn().mockReturnThis(),
  resize: jest.fn().mockReturnThis(),
  jpeg: jest.fn().mockReturnThis(),
  toBuffer: jest.fn().mockResolvedValue(mockSharpBuffer),
}
jest.mock('sharp', () => jest.fn(() => mockSharpChain))

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

  describe('uploadImage (via createEntry)', () => {
    it('uploads a .jpg with image/jpeg content-type after sharp processing', async () => {
      const uploadMock = jest.fn().mockResolvedValue({ error: null })
      const supabase = makeSupabase()
      supabase.client.storage.from.mockReturnValue({ upload: uploadMock })
      const insertChain = {
        insert: jest.fn().mockResolvedValue({ error: null }),
      }
      supabase.client.from.mockReturnValue(insertChain)

      const service = new GuestbookService(supabase as any, makeConfig() as any)
      const fakeFile = { buffer: Buffer.from('img'), mimetype: 'image/png' } as Express.Multer.File
      await service.createEntry({ name: 'Finn', message: 'Hello' }, fakeFile)

      const [path, buffer, opts] = uploadMock.mock.calls[0]
      expect(path).toMatch(/\.jpg$/)
      expect(buffer).toBe(mockSharpBuffer)
      expect(opts.contentType).toBe('image/jpeg')
    })

    it('throws BadRequestException when sharp fails', async () => {
      mockSharpChain.toBuffer.mockRejectedValueOnce(new Error('corrupt'))
      const supabase = makeSupabase()
      const service = new GuestbookService(supabase as any, makeConfig() as any)
      const fakeFile = { buffer: Buffer.from('bad'), mimetype: 'image/jpeg' } as Express.Multer.File
      await expect(
        service.createEntry({ name: 'Finn', message: 'Hello' }, fakeFile)
      ).rejects.toThrow(BadRequestException)
    })
  })
})
