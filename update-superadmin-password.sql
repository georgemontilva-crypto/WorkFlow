-- Actualizar contraseña del superadmin
-- Email: admin@finwrk.app
-- Nueva contraseña: 23858926Jorge@1993
-- Fecha: 2026-01-24

UPDATE `user` 
SET `password_hash` = '$2b$12$Ob0lKOMJl9KCvgvGsPqgeeG5IvevkBFIQa50fVku8PeyLHEsTaJ2e'
WHERE `email` = 'admin@finwrk.app';

-- Verificar que se actualizó correctamente
SELECT id, name, email, role, email_verified 
FROM `user` 
WHERE `email` = 'admin@finwrk.app';
