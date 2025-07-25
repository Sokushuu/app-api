# Sokushuu API

Backend API for the Sokushuu learning platform, built with Cloudflare Workers using [chanfana](https://github.com/cloudflare/chanfana) and [Hono](https://github.com/honojs/hono).

This API provides waitlist management and configuration endpoints for the Sokushuu launch, featuring OpenAPI 3.1 auto-generation, request validation, and comprehensive CORS configuration.

## Features

- **Waitlist Management**: Email collection with validation and duplicate prevention
- **Launch Configuration**: Dynamic launch date management via database
- **OpenAPI Documentation**: Auto-generated API documentation at `/`
- **CORS Security**: Environment-based origin restrictions
- **Comprehensive Testing**: Integration tests using [Vitest](https://vitest.dev/)

## API Endpoints

- `POST /waitlist` - Subscribe to waitlist with email validation
- `GET /waitlist/count` - Get total waitlist subscriber count  
- `GET /config/launch-date` - Get web launch date configuration

> [!IMPORTANT]
> When using C3 to create this project, select "no" when it asks if you want to deploy. You need to follow this project's [setup steps](https://github.com/cloudflare/templates/tree/main/openapi-template#setup-steps) before deploying.

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) runtime
- [Cloudflare account](https://dash.cloudflare.com/sign-up) with Workers enabled
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) installed

### Setup Steps

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Create D1 database:**
   ```bash
   bun run wrangler d1 create sokushuu-app-db
   ```
   Update the `database_id` in `wrangler.jsonc` with the returned database ID.

3. **Run database migrations:**
   ```bash
   # Local development
   bun run seedLocalDb
   
   # Production deployment
   bun run wrangler d1 migrations apply DB --remote
   ```

4. **Start development server:**
   ```bash
   bun run dev
   ```
   API will be available at `http://localhost:8787`

5. **Deploy to production:**
   ```bash
   bun run deploy
   ```

## Testing

Comprehensive integration tests using [Vitest](https://vitest.dev/):

```bash
bun run test
```

**Test Coverage:**
- Waitlist email subscription and validation
- Subscriber count tracking  
- Launch date configuration
- CORS security policies

## Project Structure

```
src/
├── index.ts                 # Main application and routing
├── endpoints/               # API endpoint implementations
│   ├── waitlistEndpoint.ts
│   ├── waitlistCountEndpoint.ts
│   └── configLaunchDateEndpoint.ts
└── types.ts                # TypeScript type definitions

migrations/                  # D1 database migrations
├── 0002_add_waitlist_table.sql
└── 0003_add_config_table.sql

tests/integration/          # Integration test suites
├── waitlist.test.ts
├── config.test.ts
└── cors.test.ts
```

## CORS Configuration

Environment-based CORS policy:
- **Development**: Allows `localhost` and `127.0.0.1` origins
- **Production**: Only allows `sokushuu.de` and `*.sokushuu.de` domains
- **Security**: Rejects unauthorized cross-origin requests

## Database Schema

- **waitlist**: Email collection with unique constraints
- **config**: Key-value configuration storage (launch date, etc.)

For more information, see the [chanfana documentation](https://chanfana.com/), [Hono documentation](https://hono.dev/docs), and [Vitest documentation](https://vitest.dev/guide/).
