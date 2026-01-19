# Fix npm install Error on Raspberry Pi

If you're getting this error:
```
npm error 404 'chart.js-node-canvas@^4.1.6' is not in this registry
```

## Solution

The package name was corrected from `chart.js-node-canvas` to `chartjs-node-canvas`. Follow these steps on your Raspberry Pi:

### Step 1: Pull Latest Changes

```bash
cd ~/uptime-awan
git pull origin main
# or
git pull origin master
```

### Step 2: Remove Old Lock Files

```bash
rm -f package-lock.json
rm -rf node_modules
```

### Step 3: Reinstall Dependencies

```bash
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

## Alternative: Manual Fix

If git pull doesn't work, manually fix the package.json:

```bash
nano package.json
```

Find this line:
```json
"chart.js-node-canvas": "^4.1.6",
```

Change it to:
```json
"chartjs-node-canvas": "^4.1.6",
```

Save (Ctrl+X, Y, Enter), then run:
```bash
rm -f package-lock.json
npm install
```
