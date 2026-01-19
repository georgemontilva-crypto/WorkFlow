-- Set soportehiwork@gmail.com as super_admin with full access
UPDATE user 
SET 
  role = 'super_admin',
  has_lifetime_access = 1,
  trial_ends_at = NULL
WHERE email = 'soportehiwork@gmail.com';

-- Verify the update
SELECT id, name, email, role, has_lifetime_access, trial_ends_at 
FROM user 
WHERE email = 'soportehiwork@gmail.com';
