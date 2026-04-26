import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    if (!request.user) throw new ForbiddenException()

    const { data } = await this.supabase.client
      .from('admins')
      .select('id')
      .eq('id', request.user.id)
      .single()

    if (!data) throw new ForbiddenException()
    return true
  }
}
