# Local Development Setup: Custom Domain (mjrp.local)

**Created**: 2025-12-19
**Purpose**: Unified OAuth development for Spotify + Apple Music

---

## Why This Is Needed

Both Spotify and Apple Music require redirect URIs for OAuth:
- **Spotify** (2024+): Blocks `localhost`, only accepts IP or custom domains
- **Apple Music**: Works with `localhost` but also accepts custom domains

Using a **custom local domain** (`mjrp.local`) solves both:
- ✅ Single URL for all services
- ✅ Unified localStorage/cookies (no session splits)
- ✅ Same experience as production

---

## Setup Instructions

### Windows (Required once per machine)

1. **Open Notepad as Administrator**:
   - Right-click Notepad → "Run as administrator"

2. **Open the hosts file**:
   - File → Open → Navigate to: `C:\Windows\System32\drivers\etc\hosts`
   - (Change file filter to "All Files (*.*)" to see it)

3. **Add this line at the end**:
   ```
   127.0.0.1   mjrp.local
   ```

4. **Save and close**

5. **Verify**: Open terminal and run `ping mjrp.local` - should resolve to 127.0.0.1

---

### macOS (Required once per machine)

1. **Open Terminal**

2. **Edit hosts file**:
   ```bash
   sudo nano /etc/hosts
   ```

3. **Add this line at the end**:
   ```
   127.0.0.1   mjrp.local
   ```

4. **Save**: `Ctrl+O`, `Enter`, then `Ctrl+X` to exit

5. **Flush DNS cache**:
   ```bash
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   ```

6. **Verify**: `ping mjrp.local` - should resolve to 127.0.0.1

---

## OAuth Dashboard Configuration

### Spotify Developer Dashboard
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Select your app → Edit Settings
3. In "Redirect URIs", add:
   ```
   http://mjrp.local:5000/callback
   ```
4. Click "Add", then **SAVE** at the bottom

### Apple Developer (if applicable)
1. Configure your MusicKit identifier
2. Add redirect URI:
   ```
   http://mjrp.local:5000/callback
   ```

---

## Running the App

After hosts file setup:

```bash
# Terminal 1: Backend
cd server && node index.js

# Terminal 2: Frontend
npm run dev
```

Access: **http://mjrp.local:5000**

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "mjrp.local not found" | Check hosts file entry, flush DNS |
| "Connection refused" | Vite not running or wrong port |
| "Invalid redirect URI" | Update OAuth dashboard with exact URI |
| Spotify still says invalid | Make sure you clicked SAVE in dashboard |

---

## For Other Developers / Agents

**Why this setup is required**:

The `vite.config.js` uses `host: 'mjrp.local'` which tells Vite to bind to that hostname. Without the hosts file entry, your OS won't know where `mjrp.local` points to.

This is a **local alias** - it doesn't require internet and only affects the local machine.
