import { Test } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { SupabaseService } from './supabase.service'

describe('SupabaseService', () => {
  let service: SupabaseService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SupabaseService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) => {
              if (key === 'SUPABASE_URL') return 'https://test.supabase.co'
              if (key === 'SUPABASE_SERVICE_KEY') return 'test-service-key'
              throw new Error(`Unknown config key: ${key}`)
            },
          },
        },
      ],
    }).compile()

    service = module.get(SupabaseService)
  })

  it('exposes a Supabase client', () => {
    expect(service.client).toBeDefined()
    expect(typeof service.client.from).toBe('function')
  })
})
