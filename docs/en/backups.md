# Backups and restore

How the server administrator backs up and restores the demo
([ADR 0014](../adr/0014-backups.md)). Polish version: [`docs/pl/backups.md`](../pl/backups.md). It
extends the [deployment guide](deployment.md); the `docker compose` prefix is the one defined there.
The commands are documented, not shipped as services: you set them up and run them.

What is backed up, and for how long:

| What | How | Retention |
| --- | --- | --- |
| Database | daily `pg_dump -Fc` | 7 days |
| Uploads volume | daily `tar` | 7 days |
| Newest dump and archive, off the server | encrypted with `age` | 7 days at the destination |
| `.env.docker` and local proxy config | encrypted, off the server | latest version, updated on every change |
| Pre-reset and pre-upgrade dumps | the same rotation | 7 days |

Not backed up: Redis (it holds only short-lived counters) and TLS certificates (certbot reissues
them).

Dumps and archives contain **personal data** (accounts, addresses, orders). The privacy notice
promises that deleted data leaves the backups within 7 days, so do not keep anything longer.

## 1. One-time setup

Create the backup directory **outside the repository and the compose project**, readable only by its
owner (the user whose crontab runs the script):

```bash
install -d -m 700 /var/backups/daydream   # as root, then chown it to that user
```

Generate an `age` key pair **on your own machine, not on the server** (`age` is in most package
managers, for example `apt install age`):

```bash
age-keygen -o daydream-backup-key.txt
# Public key: age1...
```

Keep `daydream-backup-key.txt` in your password manager. The server only gets the public key
(`age1...`), so a stolen server or backup destination cannot decrypt the copies.

## 2. The daily backup

Save this as `/usr/local/sbin/daydream-backup.sh` and run `chmod 700` on it. Set `DEPLOY_DIR` to the
repository directory. If you use the Cloudflare overlay (deployment guide, step 4), also set
`DEPLOY_COMPOSE_FILES` in the crontab to the same list of files you use for every other command.

```bash
#!/usr/bin/env bash
set -euo pipefail
umask 077
cd "${DEPLOY_DIR:?set DEPLOY_DIR}"
backups=${BACKUP_DIR:-/var/backups/daydream}
stamp=$(date -u +%Y%m%dT%H%M%SZ)
compose=(docker compose --env-file .env.docker)
for file in ${DEPLOY_COMPOSE_FILES:-docker-compose.yml docker-compose.prod.yml}; do compose+=(-f "$file"); done

mkdir -p "$backups/offsite" backups
"${compose[@]}" exec -T postgres sh -c 'pg_dump -Fc -U "$POSTGRES_USER" "$POSTGRES_DB"' </dev/null > "$backups/db-$stamp.dump"
"${compose[@]}" run --rm -T migrate tar -czf - -C /data/uploads . </dev/null > "$backups/uploads-$stamp.tar.gz"
[ -s "$backups/db-$stamp.dump" ] || exit 1
[ -s "$backups/uploads-$stamp.tar.gz" ] || exit 1

# Encrypt the newest pair for the off-server copy; the private key is not on this server.
for f in "db-$stamp.dump" "uploads-$stamp.tar.gz"; do
  age -r "$AGE_RECIPIENT" -o "$backups/offsite/$f.age" "$backups/$f"
done

# Rotation: everything older than 7 days, including the pre-reset and pre-upgrade dumps in backups/.
find "$backups" backups -type f \( -name '*.dump' -o -name '*.tar.gz' -o -name '*.age' \) -mmin +10080 -delete
```

`scripts/demo-reset.sh` and the pre-upgrade command (deployment guide, step 6) write their dumps to
`backups/` in the repository directory. The last line rotates that directory too, so those dumps also
expire after 7 days.

Crontab of the same user, at 03:15 every day (`crontab -e`):

```cron
AGE_RECIPIENT=age1...your-public-key
DEPLOY_DIR=/path/to/daydream-ecommerce-website
15 3 * * * /usr/local/sbin/daydream-backup.sh >> /var/backups/daydream/backup.log 2>&1
```

Rotation runs only after a successful backup, so check `backup.log` from time to time: while backups fail, nothing expires.

`pg_dump` runs inside the `postgres` container and reads its own credentials, so no password is on the
command line. The user running cron must be able to run `docker`. Run the script once by hand and
check that the files are not empty:

```bash
DEPLOY_DIR=/path/to/daydream-ecommerce-website AGE_RECIPIENT=age1... /usr/local/sbin/daydream-backup.sh && ls -l /var/backups/daydream
```

## 3. The off-server copy

The script leaves the newest encrypted pair in `/var/backups/daydream/offsite/`. Copy that directory
to a place you choose (another machine, object storage, a backup provider), on its own schedule.
With `rclone` it is, for example:

```bash
rclone copy /var/backups/daydream/offsite remote:daydream-backups
rclone delete --min-age 7d remote:daydream-backups
```

The second line gives the destination the same 7-day retention. If your destination has its own
lifecycle rule, use that instead. Check the retention there: the privacy notice depends on it.

## 4. Configuration

`.env.docker` holds the Stripe test keys, the webhook signing secret, `AUTH_SECRET`, `CRON_SECRET`,
SMTP and Turnstile credentials and the privacy details. Without it a rebuilt server cannot be
configured the same way (a new `AUTH_SECRET` signs every visitor out). Store it encrypted off the
server, together with any local proxy config you added (for example
`docker-compose.cloudflare.yml`, or the files of a replaced proxy):

```bash
cd /path/to/daydream-ecommerce-website
tar -czf - .env.docker docker-compose.cloudflare.yml | age -r age1...your-public-key -o daydream-config.tar.gz.age
```

List only the files that exist. Copy `daydream-config.tar.gz.age` off the server and **repeat this
whenever a value in `.env.docker` changes** (a rotated Stripe key, a new SMTP password). Keep only the
latest version. It holds secrets, not personal data, so the 7-day rule does not apply to it.

## 5. Restore into a fresh deployment

A restore is for disaster recovery, such as losing the server.

> **Warning.** A restore brings back everything that existed when the backup was taken, including
> accounts that visitors deleted afterwards. Use it only to recover from a lost or corrupted
> deployment, not to undo a mistake on a working one. If deleted accounts come back, tell the owner,
> because they have to be deleted again.

On the new server, with the prerequisites of the deployment guide (step 1):

1. Get the code (step 2). On your machine, decrypt the three files with your private key, then copy
   them to the server:

   ```bash
   age -d -i daydream-backup-key.txt -o db.dump db-<stamp>.dump.age
   age -d -i daydream-backup-key.txt -o uploads.tar.gz uploads-<stamp>.tar.gz.age
   age -d -i daydream-backup-key.txt daydream-config.tar.gz.age | tar -xzf -
   ```

   Extract the configuration in the repository directory, run `chmod 600 .env.docker`, point the DNS
   record at the new server, and build the images (step 2). Issue the TLS certificate again (step 4).

   Behind Cloudflare, add `-f docker-compose.cloudflare.yml` to every command below.

2. Start PostgreSQL only. It creates an empty `daydream` database:

   ```bash
   docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml up -d postgres
   ```

3. Restore the dump. The database is empty, so there is nothing to clean first:

   ```bash
   docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
     sh -c 'pg_restore --no-owner --exit-on-error -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < db.dump
   ```

4. Extract the uploads into the volume (the app runs as user 1001):

   ```bash
   docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml run --rm -T migrate \
     sh -c 'tar -xzf - -C /data/uploads && chown -R 1001:1001 /data/uploads' < uploads.tar.gz
   ```

5. Start everything. `migrate` runs first and applies only migrations newer than the dump:

   ```bash
   docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml up -d
   curl -fsS https://<domain>/api/health
   ```

6. Sign in as the private admin and open a product with an uploaded image. Then delete the decrypted
   `db.dump` and `uploads.tar.gz` from the server, since they hold personal data, and set up the daily
   backup again (step 2).
