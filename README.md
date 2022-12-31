# Circus PES

## Getting Started (local env)

Prerequisites:

- Docker
- node+npm

Setup Supabase (only first time)

- Add `.env` file in the supabase folder with values from discord for auth:

```
export DISCORD_CLIENT_ID=<client id>
export DISCORD_CLIENT_SECRET=<client secret>
```

- Add `.env.local` and add the anon key from the local supabase server and the supabase url

```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_KEY=<anon key>
```

Start local supabase services

```
npm run supabase:start
```

Run the development server for nextjs:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

To stop local supabase services:

```
npm run supabase:stop
```
