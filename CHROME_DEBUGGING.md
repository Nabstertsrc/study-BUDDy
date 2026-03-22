# Running AI Study Buddy in Chrome for Debugging

## Quick Start
1. Open Chrome browser
2. Navigate to: **http://localhost:5173**
3. Make sure the dev server is running (see below)

## Start the Development Server
```powershell
# In the terminal, from the project root:
npm run dev
```

The app will be available at:
- **Vite Dev Server**: http://localhost:5173 (Access this in Chrome)
- **Python AI Backend**: http://localhost:5001 (Auto-started by Electron)

## Benefits of Chrome Debugging
- **Faster refresh** - No Electron overhead
- **Better DevTools** - React DevTools extension works perfectly
- **Antigravity plugin** - Works seamlessly
- **Network inspection** - See all API calls to Python backend
- **Console logs** - Much clearer error messages

## Important Notes
- **Python backend will NOT auto-start** when using Chrome only
- You need to manually start it if you're NOT using Electron

### Manual Python Backend Start
If you want to use Chrome WITHOUT Electron:
```powershell
# Terminal 1: Start Vite
npm run vite:dev

# Terminal 2: Start Python backend
cd backend/python
python analyzer.py
```

## Recommended Workflow
1. **Use Chrome for UI debugging** (http://localhost:5173)
2. **Use `npm run dev`** so Python backend auto-starts
3. **Ignore the Electron window** - Just focus on Chrome
4. **Check Python logs** in the terminal where you ran `npm run dev`

## Debugging AI Features in Chrome
1. Open DevTools (F12)
2. Go to **Console** tab
3. Click "Generate Learning Path"
4. Watch for:
   - "AI: Routing Gemini request to Python backend..."
   - Any JSON parsing errors
   - Network calls to `http://localhost:5001/generate`

## Current Fixes Applied
✅ JSON extraction with robust markdown cleaning
✅ Explicit "JSON-only" instructions to Gemini
✅ Multi-model fallback (tries 31 Gemini models)
✅ DeepSeek as final fallback

## Testing in Chrome
Navigate to: http://localhost:5173
Then test:
1. Learning Path generation
2. Quiz creation
3. Document upload/AI Auto Organizer
4. Goals setting

Happy debugging! 🚀
