# Port Configuration Reference

**Last Updated**: 2025-12-06  
**Purpose**: Definitive guide to prevent port confusion

---

## 🚨 CRITICAL: This Project Does NOT Use Port 5173

> [!CAUTION]
> **Port 5173 is the Vite default but is NOT configured in this project**.
> Always use the ports documented below.

---

## Port Configuration

| Port | Purpose | Configuration | npm Command |
|------|---------|---------------|-------------|
| **5000** | Dev Server (Primary) | `vite.config.js:30` | `npm run dev` |
| **5005** | Preview Server (E2E Tests) | `test/e2e/helpers.js:6` | `npm run preview` |
| **3000** | Backend API Proxy | `server/index.js` | `cd server && node index.js` |

---

## Why Not 5173?

**5173 is Vite's default port** when no configuration exists. This project explicitly sets port **5000** in `vite.config.js`:

```javascript
// vite.config.js line 29-30
server: {
    port: 5000,  // ← Explicitly set, NOT 5173
```

**If you see 5173**, something is wrong:
1. ❌ `vite.config.js` is not being read
2. ❌ Running Vite from wrong directory
3. ❌ Configuration syntax error

---

## Development Workflow

### Local Development
```bash
# Terminal 1: Backend API
cd server && node index.js
# → API available at http://localhost:3000

# Terminal 2: Frontend Dev Server
npm run dev
# → App available at http://localhost:5000
```

### E2E Testing
```bash
# Terminal 1: Preview Server (production-like build)
npm run preview
# → App available at http://localhost:5005

# Terminal 2: Run E2E tests
npm run test:e2e
# → Tests connect to localhost:5005
```

---

## Verification

**Check current dev server port**:
```bash
grep -n "port:" vite.config.js
# Expected output: "30:        port: 5000,"
```

**Check E2E test port**:
```bash
grep "BASE_URL" test/e2e/helpers.js
# Expected output: "export const BASE_URL = process.env.BASE_URL || 'http://localhost:5005';"
```

---

## References in Documentation

All documentation uses the correct ports:

| File | Line | Port |
|------|------|------|
| docs/README.md | 21 | 5000 (dev) |
| docs/onboarding/DEVELOPER.md | 189 | 5000 |
| docs/onboarding/DEVOPS.md | 29 | 5000 |
| docs/onboarding/QA_ENGINEER.md | 47 | 5000 (dev), 5005 (preview) |
| test/e2e/helpers.js | 6 | 5005 (E2E) |

**Verified**: No references to port 5173 exist in codebase or docs ✅

---

## Troubleshooting

### "I'm getting 404 on localhost:5173"

**Problem**: You're using the wrong port.  
**Solution**: Use **http://localhost:5000** instead.

### "npm run dev starts on random port"

**Problem**: Port 5000 is already in use.  
**Solution**:
```bash
# Find what's using port 5000
lsof -i :5000

# Kill the process or stop the conflicting service
```

### "E2E tests fail to connect"

**Problem**: Preview server not running or wrong port.  
**Solution**:
```bash
# Make sure preview is running on 5005
npm run preview

# Check it's accessible
curl http://localhost:5005
```

---

## For New AI Agents

> [!IMPORTANT]
> **DO NOT assume port 5173**. This project uses:
> - Dev: **5000**
> - Preview/E2E: **5005**
> - API: **3000**

Always verify with:
```bash
npm run dev  # Opens on 5000, NOT 5173
```
