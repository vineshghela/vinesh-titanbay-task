# Titanbay Private Markets API

Built by Vinesh Ghela as a take-home engineering challenge for Titanbay.

A REST API for managing private market funds and investor commitments built with TypeScript, Fastify, Drizzle ORM and PostgreSQL.

---

## Database schema

![ER Diagram](./docs/first-pass-er.png)

---

## Project structure

```
src/
  app.ts                   Fastify instance, plugin registration, error handler
  index.ts                 Entry point
  db/
    schema.ts              Drizzle ORM table and enum definitions
    client.ts              PostgreSQL connection singleton
  modules/
    auth/                  Login route + JWT service
    funds/                 Fund CRUD
    investors/             Investor create + list
    investments/           Investments per fund
    transactions/          Transaction processing, reversal, fee calculation
  shared/
    errors.ts              AppError hierarchy + Fastify error handler
    auth.middleware.ts     requireAuth / requireAdmin preHandler hooks
    types.ts               @fastify/jwt module augmentation
scripts/
  seed.ts                  Local dev seed (users, funds, investors, investments)
tests/
  setup.ts                 Test DB lifecycle: migrate, seed, truncate between files
  helpers.ts               getAuthToken() test helper
  *.test.ts                Integration test suite (29 tests)
```

---

## Running the project

### With Docker (recommended)

The simplest path. No local Node.js installation required — Docker Compose handles PostgreSQL, runs migrations, seeds the database and starts the API in one command.

```bash
git clone <repo>
cd titanbay-api
cp .env.example .env
docker compose up --build
```

The API is available at http://localhost:3000

### Without Docker

Requires a local PostgreSQL instance (16+) with a database called `titanbay`
and a second called `titanbay_test`.

```bash
npm install
# Set DATABASE_URL in .env to point at your local Postgres instance
npm run db:migrate
npm run db:seed
npm run dev
```

---

## Environment variables

Copy `.env.example` to `.env` and fill in the values:

| Variable       | Description                  | Example                                                |
| -------------- | ---------------------------- | ------------------------------------------------------ |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://titanbay:titanbay@localhost:5432/titanbay` |
| `JWT_SECRET`   | Secret used to sign tokens   | change this in production                              |
| `PORT`         | Port the server listens on   | `3000`                                                 |

---

## Seeded credentials

The seed script creates two users for local development and testing:

| Email                   | Password      | Role     |
| ----------------------- | ------------- | -------- |
| `admin@titanbay.com`    | `admin123`    | admin    |
| `investor@titanbay.com` | `investor123` | investor |

---

## API endpoints

All endpoints except `POST /auth/login` require a Bearer token in the `Authorisation` header. Obtain one by logging in first.

The original API specification is available at 
https://storage.googleapis.com/interview-api-doc-funds.wearebusy.engineering/index.html.

The table below reflects the implemented endpoints. The implementation follows the original spec and extends it with authentication, audit logging and additional transaction functionality. Any differences in approach are documented in the additional implementation decisions section.


| Method | Path                         | Auth          | Description                      |
| ------ | ---------------------------- | ------------- | -------------------------------- |
| POST   | `/auth/login`                | Public        | Exchange credentials for JWT     |
| GET    | `/funds`                     | Authenticated | List all funds                   |
| POST   | `/funds`                     | Authenticated | Create a fund                    |
| GET    | `/funds/:id`                 | Authenticated | Get a fund by ID                 |
| PUT    | `/funds/:id`                 | Authenticated | Update a fund                    |
| GET    | `/investors`                 | Authenticated | List all investors               |
| POST   | `/investors`                 | Authenticated | Create an investor               |
| GET    | `/funds/:fundId/investments` | Authenticated | List investments for a fund      |
| POST   | `/funds/:fundId/investments` | Authenticated | Add an investment to a fund      |
| GET    | `/transactions`              | Authenticated | List all transactions            |
| POST   | `/transactions/process`      | Authenticated | Process a new transaction        |
| PUT    | `/transactions/:id/reverse`  | Authenticated | Reverse a transaction            |
| GET    | `/funds/:fundId/total-value` | Authenticated | Get NAV snapshot for a fund      |
| POST   | `/admin/recalculate-fees`    | Admin only    | Recalculate fees across all txns |

Full request and response shapes are defined in `src/modules/*/\*.schema.ts`.

Interactive API documentation is available at http://localhost:3000/docs. Log in via `/auth/login`, copy the token and use the Authorise button to authenticate all other requests.

---

## Running the tests

```bash
npm test
```

This runs Biome (lint and format check) first, then the Vitest integration test suite against a live `titanbay_test` PostgreSQL database. Migrations are applied automatically before the suite runs.

PostgreSQL must be running before invoking the test suite, the simplest way is to start the database via Docker:

```bash
docker compose up -d postgres
npm test
```

---

## npm scripts

| Script        | What it does                                                 |
| ------------- | ------------------------------------------------------------ |
| `dev`         | Start with hot reload via tsx watch                          |
| `build`       | Compile TypeScript to `dist/`                                |
| `start`       | Run compiled output                                          |
| `test`        | Biome check + Vitest integration tests                       |
| `lint`        | Biome lint and format check (read-only)                      |
| `lint:fix`    | Biome lint and format with auto-fix applied                  |
| `format`      | Biome format only, with auto-fix applied                     |
| `db:generate` | Generate a new Drizzle migration from schema                 |
| `db:migrate`  | Apply pending migrations                                     |
| `db:seed`     | Seed local dev database                                      |
| `audit:check` | Fail on high and critical vulnerabilities                    |
| `audit:full`  | Fail on medium and above (runs in CI)                        |
| `prepare`     | Run Husky if we're in a git repository, otherwise do nothing |

---

## What I built and why

### Module structure over a flat routes file

The codebase is split by domain module with each module having its own routes, service and Zod schema. This mirrors how a production service grows: a new domain area gets a new folder rather than extending a single file. It also makes it obvious where to look when amending a feature or tracing a bug.

### Zod as the single source of validation truth

Every request body and path parameter is validated by a Zod schema before it reaches the service layer. Using `fastify-type-provider-zod` wires this up so TypeScript infers the correct types inside route handlers without manual casting or guesswork about the shape of incoming data.

### Numeric money fields as strings

PostgreSQL `numeric(20,2)` maps to a JavaScript string in Drizzle ORM by default. I kept that mapping rather than converting to `number`. JavaScript floats cannot represent financial values precisely. Returning `"50000000.00"` instead of `50000000` in JSON responses is a deliberate choice that avoids precision loss silently introduced at the serialisation boundary.

### JWT with two roles

When a user logs in they receive a token containing their id, email and role. Two middleware hooks cover the trust levels the API needs — one that checks a valid token exists and one that also checks the role is admin. Protection is declared on the route itself rather than applied globally, so it is always visible in context when reading the code rather than hidden away in a plugin somewhere.

### Error handling in one place

Rather than scattering error handling across route handlers, all errors flow through a single Fastify error handler. It knows the difference between a validation error, an auth failure and an unexpected crash. It returns the right HTTP status and message for each *caught* error but for unexpected errors return a generic 500 with no internal details exposed.

### Integration tests against a real database

The test suite uses a real PostgreSQL database rather than mocking the data layer. For a project of this size, I'd rather verify that the API, ORM and database all work together than test each piece in isolation. Each test file seeds the database before running and cleans up afterwards, which keeps the tests predictable without adding too much overhead.

---

## Technical choices

**Fastify over Express.** Fastify's plugin system naturally isolates route groups and its first-class TypeScript support means the Zod schemas wire directly into the type system — something unavailable in the Express ecosystem.

**Drizzle ORM over Prisma.** Drizzle keeps SQL visible and predictable. There is no runtime magic, no code generation step and no black box between the query builder and what actually hits the database. The schema file is the single source of truth for both the migration and the TypeScript types.

**Biome over ESLint and Prettier.** One tool, one config file, runs in under 100ms. Biome replaces the ESLint and Prettier combination without the overhead of managing two separate rulesets and their occasional conflicts.

**Husky and lint-staged for pre-commit.** Staged TypeScript files are linted and formatted before every commit, followed by `tsc --noEmit` to catch type errors locally. `npm audit` also runs on commit and fails on high or critical vulnerabilities. The full test suite is intentionally excluded from the hook — that belongs in CI where it has time and resources to run properly.

---

## Additional implementation decisions

**PUT /funds/:id — id moved to path parameter.** The spec defined `PUT /funds` with the id in the request body. This is not idiomatic REST: a PUT without a resource identifier in the path makes the endpoint ambiguous and harder to cache or route. The implementation uses PUT /funds/:id to follow standard conventions.

**bypass_validation removed from transaction processing.** The spec included a bypass_validation flag on `POST /transactions/process`. In a financial system validation bypass is an audit liability - any transaction that circumvents checks becomes unaccountable. The flag was removed and proper validation applied unconditionally.

**Auth added to the admin endpoint.** The spec defined `POST /admin/recalculate-fees` with no authentication requirement. An unauthenticated endpoint that retroactively modifies fees across all transactions is a significant attack surface. JWT authentication with role enforcement was added. An authenticated admin token is required to call it.

**Audit log added for transaction state changes.** Transaction reversals write an immutable row to transaction_audit_log in the same database transaction as the status update. If the log write fails the reversal rolls back. This ensures the audit trail is always consistent with the transaction state.

**POST /admin/recalculate-fees is idempotent by design.** The spec did not address what happens when this endpoint is called multiple times. The implementation recalculates and overwrites rather than accumulating so repeated calls produce the same result. In production this would warrant an idempotency key or a job queue with exactly-once semantics.

---

## How I used AI

I used Claude Code throughout the task.

I started by modelling the database and creating an ER diagram based on the API specification. Once I was happy with the schema, I used Claude to scaffold the Fastify project structure, generate the initial route and service layers, and create an integration test suite covering the required endpoints.

From there I worked iteratively, running the tests, implementing functionality, and refining the codebase. AI was particularly useful for generating boilerplate, wiring Fastify plugins, creating Drizzle queries, and helping identify areas where validation or error handling could be improved.

As the implementation evolved, I used Claude to refactor duplicated validation logic, review edge cases, and suggest improvements around security and maintainability.

The overall architecture, schema design, authentication approach, testing strategy, API behaviour, and deviations from the specification were decisions I made. AI accelerated implementation, but the design choices and trade-offs remained mine.

Although most of my backend work today is in FastAPI, I'm comfortable with both Python and TypeScript. I chose TypeScript and Fastify for this challenge to better align with Titanbay's stack. AI helped me move quickly through the framework-specific details of Fastify and Drizzle without constantly switching to documentation. That meant I could spend more time thinking about the API design, schema, validation and testing strategy rather than the mechanics of the framework itself.

---

## Database schema

The schema is defined in `src/db/schema.ts` and generates a single migration in `src/migrations/`.

I kept the project to a single migration because this is a greenfield codebase created for the challenge. Rather than including every intermediate schema change made during development, I regenerated the migration from the final schema so it reflects the end state of the application.

The schema includes a few fields beyond the minimum required by the API specification, such as `transaction_type`, `kyc_status`, `country_of_domicile` and `currency`. These are common concepts in private markets systems and felt logical to include when designing the data model. The audit log and NAV snapshot tables support the additional transaction and fund valuation functionality included in the implementation.

users and investors are currently separate entities. For this challenge, authentication is used to control access to the API rather than represent investor ownership. In a production system I would likely introduce a relationship between the two, allowing authenticated users to view and manage only their own investments through endpoints such as `GET /me/investments`.

---

## Assumptions and trade-offs

- Any authenticated user can create or update funds and investors. The spec only defined role-based access for the admin recalculate-fees endpoint, so I kept the remaining endpoints available to any authenticated user. In a production system I would introduce more granular role-based permissions (RBAC).

- Future investment dates are allowed. The specification does not state whether future date investments should be accepted, so I chose not to add that. If this were a production system, I would clarify the business rule(s) and enforce if required.

- USD is the default currency. The schema includes a currency field on both funds and investments, but there is currently no validation that they match. The structure is there to support multi-currency scenarios, but the business rules around currency consistency have not been implemented.

- No pagination has been added. The specification did not require pagination and the expected dataset for the challenge is small. For a larger system I would introduce cursor-based pagination on list endpoints.

- Rate limiting is only applied to login. Login requests are limited to 10 per minute. All other endpoints rely on JWT authentication as the primary gate

- The seed script is idempotent. Seed data uses onConflictDoNothing, so it can be run multiple times without creating duplicate records. I did not make the seed process transactional as it is intended purely for local development and testing.

---

## What I would add next

- Link users and investors: Introduce a relationship between authenticated users and investor records. This would enable user-specific endpoints and allow permissions to be scoped to an investor's own investments.

- Pagination: Add cursor-based pagination to list endpoints to avoid returning large result sets as the dataset grows.

- Fund audit history: Extend the audit logging approach used for transactions to fund updates and status changes, providing a full history of operational changes.

- Currency validation: The schema supports multiple currencies, but there is currently no validation that investments use the same currency as the associated fund. This could be enforced through service-level validation or database constraints.

- Additional rate limiting: Rate limiting is currently applied to login requests only. In a production environment I would also consider limits on write-heavy endpoints such as transaction processing.
