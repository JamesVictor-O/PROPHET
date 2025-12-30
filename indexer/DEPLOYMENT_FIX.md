# 🔧 Deployment Fix Guide

## Problem

Your deployment is crashing with:
- `ts-node: not found`
- `WARNING: Generated directory not detected. Consider running envio codegen first`

## Solution

I've created several deployment configurations. Choose the one that matches your deployment platform:

---

## Option 1: Railway (Using Nixpacks) ✅ Recommended

Railway will auto-detect `nixpacks.toml` and use it.

### Steps:

1. **Make sure these files are in your `indexer/` directory:**
   - ✅ `nixpacks.toml` (created)
   - ✅ `package.json` (updated with `prestart` and `postinstall`)

2. **In Railway:**
   - Go to your service → Settings
   - Set **Root Directory** to `indexer`
   - Railway will automatically:
     - Run `npm ci`
     - Install generated dependencies
     - Run `npm run codegen`
     - Start with `npm start`

3. **Environment Variables** (add these in Railway):
   ```
   ENVIO_PG_DATABASE_URL=postgres://postgres:password@envio-postgres:5432/envio-prod
   TUI_OFF=true
   NODE_ENV=production
   ```

4. **Deploy!** Railway will handle the build automatically.

---

## Option 2: Railway (Using Docker)

If Railway detects `Dockerfile`, it will use Docker instead.

### Steps:

1. **Make sure `Dockerfile` exists in `indexer/` directory**

2. **In Railway:**
   - Go to your service → Settings
   - Set **Root Directory** to `indexer`
   - Railway will build using the Dockerfile

3. **Environment Variables** (same as above)

---

## Option 3: Render / Fly.io / Other Docker Platforms

Use the `Dockerfile` I created.

### Steps:

1. **Build command:**
   ```bash
   docker build -t prophet-indexer .
   ```

2. **Run command:**
   ```bash
   docker run -p 8080:8080 \
     -e ENVIO_PG_DATABASE_URL=your-connection-string \
     -e TUI_OFF=true \
     prophet-indexer
   ```

---

## What I Fixed

### 1. Updated `package.json`:
- Added `prestart` script: Runs `codegen` before `start`
- Added `postinstall` script: Installs generated dependencies automatically

### 2. Created `Dockerfile`:
- Multi-stage build
- Installs all dependencies (including generated)
- Runs `codegen` during build
- Production-ready image

### 3. Created `nixpacks.toml`:
- Railway-specific build configuration
- Ensures codegen runs before start
- Installs all dependencies

### 4. Created `railway.toml`:
- Alternative Railway configuration
- Explicit build and start commands

---

## Quick Fix for Current Deployment

If you're already deployed and want a quick fix:

### Update Railway Build Command:

1. Go to Railway → Your Service → Settings
2. Find **Build Command** field
3. Set it to:
   ```bash
   npm install && cd generated && npm install && cd .. && npm run codegen
   ```
4. Set **Start Command** to:
   ```bash
   npm start
   ```
5. Redeploy

---

## Verify It Works

After deployment, check logs for:
- ✅ `Running codegen...`
- ✅ `Generated directory detected`
- ✅ `Indexer started successfully`

If you still see errors, check:
1. Are all environment variables set?
2. Is PostgreSQL accessible?
3. Are the generated files present?

---

## Troubleshooting

### Still getting "ts-node: not found"?

The `postinstall` script should install it, but if not:

1. Check Railway logs during build
2. Verify `generated/node_modules` exists
3. Manually add to build command:
   ```bash
   npm install && cd generated && npm install && cd .. && npm run codegen
   ```

### Still getting "Generated directory not detected"?

1. Check that `codegen` ran successfully
2. Verify `generated/` directory exists in the build
3. Check Railway build logs for codegen output

### Indexer crashes immediately?

1. Check PostgreSQL connection string
2. Verify environment variables are set
3. Check `config.yaml` is correct
4. Review indexer logs for specific errors

---

## Next Steps

1. ✅ Commit the new files I created
2. ✅ Push to your repository
3. ✅ Update Railway build/start commands (if needed)
4. ✅ Redeploy
5. ✅ Check logs to verify it's working

---

**The key fix:** `prestart` script ensures `codegen` runs before `start`, and `postinstall` ensures `ts-node` is installed in the generated directory.

