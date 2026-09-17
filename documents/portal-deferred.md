# Portal del paciente (diferido)

Dentura está orientado a **instalación local / on-prem**. Un portal público
para auto-agendar requiere exposición a internet, autenticación de pacientes y
soporte de red que el cliente potencial actual no pide.

## Decisión

- Feature flag previsto: `dentura.portal-enabled=false` (por defecto).
- No hay UI ni rutas de portal en este release.
- Si más adelante se habilita, el alcance mínimo sería **solo LAN/kiosk**
  (reserva interna en la recepción), no cloud público.

Ver plan de producto en `documents/dentura-contexto.md`.
