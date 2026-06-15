import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { SupabaseService } from '../supabase/supabase.service'
import { ROLES_KEY } from './roles.decorator'

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private supabase: SupabaseService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    if (!request.user) throw new ForbiddenException()

    const { data } = await this.supabase.client
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', request.user.id)
      .single()

    if (!data) throw new ForbiddenException()

    const role = (data as any).roles.name
    request.user.role = role

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (requiredRoles?.length && !requiredRoles.includes(role)) {
      throw new ForbiddenException()
    }

    return true
  }
}
