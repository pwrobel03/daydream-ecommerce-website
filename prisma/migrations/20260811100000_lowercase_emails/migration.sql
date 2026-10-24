-- E-mails are compared lower-cased. Stop without changing anything if two users differ only by case:
-- merging or deleting accounts is a decision for the owner.
DO $$
DECLARE
  conflicts text;
BEGIN
  SELECT string_agg(addresses, '; ') INTO conflicts FROM (
    SELECT string_agg("email", ', ' ORDER BY "email") AS addresses
    FROM "User"
    WHERE "email" IS NOT NULL
    GROUP BY lower("email")
    HAVING count(*) > 1
  ) AS duplicates;

  IF conflicts IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot lower-case User.email, these addresses differ only by case: %', conflicts;
  END IF;
END $$;

UPDATE "User" SET "email" = lower("email") WHERE "email" <> lower("email");
UPDATE "VerificationToken" SET "email" = lower("email") WHERE "email" <> lower("email");
UPDATE "PasswordResetToken" SET "email" = lower("email") WHERE "email" <> lower("email");
