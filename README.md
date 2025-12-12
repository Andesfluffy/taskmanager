This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, add the Firebase configuration so authentication works in the TaskManager UI. Copy the sample env file and fill in your
Firebase project values. The same file also holds MongoDB settings for the API endpoints:

```
cp .env.local.example .env.local
```

### MongoDB

The `/api/tasks` endpoints use the MongoDB Atlas Data API so the app can create and read tasks without a server-side driver. Add
your Data API credentials to `.env.local`:

```
MONGODB_DATA_API_URL=https://data.mongodb-api.com/app/your-app-id/endpoint/data/v1
MONGODB_DATA_API_KEY=your_data_api_key
MONGODB_DATA_SOURCE=Cluster0
MONGODB_DATABASE=taskmanager
```

Endpoints:

- `GET /api/tasks` – returns `{ tasks: Task[] }` from the `tasks` collection.
- `POST /api/tasks` – create a task with `{ title, description? }` and returns the inserted record.
- `PATCH /api/tasks` – update an existing task with `{ id, title?, description?, completed? }`.

Then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. The landing page prompts you to sign in with Google via Firebase before showing the workspace.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
