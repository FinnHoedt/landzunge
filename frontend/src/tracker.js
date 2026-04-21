import { supabase } from './supabase.js'

export async function initTracker() {
  // Record visit and fetch total count in parallel
  const [, { count }] = await Promise.all([
    supabase.from('page_views').insert({}),
    supabase.from('page_views').select('*', { count: 'exact', head: true }),
  ])

  if (count != null) {
    document.getElementById('hit-counter').textContent = String(count).padStart(7, '0')
  }
}
