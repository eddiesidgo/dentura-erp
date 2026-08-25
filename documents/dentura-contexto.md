# Dentura ERP — Contexto y bases

> Documento de contexto del producto. Nombre provisional: **Dentura ERP** (puede cambiar).
> Fecha de captura: 2026-08-25.

## 1. Origen / referencia

Análisis de capturas de un PMS dental legacy:

- **Software de referencia:** GestOdon V1.7 / V7.7 — BSF Asesorías 2006
- **Clínica de referencia:** Dr. Rony Rivera, odontología estética, San Salvador, El Salvador
- **Carpeta de evidencias:** `documents/img/`

## 2. Problema a resolver

Clínicas dentales en El Salvador (y similares) que:

- Necesitan gestión de pacientes, agenda, tratamientos y reportes
- **Prefieren local / on-prem** (desconfianza o rechazo a la nube)
- Pueden querer **versión web** (navegador en LAN) o **versión desktop**

## 3. Alcance funcional (MVP y fases)

### Incluido en la definición de producto (sin morosos ni cuenta corriente)

| Área | Descripción |
|------|-------------|
| Pacientes | CRUD, búsqueda, ficha (datos personales/contacto). Datos fiscales básicos en ficha (NIT, etc.) sin módulo de facturas |
| Agenda | Calendario, citas, recordatorios |
| Catálogo de tratamientos | Códigos, nombres, precios |
| Trabajos / plan | Por paciente; estados: Terminados / Pendientes / No aceptados (base de cotización) |
| Reportes | Trabajos por tratamiento/estado/fechas; impresión/PDF simple |
| (Posterior) | Fotos/RVG, recetas, odontograma, facturación DTE, sync cloud |

### Explícitamente fuera del MVP actual

- Morosos
- Cuenta corriente / libro contable de cargos-abonos-ajustes
- Facturación electrónica completa (DTE) — solo datos fiscales en ficha por ahora

### Sobre “facturas” (hallazgo GestOdon)

- Había datos fiscales + tipo de comprobante + cobros tipo cuenta corriente
- **No** se demostró módulo de facturas/DTE completo en las capturas
- En Dentura: no priorizar facturación formal en MVP

## 4. Stack acordado (dirección)

### Recomendación

- **Frontend:** React (plantilla en `front/`)
- **Backend:** Spring Boot (API REST; mismo artefacto puede servir el build de React)
- **Desktop (opcional):** Electron que arranca/conecta al backend local
- **DB:** PostgreSQL en Docker (`docker compose up -d`) — credenciales `dentura/dentura`, DB `dentura`. Perfil `sqlite` reservado para Electron

### Despliegues objetivo

```
React → API Spring Boot → SQLite | Postgres

• Web local / LAN  → JAR (+ navegador)
• Desktop          → Electron + JAR + SQLite
• (Futuro) Cloud   → mismo API/JAR en VPS
```

### Notas de arquitectura

- Empaquetar React dentro del JAR (static) **no es “sucio”**; es patrón válido on-prem
- Electron = shell; Spring = motor de negocio
- **Protección de código:** JAR y Node se pueden inspeccionar en instalaciones locales. No hay anti-plagio fuerte on-prem; mitigar con licencia/contrato, no con ofuscación como estrategia principal

### Alternativa descartada / secundaria

- NestJS / Express: viable (un solo lenguaje), pero empaquetado on-prem más frágil y sin ventaja real de “protección” vs Spring para el caso local

## 5. Plan de desarrollo (fases)

| Fase | Contenido | Orden de valor |
|------|-----------|----------------|
| 0 | Monorepo: web (React), api (Spring), desktop (Electron); auth simple; SQLite + perfil Postgres; JAR sirve front | Cimientos |
| 1 | Pacientes | 1º |
| 2 | Agenda | 2º |
| 3 | Catálogo + trabajos + estados (cotización base) | 3º |
| 4 | Reportes e impresión | 4º |
| 5 | Instalador Windows, backup SQLite, licencia offline opcional | Comercial |
| 6+ | Fotos/RVG, recetas, odontograma, DTE, cloud | Post-MVP |

## 6. Odontograma (nota, no MVP)

- Básico: complejidad media
- Clínico completo: de los módulos más densos del PMS
- No incluido en el MVP inicial

## 7. Decisiones pendientes

- [ ] Confirmar nombre final (Dentura ERP provisional)
- [ ] MVP solo SQLite vs SQLite + Postgres desde día 1
- [ ] Licenciamiento offline sí/no en Fase 5
- [ ] Estructura monorepo exacta al incorporar la plantilla React de `front/`

## 8. Referencias internas

- Análisis de alcance GestOdon: conversación previa / capturas en `documents/img/`
- Plantilla frontend: `front/`
- API backend: `back/` (Spring Boot 3.4 + Maven + SQLite)
- Desktop Electron: `desktop/` (levanta el JAR de `back/target/` y abre la UI)

## 9. Tooling local (Java / Maven)

Si no hay Java/Maven del sistema, usar el toolkit en el home del usuario:

```bash
export JAVA_HOME="$HOME/.local/share/dentura-tooling/jdk-21"
export PATH="$JAVA_HOME/bin:$HOME/.local/share/dentura-tooling/maven/bin:$PATH"
```

Arranque API: `cd back && mvn spring-boot:run` → http://localhost:8080/api/health

## 10. Autenticación (implementado)

- Backend: JWT + Spring Security, SQLite `users`, seed `admin` / `123Qwe`
- Endpoints: `/api/sign-in`, `/api/sign-up`, `/api/sign-out`, `/api/forgot-password`, `/api/reset-password`
- Front: Mirage desactivado (`VITE_ENABLE_MOCK=false`), proxy Vite `/api` → `:8080`, CORS con origin patterns
