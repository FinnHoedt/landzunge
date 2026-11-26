import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase pauses free-plan projects after 7 days without activity. This
// standalone script runs one cheap, real query so the project registers
// activity. It ships in the backend image and is run on the server by a
// systemd timer (Podman Quadlet): `node dist/scripts/supabase-keepalive.js`.

export async function keepAlive(client: SupabaseClient): Promise<void> {
  const { error } = await client.from('guestbook_entries').select('id').limit(1)

  if (error) throw new Error(`Supabase keepalive query failed: ${error.message}`)
}

export function createKeepaliveClient(env: NodeJS.ProcessEnv = process.env): SupabaseClient {
  const url = env.SUPABASE_URL
  const key = env.SUPABASE_SERVICE_KEY

  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set')

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

async function main(): Promise<void> {
  try {
    await keepAlive(createKeepaliveClient())
    console.log('Supabase keepalive ok')
  } catch (err) {
    console.error(err instanceof Error ? err.message : err)
    process.exitCode = 1
  }
}

if (require.main === module) void main()
