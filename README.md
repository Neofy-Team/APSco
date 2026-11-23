# APSco Commerce

NestJS + PostgreSQL using plain SQL and `pg`, in an npm workspace. Node 22 and npm 10; Docker Compose v2 for containers. `web/` is intentionally empty for the future Next.js application. Git does not track empty directories; recreate it after cloning until the frontend is added.

```text
api/
  src/
    modules/health/       # HTTP liveness and database readiness
    database/            # pg pool and ordered SQL migrations
    config/              # validated environment
    common/              # cross-cutting guards, pipes, decorators only
  scripts/               # SQL migration runner
  test/
web/                     # frontend reserved; no implementation
infra/                   # Dockerfile, local and deployment Compose
.github/workflows/       # backend CI
```

## Local development

```sh
npm ci
cp api/.env.example api/.env
npm run db:up
npm run db:migrate
npm run dev
```

API: `http://localhost:3001/api/v1/health/live` and `/api/v1/health/ready`.
Run `npm run typecheck` and `npm test` before merging.

## API tests

Run `npm test` for unit tests. The integration and HTTP end-to-end suites require a
PostgreSQL connection in `TEST_DATABASE_URL` with permission to create schemas.
Each test uses a temporary schema and removes it when the test finishes.

```sh
export TEST_DATABASE_URL='postgresql://commerce:commerce_local@localhost:5432/commerce_test'
npm run test:all
```

Use `npm run test:integration` or `npm run test:e2e` to run either database suite separately.

For fully containerized local development (no Node installation required):

```sh
docker compose -f infra/compose.yaml --profile app up --build -d
```

This runs compiled code; rebuild after source changes. Apply migrations with `docker compose -f infra/compose.yaml --profile app run --rm api node scripts/migrate.cjs`.

## Deploy backend

```sh
cp infra/.env.example infra/.env
# Edit infra/.env: set strong secrets and the real frontend origin.
docker compose --env-file infra/.env -f infra/compose.production.yaml up --build -d
```

Use the same password in POSTGRES_PASSWORD and DATABASE_URL; percent-encode special characters in the URL password. PostgreSQL credentials initialize a new volume only: changing the environment does not rotate an existing database password.

The deployment starts PostgreSQL, runs migrations once, then starts the API as a non-root user. Data persists in a named volume. PostgreSQL has no public port; the API binds to the host loopback for an existing HTTPS reverse proxy. Configure your host proxy/domain/TLS before exposing the service to customers. No frontend service is created yet.

For each release, set APP_VERSION to a unique tag, rebuild, and recreate the migration job before updating the API:

```sh
docker compose --env-file infra/.env -f infra/compose.production.yaml build
docker compose --env-file infra/.env -f infra/compose.production.yaml run --rm migrate
docker compose --env-file infra/.env -f infra/compose.production.yaml up -d --force-recreate api
```

Use backward-compatible migrations during rolling updates. Back up PostgreSQL before releases and verify restores. `docker compose down` preserves data; `down -v` deletes it. This is a single-host deployment foundation, not high availability or a managed backup system.

## Backend conventions

Start as a modular monolith. Add business modules as features are implemented: identity, categories, products, inventory, carts, orders, payments, shipping. Each module owns its controllers, DTOs, services, repositories and SQL. Controllers handle HTTP, services enforce business rules, repositories execute parameterized SQL. Do not create global folders for all controllers or all services.

Example module layout

```text
modules/products/
  products.module.ts
  products.controller.ts
  products.service.ts
  products.repository.ts
  dto/
```

Inject `Database` and call `database.query('SELECT ... WHERE id = $1', [id])`. For transactions, acquire one client with `connect()`, use it for BEGIN/all queries/COMMIT or ROLLBACK, and release it in finally. Never concatenate user values or use pool.query across a transaction. Allowlist any dynamic column or sort names. Keep database types and backend imports out of the frontend; use HTTP API contracts.

Add paired files such as `0002_description.up.sql` and `0002_description.down.sql` in `api/src/database/migrations/`, in sortable order. Run `npm run db:migrate` to apply pending migrations and `npm run db:rollback` to revert the most recently applied migration. Rolling back the initial commerce migration drops its tables and their data.

The runner locks concurrent migration executions, checks applied up-file checksums, and wraps each migration and history update in one transaction. Add a corrective migration when an applied migration needs changes. Keep transaction control and statements that require execution outside a transaction, such as `CREATE INDEX CONCURRENTLY`, out of migration files.

When adding Next.js, create its package.json inside web/ and run npm install at the root to update the shared lockfile. Keep frontend and backend independently deployable. Add a separate web Dockerfile and service then. Add shared packages or a task runner only when concrete duplication or build times justify them.

## Research and decisions

- [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces/) manage independent packages under one root installation; selected for a small team with two applications.
- [Nest workspaces](https://docs.nestjs.com/cli/monorepo) coordinate Nest applications and libraries. A general package workspace keeps Next.js independent of Nest CLI configuration.
- [Nest database integration](https://docs.nestjs.com/techniques/database) supports direct drivers. This project uses no ORM.
- [node-postgres queries](https://node-postgres.com/features/queries) and [transactions](https://node-postgres.com/features/transactions) define the parameter binding and single-client transaction patterns used here.
