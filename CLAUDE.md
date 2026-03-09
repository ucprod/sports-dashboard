# Project: NHL Sports Dashboard PoC

## What this app does
A single-page web dashboard that displays your favorite NHL team's roster (with stylized 16-bit player illustrations), upcoming game, last game result, and team standings. Data refreshes once daily at 3 AM EST, and users see cached data throughout the day. Designed for busy sports fans who want quick ambient visibility into their team's progress.

## Target user
Busy sports fans (working professionals, families) in North America who follow NHL teams. They check in once daily, prefer cached data over real-time updates, and value clean, scannable information over comprehensive sports analytics.

## Tech stack
- Frontend: Next.js with TypeScript
- Styling: Tailwind CSS
- Database & Storage: Supabase (roster data, player portraits, cached game/standings data)
- Backend Logic: Next.js API Routes for 3 AM daily refresh job
- Image Generation: AI API to convert official NHL portraits to 16-bit pixel art
- NHL Data Source: NHL official API (free tier)
- Hosting: Vercel

## Core rules
- Always use TypeScript, never plain JavaScript
- Keep components small and single-purpose
- Never hardcode secrets or API keys in code — always use environment variables
- Always handle loading states and error states in UI components
- Mobile-first responsive design on all pages
- Player portraits generated once per new player, stored in Supabase; regenerated only on roster changes (automated detection)
- Daily refresh executes at 3 AM EST via backend job; users see cached data throughout the day
- Use localStorage for team selection (no user authentication in v1)

## Version 1 scope (build only these)
1. Local storage team selection — User picks Edmonton Oilers on first visit, preference persists
2. Daily data refresh at 3 AM EST — Backend job fetches roster, standings, last/next game from NHL API
3. Player portraits — AI-generated 16-bit pixel art illustrations; generated once per new player, regenerated on roster changes
4. Dashboard display — Single-page web app showing roster (with portraits), upcoming game, last game result, standings
5. Basic player stats — Forwards/Defense: GP, Goals, Assists, Points; Goalies: GAA, Save %

## Out of scope for v1
- iOS/mobile app (web-responsive only)
- Digital display integration or physical hardware
- Historical statistics or season archives
- Gambling or betting data
- Real-time score updates or live game tracking
- Multiple team support (Edmonton Oilers only)
- User accounts or authentication
- Advanced analytics or predictive stats

## Key architectural decisions before code
- **Daily refresh mechanism:** Next.js API Routes with a scheduled job (Vercel Cron) executing at 3 AM EST
- **Image storage:** Official NHL portraits fetched once, converted to 16-bit art via AI API, stored as blobs in Supabase Storage with metadata in database
- **Roster change detection:** Compare current NHL API roster against database on daily refresh; auto-generate portraits for new players
- **Data caching:** All game, standings, and roster data cached in Supabase; users always see latest cached version
- **Mobile responsiveness:** Grid-based layout for roster; card-based layout for game/standings info

## Success criteria for PoC
- Locally functional with live NHL API data
- Deployed to Vercel and Supabase
- End-users can load the app, see team data, and verify accuracy
- Player portraits generate and display correctly
- Daily refresh job executes without manual intervention
