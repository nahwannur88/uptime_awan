# Sync Development and Raspberry Pi Dashboard

## Problem

Development dashboard (localhost:3000) and Raspberry Pi dashboard (192.168.11.170:3001) show different data.

## Common Causes

### 1. Different Databases

**Development:** Uses `./data/uptime.db` on your Windows machine
**Raspberry Pi:** Uses `/home/pi/uptime-awan/data/uptime.db` on the Pi

These are **separate databases**, so they will have different data.

### 2. Client Not Built on Pi

The Pi needs the React client to be built before it can serve it.

### 3. Old Code on Pi

The Pi might be running an older version of the code.

## Solutions

### Solution 1: Build Client on Raspberry Pi

The Pi needs to build the React app to serve it:

```bash
# SSH into Raspberry Pi
ssh pi@192.168.11.170

# Navigate to project
cd ~/uptime-awan

# Pull latest changes
git pull origin main

# Build the client
cd client
npm install
npm run build
cd ..

# Restart service
sudo systemctl restart uptime-awan
```

### Solution 2: Update and Rebuild on Pi

Use the update script:

```bash
cd ~/uptime-awan
chmod +x scripts/update-from-git.sh
./scripts/update-from-git.sh --build
```

### Solution 3: Copy Database (If You Want Same Data)

If you want the Pi to have the same monitors as dev:

**Option A: Export/Import Monitors via API**

On your dev machine, export monitors:
```bash
curl http://localhost:3001/api/monitors > monitors.json
```

On Pi, import them (you'd need to create an import script or add them manually via UI).

**Option B: Copy Database File**

⚠️ **Warning:** This will replace Pi's database with dev database.

```bash
# On your dev machine (Windows)
# Copy data/uptime.db to Pi
scp data/uptime.db pi@192.168.11.170:/home/pi/uptime-awan/data/uptime.db

# On Pi, fix permissions
ssh pi@192.168.11.170
cd ~/uptime-awan
sudo chown pi:pi data/uptime.db
sudo systemctl restart uptime-awan
```

### Solution 4: Verify Pi is Running Latest Code

```bash
# SSH into Pi
ssh pi@192.168.11.170
cd ~/uptime-awan

# Check git status
git status
git log --oneline -5

# Check if client is built
ls -la client/build

# If build folder doesn't exist or is old, rebuild:
cd client
npm run build
cd ..

# Restart service
sudo systemctl restart uptime-awan
```

## Quick Fix Checklist

Run these on your Raspberry Pi:

```bash
cd ~/uptime-awan

# 1. Pull latest code
git pull origin main

# 2. Rebuild client
cd client
rm -rf build node_modules
npm install
npm run build
cd ..

# 3. Restart service
sudo systemctl restart uptime-awan

# 4. Check status
sudo systemctl status uptime-awan

# 5. View logs
sudo journalctl -u uptime-awan -f
```

## Expected Behavior

### Development (localhost:3000)
- Uses React dev server (port 3000)
- Hot reload enabled
- Uses local database: `./data/uptime.db`
- Shows data from your local database

### Production (Raspberry Pi - 192.168.11.170:3001)
- Serves built React app from `client/build`
- Uses Pi database: `/home/pi/uptime-awan/data/uptime.db`
- Shows data from Pi's database
- No hot reload

## They Should Match If:

1. ✅ Both have latest code
2. ✅ Pi has client built (`client/build` exists)
3. ✅ Both databases have same data (or you accept they're different)
4. ✅ Pi service is restarted after updates

## Most Likely Issue

Based on your screenshots:
- **Dev:** Has 13 monitors, speed test data ✅
- **Pi:** Has 0 monitors, no data ❌

**The Pi likely:**
1. Doesn't have the client built, OR
2. Has an empty database, OR
3. Is running old code

**Fix:** Run the Quick Fix Checklist above on your Pi.
