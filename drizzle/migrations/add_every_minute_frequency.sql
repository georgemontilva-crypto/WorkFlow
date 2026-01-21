-- Migration: Add 'every_minute' to recurrence_frequency enum
-- Date: 2026-01-20
-- Purpose: Add testing frequency option for recurring invoices

ALTER TABLE invoices 
MODIFY COLUMN recurrence_frequency 
ENUM('every_minute', 'monthly', 'biweekly', 'annual', 'custom');
