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
sudo cp examples/sources/openpay/precios-webhook.env.example /var/www/sources/openpay/precios-webhook.env
# Renombrar: quitar .example del nombre del archivo
# Editar OPENPAY_WEBHOOK_USER y OPENPAY_WEBHOOK_PASSWORD
sudo chmod 640 /var/www/sources/openpay/precios-webhook.env
sudo chown root:www-data /var/www/sources/openpay/precios-webhook.env
```

## Base de datos

```bash
sudo mysql imcyc_precios_memberships < scripts/mysql-openpay-webhook-events.sql
```

La tabla `openpay_webhook_events` garantiza **idempotencia** (no procesar dos veces el mismo evento).

## Log en disco (verificación y diagnóstico)

Cada petición se guarda en:

`/var/www/sources/openpay/precios-openpay-webhook.log`

```bash
# Ver últimas líneas (incluye verification_code al registrar el webhook)
sudo tail -n 30 /var/www/sources/openpay/precios-openpay-webhook.log

# Solo eventos de verificación Openpay
sudo grep '"kind":"verification"' /var/www/sources/openpay/precios-openpay-webhook.log | tail -5
```

Al registrar el webhook en el panel, Openpay envía `type: "verification"` con `verification_code`.  
El endpoint lo escribe en el log (`kind: verification`) y responde **HTTP 200** con el código en JSON.  
Copia ese valor en el dashboard de Openpay para completar la verificación.

## Comportamiento

- Responde **HTTP 200** siempre (errores también se registran en el log).
- Actualiza `membership_orders` según tipo de evento.
- Evento `verification` se procesa **antes** de exigir auth (el código queda en log aunque falle Basic después en otros eventos).
- Si no hay credenciales en `.env`, acepta el webhook (solo desarrollo; en producción configure el archivo).
