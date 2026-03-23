This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Added Integrations (Prisma/Postgres, S3, Mail)
This sample project includes:
- `src/lib/prisma.ts` (PrismaClient singleton)
- `prisma/schema.prisma` (Postgres models)
- `src/lib/aws-s3.ts` (S3 presigned PUT URL + buffer upload helper)
- `src/lib/mail-utils.ts` (Nodemailer HTML email sender + Prisma logging)

### 1) Environment variables
Copy `.env.example` to `.env` and fill in values.

Required for Postgres:
- `DATABASE_URL`

Required for S3 presigning:
- `AWS_REGION`
- `AWS_S3_BUCKET`

Required for sending emails:
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM`

### 2) Prisma setup
After creating your Postgres database, run:
```bash
pnpm prisma generate
pnpm prisma migrate dev
```

### 3) API routes to test
- `POST /api/mail/send` (sends an HTML email and logs it to `EmailLog`)
- `POST /api/s3/presign` (returns a presigned PUT URL for uploading to S3)

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
