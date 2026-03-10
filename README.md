# NHL Sports Dashboard PoC

A single-page web dashboard displaying Edmonton Oilers roster with AI-generated 16-bit pixel art portraits, upcoming games, recent results, and team standings.

**Status:** Phase 1 (Foundation) - In Progress

## Quick Start

### Prerequisites

- Node.js 18+ (for Next.js 14)
- npm or pnpm
- A Supabase account (free tier is fine)
- OpenAI API key (for DALL-E)

### 1. Setup Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. In the SQL Editor, run the migration from `supabase/migrations/001_init_schema.sql`
4. Copy your project URL and anon key to `.env.local`

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
# Supabase (from your project settings)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# OpenAI (from platform.openai.com)
OPENAI_API_KEY=sk-...
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Locally

```bash
npm run dev
```

Visit http://localhost:3000

## Project Structure

```
src/
├── app/                    # Next.js App Router
├── components/            # React components
├── lib/                   # Utilities and clients
├── types/                 # TypeScript definitions
└── hooks/                 # Custom React hooks
```

## Architecture

See `IMPLEMENTATION_PLAN.md` for detailed architecture decisions, schema design, and phase-by-phase implementation plan.

## Key Files

- **CLAUDE.md** - Project specification
- **IMPLEMENTATION_PLAN.md** - Full implementation guide with SQL schema, NHL API endpoints, and testing plan
- **supabase/migrations/001_init_schema.sql** - Database schema
- **.env.local** - Environment variables (never commit!)

## Development

### Available Scripts

- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode

### Creating Components

Components go in `src/components/`. Keep them small and single-purpose.

Example:

```typescript
// src/components/dashboard/RosterPlayer.tsx
import { Player } from "@/types";

interface Props {
  player: Player;
}

export default function RosterPlayer({ player }: Props) {
  return (
    <div className="card">
      <img src={player.portrait_url} alt={player.first_name} />
      <h3>{player.first_name} {player.last_name}</h3>
      <p>{player.position}</p>
    </div>
  );
}
```

## Next Steps

Phase 1 is foundation. After this:

1. **Phase 2:** NHL API integration
2. **Phase 3:** Dashboard UI (static mockup)
3. **Phase 4:** Image generation pipeline
4. **Phase 5:** Supabase data persistence
5. **Phase 6-10:** Polish, testing, and deployment

See IMPLEMENTATION_PLAN.md for detailed breakdown.

## Troubleshooting

### "Can't find Supabase"

- Check `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Verify tables were created: Check Supabase dashboard → SQL Editor

### "Build fails"

- Clear `node_modules`: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run lint`

### Port 3000 in use

- Use different port: `npm run dev -- -p 3001`

## License

MIT
