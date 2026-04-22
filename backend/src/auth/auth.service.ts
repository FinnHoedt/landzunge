import { Injectable, UnauthorizedException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  async login(email: string, password: string) {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email,
      password,
    })
    if (error || !data.session) {
      throw new UnauthorizedException('Invalid credentials')
    }
    return {
      access_token: data.session.access_token,
      expires_at: data.session.expires_at,
      user: { email: data.user.email },
    }
  }
}
