# NestJS Backend — Implementation Plan (Part 1 of 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the frontend into a `frontend/` subdirectory, apply Supabase schema changes, and build a NestJS backend as the sole Supabase client exposing public and admin REST APIs for guestbook and dispatches.

**Architecture:** Flat monorepo — `frontend/`, `backend/`, `admin/` as sibling directories. NestJS holds the Supabase service-role key and handles all DB and storage access. Auth uses Supabase JWT validation plus an `admins` table lookup. Image uploads are proxied through NestJS to Supabase Storage using Multer memory storage.

**Tech Stack:** NestJS 10, @supabase/supabase-js 2, @nestjs/throttler 6, @nestjs/serve-static 4, multer, class-validator, Jest 29, Node 24

---

## File Map

**Created:**
- `backend/package.json`
- `backend/tsconfig.json`
- `backend/tsconfig.build.json`
- `backend/nest-cli.json`
- `backend/.env.example`
- `backend/Dockerfile`
- `backend/src/main.ts`
- `backend/src/app.module.ts`
- `backend/src/supabase/supabase.service.ts`
- `backend/src/supabase/supabase.service.spec.ts`
- `backend/src/supabase/supabase.module.ts`
- `backend/src/auth/supabase-auth.guard.ts`
- `backend/src/auth/supabase-auth.guard.spec.ts`
- `backend/src/auth/admin.guard.ts`
- `backend/src/auth/admin.guard.spec.ts`
- `backend/src/auth/auth.module.ts`
- `backend/src/guestbook/dto/create-entry.dto.ts`
- `backend/src/guestbook/guestbook.service.ts`
- `backend/src/guestbook/guestbook.service.spec.ts`
- `backend/src/guestbook/guestbook.controller.ts`
- `backend/src/guestbook/guestbook.controller.spec.ts`
- `backend/src/guestbook/guestbook.module.ts`
- `backend/src/dispatches/dto/create-dispatch.dto.ts`
- `backend/src/dispatches/dto/update-dispatch.dto.ts`
- `backend/src/dispatches/dispatches.service.ts`
- `backend/src/dispatches/dispatches.service.spec.ts`
- `backend/src/dispatches/dispatches.controller.ts`
- `backend/src/dispatches/dispatches.controller.spec.ts`
- `backend/src/dispatches/dispatches.module.ts`
- `.github/workflows/deploy-frontend.yml`
- `.github/workflows/deploy-backend.yml`

**Moved (repo restructure):**
- `index.html` → `frontend/index.html`
- `style.css` → `frontend/style.css`
- `vite.config.js` → `frontend/vite.config.js`
- `package.json` → `frontend/package.json`
- `package-lock.json` → `frontend/package-lock.json`
- `.env.example` → `frontend/.env.example`
- `src/` → `frontend/src/`
- `public/` → `frontend/public/`
- `CNAME` → `frontend/public/CNAME`

**Deleted:**
- `.github/workflows/deploy.yml`

---

### Task 1: Apply Supabase schema changes

**Files:** Run SQL in the Supabase dashboard SQL editor.

- [ ] **Step 1: Create `dispatches` table**

In the Supabase dashboard → SQL Editor, run:

```sql
CREATE TABLE dispatches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  published boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
```

- [ ] **Step 2: Create `admins` table**

```sql
CREATE TABLE admins (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL
);
```

- [ ] **Step 3: Tighten RLS on `guestbook_entries`**

Remove the anon SELECT and INSERT policies (NestJS uses service role which bypasses RLS):

```sql
DROP POLICY IF EXISTS "Allow anon select" ON guestbook_entries;
DROP POLICY IF EXISTS "Allow anon insert" ON guestbook_entries;
```

If the policy names differ, check with:
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'guestbook_entries';
```
Then drop whichever policies grant anon SELECT and INSERT.

- [ ] **Step 4: Add yourself as an admin**

First get your Supabase Auth user ID. Go to Authentication → Users in the Supabase dashboard, copy your UUID, then:

```sql
INSERT INTO admins (id) VALUES ('your-user-uuid-here');
```

---

### Task 2: Move frontend into `frontend/` subdirectory

**Files:** All existing root frontend files.

- [ ] **Step 1: Create directory and move files**

```bash
mkdir frontend
git mv index.html style.css vite.config.js package.json package-lock.json frontend/
git mv src frontend/src
git mv public frontend/public
git mv CNAME frontend/public/CNAME
```

- [ ] **Step 2: Move `.env.example`**

```bash
git mv .env.example frontend/.env.example
```

- [ ] **Step 3: Verify frontend builds from new location**

```bash
cd frontend && npm install && npm run build
```

Expected: `frontend/dist/` is created with `index.html`, CSS, and JS files. No errors.

- [ ] **Step 4: Commit**

```bash
cd ..
git add -A
git commit -m "refactor: move frontend into frontend/ subdirectory"
```

---

### Task 3: Update GitHub Actions workflows

**Files:**
- Delete: `.github/workflows/deploy.yml`
- Create: `.github/workflows/deploy-frontend.yml`
- Create: `.github/workflows/deploy-backend.yml` (skeleton — filled in Task 17)

- [ ] **Step 1: Delete old workflow**

```bash
git rm .github/workflows/deploy.yml
```

- [ ] **Step 2: Create `deploy-frontend.yml`**

```yaml
# .github/workflows/deploy-frontend.yml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'
      - '.github/workflows/deploy-frontend.yml'

permissions:
  contents: write

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '24'

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Build
        working-directory: frontend
        run: npm run build
        env:
          VITE_API_URL: https://api.finnslandzunge.com

      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/dist
          cname: finnslandzunge.com
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/
git commit -m "ci: split into separate frontend and backend deploy workflows"
```

---

### Task 4: Scaffold `backend/` config and package files

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/tsconfig.build.json`
- Create: `backend/nest-cli.json`
- Create: `backend/.env.example`

- [ ] **Step 1: Create `backend/package.json`**

```json
{
  "name": "landzunge-backend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "node dist/main",
    "start:dev": "nest start --watch",
    "test": "jest --passWithNoTests",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "@nestjs/common": "^10.4.0",
    "@nestjs/config": "^3.3.0",
    "@nestjs/core": "^10.4.0",
    "@nestjs/mapped-types": "^2.0.6",
    "@nestjs/platform-express": "^10.4.0",
    "@nestjs/serve-static": "^4.0.2",
    "@nestjs/throttler": "^6.2.1",
    "@supabase/supabase-js": "^2.49.4",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "leo-profanity": "^1.9.0",
    "multer": "^1.4.5-lts.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.4.9",
    "@nestjs/testing": "^10.4.0",
    "@types/express": "^5.0.0",
    "@types/jest": "^29.5.14",
    "@types/multer": "^1.4.12",
    "@types/node": "^22.0.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.5",
    "typescript": "^5.7.0"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

- [ ] **Step 2: Create `backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false
  }
}
```

- [ ] **Step 3: Create `backend/tsconfig.build.json`**

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

- [ ] **Step 4: Create `backend/nest-cli.json`**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

- [ ] **Step 5: Create `backend/.env.example`**

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
PORT=3000
CORS_ORIGINS=https://finnslandzunge.com,https://admin.finnslandzunge.com
```

- [ ] **Step 6: Install dependencies**

```bash
cd backend && npm install
```

Expected: `node_modules/` created, no errors or peer dependency warnings that would break the build.

- [ ] **Step 7: Commit**

```bash
cd ..
git add backend/
git commit -m "feat: scaffold NestJS backend package and TypeScript config"
```

---

### Task 5: Supabase service

**Files:**
- Create: `backend/src/supabase/supabase.service.ts`
- Create: `backend/src/supabase/supabase.service.spec.ts`
- Create: `backend/src/supabase/supabase.module.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// backend/src/supabase/supabase.service.spec.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npm test -- supabase.service.spec
```

Expected: FAIL — `Cannot find module './supabase.service'`

- [ ] **Step 3: Create the source directory and implement**

```bash
mkdir -p backend/src/supabase
```

```typescript
// backend/src/supabase/supabase.service.ts
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

@Injectable()
export class SupabaseService {
  readonly client: SupabaseClient

  constructor(private config: ConfigService) {
    this.client = createClient(
      config.getOrThrow('SUPABASE_URL'),
      config.getOrThrow('SUPABASE_SERVICE_KEY'),
    )
  }
}
```

- [ ] **Step 4: Create the module**

```typescript
// backend/src/supabase/supabase.module.ts
import { Global, Module } from '@nestjs/common'
import { SupabaseService } from './supabase.service'

@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd backend && npm test -- supabase.service.spec
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
cd ..
git add backend/src/supabase/
git commit -m "feat: add SupabaseService with global module"
```

---

### Task 6: Supabase auth guard

**Files:**
- Create: `backend/src/auth/supabase-auth.guard.ts`
- Create: `backend/src/auth/supabase-auth.guard.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// backend/src/auth/supabase-auth.guard.spec.ts
import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { SupabaseAuthGuard } from './supabase-auth.guard'

const makeContext = (token?: string, requestExtra = {}) => {
  const request: any = {
    headers: token ? { authorization: `Bearer ${token}` } : {},
    ...requestExtra,
  }
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    request,
  } as unknown as ExecutionContext & { request: any }
}

describe('SupabaseAuthGuard', () => {
  const mockSupabase = {
    client: { auth: { getUser: jest.fn() } },
  }
  const guard = new SupabaseAuthGuard(mockSupabase as any)

  beforeEach(() => jest.clearAllMocks())

  it('throws UnauthorizedException when no token present', async () => {
    const ctx = makeContext()
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException)
  })

  it('throws UnauthorizedException when Supabase returns error', async () => {
    mockSupabase.client.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('invalid token'),
    })
    const ctx = makeContext('bad-token')
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException)
  })

  it('sets request.user and returns true for a valid token', async () => {
    const user = { id: 'user-123', email: 'finn@example.com' }
    mockSupabase.client.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    })
    const { request } = makeContext('valid-token') as any
    const ctx = { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext
    const result = await guard.canActivate(ctx)
    expect(result).toBe(true)
    expect(request.user).toEqual(user)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npm test -- supabase-auth.guard.spec
```

Expected: FAIL — `Cannot find module './supabase-auth.guard'`

- [ ] **Step 3: Implement**

```bash
mkdir -p backend/src/auth
```

```typescript
// backend/src/auth/supabase-auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const token = request.headers.authorization?.replace('Bearer ', '')
    if (!token) throw new UnauthorizedException()

    const { data: { user }, error } = await this.supabase.client.auth.getUser(token)
    if (error || !user) throw new UnauthorizedException()

    request.user = user
    return true
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend && npm test -- supabase-auth.guard.spec
```

Expected: PASS (3 tests)

---

### Task 7: Admin guard

**Files:**
- Create: `backend/src/auth/admin.guard.ts`
- Create: `backend/src/auth/admin.guard.spec.ts`
- Create: `backend/src/auth/auth.module.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// backend/src/auth/admin.guard.spec.ts
import { ExecutionContext, ForbiddenException } from '@nestjs/common'
import { AdminGuard } from './admin.guard'

const makeContext = (user?: any) => ({
  switchToHttp: () => ({
    getRequest: () => ({ user }),
  }),
} as unknown as ExecutionContext)

describe('AdminGuard', () => {
  const mockSupabase = {
    client: {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    },
  }

  const guard = new AdminGuard(mockSupabase as any)

  beforeEach(() => jest.clearAllMocks())

  it('throws ForbiddenException when no user on request', async () => {
    await expect(guard.canActivate(makeContext())).rejects.toThrow(ForbiddenException)
  })

  it('throws ForbiddenException when user is not in admins table', async () => {
    mockSupabase.client.from.mockReturnValue({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
    })
    await expect(guard.canActivate(makeContext({ id: 'not-admin' }))).rejects.toThrow(ForbiddenException)
  })

  it('returns true when user is in admins table', async () => {
    mockSupabase.client.from.mockReturnValue({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: 'admin-id' }, error: null }) }) }),
    })
    const result = await guard.canActivate(makeContext({ id: 'admin-id' }))
    expect(result).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npm test -- admin.guard.spec
```

Expected: FAIL — `Cannot find module './admin.guard'`

- [ ] **Step 3: Implement AdminGuard**

```typescript
// backend/src/auth/admin.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    if (!request.user) throw new ForbiddenException()

    const { data } = await this.supabase.client
      .from('admins')
      .select('id')
      .eq('id', request.user.id)
      .single()

    if (!data) throw new ForbiddenException()
    return true
  }
}
```

- [ ] **Step 4: Create `auth.module.ts`**

```typescript
// backend/src/auth/auth.module.ts
import { Module } from '@nestjs/common'
import { SupabaseAuthGuard } from './supabase-auth.guard'
import { AdminGuard } from './admin.guard'

@Module({
  providers: [SupabaseAuthGuard, AdminGuard],
  exports: [SupabaseAuthGuard, AdminGuard],
})
export class AuthModule {}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd backend && npm test -- admin.guard.spec
```

Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
cd ..
git add backend/src/auth/
git commit -m "feat: add Supabase auth guard and admin role guard"
```

---

### Task 8: Guestbook service — public read and entry submission

**Files:**
- Create: `backend/src/guestbook/dto/create-entry.dto.ts`
- Create: `backend/src/guestbook/guestbook.service.ts`
- Create: `backend/src/guestbook/guestbook.service.spec.ts`

- [ ] **Step 1: Create DTO**

```bash
mkdir -p backend/src/guestbook/dto
```

```typescript
// backend/src/guestbook/dto/create-entry.dto.ts
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class CreateEntryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(280)
  message: string
}
```

- [ ] **Step 2: Write the failing test**

```typescript
// backend/src/guestbook/guestbook.service.spec.ts
import { BadRequestException, InternalServerErrorException } from '@nestjs/common'
import { GuestbookService } from './guestbook.service'

const makeSupabase = (overrides = {}) => ({
  client: {
    from: jest.fn(),
    storage: { from: jest.fn() },
    ...overrides,
  },
  config: { getOrThrow: (k: string) => k === 'SUPABASE_URL' ? 'https://test.supabase.co' : '' },
})

describe('GuestbookService', () => {
  describe('getEntries', () => {
    it('returns entries with image_url set for approved images only', async () => {
      const rows = [
        { id: '1', name: 'Finn', message: 'Hello', created_at: '2026-01-01T00:00:00Z', image_path: 'img.jpg', image_approved: true },
        { id: '2', name: 'Guest', message: 'Hi', created_at: '2026-01-02T00:00:00Z', image_path: 'other.jpg', image_approved: false },
      ]
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: rows, error: null }),
      }
      const supabase = makeSupabase()
      supabase.client.from.mockReturnValue(mockChain)

      const service = new GuestbookService(supabase as any, supabase.config as any)
      const result = await service.getEntries(1, 20)

      expect(result[0].image_url).toBe('https://test.supabase.co/storage/v1/object/public/guestbook-images/img.jpg')
      expect(result[1].image_url).toBeNull()
    })

    it('throws InternalServerErrorException on Supabase error', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: null, error: new Error('db error') }),
      }
      const supabase = makeSupabase()
      supabase.client.from.mockReturnValue(mockChain)

      const service = new GuestbookService(supabase as any, supabase.config as any)
      await expect(service.getEntries()).rejects.toThrow(InternalServerErrorException)
    })
  })

  describe('createEntry', () => {
    it('throws BadRequestException for profane name', async () => {
      const supabase = makeSupabase()
      const service = new GuestbookService(supabase as any, supabase.config as any)
      await expect(
        service.createEntry({ name: 'fuck', message: 'hello' })
      ).rejects.toThrow(BadRequestException)
    })
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd backend && npm test -- guestbook.service.spec
```

Expected: FAIL — `Cannot find module './guestbook.service'`

- [ ] **Step 4: Implement GuestbookService**

```typescript
// backend/src/guestbook/guestbook.service.ts
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import profanity from 'leo-profanity'
import { SupabaseService } from '../supabase/supabase.service'
import { CreateEntryDto } from './dto/create-entry.dto'

@Injectable()
export class GuestbookService {
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

  async createEntry(dto: CreateEntryDto, file?: Express.Multer.File) {
    if (profanity.check(dto.name) || profanity.check(dto.message)) {
      throw new BadRequestException('Please keep entries respectful.')
    }

    let image_path: string | null = null
    if (file) {
      image_path = await this.uploadImage(file)
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
      throw new InternalServerErrorException('Failed to submit entry')
    }
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
    const ext = file.mimetype.split('/')[1]
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await this.supabase.client.storage
      .from('guestbook-images')
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false })
    if (error) throw new InternalServerErrorException('Image upload failed')
    return path
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd backend && npm test -- guestbook.service.spec
```

Expected: PASS (3 tests)

---

### Task 9: Guestbook controller

**Files:**
- Create: `backend/src/guestbook/guestbook.controller.ts`
- Create: `backend/src/guestbook/guestbook.controller.spec.ts`
- Create: `backend/src/guestbook/guestbook.module.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// backend/src/guestbook/guestbook.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { GuestbookController } from './guestbook.controller'
import { GuestbookService } from './guestbook.service'
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard'
import { AdminGuard } from '../auth/admin.guard'

const mockService = {
  getEntries: jest.fn(),
  createEntry: jest.fn(),
  approveImage: jest.fn(),
  deleteEntry: jest.fn(),
}

describe('GuestbookController', () => {
  let controller: GuestbookController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuestbookController],
      providers: [{ provide: GuestbookService, useValue: mockService }],
    })
      .overrideGuard(SupabaseAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard).useValue({ canActivate: () => true })
      .compile()

    controller = module.get(GuestbookController)
  })

  it('GET /api/guestbook calls getEntries with page=1 by default', async () => {
    mockService.getEntries.mockResolvedValue([])
    await controller.getEntries(1)
    expect(mockService.getEntries).toHaveBeenCalledWith(1, 20)
  })

  it('PATCH /api/guestbook/:id/approve-image calls approveImage', async () => {
    mockService.approveImage.mockResolvedValue(undefined)
    await controller.approveImage('some-id')
    expect(mockService.approveImage).toHaveBeenCalledWith('some-id')
  })

  it('DELETE /api/guestbook/:id calls deleteEntry', async () => {
    mockService.deleteEntry.mockResolvedValue(undefined)
    await controller.deleteEntry('some-id')
    expect(mockService.deleteEntry).toHaveBeenCalledWith('some-id')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npm test -- guestbook.controller.spec
```

Expected: FAIL — `Cannot find module './guestbook.controller'`

- [ ] **Step 3: Implement GuestbookController**

```typescript
// backend/src/guestbook/guestbook.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Throttle } from '@nestjs/throttler'
import { memoryStorage } from 'multer'
import { AdminGuard } from '../auth/admin.guard'
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard'
import { GuestbookService } from './guestbook.service'
import { CreateEntryDto } from './dto/create-entry.dto'

@Controller('api/guestbook')
export class GuestbookController {
  constructor(private service: GuestbookService) {}

  @Get()
  getEntries(@Query('page') page = 1) {
    return this.service.getEntries(Number(page), 20)
  }

  @Post()
  @HttpCode(201)
  @Throttle({ default: { limit: 1, ttl: 3_600_000 } })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
          cb(null, true)
        } else {
          cb(new BadRequestException('Only JPG, PNG, or WEBP allowed'), false)
        }
      },
    }),
  )
  createEntry(
    @Body() dto: CreateEntryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.createEntry(dto, file)
  }

  @Patch(':id/approve-image')
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  approveImage(@Param('id') id: string) {
    return this.service.approveImage(id)
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  deleteEntry(@Param('id') id: string) {
    return this.service.deleteEntry(id)
  }
}
```

- [ ] **Step 4: Create `guestbook.module.ts`**

```typescript
// backend/src/guestbook/guestbook.module.ts
import { Module } from '@nestjs/common'
import { GuestbookController } from './guestbook.controller'
import { GuestbookService } from './guestbook.service'

@Module({
  controllers: [GuestbookController],
  providers: [GuestbookService],
})
export class GuestbookModule {}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd backend && npm test -- guestbook
```

Expected: PASS (all guestbook service + controller tests)

- [ ] **Step 6: Commit**

```bash
cd ..
git add backend/src/guestbook/
git commit -m "feat: add guestbook module with public and admin endpoints"
```

---

### Task 10: Dispatches service

**Files:**
- Create: `backend/src/dispatches/dto/create-dispatch.dto.ts`
- Create: `backend/src/dispatches/dto/update-dispatch.dto.ts`
- Create: `backend/src/dispatches/dispatches.service.ts`
- Create: `backend/src/dispatches/dispatches.service.spec.ts`

- [ ] **Step 1: Create DTOs**

```bash
mkdir -p backend/src/dispatches/dto
```

```typescript
// backend/src/dispatches/dto/create-dispatch.dto.ts
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateDispatchDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string

  @IsString()
  @IsNotEmpty()
  body: string

  @IsString()
  @IsOptional()
  @MaxLength(200)
  slug?: string

  @IsBoolean()
  @IsOptional()
  published?: boolean
}
```

```typescript
// backend/src/dispatches/dto/update-dispatch.dto.ts
import { PartialType } from '@nestjs/mapped-types'
import { CreateDispatchDto } from './create-dispatch.dto'

export class UpdateDispatchDto extends PartialType(CreateDispatchDto) {}
```

- [ ] **Step 2: Write the failing test**

```typescript
// backend/src/dispatches/dispatches.service.spec.ts
import { InternalServerErrorException } from '@nestjs/common'
import { DispatchesService } from './dispatches.service'

const makeSupabase = () => ({
  client: { from: jest.fn() },
})

describe('DispatchesService', () => {
  describe('getPublished', () => {
    it('returns teaser fields for published dispatches', async () => {
      const rows = [
        { id: '1', slug: 'test-post', title: 'Test Post', body: '<p>Hello world from the Landzunge.</p>', created_at: '2026-01-01T00:00:00Z' },
      ]
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: rows, error: null }),
      }
      const supabase = makeSupabase()
      supabase.client.from.mockReturnValue(mockChain)

      const service = new DispatchesService(supabase as any)
      const result = await service.getPublished()

      expect(result[0].slug).toBe('test-post')
      expect(result[0].excerpt).toBe('Hello world from the Landzunge.')
      expect(result[0].body).toBeUndefined()
    })
  })

  describe('getBySlug', () => {
    it('throws InternalServerErrorException when dispatch not found', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('not found') }),
      }
      const supabase = makeSupabase()
      supabase.client.from.mockReturnValue(mockChain)

      const service = new DispatchesService(supabase as any)
      await expect(service.getBySlug('missing')).rejects.toThrow()
    })
  })

  describe('toSlug', () => {
    it('converts title to url-safe slug', () => {
      const service = new DispatchesService({ client: { from: jest.fn() } } as any)
      expect((service as any).toSlug('Hello World! A Test')).toBe('hello-world-a-test')
    })
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd backend && npm test -- dispatches.service.spec
```

Expected: FAIL — `Cannot find module './dispatches.service'`

- [ ] **Step 4: Implement DispatchesService**

```typescript
// backend/src/dispatches/dispatches.service.ts
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
      .select('id, slug, title, published, created_at')
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
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd backend && npm test -- dispatches.service.spec
```

Expected: PASS (3 tests)

---

### Task 11: Dispatches controller

**Files:**
- Create: `backend/src/dispatches/dispatches.controller.ts`
- Create: `backend/src/dispatches/dispatches.controller.spec.ts`
- Create: `backend/src/dispatches/dispatches.module.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// backend/src/dispatches/dispatches.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { DispatchesController } from './dispatches.controller'
import { DispatchesService } from './dispatches.service'
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard'
import { AdminGuard } from '../auth/admin.guard'

const mockService = {
  getPublished: jest.fn(),
  getBySlug: jest.fn(),
  getAllAdmin: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}

describe('DispatchesController', () => {
  let controller: DispatchesController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DispatchesController],
      providers: [{ provide: DispatchesService, useValue: mockService }],
    })
      .overrideGuard(SupabaseAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard).useValue({ canActivate: () => true })
      .compile()

    controller = module.get(DispatchesController)
  })

  it('GET /api/dispatches calls getPublished', async () => {
    mockService.getPublished.mockResolvedValue([])
    await controller.getPublished()
    expect(mockService.getPublished).toHaveBeenCalled()
  })

  it('GET /api/dispatches/:slug calls getBySlug', async () => {
    mockService.getBySlug.mockResolvedValue({ slug: 'test' })
    await controller.getBySlug('test')
    expect(mockService.getBySlug).toHaveBeenCalledWith('test')
  })

  it('POST /api/admin/dispatches calls create', async () => {
    mockService.create.mockResolvedValue({ id: '1' })
    await controller.create({ title: 'T', body: '<p>B</p>' })
    expect(mockService.create).toHaveBeenCalledWith({ title: 'T', body: '<p>B</p>' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npm test -- dispatches.controller.spec
```

Expected: FAIL — `Cannot find module './dispatches.controller'`

- [ ] **Step 3: Implement DispatchesController**

```typescript
// backend/src/dispatches/dispatches.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { AdminGuard } from '../auth/admin.guard'
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard'
import { DispatchesService } from './dispatches.service'
import { CreateDispatchDto } from './dto/create-dispatch.dto'
import { UpdateDispatchDto } from './dto/update-dispatch.dto'

@Controller('api/dispatches')
export class DispatchesController {
  constructor(private service: DispatchesService) {}

  @Get()
  getPublished() {
    return this.service.getPublished()
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.service.getBySlug(slug)
  }

  @Get('admin/all')
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  getAllAdmin() {
    return this.service.getAllAdmin()
  }

  @Post()
  @HttpCode(201)
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  create(@Body() dto: CreateDispatchDto) {
    return this.service.create(dto)
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() dto: UpdateDispatchDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  delete(@Param('id') id: string) {
    return this.service.delete(id)
  }
}
```

- [ ] **Step 4: Create `dispatches.module.ts`**

```typescript
// backend/src/dispatches/dispatches.module.ts
import { Module } from '@nestjs/common'
import { DispatchesController } from './dispatches.controller'
import { DispatchesService } from './dispatches.service'

@Module({
  controllers: [DispatchesController],
  providers: [DispatchesService],
})
export class DispatchesModule {}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd backend && npm test -- dispatches
```

Expected: PASS (all dispatches service + controller tests)

- [ ] **Step 6: Commit**

```bash
cd ..
git add backend/src/dispatches/
git commit -m "feat: add dispatches module with public and admin endpoints"
```

---

### Task 12: Wire up AppModule and main.ts

**Files:**
- Create: `backend/src/app.module.ts`
- Create: `backend/src/main.ts`

- [ ] **Step 1: Create `app.module.ts`**

```typescript
// backend/src/app.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'
import { SupabaseModule } from './supabase/supabase.module'
import { AuthModule } from './auth/auth.module'
import { GuestbookModule } from './guestbook/guestbook.module'
import { DispatchesModule } from './dispatches/dispatches.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public', 'admin'),
      serveRoot: '/admin',
      serveStaticOptions: { fallthrough: true },
      exclude: ['/api/(.*)'],
    }),
    SupabaseModule,
    AuthModule,
    GuestbookModule,
    DispatchesModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 2: Create `main.ts`**

```typescript
// backend/src/main.ts
import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const origins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:5174']

  app.enableCors({
    origin: origins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  )

  const port = process.env.PORT ?? 3000
  await app.listen(port)
  console.log(`Backend listening on port ${port}`)
}

bootstrap()
```

- [ ] **Step 3: Run all tests**

```bash
cd backend && npm test
```

Expected: All tests PASS.

- [ ] **Step 4: Verify the backend builds**

```bash
cd backend && npm run build
```

Expected: `backend/dist/` created, no TypeScript errors.

- [ ] **Step 5: Smoke test locally**

`ServeStaticModule` requires `public/admin` to exist at startup. Create a placeholder so the backend starts without the admin SPA built yet:

```bash
mkdir -p backend/public/admin
```

Copy `.env.example` to `.env` and fill in real values, then:

```bash
cd backend && npm run start
```

Expected: `Backend listening on port 3000`

Test with curl:
```bash
curl http://localhost:3000/api/guestbook
# Expected: JSON array of entries

curl http://localhost:3000/api/dispatches
# Expected: JSON array (empty if no dispatches yet)
```

- [ ] **Step 6: Commit**

```bash
cd ..
git add backend/src/app.module.ts backend/src/main.ts
git commit -m "feat: wire up NestJS app module with CORS, validation, throttling, and static serving"
```

---

### Task 13: Dockerfile

**Files:**
- Create: `backend/Dockerfile`

- [ ] **Step 1: Create `backend/Dockerfile`**

```dockerfile
# backend/Dockerfile

# Stage 1: Build admin SPA
FROM node:24-alpine AS admin-build
WORKDIR /admin
COPY admin/package*.json ./
RUN npm ci
COPY admin ./
ARG VITE_API_URL=https://api.finnslandzunge.com
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
RUN npm run build

# Stage 2: Build NestJS backend
FROM node:24-alpine AS backend-build
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
RUN npm run build

# Stage 3: Production image
FROM node:24-alpine
WORKDIR /app
COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/node_modules ./node_modules
COPY --from=admin-build /admin/dist ./public/admin
EXPOSE 3000
CMD ["node", "dist/main"]
```

> **Note:** This Dockerfile is built from the **repo root** (not from inside `backend/`), so the COPY paths reference sibling directories. The CI command will be `docker build -f backend/Dockerfile .`

- [ ] **Step 2: Commit**

```bash
git add backend/Dockerfile
git commit -m "feat: add multi-stage Dockerfile building admin SPA + NestJS backend"
```

---

### Task 14: Backend deploy GitHub Action

**Files:**
- Create: `.github/workflows/deploy-backend.yml`

- [ ] **Step 1: Create the workflow**

This workflow SSHes into the VPS, pulls the latest code, rebuilds the Docker image, and restarts the container. You need these secrets in GitHub repo settings:
- `VPS_HOST` — IP or hostname of your VPS
- `VPS_USER` — SSH user (e.g. `deploy`)
- `VPS_SSH_KEY` — private SSH key whose public key is in `~/.ssh/authorized_keys` on the VPS
- `SUPABASE_SERVICE_KEY` — Supabase service role key (set on VPS, not baked into image)
- `VITE_SUPABASE_URL` — Supabase URL (used at admin build time)
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key (used at admin build time for auth-only client)

```yaml
# .github/workflows/deploy-backend.yml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - 'admin/**'
      - '.github/workflows/deploy-backend.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: |
          docker build \
            -f backend/Dockerfile \
            --build-arg VITE_API_URL=https://api.finnslandzunge.com \
            --build-arg VITE_SUPABASE_URL=${{ secrets.VITE_SUPABASE_URL }} \
            --build-arg VITE_SUPABASE_ANON_KEY=${{ secrets.VITE_SUPABASE_ANON_KEY }} \
            -t landzunge-backend:latest \
            .

      - name: Save image to tarball
        run: docker save landzunge-backend:latest | gzip > backend.tar.gz

      - name: Copy image to VPS
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          source: backend.tar.gz
          target: /tmp/

      - name: Deploy on VPS
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            docker load < /tmp/backend.tar.gz
            docker stop landzunge-backend || true
            docker rm landzunge-backend || true
            docker run -d \
              --name landzunge-backend \
              --restart unless-stopped \
              -p 3000:3000 \
              -e SUPABASE_URL=${{ secrets.VITE_SUPABASE_URL }} \
              -e SUPABASE_SERVICE_KEY=${{ secrets.SUPABASE_SERVICE_KEY }} \
              -e CORS_ORIGINS=https://finnslandzunge.com,https://admin.finnslandzunge.com \
              -e PORT=3000 \
              landzunge-backend:latest
            rm /tmp/backend.tar.gz
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy-backend.yml
git commit -m "ci: add backend Docker build and VPS deploy workflow"
```

---

### Task 15: Run full test suite and verify build

- [ ] **Step 1: Run all backend tests**

```bash
cd backend && npm test
```

Expected: All tests PASS. Output should show tests for:
- `supabase.service.spec`
- `supabase-auth.guard.spec`
- `admin.guard.spec`
- `guestbook.service.spec`
- `guestbook.controller.spec`
- `dispatches.service.spec`
- `dispatches.controller.spec`

- [ ] **Step 2: Run a full TypeScript build**

```bash
cd backend && npm run build
```

Expected: `dist/` created, zero TypeScript errors.

- [ ] **Step 3: Final commit**

```bash
cd ..
git add -A
git commit -m "feat: complete NestJS backend — guestbook, dispatches, auth, Docker"
```
