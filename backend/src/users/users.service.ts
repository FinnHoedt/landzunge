import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
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
    const { data: { users }, error: listError } = await this.supabase.client.auth.admin.listUsers({ perPage: 1000 })
    if (listError) throw new BadRequestException(listError.message)

    const authUser = users.find((u: any) => u.email === email.toLowerCase())
    if (!authUser) throw new NotFoundException(`No auth user with email ${email}`)

    const { data: roleRow, error: roleError } = await this.supabase.client
      .from('roles')
      .select('id')
      .eq('name', roleName)
      .single()
    if (roleError || !roleRow) throw new BadRequestException(`Role '${roleName}' not found`)

    const { error } = await this.supabase.client
      .from('user_roles')
      .insert({ user_id: authUser.id, role_id: (roleRow as any).id })
    if (error) throw new BadRequestException(error.message)

    return { id: authUser.id, email, role: roleName }
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
