# Circus PES

## Getting Started (local env)

Prerequisites:

- Postgres DB
- Discord oauth credentials
- Minio credentials
- node+npm

Install dependencies

```bash
npm install
# or
yarn install
```

Setup Prisma

- Add `.env` file at the root of the project and add the postgres url:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/circus-pes
```

- To init the Postgres database with the migrations files:

```bash
npx prisma migrate dev
```

Setup Discord, Minio and auth

- Add `.env.local` and copy the following lines into it:

```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<secret to generate>

DISCORD_ID=<client id>
DISCORD_SECRET=<client secret>

NEXT_PUBLIC_MINIO_ENDPOINT=storage.circuspes.fr
MINIO_ACCESS_KEY=<access key>
MINIO_SECRET_KEY=<secret key>

```

Run the development server for nextjs:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
