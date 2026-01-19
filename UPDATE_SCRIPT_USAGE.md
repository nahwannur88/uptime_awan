# Update Script Usage Guide

Scripts to automatically pull latest changes from git and reinstall npm dependencies.

## For Raspberry Pi / Linux

### Basic Usage

```bash
cd ~/uptime-awan
chmod +x scripts/update-from-git.sh
./scripts/update-from-git.sh
```

### Options

```bash
# Force reinstall even if package.json didn't change
./scripts/update-from-git.sh --force

# Force rebuild client application
./scripts/update-from-git.sh --build

bash scripts/update-from-git.sh --build
```

### What It Does

1. ✅ Checks for uncommitted changes (offers to stash)
2. ✅ Pulls latest changes from git
3. ✅ Detects if package.json changed
4. ✅ Reinstalls server dependencies (if changed or --force)
5. ✅ Reinstalls client dependencies (if changed or --force)
6. ✅ Rebuilds client (if in production or --build)
7. ✅ Verifies database tables
8. ✅ Restores stashed changes (if any)

### Example Output

```
==========================================
Uptime Awan - Update from Git
==========================================

Current branch: main

Step 1: Checking for uncommitted changes...
Step 2: Pulling latest changes from git...
✓ Successfully pulled latest changes

Step 3: Checking for dependency changes...
package.json has changed - dependencies need to be reinstalled

Step 4: Reinstalling server dependencies...
Removing old node_modules and package-lock.json...
Installing dependencies (this may take a few minutes)...
✓ Server dependencies installed successfully

Step 5: Reinstalling client dependencies...
✓ Client dependencies installed successfully

Step 6: Rebuilding client application...
✓ Client application rebuilt successfully

Step 7: Verifying database tables...
✓ Database tables verified

==========================================
Update Complete!
==========================================

Next steps:
1. Restart the service:
   sudo systemctl restart uptime-awan
```

## For Windows Development

### Basic Usage

```powershell
cd I:\uptime_awan
.\scripts\update-from-git.ps1
```

### Options

```powershell
# Force reinstall
.\scripts\update-from-git.ps1 -Force

# Force rebuild
.\scripts\update-from-git.ps1 -Build

# Both
.\scripts\update-from-git.ps1 -Force -Build
```

## After Update

### On Raspberry Pi

```bash
# Restart the service
sudo systemctl restart uptime-awan

# Check status
sudo systemctl status uptime-awan

# View logs
sudo journalctl -u uptime-awan -f
```

### On Windows (Development)

```bash
# Restart development server
npm run dev
```

## Troubleshooting

### Uncommitted Changes

If you have uncommitted changes:
- **Option 1:** Stash them (script will ask)
- **Option 2:** Commit them first: `git commit -am "My changes"`
- **Option 3:** Discard them: `git reset --hard`

### Failed to Pull

If git pull fails:
- Check your internet connection
- Verify you're on the correct branch
- Check for merge conflicts

### npm install Fails

If npm install fails:
- Check Node.js version: `node --version` (should be 22.x or 24.x)
- Clear npm cache: `npm cache clean --force`
- Try manual install: `npm install`

### Database Issues

If database tables are missing:
```bash
node scripts/fix-tables-node.js
```

## Quick Update Command

Add to your `.bashrc` or `.zshrc` for easy access:

```bash
alias uptime-update='cd ~/uptime-awan && ./scripts/update-from-git.sh'
```

Then just run:
```bash
uptime-update
```

## Safety Features

- ✅ Checks for uncommitted changes before pulling
- ✅ Offers to stash changes automatically
- ✅ Only reinstalls if package.json changed (unless --force)
- ✅ Verifies database tables after update
- ✅ Provides clear error messages
- ✅ Restores stashed changes after update
