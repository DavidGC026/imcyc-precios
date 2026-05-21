-- Ejecutar en imcyc_precios_memberships (una vez):
-- sudo mysql imcyc_precios_memberships < scripts/mysql-openpay-webhook-events.sql

CREATE TABLE IF NOT EXISTS openpay_webhook_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    event_key VARCHAR(128) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    order_ref VARCHAR(64) DEFAULT NULL,
    payload TEXT DEFAULT NULL,
    created_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_event_key (event_key),
    KEY idx_order_ref (order_ref)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
