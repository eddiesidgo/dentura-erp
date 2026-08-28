# Dentura Desktop (Electron)

Shell de escritorio que **compila/levanta el JAR** de `back/` y abre la UI.

## Flujo

1. Busca `back/target/dentura-api-*.jar`
2. Si no existe (o usas `start:rebuild`), corre `mvn -DskipTests package` en `back/`
3. Arranca `java -jar …` con cwd en `back/` (SQLite en `back/data/`)
4. Espera `GET /api/health`
5. Abre la ventana Electron

## Requisitos

- Node.js 20+
- Java 21 (PATH, `JAVA_HOME`, o `~/.local/share/dentura-tooling/jdk-21`)
- Backend en `../back`

## Uso

```bash
cd desktop
npm install
npm start                 # usa JAR existente (o lo compila si falta)
npm run start:rebuild     # fuerza mvn package y luego Electron
npm run start:ui-dev      # JAR + Vite (auto) + UI en http://localhost:5173
```

Con el front todavía no embebido en el JAR, `npm start` abre `http://127.0.0.1:8080/` (API).  
`start:ui-dev` levanta Vite en `front/` si aún no está corriendo (o reutiliza uno existente).

## Variables

| Variable | Default | Uso |
|----------|---------|-----|
| `PORT` | `8080` | Puerto del JAR |
| `DENTURA_UI_URL` | `http://127.0.0.1:PORT/` | URL de la ventana |
| `DENTURA_REBUILD_JAR` | — | `1` = recompilar siempre |
| `DENTURA_DB_PATH` | `back/data/dentura.db` | SQLite |
| `JAVA_HOME` | tooling local | JDK a usar |
