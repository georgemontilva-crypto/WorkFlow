#!/bin/bash

# Convert camelCase database fields to snake_case throughout the codebase

cd /home/ubuntu/WorkFlow

# User table fields
find server/ -type f -name "*.ts" -exec sed -i 's/\.passwordHash/\.password_hash/g' {} +
find server/ -type f -name "*.ts" -exec sed -i 's/\.emailVerified/\.email_verified/g' {} +
find server/ -type f -name "*.ts" -exec sed -i 's/\.loginMethod/\.login_method/g' {} +
find server/ -type f -name "*.ts" -exec sed -i 's/\.trialEndsAt/\.trial_ends_at/g' {} +
find server/ -type f -name "*.ts" -exec sed -i 's/\.hasLifetimeAccess/\.has_lifetime_access/g' {} +
find server/ -type f -name "*.ts" -exec sed -i 's/\.twoFactorSecret/\.two_factor_secret/g' {} +
find server/ -type f -name "*.ts" -exec sed -i 's/\.twoFactorEnabled/\.two_factor_enabled/g' {} +
find server/ -type f -name "*.ts" -exec sed -i 's/\.createdAt/\.created_at/g' {} +
find server/ -type f -name "*.ts" -exec sed -i 's/\.updatedAt/\.updated_at/g' {} +
find server/ -type f -name "*.ts" -exec sed -i 's/\.lastSignedIn/\.last_signed_in/g' {} +

# Foreign keys and other fields
find server/ -type f -name "*.ts" -exec sed -i 's/\.userId/\.user_id/g' {} +
find server/ -type f -name "*.ts" -exec sed -i 's/\.clientId/\.client_id/g' {} +
find server/ -type f -name "*.ts" -exec sed -i 's/\.ticketId/\.ticket_id/g' {} +
find server/ -type f -name "*.ts" -exec sed -i 's/\.isStaff/\.is_staff/g' {} +

# Object property assignments
find server/ -type f -name "*.ts" -exec sed -i 's/passwordHash:/password_hash:/g' {} +
find server/ -type f -name "*.ts" -exec sed -i 's/emailVerified:/email_verified:/g' {} +
find server/ -type f -name "*.ts" -exec sed -i 's/loginMethod:/login_method:/g' {} +
find server/ -type f -name "*.ts" -exec sed -i 's/trialEndsAt:/trial_ends_at:/g' {} +
find server/ -type f -name "*.ts" -exec sed -i 's/hasLifetimeAccess:/has_lifetime_access:/g' {} +
find server/ -type f -name "*.ts" -exec sed -i 's/twoFactorSecret:/two_factor_secret:/g' {} +
find server/ -type f -name "*.ts" -exec sed -i 's/twoFactorEnabled:/two_factor_enabled:/g' {} +
find server/ -type f -name "*.ts" -exec sed -i 's/createdAt:/created_at:/g' {} +
find server/ -type f -name "*.ts" -exec sed -i 's/updatedAt:/updated_at:/g' {} +
find server/ -type f -name "*.ts" -exec sed -i 's/lastSignedIn:/last_signed_in:/g' {} +
find server/ -type f -name "*.ts" -exec sed -i 's/userId:/user_id:/g' {} +
find server/ -type f -name "*.ts" -exec sed -i 's/clientId:/client_id:/g' {} +
find server/ -type f -name "*.ts" -exec sed -i 's/ticketId:/ticket_id:/g' {} +
find server/ -type f -name "*.ts" -exec sed -i 's/isStaff:/is_staff:/g' {} +

echo "Field name conversion complete!"
