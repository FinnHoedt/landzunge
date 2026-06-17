import { ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AdminGuard } from './admin.guard'

const makeContext = (user?: any, handler = {}, cls = {}) => {
  const request: any = { user }
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => handler,
    getClass: () => cls,
  } as unknown as ExecutionContext
}

describe('AdminGuard', () => {
  const mockSupabase = { client: { from: jest.fn() } }
  const reflector = new Reflector()
  const guard = new AdminGuard(mockSupabase as any, reflector)

  beforeEach(() => jest.clearAllMocks())

  it('throws ForbiddenException when no user on request', async () => {
    await expect(guard.canActivate(makeContext())).rejects.toThrow(ForbiddenException)
  })

  it('throws ForbiddenException when user has no user_roles row', async () => {
    mockSupabase.client.from.mockReturnValue({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }),
    })
    await expect(guard.canActivate(makeContext({ id: 'user-1' }))).rejects.toThrow(ForbiddenException)
  })

  it('returns true and sets request.user.role when no @Roles required', async () => {
    mockSupabase.client.from.mockReturnValue({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { roles: { name: 'admin' } } }) }) }),
    })
    const ctx = makeContext({ id: 'user-1' })
    const result = await guard.canActivate(ctx)
    expect(result).toBe(true)
    expect(ctx.switchToHttp().getRequest().user.role).toBe('admin')
  })

  it('throws ForbiddenException when role not in required roles', async () => {
    mockSupabase.client.from.mockReturnValue({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { roles: { name: 'admin' } } }) }) }),
    })
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['super_admin'])
    await expect(guard.canActivate(makeContext({ id: 'user-1' }))).rejects.toThrow(ForbiddenException)
  })

  it('returns true when role is in required roles', async () => {
    mockSupabase.client.from.mockReturnValue({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { roles: { name: 'super_admin' } } }) }) }),
    })
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['super_admin'])
    const result = await guard.canActivate(makeContext({ id: 'user-1' }))
    expect(result).toBe(true)
  })
})
