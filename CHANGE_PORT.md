# How to Run on a Different Port

## Quick Answer

Set the `PORT` environment variable before running:

### Windows (PowerShell)
```powershell
$env:PORT=3002; npm start
```

### Windows (CMD)
```cmd
set PORT=3002 && npm start
```

### Linux/Mac/Raspberry Pi
```bash
PORT=3002 npm start
```

### For Development Mode
```bash
PORT=3002 npm run dev
```

## Methods

### Method 1: Environment Variable (Temporary)

**Windows PowerShell:**
```powershell
$env:PORT=3002
npm start
```

**Windows CMD:**
```cmd
set PORT=3002
npm start
```

**Linux/Mac/Raspberry Pi:**
```bash
export PORT=3002
npm start
```

### Method 2: One-Line Command

**Windows PowerShell:**
```powershell
$env:PORT=3002; npm start
```

**Windows CMD:**
```cmd
set PORT=3002 && npm start
```

**Linux/Mac/Raspberry Pi:**
```bash
PORT=3002 npm start
```

### Method 3: Edit .env File (Permanent)

1. Open `.env` file (or create from `.env.example`)
2. Change the PORT value:
   ```env
   PORT=3002
   ```
3. Save and run:
   ```bash
   npm start
   ```

### Method 4: Command Line Argument (Node.js)

You can also modify `server/index.js` temporarily, or use:

**Windows PowerShell:**
```powershell
$env:PORT=3002; node server/index.js
```

**Linux/Mac/Raspberry Pi:**
```bash
PORT=3002 node server/index.js
```

## Examples

### Run on Port 3002
```bash
PORT=3002 npm start
```

### Run on Port 8080
```bash
PORT=8080 npm start
```

### Run on Port 5000
```bash
PORT=5000 npm start
```

## For Development Mode

### Windows PowerShell:
```powershell
$env:PORT=3002; npm run dev
```

### Linux/Mac/Raspberry Pi:
```bash
PORT=3002 npm run dev
```

## Access the Dashboard

After starting on a different port, access it at:
```
http://localhost:3002
```

Or if on Raspberry Pi:
```
http://192.168.11.170:3002
```

## Important Notes

1. **Default Port**: If PORT is not set, it defaults to `3001`
2. **Frontend Proxy**: In development mode, the React dev server (port 3000) proxies to the backend. If you change the backend port, you may need to update the proxy in `client/package.json`
3. **Production**: In production, the React app is built and served by the same server, so changing PORT affects both
4. **Firewall**: If running on a different port, make sure your firewall allows that port

## Update React Dev Server Proxy (If Needed)

If you change the backend port in development, update `client/package.json`:

```json
"proxy": "http://localhost:3002"
```

Then restart the dev server.

## For Raspberry Pi Service

If you want to change the port permanently for the systemd service:

1. Edit the service file:
   ```bash
   sudo nano /etc/systemd/system/uptime-awan.service
   ```

2. Add Environment variable:
   ```ini
   [Service]
   Environment="PORT=3002"
   ```

3. Reload and restart:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart uptime-awan
   ```

## Quick Reference

| Platform | Command |
|----------|---------|
| Windows PowerShell | `$env:PORT=3002; npm start` |
| Windows CMD | `set PORT=3002 && npm start` |
| Linux/Mac | `PORT=3002 npm start` |
| Raspberry Pi | `PORT=3002 npm start` |
