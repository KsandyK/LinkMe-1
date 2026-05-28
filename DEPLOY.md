# CRAVR — Production Deployment Guide

Deploy CRAVR to any Linux VPS (Ubuntu 22.04 recommended) with a custom domain, SSL, and CCBill payment processing.

---

## Prerequisites

| Item | Where to get it |
|------|----------------|
| A VPS | DigitalOcean Droplet, Hetzner CX22, Vultr, Linode — any Ubuntu 22.04 box |
| A domain name | Namecheap, GoDaddy, Cloudflare, etc. |
| CCBill merchant account | ccbill.com — needs to be active before payments work |
| Git access to this repo | GitHub / GitLab SSH key on the server |

**Minimum specs:** 2 CPU, 4 GB RAM, 40 GB SSD (handles up to ~500 concurrent users)

---

## Step 1 — Point Your Domain DNS

In your domain registrar / DNS provider, create two A records pointing to your server's IP address:

```
A   @         <your-server-ip>   (TTL 300)
A   www       <your-server-ip>   (TTL 300)
```

DNS propagation can take up to 24 hours, but is usually under 10 minutes.

---

## Step 2 — Set Up the Server

SSH into your fresh VPS and run:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker + Compose plugin
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker

# Install certbot (for SSL certificates)
sudo apt install -y certbot

# Verify Docker works
docker run --rm hello-world
```

---

## Step 3 — Clone the Repo

```bash
cd /opt
sudo git clone https://github.com/YOUR_USERNAME/CRAVR-1.git CRAVR
sudo chown -R $USER:$USER CRAVR
cd CRAVR
```

---

## Step 4 — Configure Environment

```bash
# Copy the example and fill it in
cp .env.production.example .env
nano .env
```

Fill in every field. The required ones are:

| Variable | How to get the value |
|----------|---------------------|
| `DOMAIN` | Your domain, e.g. `cravr.fun` |
| `VITE_API_URL` | `https://cravr.fun` |
| `ALLOWED_ORIGINS` | `https://cravr.fun,https://www.cravr.fun` |
| `POSTGRES_PASSWORD` | Make up a strong random password |
| `JWT_SECRET` | Run: `openssl rand -hex 64` |
| `CCBILL_CLIENT_ACCNUM` | Your CCBill account number |
| `CCBILL_SUBACCOUNT` | Usually `0000` |
| `CCBILL_FORM_NAME` | Your CCBill form name, e.g. `cc_payment.html` |
| `CCBILL_SALT` | From CCBill merchant panel → Settings → Salt |
| `CCBILL_WEBHOOK_SECRET` | From CCBill merchant panel |

---

## Step 5 — Update nginx.conf With Your Domain

```bash
# Replace YOURDOMAIN.COM placeholder (run this once)
sed -i 's/YOURDOMAIN\.COM/cravr.fun/g' nginx/nginx.conf
```

(Replace `cravr.fun` with your actual domain.)

---

## Step 6 — Obtain SSL Certificate

The certificate must be obtained **before** the proxy container starts with SSL enabled.

```bash
# Temporarily allow HTTP for the ACME challenge
# Start just the proxy in HTTP-only mode first:
sudo certbot certonly --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com \
  --agree-tos \
  --email your@email.com \
  --non-interactive

# Verify certs were created:
sudo ls /etc/letsencrypt/live/yourdomain.com/
```

You should see: `cert.pem  chain.pem  fullchain.pem  privkey.pem`

---

## Step 7 — Run Database Migrations

Start just the database, run Prisma migrations, then bring down:

```bash
# Start postgres only
docker compose -f docker-compose.prod.yml up -d postgres

# Run migrations (adjust the image tag if needed)
docker compose -f docker-compose.prod.yml run --rm api \
  node -e "const { execSync } = require('child_process'); execSync('npx prisma migrate deploy', { stdio: 'inherit' })"

# Or if you have node/pnpm on the host:
# cd apps/api && DATABASE_URL="postgresql://CRAVR:PASSWORD@localhost:5432/CRAVR" npx prisma migrate deploy
```

---

## Step 8 — Launch Everything

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

This will:
1. Build the API image (installs deps, runs esbuild)
2. Build the web image (runs Vite build with your `VITE_API_URL`)
3. Start postgres, api, web, proxy, and certbot

Check everything is running:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api
```

---

## Step 9 — Register the CCBill Webhook

In your **CCBill Merchant Panel**:

1. Go to **Account Info → Webhook / Background Post URL**
2. Set the URL to:
   ```
   https://yourdomain.com/api/credits/webhook
   ```
3. Set the method to **POST**
4. Enable the **Approval Post** and **Denial Post** events
5. Save

When a customer completes a payment, CCBill will call this URL and the server will automatically credit their account.

---

## Step 10 — Verify the Deployment

```bash
# Check HTTPS works
curl -I https://yourdomain.com

# Check API health
curl https://yourdomain.com/api/health

# Check WebSocket endpoint is reachable
# (should return 400 "Bad Request" — that means nginx is routing it correctly)
curl -I https://yourdomain.com/ws
```

Open `https://yourdomain.com` in a browser — you should see the CRAVR landing page.

---

## Maintenance

### Update the app after a code change

```bash
cd /opt/CRAVR
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

### Renew SSL certificate

Certbot auto-renews via the certbot container. To force a manual renewal:

```bash
docker compose -f docker-compose.prod.yml run --rm certbot renew
docker compose -f docker-compose.prod.yml exec proxy nginx -s reload
```

### View logs

```bash
# API logs
docker compose -f docker-compose.prod.yml logs -f api

# nginx access logs
docker compose -f docker-compose.prod.yml logs -f proxy

# All services
docker compose -f docker-compose.prod.yml logs -f
```

### Database backup

```bash
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U CRAVR CRAVR > backup_$(date +%Y%m%d).sql
```

### Restart a single service

```bash
docker compose -f docker-compose.prod.yml restart api
```

---

## Firewall Setup (optional but recommended)

```bash
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## Architecture Overview

```
Internet
   │
   ▼
[proxy :443]  ← nginx, SSL termination
   │
   ├── /api/*  →  [api :3000]  ← Express REST
   ├── /ws     →  [api :3001]  ← WebSocket (live streams, chat)
   └── /*      →  [web :80]    ← nginx serving the Vite SPA
                     │
                [postgres :5432]  ← internal only, never exposed
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `502 Bad Gateway` | API container not ready yet — check `docker compose logs api` |
| `ERR_SSL_PROTOCOL_ERROR` | Certs not yet in `/etc/letsencrypt/` — re-run Step 6 |
| Payments not crediting | Check CCBill webhook URL is exactly right; check `docker compose logs api \| grep webhook` |
| WebSocket disconnects | Ensure `/ws` location in nginx.conf has `proxy_read_timeout 86400s` |
| Database connection refused | Check `POSTGRES_PASSWORD` matches between services in `.env` |
