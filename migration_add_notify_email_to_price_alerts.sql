-- Agregar campo notify_email a price_alerts
ALTER TABLE price_alerts 
ADD COLUMN notify_email INT NOT NULL DEFAULT 1 AFTER is_active;
