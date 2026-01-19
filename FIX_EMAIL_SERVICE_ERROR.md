# Fix "Cannot find module 'chart.js-node-canvas'" Error

## Problem

You're getting this error when starting the server:
```
Error: Cannot find module 'chart.js-node-canvas'
```

This happens because your Raspberry Pi has an old version of `server/services/email.js` that's trying to require the wrong package name.

## Solution

### Step 1: Pull Latest Changes from Git

On your Raspberry Pi:

```bash
cd ~/uptime-awan
git pull origin main
# or if your branch is master:
# git pull origin master
```

### Step 2: If Git Pull Doesn't Work - Manual Fix

If git says "Already up to date" but you still have the error, manually fix the file:

```bash
cd ~/uptime-awan
nano server/services/email.js
```

Find this line (around line 4):
```javascript
ChartJSNodeCanvas = require('chart.js-node-canvas');
```

Change it to:
```javascript
ChartJSNodeCanvas = require('chartjs-node-canvas');
```

**Important:** Remove the dot between `chart` and `js`!

Save: `Ctrl+X`, then `Y`, then `Enter`

### Step 3: Quick One-Liner Fix (Alternative)

If you prefer a quick fix without editing:

```bash
cd ~/uptime-awan

# Fix the require statement in email.js
sed -i "s/require('chart\.js-node-canvas')/require('chartjs-node-canvas')/g" server/services/email.js

# Verify the fix
grep "chartjs-node-canvas" server/services/email.js
```

Should show:
```javascript
ChartJSNodeCanvas = require('chartjs-node-canvas');
```

### Step 4: Verify package.json is Also Correct

Make sure `package.json` also has the correct name:

```bash
grep "chartjs-node-canvas" package.json
```

Should show:
```json
"chartjs-node-canvas": "^4.1.6",
```

If it shows `chart.js-node-canvas`, fix it:
```bash
sed -i 's/"chart\.js-node-canvas"/"chartjs-node-canvas"/g' package.json
```

### Step 5: Reinstall Dependencies (If Needed)

If you fixed package.json, reinstall:

```bash
rm -f package-lock.json
rm -rf node_modules
npm install
```

### Step 6: Start the Server

```bash
NODE_ENV=production node server/index.js
```

Or if using systemd:
```bash
sudo systemctl restart uptime-awan
```

## Complete Fix Script

Run this to fix everything at once:

```bash
cd ~/uptime-awan

# Fix package.json
sed -i 's/"chart\.js-node-canvas"/"chartjs-node-canvas"/g' package.json

# Fix email.js
sed -i "s/require('chart\.js-node-canvas')/require('chartjs-node-canvas')/g" server/services/email.js
sed -i 's/require("chart\.js-node-canvas")/require("chartjs-node-canvas")/g' server/services/email.js

# Verify fixes
echo "=== package.json ==="
grep "chartjs-node-canvas" package.json
echo ""
echo "=== email.js ==="
grep "chartjs-node-canvas" server/services/email.js

# Reinstall if package.json was changed
if grep -q '"chartjs-node-canvas"' package.json; then
    echo "Reinstalling dependencies..."
    rm -f package-lock.json
    rm -rf node_modules
    npm install
fi
```

## Why This Happened

The package name was corrected from `chart.js-node-canvas` to `chartjs-node-canvas` (removed the dot). Your Raspberry Pi still has the old version of the code that needs to be updated.

## Verification

After fixing, verify everything is correct:

```bash
# Check package.json
grep "chartjs-node-canvas" package.json

# Check email.js
grep "chartjs-node-canvas" server/services/email.js

# Check if package is installed
ls node_modules | grep chartjs
```

## If Still Having Issues

1. **Check git status:**
   ```bash
   git status
   git log --oneline -5
   ```

2. **Force pull latest (WARNING: Discards local changes):**
   ```bash
   git fetch origin
   git reset --hard origin/main
   ```

3. **Then reinstall:**
   ```bash
   rm -f package-lock.json
   rm -rf node_modules
   npm install
   ```

4. **Start server:**
   ```bash
   NODE_ENV=production node server/index.js
   ```
