# How to Pull Latest Changes from Git

## On Your Local Machine (Windows)

### If you haven't committed your changes yet:

```bash
# Check what files have changed
git status

# If you want to keep your changes, commit them first
git add .
git commit -m "Your commit message"

# Then pull
git pull origin main
# or
git pull origin master
```

### If you want to discard local changes and get latest:

```bash
# Discard all local changes
git reset --hard

# Pull latest changes
git pull origin main
# or
git pull origin master
```

### If you want to stash your changes temporarily:

```bash
# Save your changes temporarily
git stash

# Pull latest changes
git pull origin main

# Restore your changes
git stash pop
```

---

## On Your Raspberry Pi

### Step 1: Navigate to Project Directory

```bash
cd ~/uptime-awan
```

### Step 2: Check Current Status

```bash
git status
```

### Step 3: Pull Latest Changes

```bash
# If you're on main branch
git pull origin main

# If you're on master branch
git pull origin master

# Or just pull from current branch
git pull
```

### Step 4: If You Have Local Changes

**Option A: Commit and Pull**
```bash
git add .
git commit -m "Local changes"
git pull origin main
```

**Option B: Discard Local Changes (if you don't need them)**
```bash
git reset --hard
git pull origin main
```

**Option C: Stash Changes**
```bash
git stash
git pull origin main
git stash pop
```

### Step 5: After Pulling - Reinstall Dependencies (if package.json changed)

```bash
# Remove old lock files
rm -f package-lock.json
rm -rf node_modules

# Reinstall
npm install

# If client dependencies changed
cd client
rm -f package-lock.json
rm -rf node_modules
npm install
cd ..
```

---

## Common Git Pull Scenarios

### Scenario 1: Simple Pull (No Conflicts)

```bash
git pull origin main
```

### Scenario 2: Pull with Merge Conflicts

```bash
git pull origin main
# If conflicts occur:
# 1. Edit the conflicted files
# 2. git add <file>
# 3. git commit
```

### Scenario 3: Force Pull (Overwrite Local Changes)

```bash
# WARNING: This will discard all local changes!
git fetch origin
git reset --hard origin/main
```

### Scenario 4: Pull Specific Branch

```bash
# Switch to branch
git checkout branch-name

# Pull that branch
git pull origin branch-name
```

---

## Troubleshooting

### Error: "Your local changes would be overwritten"

**Solution 1: Commit your changes**
```bash
git add .
git commit -m "Save local changes"
git pull origin main
```

**Solution 2: Stash your changes**
```bash
git stash
git pull origin main
git stash pop
```

**Solution 3: Discard local changes (if not needed)**
```bash
git reset --hard
git pull origin main
```

### Error: "fatal: refusing to merge unrelated histories"

```bash
git pull origin main --allow-unrelated-histories
```

### Error: "Updates were rejected because the remote contains work"

```bash
# Fetch and merge
git fetch origin
git merge origin/main

# Or rebase
git pull --rebase origin main
```

---

## Quick Reference

```bash
# Check current branch
git branch

# Check status
git status

# Pull latest changes
git pull origin main

# View recent commits
git log --oneline -5

# Check what changed
git diff
```
