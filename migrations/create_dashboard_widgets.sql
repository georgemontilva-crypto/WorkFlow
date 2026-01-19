-- Create dashboard_widgets table
CREATE TABLE IF NOT EXISTS `dashboard_widgets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `widget_type` VARCHAR(50) NOT NULL,
  `widget_data` TEXT,
  `position` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_widget_type` (`widget_type`),
  INDEX `idx_position` (`position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default widgets for existing users (optional)
-- This will give all users the 4 basic widgets by default
INSERT INTO `dashboard_widgets` (`user_id`, `widget_type`, `position`)
SELECT DISTINCT `id`, 'clients', 0 FROM `user` WHERE NOT EXISTS (
  SELECT 1 FROM `dashboard_widgets` WHERE `user_id` = `user`.`id` AND `widget_type` = 'clients'
);

INSERT INTO `dashboard_widgets` (`user_id`, `widget_type`, `position`)
SELECT DISTINCT `id`, 'invoices', 1 FROM `user` WHERE NOT EXISTS (
  SELECT 1 FROM `dashboard_widgets` WHERE `user_id` = `user`.`id` AND `widget_type` = 'invoices'
);

INSERT INTO `dashboard_widgets` (`user_id`, `widget_type`, `position`)
SELECT DISTINCT `id`, 'income', 2 FROM `user` WHERE NOT EXISTS (
  SELECT 1 FROM `dashboard_widgets` WHERE `user_id` = `user`.`id` AND `widget_type` = 'income'
);

INSERT INTO `dashboard_widgets` (`user_id`, `widget_type`, `position`)
SELECT DISTINCT `id`, 'expenses', 3 FROM `user` WHERE NOT EXISTS (
  SELECT 1 FROM `dashboard_widgets` WHERE `user_id` = `user`.`id` AND `widget_type` = 'expenses'
);
