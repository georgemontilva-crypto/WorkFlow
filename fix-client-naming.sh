#!/bin/bash

# Convert camelCase database fields to snake_case in client files

cd /home/ubuntu/WorkFlow

# Client table fields
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/\.userId/\.user_id/g' {} +
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/\.clientId/\.client_id/g' {} +
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/\.billingCycle/\.billing_cycle/g' {} +
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/\.customCycleDays/\.custom_cycle_days/g' {} +
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/\.nextPaymentDate/\.next_payment_date/g' {} +
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/\.reminderDays/\.reminder_days/g' {} +
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/\.invoiceNumber/\.invoice_number/g' {} +
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/\.issueDate/\.issue_date/g' {} +
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/\.dueDate/\.due_date/g' {} +
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/\.targetAmount/\.target_amount/g' {} +
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/\.currentAmount/\.current_amount/g' {} +
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/\.createdAt/\.created_at/g' {} +
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/\.updatedAt/\.updated_at/g' {} +
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/\.trialEndsAt/\.trial_ends_at/g' {} +
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/\.hasLifetimeAccess/\.has_lifetime_access/g' {} +

# Object property assignments
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/userId:/user_id:/g' {} +
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/clientId:/client_id:/g' {} +
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/billingCycle:/billing_cycle:/g' {} +
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/customCycleDays:/custom_cycle_days:/g' {} +
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/nextPaymentDate:/next_payment_date:/g' {} +
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/reminderDays:/reminder_days:/g' {} +
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/invoiceNumber:/invoice_number:/g' {} +
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/issueDate:/issue_date:/g' {} +
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/dueDate:/due_date:/g' {} +
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/targetAmount:/target_amount:/g' {} +
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/currentAmount:/current_amount:/g' {} +
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/createdAt:/created_at:/g' {} +
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/updatedAt:/updated_at:/g' {} +
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/trialEndsAt:/trial_ends_at:/g' {} +
find client/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/hasLifetimeAccess:/has_lifetime_access:/g' {} +

echo "Client field name conversion complete!"
