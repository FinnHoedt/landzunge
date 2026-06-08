import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const profanity = require('leo-profanity') as typeof import('leo-profanity')
import * as sharp from 'sharp'
import { SupabaseService } from '../supabase/supabase.service'
import { CreateEntryDto } from './dto/create-entry.dto'

@Injectable()
export class GuestbookService {
  private readonly logger = new Logger(GuestbookService.name)

  constructor(
    private supabase: SupabaseService,
    private config: ConfigService,
  ) {}

  async getEntries(page = 1, limit = 20) {
    const from = (page - 1) * limit
    const { data, error } = await this.supabase.client
      .from('guestbook_entries')
      .select('id, name, message, created_at, image_path, image_approved')
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)

    if (error) throw new InternalServerErrorException('Failed to fetch entries')

    const base = this.config.getOrThrow('SUPABASE_URL')
    return data.map((e) => ({
      id: e.id,
      name: e.name,
      message: e.message,
      created_at: e.created_at,
      image_url:
        e.image_approved && e.image_path
          ? `${base}/storage/v1/object/public/guestbook-images/${e.image_path}`
          : null,
    }))
  }

  async getAllAdmin() {
    const { data, error } = await this.supabase.client
      .from('guestbook_entries')
      .select('id, name, message, created_at, image_path, image_approved')
      .order('created_at', { ascending: false })

    if (error) throw new InternalServerErrorException('Failed to fetch entries')

    const base = this.config.getOrThrow('SUPABASE_URL')
    return data.map((e) => ({
      id: e.id,
      name: e.name,
      message: e.message,
      created_at: e.created_at,
      image_path: e.image_path,
      image_approved: e.image_approved,
      image_url: e.image_path
        ? `${base}/storage/v1/object/public/guestbook-images/${e.image_path}`
        : null,
    }))
  }

  async createEntry(dto: CreateEntryDto, file?: Express.Multer.File) {
    if (profanity.check(dto.name) || profanity.check(dto.message)) {
      this.logger.warn({ name: dto.name }, 'guestbook submission blocked by profanity filter')
      throw new BadRequestException('Please keep entries respectful.')
    }

    let image_path: string | null = null
    if (file) {
      image_path = await this.uploadImage(file)
      this.logger.log({ image_path }, 'guestbook image uploaded')
    }

    const { error } = await this.supabase.client
      .from('guestbook_entries')
      .insert({ name: dto.name, message: dto.message, image_path })

    if (error) {
      if (image_path) {
        await this.supabase.client.storage
          .from('guestbook-images')
          .remove([image_path])
      }
      this.logger.warn({ name: dto.name, err: error }, 'guestbook db insert failed')
      throw new InternalServerErrorException('Failed to submit entry')
    }

    this.logger.log({ name: dto.name, hasImage: !!image_path }, 'guestbook entry submitted')
  }

  async approveImage(id: string) {
    const { error } = await this.supabase.client
      .from('guestbook_entries')
      .update({ image_approved: true })
      .eq('id', id)
    if (error) throw new InternalServerErrorException()
  }

  async deleteEntry(id: string) {
    const { data } = await this.supabase.client
      .from('guestbook_entries')
      .select('image_path')
      .eq('id', id)
      .single()

    if (data?.image_path) {
      await this.supabase.client.storage
        .from('guestbook-images')
        .remove([data.image_path])
    }

    const { error } = await this.supabase.client
      .from('guestbook_entries')
      .delete()
      .eq('id', id)
    if (error) throw new InternalServerErrorException()
  }

  private async uploadImage(file: Express.Multer.File): Promise<string> {
    let processed: Buffer
    try {
      processed = await sharp(file.buffer)
        .grayscale()
        .resize({ width: 600, withoutEnlargement: true })
        .jpeg({ quality: 72 })
        .toBuffer()
    } catch (err) {
      this.logger.error({ err }, 'sharp image processing failed')
      throw new BadRequestException('Image could not be processed')
    }

    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
    const { error } = await this.supabase.client.storage
      .from('guestbook-images')
      .upload(path, processed, { contentType: 'image/jpeg', upsert: false })
    if (error) {
      this.logger.warn({ err: error }, 'guestbook image storage upload failed')
      throw new InternalServerErrorException('Image upload failed')
    }
    return path
  }
}
