import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common'
import { randomBytes } from 'crypto'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class UsersService {
  constructor(private supabase: SupabaseService) {}

  async list() {
    const { data: rows, error } = await this.supabase.client
      .from('user_roles')
      .select('user_id, roles(name)')

    if (error) throw new BadRequestException(error.message)
    if (!rows?.length) return []

    const { data: { users }, error: authError } = await this.supabase.client.auth.admin.listUsers({ perPage: 1000 })
    if (authError) throw new BadRequestException(authError.message)

    return rows.map((row: any) => ({
      id: row.user_id,
      role: row.roles.name,
      email: users.find((u: any) => u.id === row.user_id)?.email ?? 'unknown',
    }))
  }

  async add(email: string, roleName: string) {
    const normalizedEmail = email.toLowerCase()

    const { data: roleRow, error: roleError } = await this.supabase.client
      .from('roles')
      .select('id')
      .eq('name', roleName)
      .single()
    if (roleError || !roleRow) throw new BadRequestException(`Role '${roleName}' not found`)

    const { data: { users }, error: listError } = await this.supabase.client.auth.admin.listUsers({ perPage: 1000 })
    if (listError) throw new BadRequestException(listError.message)

    let authUser = users.find((u: any) => u.email === normalizedEmail)
    let password: string | undefined

    if (authUser) {
      const { data: existing } = await this.supabase.client
        .from('user_roles')
        .select('user_id')
        .eq('user_id', authUser.id)
        .maybeSingle()
      if (existing) throw new ConflictException('User already has a role')
    } else {
      password = randomBytes(18).toString('base64url')
      const { data: created, error: createError } =
        await this.supabase.client.auth.admin.createUser({
          email: normalizedEmail,
          password,
          email_confirm: true,
        })
      if (createError || !created?.user) {
        throw new BadRequestException(createError?.message ?? 'Could not create auth user')
      }
      authUser = created.user
    }

    const { error } = await this.supabase.client
      .from('user_roles')
      .insert({ user_id: authUser.id, role_id: (roleRow as any).id })
    if (error) throw new BadRequestException(error.message)

    return {
      id: authUser.id,
      email: authUser.email,
      role: roleName,
      ...(password ? { password } : {}),
    }
  }

  async updateRole(userId: string, roleName: string) {
    const { data: roleRow, error: roleError } = await this.supabase.client
      .from('roles')
      .select('id')
      .eq('name', roleName)
      .single()
    if (roleError || !roleRow) throw new BadRequestException(`Role '${roleName}' not found`)

    const { error } = await this.supabase.client
      .from('user_roles')
      .update({ role_id: (roleRow as any).id })
      .eq('user_id', userId)
    if (error) throw new BadRequestException(error.message)
  }

  async remove(userId: string) {
    const { error } = await this.supabase.client
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
    if (error) throw new BadRequestException(error.message)
  }
}
