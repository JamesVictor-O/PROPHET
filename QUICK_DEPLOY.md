# ⚡ Quick Deploy Guide - 5 Minutes

## Deploy Envio Indexer to Railway (Easiest Method)

### Step 1: Sign up for Railway (2 min)

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Sign in with GitHub
4. Click "Deploy from GitHub repo"
5. Select your PROPHET repository

### Step 2: Configure Service (2 min)

1. **Select the `indexer` directory** as the root
2. Railway will auto-detect the Docker Compose file
3. Click "Deploy"

### Step 3: Set Environment Variables (1 min)

Go to your Railway project → Variables tab, add:

```env
ENVIO_PG_PASSWORD=your-strong-password-here
HASURA_GRAPHQL_ADMIN_SECRET=your-strong-secret-here
HASURA_GRAPHQL_ENABLE_CONSOLE=false
```

**Generate passwords:**

```bash
# On Mac/Linux:
openssl rand -base64 32

# Or use: https://www.lastpass.com/features/password-generator
```

### Step 4: Get Your GraphQL URL

1. Go to your Railway project → Settings → Domains
2. Railway provides a public URL automatically
3. Your GraphQL endpoint: `https://your-app.up.railway.app/v1/graphql`

### Step 5: Update Vercel

1. Go to Vercel → Your Project → Settings → Environment Variables
2. Add:
   ```
   NEXT_PUBLIC_ENVIO_GRAPHQL_URL=https://your-app.up.railway.app/v1/graphql
   ```
3. Click "Save"
4. Go to Deployments → Click "..." → "Redeploy"

### Step 6: Test

Visit your Vercel app and check the browser console. You should see GraphQL queries working!

---

## Alternative: One-Click Deploy with Render

### Step 1: Create PostgreSQL Database

1. Go to [render.com](https://render.com)
2. New → PostgreSQL
3. Name: `prophet-db`
4. Create database
5. Copy the **Internal Database URL**

### Step 2: Deploy Hasura GraphQL

1. New → Web Service
2. Connect GitHub repo
3. Settings:

   - **Name**: `prophet-graphql`
   - **Root Directory**: `indexer`
   - **Environment**: Docker
   - **Dockerfile Path**: (create one, see below)

4. **Create `indexer/Dockerfile`**:

   ```dockerfile
   FROM hasura/graphql-engine:v2.43.0
   ```

5. **Environment Variables**:

   ```
   HASURA_GRAPHQL_DATABASE_URL=<paste-internal-database-url>
   HASURA_GRAPHQL_ENABLE_CONSOLE=false
   HASURA_GRAPHQL_ADMIN_SECRET=<generate-secret>
   HASURA_GRAPHQL_UNAUTHORIZED_ROLE=public
   PORT=8080
   ```

6. Deploy and get URL: `https://prophet-graphql.onrender.com/v1/graphql`

### Step 3: Deploy Envio Indexer

1. New → Background Worker
2. Connect GitHub repo
3. Settings:

   - **Root Directory**: `indexer`
   - **Build Command**: `npm install && npm run codegen`
   - **Start Command**: `npm run dev`

4. **Environment Variables**:
   ```
   ENVIO_PG_DATABASE_URL=<same-internal-database-url>
   ```

### Step 4: Update Vercel

Same as Railway - add `NEXT_PUBLIC_ENVIO_GRAPHQL_URL` to Vercel environment variables.

---

## Troubleshooting

### Railway deployment fails?

- ✅ Check that Docker is properly configured in Railway
- ✅ Verify environment variables are set
- ✅ Check Railway logs for errors

### GraphQL returns empty data?

- ✅ Wait 5-10 minutes for indexer to sync
- ✅ Check Envio indexer logs in Railway
- ✅ Verify `start_block` in `config.yaml` matches your contract deployment block

### CORS errors?

Add to Railway environment variables:

```
HASURA_GRAPHQL_CORS_DOMAIN=https://your-vercel-app.vercel.app,https://*.vercel.app
```

---

## Cost

- **Railway**: Free tier includes $5 credit/month
- **Render**: Free tier (sleeps after 15 min inactivity)
- **Total**: ~$0-10/month for small projects

---

**That's it!** Your Envio indexer should now be accessible from Vercel. 🎉
