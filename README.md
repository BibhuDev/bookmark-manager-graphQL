# Bookmark Manager GraphQL API

A simple Bookmark Manager API built with **Bun, TypeScript, GraphQL Yoga, Prisma, and PostgreSQL**.

The API allows users to create folders, organize bookmarks, search bookmarks, and manage bookmark relationships through GraphQL.

## Tech Stack

* Bun
* TypeScript (strict mode)
* GraphQL Yoga
* GraphQL schema-first approach
* PostgreSQL
* Prisma ORM
* Docker Compose
* Automated unit and integration tests

## Setup

### Prerequisites

Make sure you have:

* [Bun](https://bun.sh/) installed
* [Docker](https://www.docker.com/) installed and running
* Git

### Clone the repository

```bash
git clone <your-repository-url>
cd <repository-directory>
```

### Install dependencies

```bash
bun install
```

### Start PostgreSQL

```bash
docker compose up -d
```

### Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bookmarks"
```

Adjust the connection string if your Docker Compose configuration uses different credentials or a different database name.

### Generate Prisma Client

```bash
bun run gendb
```

### Run database migrations

For a fresh development database:

```bash
bunx prisma migrate dev
```

### Start the development server

```bash
bun run dev
```

The GraphQL API will then be available at the URL shown by the development server.

## Environment Variables

| Variable       | Description                                 | Example                                                   |
| -------------- | ------------------------------------------- | --------------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma | `postgresql://postgres:postgres@localhost:5432/bookmarks` |

## Database

Database changes should be made through the Prisma schema and generated using Prisma's migration tooling:

```bash
bunx prisma migrate dev
```

SQL migration files should not be manually written or modified as a replacement for Prisma migrations.

The main relationship is:

```text
Folder
  └── Bookmark
       └── belongs to one Folder
```

The database should also use appropriate indexes and constraints for commonly queried fields and relationships.

## API

The API uses GraphQL Yoga with a schema-first approach. The GraphQL schema is defined in a `.graphql` file, while resolver implementations are kept separately.

### Queries

#### `folders`

Returns all folders.

```graphql
query {
  folders {
    id
    name
    createdAt
  }
}
```

#### `folder(id)`

Returns a single folder and its bookmarks.

```graphql
query {
  folder(id: "folder-id") {
    id
    name
    createdAt
    bookmarks {
      id
      title
      url
      tags
      createdAt
    }
  }
}
```

#### `bookmarks`

Returns bookmarks with optional filtering and cursor-based pagination.

Supported arguments:

* `folderId` — filters bookmarks by folder
* `search` — performs a substring search against the bookmark title
* `take` — number of records to return
* `cursor` — cursor used to continue from the previous page

Example:

```graphql
query {
  bookmarks(take: 10, search: "github") {
    id
    title
    url
    tags
    folderId
    createdAt
  }
}
```

### Cursor Pagination

Bookmark pagination uses a cursor-based approach rather than returning a fixed subset of records.

The cursor represents the position of the last item returned by the previous request. The client can provide that cursor in the next request to continue retrieving records.

This allows pagination to work across multiple requests without relying on page numbers or repeatedly skipping an increasing number of records.

The exact cursor representation is an implementation detail of the API and should remain opaque to clients.

### Mutations

The API supports:

```text
createFolder
createBookmark
updateBookmark
deleteBookmark
moveBookmark
```

Example:

```graphql
mutation {
  createFolder(name: "Development") {
    id
    name
    createdAt
  }
}
```

A bookmark can be moved between folders using:

```graphql
mutation {
  moveBookmark(id: "bookmark-id", folderId: "folder-id") {
    id
    title
    folderId
  }
}
```

## Validation and Error Handling

The API validates user input before performing database operations.

At minimum:

* Bookmark titles cannot be empty or whitespace-only.
* Bookmark URLs must be valid URLs.
* Referenced folders must exist.
* Requested bookmarks must exist.
* Moving a bookmark to a non-existent folder returns a meaningful GraphQL error.

Validation and domain errors are returned as GraphQL errors instead of being exposed as unhandled server exceptions or generic HTTP 500 responses.

## Testing

The project contains both unit and integration tests.

### Unit Tests

Resolver unit tests verify important application behavior, including successful operations and validation/error paths.

Tests use real assertions rather than only checking that functions execute without throwing.

Run the unit test suite with:

```bash
bun test
```

### PostgreSQL Integration Test

At least one integration test runs against a real PostgreSQL database started through Docker Compose.

This verifies that the application can successfully interact with PostgreSQL and Prisma rather than relying entirely on mocked database calls.

Make sure PostgreSQL is running before executing integration tests:

```bash
docker compose up -d
bun test
```

## Development

A typical development workflow is:

```bash
docker compose up -d
bun install
bun run gendb
bunx prisma migrate dev
bun run dev
```

Useful commands may include:

```bash
bun run dev
bun test
bun run gendb
bunx prisma migrate dev
```

If a sanity script is provided, the complete validation can be run with:

```bash
bun run sanity
```

which runs linting, type checking, and tests.

## Project Structure

The project follows a simple separation between the GraphQL schema, resolvers, database layer, and tests.

A typical structure is:

```text
src/
├── graphql/
│   ├── schema.graphql
│   └── resolvers/
├── db/
├── ...
prisma/
├── schema.prisma
└── migrations/
tests/
├── unit/
└── integration/
docker-compose.yml
.env
README.md
```

The exact structure may differ slightly depending on implementation details.

## How I'd Extend This

If this API grew into a production system, I would consider the following improvements without adding them unnecessarily to the current scope:

### Authentication and Authorization

Add authentication and user ownership so each user can manage only their own folders and bookmarks. Authorization rules could then be applied at the resolver/service layer.

### Caching

Introduce caching for frequently accessed data if database performance becomes a bottleneck. Cache invalidation would need to be handled carefully around bookmark and folder mutations.

### Search

For larger datasets, replace simple title substring matching with PostgreSQL full-text search or a dedicated search solution if search requirements become more advanced.

### Observability

Add structured logging, metrics, tracing, and error monitoring to make production issues easier to diagnose.

### API Evolution

GraphQL already provides a flexible schema, but changes should still be introduced carefully through deprecation and backwards-compatible schema evolution.

### Scaling

The API could be run as multiple stateless instances behind a load balancer while PostgreSQL remains the primary persistent datastore. Connection pooling and appropriate database indexing would become increasingly important as traffic grows.

## Git Workflow

The project uses incremental commits with meaningful commit messages rather than one large final commit.

Examples:

```text
feat: add Prisma schema and database migrations
feat: add GraphQL folder queries
feat: add bookmark mutations
test: add bookmark resolver tests
test: add PostgreSQL integration test
docs: add local setup instructions
```

The project should be submitted through a Pull Request against the `main` branch.

The Pull Request description should summarize:

* What was implemented
* Important design decisions
* Tradeoffs
* Improvements that could be made with more time

## Scope

This project intentionally focuses on the requested Bookmark Manager functionality.

Features such as authentication, RBAC, Redis, GraphQL Federation, deployment infrastructure, and other production infrastructure are intentionally left out unless required by the assignment.
