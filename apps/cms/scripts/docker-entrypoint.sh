#!/bin/sh
# Starts Strapi in the container. Secrets not provided through the environment are generated
# once and kept in the data volume, so `docker compose up` needs no committed secrets.
set -eu

SECRETS_FILE="${SECRETS_FILE:-./data/secrets.env}"
mkdir -p "$(dirname "$SECRETS_FILE")"

random() { node -e "process.stdout.write(require('crypto').randomBytes(32).toString('base64'))"; }

if [ ! -f "$SECRETS_FILE" ]; then
  umask 077
  {
    echo "APP_KEYS=$(random),$(random)"
    for name in API_TOKEN_SALT ADMIN_JWT_SECRET TRANSFER_TOKEN_SALT JWT_SECRET ENCRYPTION_KEY; do
      echo "$name=$(random)"
    done
  } > "$SECRETS_FILE"
fi

# Values already set in the environment win over the generated ones.
while IFS='=' read -r name value; do
  [ -z "$name" ] && continue
  eval "current=\${$name:-}"
  [ -z "$current" ] && export "$name=$value"
done < "$SECRETS_FILE"

exec "$@"
