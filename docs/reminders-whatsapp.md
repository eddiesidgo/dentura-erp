# Recordatorios WhatsApp (wa.me)

Dentura genera enlaces `https://wa.me/<telefono>?text=<mensaje>` para que el personal
abra WhatsApp y envíe el recordatorio manualmente. No hay integración con la API de Meta.

## Configuración por clínica

Columnas en `clinics` (migración V17):

- `reminder_hours_before` — horas antes de la cita (default `24`)
- `reminder_message_template` — plantilla con `{patientName}`, `{date}`, `{time}`, `{clinicName}`
- `reminder_default_country_code` — código país sin `+` (default `503` El Salvador)

## API

- `POST /api/reminders/generate` — genera cola para la clínica actual (`agenda.write`)
- `GET /api/reminders?status=PENDING` — lista recordatorios (`agenda.read`)
- `POST /api/reminders/{id}/sent` — marca enviado
- `POST /api/reminders/{id}/skipped` — marca omitido

El job horario (`ReminderScheduler`) llama a la generación para todas las clínicas activas.

## Pasos de prueba

1. Crear/editar un paciente con móvil local (ej. `71234567`) o con código país.
2. Crear una cita `SCHEDULED` o `CONFIRMED` en las próximas 24–48 h.
3. Iniciar sesión y llamar `POST /api/reminders/generate` (o esperar el job).
4. Abrir **Recordatorios** en el front; debe aparecer un ítem `PENDING` con `waMeUrl`.
5. Abrir el enlace; WhatsApp Web/App debe precargar el mensaje.
6. Marcar como **Enviado** o **Omitido** desde la UI.
