import { Injectable, UnauthorizedException } from '@nestjs/common'
import { createClient } from '@supabase/supabase-js'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  async login(email: string, password: string) {
    // Use a temporary client to avoid tainting the singleton service role client with a user session
    const tempClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )

    const { data, error } = await tempClient.auth.signInWithPassword({
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
