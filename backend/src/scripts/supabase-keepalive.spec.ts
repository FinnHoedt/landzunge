import { SupabaseClient } from '@supabase/supabase-js'
import { createKeepaliveClient, keepAlive } from './supabase-keepalive'

function mockClient(result: { error: { message: string } | null }) {
  const limit = jest.fn().mockResolvedValue(result)
  const select = jest.fn(() => ({ limit }))
  const from = jest.fn(() => ({ select }))
  return { client: { from } as unknown as SupabaseClient, from, select, limit }
}

describe('supabase-keepalive', () => {
  describe('keepAlive', () => {
    it('runs a real query against guestbook_entries', async () => {
      const { client, from, select, limit } = mockClient({ error: null })

      await keepAlive(client)

      expect(from).toHaveBeenCalledWith('guestbook_entries')
      expect(select).toHaveBeenCalledWith('id')
      expect(limit).toHaveBeenCalledWith(1)
    })

    it('throws when the query fails', async () => {
      const { client } = mockClient({ error: { message: 'project paused' } })

      await expect(keepAlive(client)).rejects.toThrow(
        'Supabase keepalive query failed: project paused',
      )
    })
  })

  describe('createKeepaliveClient', () => {
    it('creates a client from SUPABASE_URL and SUPABASE_SERVICE_KEY', () => {
      const client = createKeepaliveClient({
        SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_SERVICE_KEY: 'test-service-key',
      })

      expect(typeof client.from).toBe('function')
    })

    it('throws when env vars are missing', () => {
      expect(() => createKeepaliveClient({ SUPABASE_URL: 'https://test.supabase.co' })).toThrow(
        'SUPABASE_URL and SUPABASE_SERVICE_KEY must be set',
      )
    })
  })
})
