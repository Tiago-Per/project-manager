# Project Manager

Project manager app: list, create, edit, delete and favorite projects.

## Stack

- **API (`api/`):** Ruby on Rails 8 in API mode, PostgreSQL, Active Storage, RSpec, FactoryBot
- **Frontend (`web/`):** Vue 3 + TypeScript, Vite, Vue Router, Pinia, Vitest
- **Infra:** Docker Compose for local development

## Structure

```
api/                 # Rails API
web/                 # Vue 3 + TypeScript
docker-compose.yml   # runs db + api + web
README.md            # documentation and technical decisions
```

## Conventions

### General
- Code, variable names, methods and tests in English.
- Commits follow Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`).
- Use current versions and modern practices. Avoid legacy or deprecated patterns.

### API
- Controllers under the `Api::` namespace.
- Tests with RSpec and FactoryBot.

### Frontend
- Components with `<script setup lang="ts">` and the Composition API.
- State management with Pinia (setup stores).
- HTTP calls in `src/api/`, types in `src/types/`.
- Custom CSS with custom properties, flexbox and grid.
- API URL via `VITE_API_URL`.

## Testing

### API (RSpec)
- Models: test validations and business rules in `spec/models/`.
- Endpoints: use request specs in `spec/requests/` (no controller specs).
- Test data with FactoryBot in `spec/factories/`. Prefer `build` when saving to the database is not needed.
- Cover the success case and the main error cases (validation errors, record not found).
- No real external calls in tests.

### Frontend (Vitest)
- Component tests with Vitest and Vue Test Utils, next to the components or in `src/**/__tests__/`.
- Test behavior visible to the user (what is rendered, emitted events), not implementation details.
- Mock API calls.

### General
- Every new feature comes with tests.
- Run the tests after each change.

## Commands

```bash
# API
cd api
bin/rails server          # http://localhost:3000
bundle exec rspec         # tests

# Frontend
cd web
npm run dev               # http://localhost:5173
npm run test              # Vitest
```

PostgreSQL runs in a Docker container (see `api/config/database.yml` for host and port).