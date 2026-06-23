# Auto World Backend

NestJS API for the Auto World Factory Management System.

## First-time setup

1. Copy `.env.example` to `.env` and fill in your local values.

2. Create the PostgreSQL database:

```bash
npm run db:create
```

3. Run migrations to create tables:

```bash
npm run migration:run
```

4. Start the app. Seeding runs automatically on first start:

```bash
npm run start:dev
```

## Existing environment

```bash
npm run start:dev
```

## Production

```bash
NODE_ENV=production npm run start:prod
```

Migrations run automatically at startup in production through `migrationsRun: true`.

## Migration commands

Generate a new migration after changing entities:

```bash
npm run migration:generate -- src/migrations/YourMigrationName
```

Apply pending migrations:

```bash
npm run migration:run
```

Revert the last migration:

```bash
npm run migration:revert
```

Show migration status:

```bash
npm run migration:show
```
