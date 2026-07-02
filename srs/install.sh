#!/usr/bin/env bash
# CRAVR — SRS install script (Ubuntu 24.04 / Cloudzy)
#
# Installs SRS via Docker, wires it to the CRAVR API on the host, and exposes
# HLS through your existing nginx + Cloudflare Origin Cert (no extra port open).
#
# Run as root on the production server:
#   bash /opt/cravr/srs/install.sh
#
# After this:
#   - OBS publishes to:  rtmp://stream.cravr.fun:1935/live/<streamKey>
#   - Viewers fetch from: https://cravr.fun/hls/live/<streamKey>/index.m3u8
#   - SRS calls the API at http://172.17.0.1:3000/api/streams/webhook/srs
#
set -euo pipefail

echo "── 1. Install Docker (if missing) ─────────────────────────────────────────"
if ! command -v docker >/dev/null; then
  apt-get update -y
  apt-get install -y docker.io
  systemctl enable --now docker
else
  echo "    docker already installed: $(docker --version)"
fi

echo "── 2. Create persistent HLS volume ────────────────────────────────────────"
mkdir -p /var/srs/hls
chown -R 1000:1000 /var/srs

echo "── 3. Open RTMP port in UFW ───────────────────────────────────────────────"
ufw allow 1935/tcp comment "SRS RTMP ingest"
ufw reload || true

echo "── 4. Pull SRS image and run as a systemd service ─────────────────────────"
docker pull ossrs/srs:5

# Stop/remove existing container if re-running
docker rm -f srs 2>/dev/null || true

# Run SRS:
#   - 1935: RTMP ingest (publicly reachable)
#   - 8080: HLS (bound to localhost only — nginx proxies it)
#   - 1985: SRS admin API (localhost only)
#   - /opt/cravr/srs/srs.conf  → /usr/local/srs/conf/srs.conf
#   - /var/srs/hls            → /usr/local/srs/objs/nginx/html
#
# --add-host: lets SRS reach the API on the docker host (the API listens on
# localhost:3000, which the container reaches via host.docker.internal aka
# the docker0 bridge gateway).
docker run -d --restart=always --name srs \
  -p 1935:1935 \
  -p 127.0.0.1:8080:8080 \
  -p 127.0.0.1:1985:1985 \
  --add-host=srs-host-gateway:172.17.0.1 \
  -v /opt/cravr/srs/srs.conf:/usr/local/srs/conf/srs.conf:ro \
  -v /var/srs/hls:/usr/local/srs/objs/nginx/html \
  ossrs/srs:5 \
  ./objs/srs -c conf/srs.conf

echo "── 5. nginx — proxy /hls/ to SRS so it's served over HTTPS via cravr.fun ──"
cat > /etc/nginx/conf.d/srs-hls.conf <<'NGINX'
# HLS proxy — segments stream out from SRS via the existing TLS-terminated host.
# Lives in a 'location /hls/' block; add it to the main server { } block below.
NGINX

# Inject the location block into the existing site config if missing.
SITE=/etc/nginx/sites-available/cravr
if ! grep -q "location /hls/" "$SITE"; then
  # insert just before the last closing brace
  sed -i '$i\
\
    # ── SRS HLS proxy ────────────────────────────────────────────────────────\
    # /hls/live/<streamKey>/index.m3u8 → http://127.0.0.1:8080/live/<streamKey>/index.m3u8\
    location /hls/ {\
        proxy_pass http://127.0.0.1:8080/;\
        proxy_http_version 1.1;\
        # Cache HLS segments at the edge (Cloudflare/Bunny) — manifests stay fresh\
        add_header Cache-Control "public, max-age=2" always;\
        # CORS so hls.js can fetch from the browser\
        add_header Access-Control-Allow-Origin "*" always;\
    }' "$SITE"
fi

nginx -t && systemctl reload nginx

echo "── 6. DNS reminder ────────────────────────────────────────────────────────"
cat <<EOF

  ▼ Add a DNS record in Cloudflare so OBS can reach SRS:

      Type    Name              Content             Proxy
      A       stream            $(curl -s ifconfig.me)   DNS only  ← important: NOT Proxied (Cloudflare doesn't proxy RTMP)

  Cloudflare only proxies HTTP/HTTPS — RTMP must hit the origin directly.

EOF

echo "── 7. Add to /opt/cravr/apps/api/.env (then pm2 restart cravr-api) ────────"
echo "      RTMP_HOST=stream.cravr.fun"
echo
echo "✅  SRS is running. Test with:"
echo "      docker logs -f srs"
echo "      curl http://127.0.0.1:1985/api/v1/summaries  # SRS admin API"
echo
