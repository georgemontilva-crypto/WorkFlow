-- Create reminders table
CREATE TABLE IF NOT EXISTS `reminders` (
  `id` serial AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `reminder_date` timestamp NOT NULL,
  `reminder_time` varchar(10),
  `category` enum('payment', 'meeting', 'deadline', 'personal', 'other') NOT NULL DEFAULT 'other',
  `priority` enum('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  `status` enum('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  `notify_email` int NOT NULL DEFAULT 1,
  `notify_days_before` int NOT NULL DEFAULT 1,
  `email_sent` int NOT NULL DEFAULT 0,
  `calendar_exported` int NOT NULL DEFAULT 0,
  `related_client_id` int,
  `related_invoice_id` int,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
