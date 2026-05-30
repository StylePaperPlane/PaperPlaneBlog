# PaperPlane Blog Backend

Spring Boot backend for PaperPlane Blog.

## Development

```bash
mvn spring-boot:run
```

The default configuration expects PostgreSQL on `127.0.0.1:5432` with database/user `paperplane`.

## Build

```bash
mvn -DskipTests package
```

## Docker

`docker-compose.yml` starts PostgreSQL and the backend service. Set `POSTGRES_PASSWORD` in your local environment or a private `.env` file before deploying.
