# Cumplimiento Openpay — Membresías /precios

Referencia: [API Openpay México](https://documents.openpay.mx/docs/api.html), [Suscripciones](https://documents.openpay.mx/docs/suscriptions.html), [3D Secure](https://documents.openpay.mx/docs/three-d-secure.html).

## Lo que exige Openpay (resumen)

| Tema | Lineamiento | Estado en /precios |
|------|-------------|-------------------|
| PCI | Tarjeta solo vía **Openpay.js** (`token.create`); nunca enviar PAN/CVV al servidor | OK |
| Antifraude | `device_session_id` generado con `OpenPay.deviceData.setup()` | OK en frontend |
| Cargo con token | `device_session_id` **requerido** en cargos con `source_id` | OK (pago único) |
| Tarjeta desde token | Al asociar token al cliente: `token_id` + `device_session_id` **requeridos** | OK (suscripciones, corregido) |
| 3D Secure | Solo en **cargos** con `use_3d_secure: true` + `redirect_url`; no en API de suscripciones | OK por diseño |
| Tras 3DS | En `redirect_url`, leer query `id` y **consultar el cargo** en Openpay | OK (`orders/get.php` + confirmación) |
| Planes | Crear planes en panel; IDs en `membership-plans.production.php` | OK (sin auto-crear en producción) |
| `order_id` | Único por transacción | OK (`generate_membership_order_id`) |
| Webhook | Confirmar pagos asíncronos (SPEI, efectivo, renovaciones) | OK (código) — **registrar URL y eventos en panel** |
| Webhook auth | HTTP Basic en `precios-webhook.env` | OK |
| Idempotencia webhook | Tabla `openpay_webhook_events` | OK |
| `currency: MXN` | Explícito en cargos | OK |
| Cobro recurrente | Aviso legal + checkbox en checkout | OK |
| Error 3005 | Mensaje claro (cargo duplicado) | OK |
| Sync post-3DS | `orders/get.php?sync=1` + `orders/sync.php` | OK |

## Flujos implementados

### Suscripción (tarjeta, default)

1. Frontend: token + `device_session_id`
2. Backend: cliente → **tarjeta desde token** (antifraude) → suscripción con `source_id` = id de tarjeta
3. Openpay cobra según el plan recurrente (sin `use_3d_secure` en suscripciones)

### Pago único con tarjeta

1. `createOpenpayCharge` con `use_3d_secure: true`, `device_session_id`, `redirect_url`
2. Si hay challenge: redirect a URL de Openpay
3. Vuelta a `/precios/confirmacion?id={charge_id}` → sincroniza y persiste estado en MySQL (`sync=1`)

### SPEI / efectivo

Cargos `bank_account` / `store` sin 3DS; estado final vía webhook recomendado.

## 3D Secure y suscripciones

La API de **suscripciones no documenta** `use_3d_secure`. Forzar 3DS en el alta rompería el flujo estándar de Openpay. Si el comercio exige 3DS en el primer cobro, hay que validar con Openpay/BBVA un flujo híbrido (primer cargo 3DS + suscripción después), no está implementado.

## Configuración producción

- Llaves live en `/var/www/sources/openpay/`
- Planes en `membership-plans.production.php`
- Sin `precios-sandbox.enabled`
- Webhook: ver [OPENPAY-WEBHOOK.md](./OPENPAY-WEBHOOK.md)
