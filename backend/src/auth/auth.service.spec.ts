import { UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service'

function makeSupabase(session: any = null, error: any = null) {
  return {
    client: {
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          data: { session, user: session ? { email: 'admin@test.com' } : null },
          error,
        }),
      },
    },
  }
}

describe('AuthService', () => {
  describe('login', () => {
    it('returns token on valid credentials', async () => {
      const session = { access_token: 'tok', expires_at: 9999 }
      const service = new AuthService(makeSupabase(session) as any)
      const result = await service.login('admin@test.com', 'pass')
      expect(result.access_token).toBe('tok')
      expect(result.user.email).toBe('admin@test.com')
    })

    it('throws UnauthorizedException on invalid credentials', async () => {
      const service = new AuthService(makeSupabase(null, new Error('Invalid')) as any)
      await expect(service.login('bad@test.com', 'wrong')).rejects.toThrow(UnauthorizedException)
    })
  })
})
