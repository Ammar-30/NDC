-- Remap all user and owner email domains to ndc.com while preserving local-part.
-- Example: alice@old-domain.com -> alice@ndc.com

UPDATE users
SET email = lower(split_part(email, '@', 1) || '@ndc.com')
WHERE lower(email) NOT LIKE '%@ndc.com';

UPDATE owners
SET email = lower(split_part(email, '@', 1) || '@ndc.com')
WHERE lower(email) NOT LIKE '%@ndc.com';
