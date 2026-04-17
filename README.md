# Colab Website (GuessChess)

Website for the indie game studio **Colab** with auth for **GuessChess**.

## Features

- Login and register using PostgreSQL
- Existing users in your DB can log in
- Account page after login
- Change password
- Account deletion request form
- Privacy policy / terms / delete-account pages copied from your existing website
- Visual Google Play and App Store buttons (placeholder links)

## Railway env vars

- `DATABASE_URL`
- `SESSION_SECRET`
- `NODE_ENV=production`

Optional:

- `PGSSL=disable` when using `*.railway.internal`
- `PGSSL=require` when external DB requires TLS

## Optional user table overrides

Only if auto-detection does not match your users schema:

- `USER_TABLE`
- `USER_ID_COLUMN`
- `USER_EMAIL_COLUMN`
- `USER_USERNAME_COLUMN`
- `USER_PASSWORD_COLUMN`
- `USER_CREATED_AT_COLUMN`
- `USER_UPDATED_AT_COLUMN`

## Run locally

```bash
npm install
npm start
```
