# Fix chart.js-node-canvas Error on Raspberry Pi

## Problem

You're getting this error:
```
npm error 404 'chart.js-node-canvas@^4.1.6' is not in this registry
```

This happens because your Raspberry Pi has an old `package.json` with the wrong package name.

## Solution

### Step 1: Pull Latest Changes from Git

On your Raspberry Pi, run:

```bash
cd ~/uptime-awan

# Pull the latest changes
git pull origin main
# or if your branch is master:
# git pull origin master
```

### Step 2: If Git Pull Doesn't Work (No Changes)

If git says "Already up to date" but you still have the error, manually fix `package.json`:

```bash
cd ~/uptime-awan
nano package.json
```

Find this line (around line 26):
```json
"chart.js-node-canvas": "^4.1.6",
```

Change it to:
```json
"chartjs-node-canvas": "^4.1.6",
```

**Important:** Remove the dot between `chart` and `js`!

Save: `Ctrl+X`, then `Y`, then `Enter`

### Step 3: Clean and Reinstall

```bash
# Remove old lock files and node_modules
rm -f package-lock.json
rm -rf node_modules

# Reinstall dependencies
npm install
```

### Step 4: Install Client Dependencies

```bash
cd client
rm -f package-lock.json
rm -rf node_modules
npm install
cd ..
```

### Step 5: Build Client

```bash
cd client
npm run build
cd ..
```

## Quick One-Liner Fix

If you want to fix it quickly without editing manually:

```bash
cd ~/uptime-awan

# Fix package.json
sed -i 's/"chart\.js-node-canvas"/"chartjs-node-canvas"/g' package.json

# Clean and reinstall
rm -f package-lock.json
rm -rf node_modules
npm install
```

## Verify the Fix

Check that the package name is correct:

```bash
grep "chartjs-node-canvas" package.json
```

Should show:
```json
"chartjs-node-canvas": "^4.1.6",
```

## Why This Happened

The package name was corrected from `chart.js-node-canvas` to `chartjs-node-canvas` (removed the dot). Your Raspberry Pi still has the old version of `package.json` that needs to be updated.

## After Fixing

Once `npm install` completes successfully, you can:

1. **Restart the service** (if it's running):
   ```bash
   sudo systemctl restart uptime-awan
   ```

2. **Or start the application**:
   ```bash
   NODE_ENV=production node server/index.js
   ```

## Still Having Issues?

If you continue to have problems:

1. **Check your git status**:
   ```bash
   git status
   git log --oneline -5
   ```

2. **Verify you're on the right branch**:
   ```bash
   git branch
   ```

3. **Force pull latest changes** (WARNING: This discards local changes):
   ```bash
   git fetch origin
   git reset --hard origin/main
   ```

4. **Then reinstall**:
   ```bash
   rm -f package-lock.json
   rm -rf node_modules
   npm install
   ```
