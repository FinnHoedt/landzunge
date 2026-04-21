import { ExecutionContext, ForbiddenException } from '@nestjs/common'
import { AdminGuard } from './admin.guard'

const makeContext = (user?: any) => ({
  switchToHttp: () => ({
    getRequest: () => ({ user }),
  }),
} as unknown as ExecutionContext)

describe('AdminGuard', () => {
  const mockSupabase = {
    client: {
      from: jest.fn(),
    },
  }

  const guard = new AdminGuard(mockSupabase as any)

  beforeEach(() => jest.clearAllMocks())

  it('throws ForbiddenException when no user on request', async () => {
    await expect(guard.canActivate(makeContext())).rejects.toThrow(ForbiddenException)
  })

  it('throws ForbiddenException when user is not in admins table', async () => {
    mockSupabase.client.from.mockReturnValue({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
    })
    await expect(guard.canActivate(makeContext({ id: 'not-admin' }))).rejects.toThrow(ForbiddenException)
  })

  it('returns true when user is in admins table', async () => {
    mockSupabase.client.from.mockReturnValue({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: 'admin-id' }, error: null }) }) }),
    })
    const result = await guard.canActivate(makeContext({ id: 'admin-id' }))
    expect(result).toBe(true)
  })
})
