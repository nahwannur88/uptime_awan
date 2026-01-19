# Commands to Run After Git Pull on Raspberry Pi

## Quick Answer

After pulling from git on Raspberry Pi, run these commands to ensure all features are up to date:

```bash
# Option 1: Use the automated script (RECOMMENDED)
cd ~/uptime-awan
bash scripts/update-from-git.sh --build

# Option 2: Manual commands
cd ~/uptime-awan
npm install
cd client && npm install && npm run build && cd ..
sudo systemctl restart uptime-awan
```

## Detailed Steps

### Method 1: Automated Script (Easiest)

The project includes an automated update script that handles everything:

```bash
cd ~/uptime-awan
bash scripts/update-from-git.sh --build
```

This script will:
1. ✅ Pull latest changes from git
2. ✅ Check for dependency changes
3. ✅ Reinstall server dependencies (if needed)
4. ✅ Reinstall client dependencies (if needed)
5. ✅ Rebuild the client application
6. ✅ Verify database tables

**After the script completes, restart the service:**
```bash
sudo systemctl restart uptime-awan
```

### Method 2: Manual Commands

If you prefer to run commands manually:

#### Step 1: Navigate to Project Directory
```bash
cd ~/uptime-awan
```

#### Step 2: Pull Latest Changes
```bash
git pull origin main
```

#### Step 3: Reinstall Server Dependencies
```bash
npm install
```

#### Step 4: Reinstall Client Dependencies
```bash
cd client
npm install
cd ..
```

#### Step 5: Rebuild Client Application
```bash
cd client
npm run build
cd ..
```

#### Step 6: Restart the Service
```bash
sudo systemctl restart uptime-awan
```

#### Step 7: Verify Service is Running
```bash
sudo systemctl status uptime-awan
```

## Complete Workflow Example

```bash
# SSH into your Raspberry Pi
ssh pi@192.168.11.170

# Navigate to project
cd ~/uptime-awan

# Pull latest changes
git pull origin main

# Run update script (includes npm install and build)
bash scripts/update-from-git.sh --build

# Restart service
sudo systemctl restart uptime-awan

# Check status
sudo systemctl status uptime-awan

# View logs (optional)
sudo journalctl -u uptime-awan -f
```

## When to Use `--force` Flag

If you want to force reinstall dependencies even if `package.json` hasn't changed:

```bash
bash scripts/update-from-git.sh --force --build
```

## Troubleshooting

### If npm install fails:
```bash
# Remove node_modules and try again
rm -rf node_modules package-lock.json
cd client && rm -rf node_modules package-lock.json && cd ..
npm install
cd client && npm install && cd ..
```

### If build fails:
```bash
cd client
rm -rf node_modules package-lock.json build
npm install
npm run build
cd ..
```

### If service won't start:
```bash
# Check logs
sudo journalctl -u uptime-awan -n 50

# Check if port is in use
sudo lsof -i :3001

# Restart service
sudo systemctl restart uptime-awan
```

## Quick Reference

| Task | Command |
|------|---------|
| Pull from git | `git pull origin main` |
| Update everything (automated) | `bash scripts/update-from-git.sh --build` |
| Reinstall server deps | `npm install` |
| Reinstall client deps | `cd client && npm install && cd ..` |
| Rebuild client | `cd client && npm run build && cd ..` |
| Restart service | `sudo systemctl restart uptime-awan` |
| Check status | `sudo systemctl status uptime-awan` |
| View logs | `sudo journalctl -u uptime-awan -f` |

## Important Notes

1. **Always rebuild the client** after pulling changes that affect the frontend
2. **Restart the service** after updating to load new code
3. **Check service status** to ensure it started successfully
4. **View logs** if something doesn't work as expected

## One-Line Command (For Quick Updates)

```bash
cd ~/uptime-awan && git pull origin main && bash scripts/update-from-git.sh --build && sudo systemctl restart uptime-awan
```
