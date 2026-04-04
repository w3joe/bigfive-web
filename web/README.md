# bigfive-web

https://bigfive-test.com

Website for five factor model of personality based on work from [IPIP-NEO-PI](https://github.com/kholia/IPIP-NEO-PI).

Tests and evaluation is gathered from [ipip.ori.org](http://ipip.ori.org).

See it live @ [bigfive-test.com](https://bigfive-test.com)

The frontend is written in [nodejs](https://nodejs.org) using the
[Next.js](https://nextjs.org/) framework.

## Installation

Download and install [nodejs](https://nodejs.org),
[git](https://git-scm.com/downloads) and [vercel-cli](https://vercel.com/download)

Install [yarn](https://classic.yarnpkg.com/lang/en/docs/install/#debian-stable)

```
npm install --global yarn
```

Survey results and feedback are stored in [Supabase](https://supabase.com/) (Postgres). Create a project, run the SQL migration in `supabase/migrations/`, then set the environment variables below.

## Development

Copy `.env.example` to `.env.local` and fill in your Supabase project URL and **service role** key (server actions use the service role; keep that key out of client code and public repos).

```
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Optional: `NEXT_PUBLIC_SUPABASE_ANON_KEY` if you add client-side Supabase later.

Run the setup script to install all dependencies

```
yarn
```

Run the development server

```
yarn dev
```

## Linting

Run the linter

```
yarn lint && yarn format:fix
```

## License

Licensed under the [MIT license](../LICENSE).
