UPDATE plans
SET is_active = FALSE
WHERE LOWER(name) = 'daily';
