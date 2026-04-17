# Colab GuessChess Website

Website for the GuessChess phone app by Colab, with:

- Login/register using PostgreSQL users table
- Account page after login
- Change password
- Account deletion request submission
- Privacy policy, terms, and delete-account legal pages

## Run locally

1. Install dependencies:
   - `npm install`
2. Create env vars (or copy `.env.example`):
   - `DATABASE_URL`
   - `SESSION_SECRET`
3. Start:
   - `npm start`

## Railway

Set these Railway environment variables:

- `DATABASE_URL` (the URL you shared)
- `SESSION_SECRET` (a long random string)
- `NODE_ENV=production`

Optional DB SSL override:

- `PGSSL=disable` for `*.railway.internal` private hosts
- `PGSSL=require` for external hosts requiring TLS

Optional explicit user table mapping (only if auto-detection does not match your schema):

- `USER_TABLE`
- `USER_ID_COLUMN`
- `USER_EMAIL_COLUMN`
- `USER_USERNAME_COLUMN`
- `USER_PASSWORD_COLUMN`
- `USER_CREATED_AT_COLUMN`
- `USER_UPDATED_AT_COLUMN`

## Health endpoints

- `/health` -> app/process health (fast, no DB)
- `/health/db` -> database connectivity status
