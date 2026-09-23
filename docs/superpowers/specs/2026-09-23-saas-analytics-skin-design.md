# Dentura SaaS Analytics Skin — Design Spec

**Date:** 2026-09-23  
**Status:** Approved (enfoque 1 — tokens-first + mirrors puntuales)

## Goal

Aplicar un look “analytics SaaS” (fondos claros, cards blancas con borde fino, menú activo sutil, radios 8–12px) a **toda la app**, sin fijar el acento a violeta y sin inventar layouts nuevos.

## Decisions

| Tema | Decisión |
|------|----------|
| Alcance | App completa (big bang visual) |
| Estrategia | Tokens / CSS globales + mirrors solo donde falte markup |
| Acento | ThemeSwitcher intacto (`themeColor` / `primaryColorLevel`) |
| Shell | Retocar sidebar/header (activo sutil, menos peso visual); layouts actuales se mantienen |
| Dark mode | Mismo skin adaptado (no eliminar) |
| Fuera de alcance | Layouts estructurales nuevos, cambios de flujos/backend, fijar violeta |

## Visual language

- **Canvas:** fondo suave (`gray-50` / `#F5F7F9`), no gray-100 denso.
- **Cards:** blanco, `rounded-xl`, borde `gray-200` fino, sombra muy suave (o solo borde).
- **Tipografía:** headings más nítidos; body/muted en gray-500; Inter se mantiene.
- **Nav:** item activo = fondo gray-100 suave + texto más oscuro (no gray-200 pesado).
- **Controles:** inputs/botones `rounded-lg`–`rounded-xl`, bordes más claros.
- **Tablas/diálogos:** heredar radios y bordes más suaves.

## Component strategy

1. **In-place CSS** en primitives existentes (`_card`, `_input`, `_button`, `_menu-item`, `_side-nav`, `_header`, `_tables`, `_dialog`, `tailwind/index` body).
2. **Mirrors** (wrappers, no fork del kit):
   - `SoftCard` — card analytics (borde + padding generoso).
   - `GhostButton` — outline suave full-width / acciones secundarias.
   - Reutilizar `KpiStat` / ajustar tiles de Home a estilo métrica clara (no bloques gradient saturados).
3. **Home** como vitrina del skin (KPIs + cards), el resto hereda vía CSS.

## Success criteria

- Casi todas las pantallas se ven más “aireadas” sin migrar imports página a página.
- Cambiar color en ThemeSwitcher sigue tintando botones solid / focos.
- Dark mode usable (sin regressiones graves de contraste).
- Layout switcher (modern/classic/etc.) sigue funcionando.

## Non-goals

- Sidebar icon-only tipo mock 2.
- Floating action bar.
- Rediseño de odontograma / reportes PDF.
