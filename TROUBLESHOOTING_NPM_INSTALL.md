# Troubleshooting npm install Failures

Common solutions for npm install issues, especially on Raspberry Pi.

## Quick Fixes

### 1. Clear npm Cache

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 2. Install Build Tools (Required for native modules)

```bash
sudo apt update
sudo apt install -y build-essential python3
```

### 3. Update Node.js and npm

```bash
# Check current versions
node --version
npm --version

# If outdated, reinstall Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

## Common Errors and Solutions

### Error: Canvas Module Fails

**Error message:**
```
Error: Cannot find module 'canvas'
or
gyp ERR! build error
```

**Solution:**

```bash
# Install canvas dependencies
sudo apt install -y \
  build-essential \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev

# Clear and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Error: sqlite3 Build Fails

**Error message:**
```
node-gyp rebuild
ERR! stack Error: `make` failed
```

**Solution:**

```bash
# Install build dependencies
sudo apt install -y build-essential python3

# Rebuild sqlite3
npm rebuild sqlite3

# Or reinstall
rm -rf node_modules
npm install
```

### Error: Out of Memory

**Error message:**
```
FATAL ERROR: Reached heap limit
Killed
```

**Solution:**

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=2048"

# Then install
npm install

# Or install one package at a time
npm install express
npm install ws
npm install sqlite3
# ... continue with other packages
```

### Error: Permission Denied

**Error message:**
```
EACCES: permission denied
```

**Solution:**

```bash
# Fix npm permissions (if needed)
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Or use sudo (not recommended, but works)
sudo npm install
```

### Error: Python Not Found

**Error message:**
```
gyp ERR! stack Error: Can't find Python executable
```

**Solution:**

```bash
# Install Python
sudo apt install -y python3 python3-pip

# Create symlink (if needed)
sudo ln -s /usr/bin/python3 /usr/bin/python

# Verify
python --version
```

### Error: Network/Timeout Issues

**Error message:**
```
ETIMEDOUT
ENOTFOUND
```

**Solution:**

```bash
# Use different registry (if npmjs.org is slow)
npm config set registry https://registry.npmjs.org/

# Increase timeout
npm config set fetch-timeout 60000
npm config set fetch-retries 5

# Try again
npm install
```

### Error: Node Version Incompatible

**Error message:**
```
The engine "node" is incompatible
```

**Solution:**

```bash
# Check Node.js version
node --version

# Should be v16.x or v18.x
# If not, install Node.js 18.x:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should show v18.x.x
npm --version
```

## Step-by-Step Recovery

### Complete Clean Install

```bash
# 1. Remove everything
cd /home/pi/uptime-awan
rm -rf node_modules package-lock.json
rm -rf client/node_modules client/package-lock.json

# 2. Clear caches
npm cache clean --force

# 3. Install system dependencies
sudo apt update
sudo apt install -y \
  build-essential \
  python3 \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev

# 4. Verify Node.js
node --version  # Should be v16+ or v18+
npm --version

# 5. Install server dependencies
npm install

# 6. Install client dependencies
cd client
npm install
cd ..
```

## Raspberry Pi Specific Issues

### Low Memory During Build

If you have 2GB RAM or less:

```bash
# Create swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Now try npm install
npm install
```

### Slow Installation

On Raspberry Pi, npm install can take 10-20 minutes. Be patient!

```bash
# Install with verbose output to see progress
npm install --verbose

# Or install in background
nohup npm install > install.log 2>&1 &
tail -f install.log
```

## Alternative: Install Dependencies One by One

If bulk install fails, install critical packages first:

```bash
# Core dependencies
npm install express
npm install ws
npm install sqlite3
npm install axios
npm install node-cron
npm install speedtest-net
npm install cors
npm install dotenv

# Email dependencies
npm install nodemailer
npm install chart.js-node-canvas
npm install canvas

# Dev dependencies (optional)
npm install --save-dev nodemon concurrently
```

## Check What Failed

### Get Detailed Error

```bash
# Install with verbose logging
npm install --loglevel=verbose 2>&1 | tee install.log

# Check the log
cat install.log | grep -i error
```

### Check Specific Package

```bash
# Try installing problematic package separately
npm install canvas --verbose
npm install sqlite3 --verbose
```

## Verify Installation

After successful install:

```bash
# Check installed packages
npm list --depth=0

# Should show all dependencies
# If any are missing, install them individually
```

## Still Having Issues?

### Get System Info

```bash
# Collect information for troubleshooting
echo "=== System Info ===" > debug.txt
uname -a >> debug.txt
node --version >> debug.txt
npm --version >> debug.txt
python3 --version >> debug.txt
free -h >> debug.txt
df -h >> debug.txt

echo "=== npm config ===" >> debug.txt
npm config list >> debug.txt

cat debug.txt
```

### Common Solutions Summary

1. ✅ Install build tools: `sudo apt install -y build-essential python3`
2. ✅ Install canvas deps: `sudo apt install -y libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`
3. ✅ Clear cache: `npm cache clean --force`
4. ✅ Remove node_modules: `rm -rf node_modules package-lock.json`
5. ✅ Check Node version: `node --version` (should be 16+ or 18+)
6. ✅ Increase memory: `export NODE_OPTIONS="--max-old-space-size=2048"`
7. ✅ Be patient - Raspberry Pi is slow but will complete

## Quick Diagnostic Script

Run this to check your environment:

```bash
#!/bin/bash
echo "=== Environment Check ==="
echo "Node.js: $(node --version 2>/dev/null || echo 'NOT INSTALLED')"
echo "npm: $(npm --version 2>/dev/null || echo 'NOT INSTALLED')"
echo "Python: $(python3 --version 2>/dev/null || echo 'NOT INSTALLED')"
echo "Build tools: $(which make 2>/dev/null && echo 'INSTALLED' || echo 'NOT INSTALLED')"
echo "Memory: $(free -h | grep Mem | awk '{print $2}')"
echo "Disk space: $(df -h / | tail -1 | awk '{print $4}')"
```

Save as `check-env.sh`, then:
```bash
chmod +x check-env.sh
./check-env.sh
```

---

**Share the exact error message** you're seeing for more specific help!
