# Dentura ERP — Contexto y bases

> Documento de contexto del producto. Nombre provisional: **Dentura ERP** (puede cambiar).
> Fecha de captura: 2026-08-25. Actualizado: 2026-09-12.

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

## 3. Alcance funcional

### Implementado (fases 0–4 + módulos mid-tier)

| Área | Descripción |
|------|-------------|
| Pacientes | CRUD, búsqueda, ficha (datos personales/contacto/fiscales básicos). Fuente de referido opcional |
| Agenda | Calendario y citas |
| Catálogo de tratamientos | Códigos, nombres, precios |
| Trabajos / plan | Por paciente; estados: Terminados / Pendientes / No aceptados (base de cotización) |
| Reportes | Listado/resumen de trabajos, cotización, recibo de pago, receta, resumen de pagos, pacientes por fuente de referidos; vista previa + PDF |
| Odontograma | Hallazgos por pieza (FDI), superficies, condición y estado; pestaña en ficha |
| Pagos | Cobros por paciente, recibo secuencial, asignaciones a trabajos, saldo vs plan |
| Fotos / RVG | Archivos por paciente (almacenamiento local) |
| Recetas | Prescripciones + plantillas; impresión/PDF |
| Referidos | Catálogo de fuentes + referidos salientes; reporte por fuente |

### Explícitamente fuera de alcance (sigue)

- Morosos
- **Cuenta corriente / libro de cargos-abonos-ajustes** (sigue fuera; los pagos son cobros simples, no contabilidad de cargos/abonos)
- Facturación electrónica completa (DTE) — solo datos fiscales en ficha por ahora

### Backlog (diferido)

- **Recordatorios de citas** (WhatsApp / email): diferidos mientras el producto es ERP local sin integraciones de mensajería
- Instalador Windows, backup, licencia offline (fase comercial)
- DTE, sync cloud

### Sobre “facturas” (hallazgo GestOdon)

- Había datos fiscales + tipo de comprobante + cobros tipo cuenta corriente
- **No** se demostró módulo de facturas/DTE completo en las capturas
- En Dentura: no priorizar facturación formal; pagos = recibos internos

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

| Fase | Contenido | Estado |
|------|-----------|--------|
| 0 | Monorepo: web (React), api (Spring), desktop (Electron); auth; SQLite + perfil Postgres; JAR sirve front | Hecho |
| 1 | Pacientes | Hecho |
| 2 | Agenda | Hecho |
| 3 | Catálogo + trabajos + estados (cotización base) | Hecho |
| 4 | Reportes e impresión (trabajos + cotización + pagos/recetas/referidos) | Hecho |
| Mid-tier | Odontograma, pagos, fotos, recetas, referidos | Hecho |
| 5 | Instalador Windows, backup SQLite, licencia offline opcional | Pendiente |
| Backlog | Recordatorios (WhatsApp/email), DTE, cloud | Diferido |

## 6. Odontograma

- Implementado a nivel básico: piezas FDI, superficies, condiciones y estados, vínculo opcional a trabajo
- Clínico completo (gráficos densos, periodontograma, etc.) queda como evolución futura

## 7. Decisiones pendientes

- [ ] Confirmar nombre final (Dentura ERP provisional)
- [ ] Licenciamiento offline sí/no en Fase 5
- [ ] Cuándo reactivar recordatorios (canal local vs proveedor externo)

## 8. Referencias internas

- Análisis de alcance GestOdon: conversación previa / capturas en `documents/img/`
- Plantilla frontend: `front/`
- API backend: `back/` (Spring Boot 3.4 + Maven + SQLite/Postgres)
- Desktop Electron: `desktop/` (levanta el JAR de `back/target/` y abre la UI)

## 9. Tooling local (Java / Maven)

Si no hay Java/Maven del sistema, usar el toolkit en el home del usuario:

```bash
export JAVA_HOME="$HOME/.local/share/dentura-tooling/jdk-21"
export PATH="$JAVA_HOME/bin:$HOME/.local/share/dentura-tooling/maven/bin:$PATH"
```

Arranque API: `cd back && mvn spring-boot:run` → http://localhost:8080/api/health

## 10. Autenticación (implementado)

- Backend: JWT + Spring Security, seed `admin` / `123Qwe`
- Endpoints: `/api/sign-in`, `/api/sign-up`, `/api/sign-out`, `/api/forgot-password`, `/api/reset-password`
- Front: Mirage desactivado (`VITE_ENABLE_MOCK=false`), proxy Vite `/api` → `:8080`, CORS con origin patterns
