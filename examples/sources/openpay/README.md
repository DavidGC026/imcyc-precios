# Ejemplo: `/var/www/sources/openpay`

Copia de la estructura usada en el servidor **grabador.imcyc.com** para Tienda IMCYC y **/precios**.  
Los archivos aquí son plantillas: **no contienen llaves, contraseñas ni secretos reales**.

## Instalación en servidor

```bash
sudo mkdir -p /var/www/sources/openpay
sudo cp examples/sources/openpay/*.example /var/www/sources/openpay/
# Renombrar quitando la extensión .example según la tabla inferior
sudo chmod 640 /var/www/sources/openpay/*.php /var/www/sources/openpay/*.env 2>/dev/null || true
sudo chown root:www-data /var/www/sources/openpay/precios-*.env
```

## Archivos

| Plantilla (repo) | Destino en servidor | Uso |
|------------------|---------------------|-----|
| `config.php.example` | `config.php` | Llaves Openpay (tienda + base). Producción y sandbox. |
| `mail.php.example` | `mail.php` | SMTP notificaciones (Tienda; opcional para precios). |
| `membership-plans.production.php.example` | `membership-plans.production.php` | IDs de planes Openpay **live** (/precios). |
| `membership-plans.sandbox.php.example` | `membership-plans.sandbox.php` | IDs de planes **sandbox** (/precios). |
| `precios-openpay.env.example` | `precios-openpay.env` | Solo sandbox /precios (con `precios-sandbox.enabled`). |
| `precios-mysql.env.example` | `precios-mysql.env` | MySQL `imcyc_precios_memberships`. |
| `precios-webhook.env.example` | `precios-webhook.env` | HTTP Basic del webhook /precios. |
| `precios-sandbox.enabled.example` | `precios-sandbox.enabled` | Archivo vacío = forzar sandbox en /precios. |

## Producción /precios (resumen)

1. **No** crear `precios-sandbox.enabled`.
2. En `config.php`: `production => true` y llaves live en `production_*` (panel https://dashboard.openpay.mx/).
3. Copiar `membership-plans.production.php` con los `openpay_plan_id` de tu panel.
4. `precios-mysql.env` y `precios-webhook.env` con valores reales (fuera de git).
5. Webhook: ver [docs/OPENPAY-WEBHOOK.md](../../../docs/OPENPAY-WEBHOOK.md).

## Permisos recomendados

```bash
sudo chmod 750 /var/www/sources/openpay
sudo chmod 640 /var/www/sources/openpay/config.php /var/www/sources/openpay/mail.php
sudo chmod 640 /var/www/sources/openpay/precios-*.env
```

No versionar en git: `config.php`, `mail.php`, `precios-*.env`, `openpay-webhook.log`, `memberships-data/`.
