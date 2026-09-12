# Dentura API

API Spring Boot (Maven) para Dentura ERP.

## Requisitos

- Java 21+
- Maven 3.9+
- Docker (PostgreSQL local)

## Base de datos (PostgreSQL)

```bash
# Desde la raíz del repo — restart: always (arranca con Docker)
docker compose up -d
```

Credenciales (en `application.properties` / `docker-compose.yml`):

| Campo | Valor |
|-------|-------|
| Host | `localhost` |
| Puerto | `5432` |
| DB | `dentura` |
| Usuario | `dentura` |
| Password | `dentura` |

Perfil SQLite (Electron, futuro): `mvn spring-boot:run -Dspring-boot.run.profiles=sqlite`

Tooling local del proyecto (si no tienes Java/Maven en el sistema):

```bash
export JAVA_HOME="$(/usr/libexec/java_home -v 21)"
export PATH="$JAVA_HOME/bin:$PATH"
```

## Arranque

```bash
cd back
mvn spring-boot:run
```

- API: http://localhost:8080
- Health: http://localhost:8080/api/health
- Actuator: http://localhost:8080/actuator/health
- SQLite: perfil `sqlite` → `./data/dentura.db`
- PostgreSQL: Docker → ver `docker-compose.yml` en la raíz

## Autenticación (JWT)

| Método | Ruta | Auth |
|--------|------|------|
| POST | `/api/sign-in` | Público — `{ userName, password }` → `{ token, user }` |
| POST | `/api/sign-up` | Público — `{ userName, email, password }` |
| POST | `/api/sign-out` | Bearer token |
| POST | `/api/forgot-password` | Público (stub MVP) |
| POST | `/api/reset-password` | Público (stub MVP) |

Usuario seed (primera ejecución): `admin` / `123Qwe`

El front React usa proxy Vite `/api` → `8080` y `VITE_ENABLE_MOCK=false`.

## Variables útiles

| Variable | Default | Uso |
|----------|---------|-----|
| `PORT` | `8080` | Puerto HTTP |
| `DENTURA_DB_HOST` | `localhost` | Postgres host |
| `DENTURA_DB_PORT` | `5432` | Postgres port |
| `DENTURA_DB_NAME` | `dentura` | Postgres database |
| `DENTURA_DB_USER` | `dentura` | Postgres user |
| `DENTURA_DB_PASSWORD` | `dentura` | Postgres password |
| `DENTURA_CORS_ORIGIN_PATTERNS` | `localhost:*`, `127.0.0.1:*` | CORS dev |
| `DENTURA_JWT_SECRET` | (dev default) | Clave HMAC JWT |
| `DENTURA_SEED_ADMIN_USER` | `admin` | Usuario inicial |
| `DENTURA_SEED_ADMIN_PASSWORD` | `123Qwe` | Contraseña inicial |

## Build JAR

```bash
mvn -DskipTests package
java -jar target/dentura-api-0.0.1-SNAPSHOT.jar
```
