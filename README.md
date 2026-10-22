# Soft4u

Soft4u (https://soft4u.top) is an online store for OTT subscriptions, streaming accounts and genuine software licences in Pakistan, built with Next.js and hosted on Vercel.

## Run locally

Prerequisites: [Bun](https://bun.sh) 1.3+

1. Install dependencies: `bun install`
2. Copy `.env.example` to `.env.local` and fill in the values you need (none are required for the current storefront build).
3. Start the dev server: `bun run dev`
4. Production build: `bun run build` then `bun run start`

## Configuration

Business details (name, domain, support email, phone/WhatsApp, address, hours, currency) live in `lib/site-config.ts`. The footer, contact page, policies, metadata, robots and sitemap all read from there.

The admin panel is at `/admin` and is not linked from the public site. It has no authentication yet; add it before connecting real data.
