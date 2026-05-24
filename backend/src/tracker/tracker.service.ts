import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class TrackerService {
  constructor(private supabase: SupabaseService) {}

  async getCount(): Promise<{ count: number }> {
    const { count, error } = await this.supabase.client
      .from('visitor_count')
      .select('*', { count: 'exact', head: true })

    if (error) throw new InternalServerErrorException('Failed to get count')

    return { count: count ?? 0 }
  }

  async track(): Promise<{ count: number }> {
    const { error: insertError } = await this.supabase.client
      .from('visitor_count')
      .insert({})

    if (insertError) throw new InternalServerErrorException('Failed to track visit')

    const { count, error: countError } = await this.supabase.client
      .from('visitor_count')
      .select('*', { count: 'exact', head: true })

    if (countError) throw new InternalServerErrorException('Failed to get count')

    return { count: count ?? 0 }
  }
}
