import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { CreateDispatchDto } from './dto/create-dispatch.dto'
import { UpdateDispatchDto } from './dto/update-dispatch.dto'

@Injectable()
export class DispatchesService {
  constructor(private supabase: SupabaseService) {}

  async getPublished() {
    const { data, error } = await this.supabase.client
      .from('dispatches')
      .select('id, slug, title, body, created_at')
      .eq('published', true)
      .order('created_at', { ascending: false })

    if (error) throw new InternalServerErrorException()

    return data.map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      excerpt: this.stripHtml(d.body).slice(0, 200),
      created_at: d.created_at,
    }))
  }

  async getBySlug(slug: string) {
    const { data, error } = await this.supabase.client
      .from('dispatches')
      .select('id, slug, title, body, created_at')
      .eq('slug', slug)
      .single()

    if (error || !data) throw new NotFoundException()
    return data
  }

  async getAllAdmin() {
    const { data, error } = await this.supabase.client
      .from('dispatches')
      .select('id, slug, title, body, published, created_at')
      .order('created_at', { ascending: false })

    if (error) throw new InternalServerErrorException()
    return data
  }

  async create(dto: CreateDispatchDto) {
    const slug = dto.slug ?? this.toSlug(dto.title)
    const { data, error } = await this.supabase.client
      .from('dispatches')
      .insert({ slug, title: dto.title, body: dto.body, published: dto.published ?? false })
      .select()
      .single()

    if (error) throw new InternalServerErrorException('Failed to create dispatch')
    return data
  }

  async update(id: string, dto: UpdateDispatchDto) {
    const updates: Record<string, unknown> = {}
    if (dto.title !== undefined) updates.title = dto.title
    if (dto.body !== undefined) updates.body = dto.body
    if (dto.published !== undefined) updates.published = dto.published
    if (dto.slug !== undefined) updates.slug = dto.slug

    const { data, error } = await this.supabase.client
      .from('dispatches')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new InternalServerErrorException()
    return data
  }

  async delete(id: string) {
    const { error } = await this.supabase.client
      .from('dispatches')
      .delete()
      .eq('id', id)

    if (error) throw new InternalServerErrorException()
  }

  private toSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }
}
