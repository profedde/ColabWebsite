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

Recommended for your current `users` table:

- `USER_TABLE=users`
- `USER_ID_COLUMN=id`
- `USER_USERNAME_COLUMN=username`
- `USER_PASSWORD_COLUMN=pass_hash`
- `USER_SALT_COLUMN=salt`
- `USER_HASH_MODE=sha256_salt_password`

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
- `USER_SALT_COLUMN`
- `USER_HASH_MODE`
- `USER_CREATED_AT_COLUMN`
- `USER_UPDATED_AT_COLUMN`

## Run locally

```bash
npm install
npm start
```
