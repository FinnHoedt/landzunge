import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { SupabaseAuthGuard } from './supabase-auth.guard'

const makeContext = (token?: string, requestExtra = {}) => {
  const request: any = {
    headers: token ? { authorization: `Bearer ${token}` } : {},
    ...requestExtra,
  }
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    request,
  } as unknown as ExecutionContext & { request: any }
}

describe('SupabaseAuthGuard', () => {
  const mockSupabase = {
    client: { auth: { getUser: jest.fn() } },
  }
  const guard = new SupabaseAuthGuard(mockSupabase as any)

  beforeEach(() => jest.clearAllMocks())

  it('throws UnauthorizedException when no token present', async () => {
    const ctx = makeContext()
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException)
  })

  it('throws UnauthorizedException when Supabase returns error', async () => {
    mockSupabase.client.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('invalid token'),
    })
    const ctx = makeContext('bad-token')
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException)
  })

  it('sets request.user and returns true for a valid token', async () => {
    const user = { id: 'user-123', email: 'finn@example.com' }
    mockSupabase.client.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    })
    const { request } = makeContext('valid-token') as any
    const ctx = { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext
    const result = await guard.canActivate(ctx)
    expect(result).toBe(true)
    expect(request.user).toEqual(user)
  })
})
