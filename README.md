This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started
install node.js: https://nodejs.org/download/release/latest/node-v24.6.0-x64.msi
install typescript: npm install -g tsx

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

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## More instructions from Claude

:: Start development
npm run dev

:: Run Prisma Studio (database viewer)
npx prisma studio

:: Update database after schema changes
npx prisma migrate dev

:: Build for production
npm run build

:: Run production build locally
npm start

## Other Instructions

:: spin up a new branch
1. create new branch from desired point in GitHub Desktop
2. publish branch to GitHub
3. open cmd prompt in parent folder where you want the branch folder
4. git clone https://github.com/gbahns/robotmadness <branch-folder>
5. cd <branch-folder>
6. checkout <branch-name>
7. npx prisma generate (to create the database)
8. npm run dev (to start up the web server)
