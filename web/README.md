# GALAXY (web)

Photography-first social app built with Next.js (App Router), Prisma, NextAuth, and Cloudinary.

## Local development

1) Install deps

```bash
npm install
```

2) Create env file

Copy `.env.example` to `.env.local` and fill in values:

- `DATABASE_URL`
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `EMAIL_SERVER`, `EMAIL_FROM`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

3) Migrate + seed

```bash
npx prisma migrate dev
npx prisma db seed
```

4) Run the dev server

```bash
npm run dev
```

Open http://localhost:3000

## Deployment (Vercel)

### Environment variables

Add these in Vercel Project Settings → Environment Variables:

- `DATABASE_URL` (recommended: pooled/pooled+ssl URL from your provider)
- `DIRECT_URL` (optional but recommended for Prisma migrations if your `DATABASE_URL` is pooled; set to a non-pooled direct connection URL)
- `NEXTAUTH_URL` (your production URL)
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `EMAIL_SERVER`, `EMAIL_FROM`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Build settings

Vercel preset: **Next.js**

- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: (leave default)

`postinstall` runs `prisma generate` to ensure Prisma Client exists at build/runtime.

### Database migrations

Run on deploy (recommended via CI or manual one-time step):

```bash
npx prisma migrate deploy
```

Seed categories once:

```bash
npx prisma db seed
```

### Image optimization

Next.js Image Optimization allowlists:
- Cloudinary delivery (`res.cloudinary.com`)
- Google avatars (`lh3.googleusercontent.com`)

If you use additional hosts for user images, add them to `next.config.mjs`.
