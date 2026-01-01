# 🚀 PROPHET Deployment Guide (Vercel Frontend + Railway Indexer/Hasura)

This guide explains how to deploy the Envio indexer and Hasura GraphQL Engine to Railway so your Vercel-deployed frontend can access it.

## Architecture Overview

The PROPHET deployment consists of **three separate services**:

1. **PostgreSQL Database** - Stores indexed blockchain data
2. **Hasura GraphQL Engine** - Exposes GraphQL API (has `/healthz` endpoint)
3. **Envio Indexer** - Background worker that indexes blockchain events (no HTTP endpoint)

```
┌─────────────────┐
│   Vercel        │
│   (Frontend)    │
└────────┬────────┘
         │ HTTPS
         │
┌────────▼────────┐
│   Hasura        │
│   GraphQL API   │
│   (Port 8080)   │
└────────┬────────┘
         │
┌────────▼────────┐
│   PostgreSQL    │
│   (Database)    │
└────────┬────────┘
         │
┌────────▼────────┐
│   Envio Indexer │
│   (Background)  │
└─────────────────┘
```

## Problem

- ✅ Frontend is deployed on Vercel
- ❌ Envio indexer runs locally in Docker
- ❌ Vercel can't access `localhost:8080`

## Solution: Deploy to Railway

**Railway** is recommended for the easiest setup. You'll deploy three services:

---

## Option 1: Railway (Recommended) 🚂

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create a new project

### Step 2: Deploy PostgreSQL Database

1. In your Railway project, click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway will automatically provision a PostgreSQL database
3. Note the connection details from the **Variables** tab:
   - `PGHOST`
   - `PGPORT`
   - `PGDATABASE`
   - `PGUSER`
   - `PGPASSWORD`
   - `DATABASE_URL` (full connection string)

### Step 3: Deploy Hasura GraphQL Engine

1. In your Railway project, click **"+ New"** → **"GitHub Repo"**
2. Select your PROPHET repository
3. **Configure the service**:

   - **Root Directory**: `hasura`
   - **Build Command**: (leave empty - we'll use Docker)
   - **Start Command**: (leave empty)

4. **Add a Dockerfile** (create `hasura/Dockerfile` in your repo root):

   ```dockerfile
   FROM hasura/graphql-engine:v2.43.0

   ENV HASURA_GRAPHQL_ENABLE_CONSOLE=false
   ENV PORT=8080
   ```

5. **Configure Environment Variables** (in Railway service settings):

   ```
   HASURA_GRAPHQL_DATABASE_URL=<your-postgres-database-url-from-step-2>
   HASURA_GRAPHQL_ENABLE_CONSOLE=false
   HASURA_GRAPHQL_ADMIN_SECRET=<generate-strong-secret>
   HASURA_GRAPHQL_UNAUTHORIZED_ROLE=public
   HASURA_GRAPHQL_STRINGIFY_NUMERIC_TYPES=true
   PORT=8080
   ```

6. **Add Healthcheck** (in `hasura/railway.toml` or service settings):

   - Healthcheck Path: `/healthz`
   - Healthcheck Timeout: 100 seconds

7. **Deploy and get URL**:
   - Railway will provide a public URL like: `https://hasura-production.up.railway.app`
   - Your GraphQL endpoint will be: `https://hasura-production.up.railway.app/v1/graphql`

### Step 4: Deploy Envio Indexer

1. In your Railway project, click **"+ New"** → **"GitHub Repo"**
2. Select your PROPHET repository
3. **Configure the service**:

   - **Root Directory**: `indexer`
   - Ensure Railway is using the **Dockerfile build** (not Nixpacks) so the Envio binary is installed correctly.

4. **Configure Environment Variables**:

   ```
   ENVIO_PG_DATABASE_URL=<your-postgres-database-url-from-step-2>
   TUI_OFF=true
   NODE_ENV=production
   SKIP_CODEGEN=1
   ```

   **Why `SKIP_CODEGEN=1`?** Codegen is done during the Docker image build. Skipping it at runtime prevents Railway restarts/timeouts from repeatedly re-running `envio codegen`.

5. **Important**: The indexer is a **background worker** with no HTTP endpoint

   - **No healthcheck needed** (already configured in `railway.toml`)
   - The service will run continuously and index blockchain events

6. **Deploy**: Railway will build using the `Dockerfile` in `indexer/` directory

### Step 5: Update Vercel Environment Variables

1. Go to your Vercel project → Settings → Environment Variables
2. Add:
   ```
   NEXT_PUBLIC_ENVIO_GRAPHQL_URL=https://hasura-production.up.railway.app/v1/graphql
   ```
3. Redeploy your Vercel app

### Step 6: Verify Deployment

1. **Check Hasura is running**:

   ```bash
   curl https://hasura-production.up.railway.app/healthz
   # Should return: {"status":"ok"}
   ```

2. **Test GraphQL endpoint**:

   ```bash
   curl -X POST https://hasura-production.up.railway.app/v1/graphql \
     -H "Content-Type: application/json" \
     -d '{
       "query": "{ Market(limit: 5) { id question totalPool } }"
     }'
   ```

3. **Check indexer logs** (in Railway):
   - Go to your Envio Indexer service → **Deployments** → **View Logs**
   - You should see: `Indexing started...` and event processing logs

---

## Option 2: Render 🎨

Render also supports Docker Compose deployments.

### Step 1: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Deploy PostgreSQL

1. Create a new **PostgreSQL** database
2. Note the connection string (you'll need it later)

### Step 3: Deploy Hasura GraphQL Engine

1. Create a new **Web Service**
2. Connect your GitHub repo
3. Set:

   - **Name**: `prophet-graphql`
   - **Environment**: Docker
   - **Dockerfile Path**: (we'll create one)
   - **Build Command**: (leave empty)
   - **Start Command**: (leave empty)

4. **Environment Variables**:

   ```
   HASURA_GRAPHQL_DATABASE_URL=<your-postgres-connection-string>
   HASURA_GRAPHQL_ENABLE_CONSOLE=false
   HASURA_GRAPHQL_ADMIN_SECRET=<generate-strong-secret>
   HASURA_GRAPHQL_UNAUTHORIZED_ROLE=public
   PORT=8080
   ```

5. **Create Dockerfile** (in `indexer/` directory):

   ```dockerfile
   FROM hasura/graphql-engine:v2.43.0
   ```

6. Deploy and get your URL: `https://prophet-graphql.onrender.com/v1/graphql`

### Step 4: Deploy Envio Indexer

1. Create a new **Background Worker**
2. Connect your GitHub repo
3. Set root directory to `indexer/`
4. **Build Command**: `npm install && npm run codegen`
5. **Start Command**: `npm run dev`
6. **Environment Variables**:
   ```
   ENVIO_PG_DATABASE_URL=<your-postgres-connection-string>
   ```

### Step 5: Update Vercel

Add to Vercel environment variables:

```
NEXT_PUBLIC_ENVIO_GRAPHQL_URL=https://prophet-graphql.onrender.com/v1/graphql
```

---

## Option 3: Fly.io 🪰

Fly.io is great for Docker deployments with global distribution.

### Step 1: Install Fly CLI

```bash
curl -L https://fly.io/install.sh | sh
```

### Step 2: Create Fly App

```bash
cd indexer
fly launch
```

### Step 3: Configure fly.toml

Create `indexer/fly.toml`:

```toml
app = "prophet-indexer"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80
    force_https = true

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

[env]
  HASURA_GRAPHQL_ENABLE_CONSOLE = "false"
  PORT = "8080"
```

### Step 4: Create Dockerfile

Create `indexer/Dockerfile`:

```dockerfile
FROM hasura/graphql-engine:v2.43.0

ENV HASURA_GRAPHQL_ENABLE_CONSOLE=false
ENV PORT=8080
```

### Step 5: Deploy

```bash
fly deploy
```

### Step 6: Get URL

```bash
fly info
# Your URL will be: https://prophet-indexer.fly.dev/v1/graphql
```

---

## Option 4: Envio Hosted Service (If Available) 🎯

If Envio offers a hosted service:

```bash
cd indexer
npm install -g @envio/cli
envio login
envio deploy
```

This will give you a hosted GraphQL endpoint.

---

## Railway Configuration Files

### `indexer/railway.toml` (Already configured)

This file configures the Envio Indexer service:

```toml
[build]
builder = "DOCKERFILE"

[deploy]
startCommand = "npm start"
# No healthcheck - Envio indexer is a background worker without HTTP endpoint
# Healthcheck is only needed for Hasura GraphQL Engine service
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### `indexer/Dockerfile` (Already configured)

Multi-stage Docker build that:

- Installs dependencies
- Downloads `envio` binary
- Runs codegen
- Starts the indexer

---

## Testing Your Deployment

### 1. Test Hasura Health Endpoint

```bash
curl https://hasura-production.up.railway.app/healthz
# Expected: {"status":"ok"}
```

### 2. Test GraphQL Query

```bash
curl -X POST https://hasura-production.up.railway.app/v1/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ Market(limit: 5) { id question totalPool } }"
  }'
```

### 3. Check Indexer Status

In Railway, go to your Envio Indexer service → **Deployments** → **View Logs**:

- Look for: `Indexing started...`
- Look for: `Processing events...`
- No errors should be present

---

## Environment Variables Summary

### For Hasura GraphQL Engine Service (Railway):

```env
HASURA_GRAPHQL_DATABASE_URL=<postgres-connection-url-from-railway>
HASURA_GRAPHQL_ENABLE_CONSOLE=false
HASURA_GRAPHQL_ADMIN_SECRET=<generate-strong-secret>
HASURA_GRAPHQL_UNAUTHORIZED_ROLE=public
HASURA_GRAPHQL_STRINGIFY_NUMERIC_TYPES=true
PORT=8080
```

### For Envio Indexer Service (Railway):

```env
ENVIO_PG_DATABASE_URL=<postgres-connection-url-from-railway>
TUI_OFF=true
NODE_ENV=production
```

**Note**: Railway provides the PostgreSQL connection URL automatically. Copy it from the PostgreSQL service's **Variables** tab.

### For Vercel Frontend:

```env
NEXT_PUBLIC_ENVIO_GRAPHQL_URL=https://hasura-production.up.railway.app/v1/graphql
```

Replace `hasura-production.up.railway.app` with your actual Hasura service URL from Railway.

---

## Troubleshooting

### Healthcheck Failed for Indexer?

**Error**: `1/1 replicas never became healthy!`

**Solution**: The Envio indexer is a background worker without an HTTP endpoint. Healthchecks are disabled in `railway.toml`. This is expected behavior. Only Hasura needs a healthcheck.

### GraphQL endpoint returns 404?

- ✅ Check the URL includes `/v1/graphql`
- ✅ Verify Hasura service is running and healthy (check `/healthz`)
- ✅ Check Railway logs for Hasura service
- ✅ Verify `HASURA_GRAPHQL_DATABASE_URL` is correct

### No data in GraphQL?

- ✅ Verify Envio indexer is running (check Railway logs)
- ✅ Verify indexer is connected to the same database as Hasura
- ✅ Check indexer logs for errors
- ✅ Verify `start_block` in `indexer/config.yaml` is correct
- ✅ Ensure contracts have emitted events
- ✅ Wait a few minutes for initial indexing to complete

### Indexer Build Fails?

**Error**: `npm ci` can only install packages when package.json and package-lock.json are in sync

**Solution**: The Dockerfile uses `npm ci --omit=optional` for root dependencies and `npm install --legacy-peer-deps` for generated dependencies. This is already configured.

**Error**: `envio binary not found`

**Solution**: The Dockerfile explicitly installs `envio@2.30.1` with scripts enabled. This is already configured.

### CORS errors?

Add to Hasura service environment variables:

```
HASURA_GRAPHQL_CORS_DOMAIN=https://your-vercel-app.vercel.app
```

Or allow all origins (for development):

```
HASURA_GRAPHQL_CORS_DOMAIN=*
```

### Indexer not processing events?

1. Check indexer logs in Railway
2. Verify `ENVIO_PG_DATABASE_URL` is correct
3. Verify database connection is working
4. Check `indexer/config.yaml` for correct contract addresses and start block

---

## Recommended Architecture (Railway)

```
┌─────────────────────────────────────────┐
│         Railway Project                 │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  PostgreSQL Database              │  │
│  │  (Managed Service)                │  │
│  └──────────────┬───────────────────┘  │
│                 │                       │
│  ┌──────────────▼───────────────────┐  │
│  │  Hasura GraphQL Engine            │  │
│  │  (Web Service, Port 8080)         │  │
│  │  Healthcheck: /healthz            │  │
│  └──────────────┬───────────────────┘  │
│                 │                       │
│  ┌──────────────▼───────────────────┐  │
│  │  Envio Indexer                   │  │
│  │  (Background Worker)              │  │
│  │  No HTTP endpoint                │  │
│  │  No healthcheck                   │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
         ▲
         │ HTTPS
         │
┌────────┴────────┐
│   Vercel        │
│   (Frontend)    │
└─────────────────┘
```

---

## Quick Start Checklist

1. ✅ Create Railway account and project
2. ✅ Deploy PostgreSQL database (Railway managed)
3. ✅ Deploy Hasura GraphQL Engine service
   - Use `hasura/Dockerfile`
   - Configure environment variables
   - Set healthcheck to `/healthz`
4. ✅ Deploy Envio Indexer service
   - Root directory: `indexer`
   - Railway will use `railway.toml` and `Dockerfile`
   - Configure database connection
5. ✅ Get Hasura GraphQL URL
6. ✅ Add `NEXT_PUBLIC_ENVIO_GRAPHQL_URL` to Vercel
7. ✅ Redeploy Vercel app
8. ✅ Test GraphQL endpoint
9. ✅ Verify indexer is processing events (check logs)

---

## Cost Estimates

- **Railway**: ~$5-20/month (free tier available)
- **Render**: ~$7-25/month (free tier available, but sleeps after inactivity)
- **Fly.io**: ~$5-15/month (free tier available)
- **Envio Hosted**: Check Envio pricing

---

**Need help?** Check the [Railway docs](https://docs.railway.app), [Render docs](https://render.com/docs), or [Fly.io docs](https://fly.io/docs).

---

## Copy/paste env var examples (safe)

### Indexer → Hasura

```env
# IMPORTANT: include https:// and use /v1/metadata (not /v1/graphql)
HASURA_GRAPHQL_ENDPOINT=https://<your-hasura-service>.up.railway.app/v1/metadata
HASURA_GRAPHQL_ADMIN_SECRET=<same secret you set on Hasura>
HASURA_GRAPHQL_ROLE=admin
```

### Indexer → Postgres (Option A: internal Railway networking)

Recommended if your Indexer service is connected to the Postgres service via Railway “Variable Reference”.

```env
ENVIO_PG_HOST=postgres.railway.internal
ENVIO_PG_PORT=5432
ENVIO_PG_USER=<PGUSER>
ENVIO_PG_PASSWORD=<PGPASSWORD>
ENVIO_PG_DATABASE=<PGDATABASE>
ENVIO_PG_SSL_MODE=require
```

### Indexer → Postgres (Option B: public proxy URL)

If you use `DATABASE_PUBLIC_URL`, split it into parts. Example:

`postgresql://USER:PASSWORD@HOST:PORT/DBNAME`

```env
ENVIO_PG_HOST=<HOST>
ENVIO_PG_PORT=<PORT>
ENVIO_PG_USER=<USER>
ENVIO_PG_PASSWORD=<PASSWORD>
ENVIO_PG_DATABASE=<DBNAME>
ENVIO_PG_SSL_MODE=require
```
