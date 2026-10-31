# Soft4u

Soft4u (https://soft4u.top) is an online store for OTT subscriptions, streaming accounts and genuine software licences, built with Next.js on Neon Postgres and hosted on Vercel.

## Run locally

Prerequisites: [Bun](https://bun.sh) 1.3+

1. Install dependencies: `bun install`
2. Copy `.env.example` to `.env.local` and fill in every value.
3. Create the tables and starter content: `bun run db:migrate` then `bun run db:seed`
4. Optional: upload the logo library and 3D category icons to Cloudinary: `bun run images:library`
5. Start the dev server: `bun run dev`
6. Production build: `bun run build` then `bun run start`

## Admin

The admin panel is at `/admin` (sign-in at `/admin/login`, no signup). The seed admin comes from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`; more admins are added from Settings → Admins. Store details, payment accounts, currency and pricing, homepage and legal content are all edited there.

## Telegram bot

After the production deploy, set `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` and `TELEGRAM_WEBHOOK_SECRET`, then run `bun run telegram:setup` once.
