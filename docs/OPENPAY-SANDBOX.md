# Pruebas Openpay (sandbox) — Membresías /precios

## Estado actual en producción

`https://grabador.imcyc.com/precios/api/openpay-config.php` devuelve `"sandbox": false` → cobros **reales**.

## Activar sandbox solo en /precios

La tienda (`TiendaImcyc`) puede seguir en producción. Para membresías:

### Opción A — Archivo bandera (recomendada, sobrevive al `pnpm build`)

Plantillas sin secretos: [examples/sources/openpay/README.md](../examples/sources/openpay/README.md)

```bash
sudo mkdir -p /var/www/sources/openpay
sudo touch /var/www/sources/openpay/precios-sandbox.enabled
```

(La ruta en `precios/api/` también funciona, pero **se borra** al desplegar con `rsync --delete`.)

### Opción B — Variable de entorno

En el vhost de Apache (solo si aplica a `/precios`):

```apache
SetEnv IMCYC_PRECIOS_OPENPAY_SANDBOX 1
```

### Llaves de prueba

1. Crear `/var/www/sources/openpay/precios-openpay.env` (persistente)
2. Rellenar con llaves del panel [sandbox-dashboard.openpay.mx](https://sandbox-dashboard.openpay.mx/)
3. O asegurarse de que en `/var/www/sources/openpay/config.php` los campos `merchant_id`, `private_key`, `public_key` sean de **sandbox** (con `production => false` cuando no uses el archivo bandera global).

Verificar:

```bash
curl -s https://grabador.imcyc.com/precios/api/openpay-config.php | jq .data.sandbox
# debe mostrar: true
```

## Tarjetas de prueba (Openpay México)

| Resultado | Número | CVV | Vencimiento |
|-----------|--------|-----|-------------|
| Aprobada | 4111111111111111 | 123 | 12/30 |
| Rechazada | 4000000000000002 | 123 | 12/30 |

Nombre del titular: cualquier nombre de prueba.

Documentación: [documents.openpay.mx](https://documents.openpay.mx/docs/sandbox.html)

## Webhook en sandbox

Registrar en el panel sandbox:

`https://grabador.imcyc.com/precios/api/openpay-webhook.php`

## Volver a producción

```bash
sudo rm /var/www/sources/openpay/precios-sandbox.enabled
```

Recargar checkout; `openpay-config.php` debe devolver `"sandbox": false`.

## Base de datos MySQL (órdenes de membresía)

Registro local de pedidos (estado, cliente, payload Openpay) para consultas y webhook.

Config en `/var/www/sources/openpay/precios-mysql.env` (ver `public/api/precios-mysql.env.example`).

Crear base y usuario dedicado:

```bash
sudo mysql <<'SQL'
CREATE DATABASE IF NOT EXISTS imcyc_precios_memberships
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'precios_memberships'@'localhost' IDENTIFIED BY 'CONTRASEÑA_SEGURA';
GRANT SELECT, INSERT, UPDATE ON imcyc_precios_memberships.* TO 'precios_memberships'@'localhost';
FLUSH PRIVILEGES;
SQL
sudo cp public/api/precios-mysql.env.example /var/www/sources/openpay/precios-mysql.env
# Editar MEMBERSHIP_DB_PASSWORD
sudo chmod 640 /var/www/sources/openpay/precios-mysql.env
sudo chown root:www-data /var/www/sources/openpay/precios-mysql.env
```

## Planes Openpay (IDs)

| Membresía | Ciclo | Monto | Clave interna | ID producción |
|-----------|-------|-------|---------------|---------------|
| Membresía Individual | mensual | $99 | `profesional-monthly` | `pjguslxarekdizfopyuu` |
| Profesional Plus | mensual | $299 | `profesional-plus-monthly` | `p8dydrrxflyvhlda8nib` |
| Profesional Anual | anual | $1,089 | `profesional-yearly` | `pylisai9nrbgo2o9kn1s` |
| Profesional Plus Anual | anual | $3,289 | `profesional-plus-yearly` | `prbwag8wufg3sdaef9fs` |

Archivos persistentes en el servidor:

- Producción: `/var/www/sources/openpay/membership-plans.production.php`
- Sandbox: `/var/www/sources/openpay/membership-plans.sandbox.php`

Con `precios-sandbox.enabled` activo se usa el archivo sandbox; al quitarlo, producción.

## Cancelar suscripción

Ruta pública (sin botón en el catálogo; compartir enlace o correos):

`https://grabador.imcyc.com/precios/#/cancelar-suscripcion`

API: `GET/POST /precios/api/cancel-membership-subscription.php` — requiere correo e ID de suscripción (el de la confirmación de pago).

Crear la tabla (una vez):

```bash
sudo mysql imcyc_precios_memberships < scripts/mysql-memberships-schema.sql
```
