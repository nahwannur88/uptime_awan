# Accessing Dashboard from Other Computers

Yes! You can access the Uptime Awan Dashboard from any computer, phone, or tablet on the same network.

## Quick Answer

**Yes, you can access the dashboard from another computer!**

Simply use:
```
http://[raspberry-pi-ip-address]:3001
```

## Finding Your Raspberry Pi IP Address

### Method 1: From Raspberry Pi

```bash
hostname -I
```

This will show your IP address, for example: `192.168.1.100`

### Method 2: From Router Admin Panel

1. Log into your router's admin panel (usually `192.168.1.1` or `192.168.0.1`)
2. Look for "Connected Devices" or "DHCP Clients"
3. Find your Raspberry Pi (hostname is usually `raspberrypi`)

### Method 3: Using Network Scanner

On Windows:
```cmd
arp -a | findstr "192.168"
```

On Mac/Linux:
```bash
arp -a | grep "192.168"
```

## Accessing from Another Computer

### On the Same Network (Local Network)

1. **Find Raspberry Pi IP**:
   ```bash
   # On Raspberry Pi
   hostname -I
   # Example output: 192.168.1.100
   ```

2. **Open Browser on Another Computer**:
   ```
   http://192.168.1.100:3001
   ```
   
   Replace `192.168.1.100` with your actual Raspberry Pi IP address.

3. **Bookmark the URL** for easy access!

### From Mobile Devices

Same process - just use the IP address in your mobile browser:
```
http://[raspberry-pi-ip]:3001
```

Works on:
- ✅ iPhone/iPad (Safari, Chrome)
- ✅ Android phones/tablets (Chrome, Firefox)
- ✅ Any device with a web browser

## Firewall Configuration

### If You Can't Access (Firewall Blocking)

Make sure port 3001 is allowed:

```bash
# On Raspberry Pi
sudo ufw allow 3001/tcp
sudo ufw status
```

Or if using iptables:
```bash
sudo iptables -A INPUT -p tcp --dport 3001 -j ACCEPT
```

### Check if Service is Running

```bash
# On Raspberry Pi
sudo systemctl status uptime-awan
```

Should show `active (running)`

## Access from Outside Your Network (Optional)

### Option 1: Port Forwarding (Not Recommended for Security)

1. **Setup Port Forwarding** in your router:
   - External Port: 3001 (or any port)
   - Internal IP: Your Raspberry Pi IP
   - Internal Port: 3001
   - Protocol: TCP

2. **Find Your Public IP**:
   ```bash
   curl ifconfig.me
   ```

3. **Access from anywhere**:
   ```
   http://[your-public-ip]:3001
   ```

⚠️ **Security Warning**: Exposing the dashboard to the internet without authentication is a security risk. Consider adding authentication or using a VPN.

### Option 2: VPN (Recommended)

1. Setup a VPN server on your network
2. Connect to VPN from remote location
3. Access dashboard using local IP address

### Option 3: SSH Tunnel (Secure)

From your remote computer:

```bash
ssh -L 3001:localhost:3001 pi@[raspberry-pi-ip]
```

Then access:
```
http://localhost:3001
```

## Troubleshooting

### Can't Access from Another Computer

1. **Check Raspberry Pi IP**:
   ```bash
   hostname -I
   ```

2. **Verify Service is Running**:
   ```bash
   sudo systemctl status uptime-awan
   ```

3. **Check Firewall**:
   ```bash
   sudo ufw status
   sudo ufw allow 3001/tcp
   ```

4. **Test Connection**:
   ```bash
   # From another computer
   ping [raspberry-pi-ip]
   telnet [raspberry-pi-ip] 3001
   ```

5. **Check Logs**:
   ```bash
   sudo journalctl -u uptime-awan -n 50
   ```

6. **Verify Port is Listening**:
   ```bash
   # On Raspberry Pi
   sudo netstat -tulpn | grep 3001
   # Should show: tcp 0 0 0.0.0.0:3001 LISTEN
   ```

### Connection Refused

- Service might not be running
- Firewall might be blocking
- Wrong IP address

### Timeout

- Devices not on same network
- Firewall blocking connection
- Router blocking local network access

### Works on Pi but Not Other Devices

- Check firewall settings
- Verify IP address is correct
- Ensure both devices on same network

## Network Requirements

### Same Network Access

- ✅ Both devices must be on the same Wi-Fi network
- ✅ Or both connected via Ethernet to same router
- ✅ Firewall must allow port 3001

### Different Networks

- Requires port forwarding or VPN
- Or use SSH tunnel for secure access

## Security Considerations

### For Local Network Access

- ✅ Generally safe on private networks
- ✅ Other devices on your network can access
- ⚠️ Consider adding authentication for sensitive data

### For Internet Access

- ⚠️ **Not recommended** without authentication
- ⚠️ Use VPN or SSH tunnel instead
- ⚠️ Consider adding password protection
- ⚠️ Use HTTPS with SSL certificate

## Quick Test

### From Another Computer

1. Open command prompt/terminal
2. Ping the Raspberry Pi:
   ```bash
   ping [raspberry-pi-ip]
   ```
3. If ping works, try accessing:
   ```
   http://[raspberry-pi-ip]:3001
   ```

## Example Scenarios

### Scenario 1: Laptop on Same Wi-Fi

```
Raspberry Pi IP: 192.168.1.100
Laptop IP: 192.168.1.50

Access from laptop:
http://192.168.1.100:3001
```

### Scenario 2: Phone on Same Network

```
Raspberry Pi IP: 192.168.1.100

Open mobile browser:
http://192.168.1.100:3001
```

### Scenario 3: Remote Access via VPN

```
1. Connect to VPN
2. Use local IP: http://192.168.1.100:3001
```

## Setting a Static IP (Optional)

To avoid IP address changes:

1. **Reserve IP in Router**:
   - Log into router admin
   - Find "DHCP Reservation" or "Static IP"
   - Assign static IP to Raspberry Pi MAC address

2. **Or Configure on Raspberry Pi**:
   ```bash
   sudo nano /etc/dhcpcd.conf
   ```
   
   Add:
   ```
   interface eth0
   static ip_address=192.168.1.100/24
   static routers=192.168.1.1
   static domain_name_servers=192.168.1.1
   ```

## Summary

✅ **Yes, you can access from other computers!**

1. Find Raspberry Pi IP: `hostname -I`
2. Open browser: `http://[ip]:3001`
3. Make sure firewall allows port 3001
4. Both devices must be on same network

That's it! The dashboard is accessible from any device on your network.

---

**Need help?** Check the logs: `sudo journalctl -u uptime-awan -f`
