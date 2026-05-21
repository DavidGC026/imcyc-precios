# Webhook Openpay — /precios

## URL de producción

`https://grabador.imcyc.com/precios/api/openpay-webhook.php`

## Registro en panel Openpay

1. Dashboard Openpay → **Webhooks** → agregar URL anterior.
2. Método **POST**, autenticación **HTTP Basic** (mismas credenciales que en `precios-webhook.env`).
3. Eventos recomendados:
   - `charge.succeeded`, `charge.failed`, `charge.cancelled`, `charge.pending`, `charge.refunded`
   - `subscription.charge.succeeded`, `subscription.charge.failed`
   - `chargeback.accepted`, `chargeback.rejected` (si están disponibles en tu cuenta)

## Credenciales en servidor

```bash
sudo cp public/api/precios-webhook.env.example /var/www/sources/openpay/precios-webhook.env
# Editar OPENPAY_WEBHOOK_USER y OPENPAY_WEBHOOK_PASSWORD
sudo chmod 640 /var/www/sources/openpay/precios-webhook.env
sudo chown root:www-data /var/www/sources/openpay/precios-webhook.env
```

## Base de datos

```bash
sudo mysql imcyc_precios_memberships < scripts/mysql-openpay-webhook-events.sql
```

La tabla `openpay_webhook_events` garantiza **idempotencia** (no procesar dos veces el mismo evento).

## Comportamiento

- Responde **HTTP 200** siempre (errores se registran en `error_log`).
- Actualiza `membership_orders` según tipo de evento.
- Si no hay credenciales en `.env`, acepta el webhook (solo para desarrollo; en producción configure el archivo).
