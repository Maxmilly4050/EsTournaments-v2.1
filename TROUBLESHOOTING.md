# Browser Troubleshooting Guide for Loading Issues

## JavaScript Loading Error (main-app.js)
This error typically occurs due to:
- Stale browser cache
- Development server restart needed
- Build artifacts corruption

### Solutions:
1. **Hard refresh browser**: Ctrl+F5 (Windows/Linux) or Cmd+Shift+R (Mac)
2. **Clear browser cache**: 
   - Chrome: Settings > Privacy > Clear browsing data > Cached images and files
   - Firefox: Settings > Privacy & Security > Clear Data > Cached Web Content
3. **Restart development server**: Run `./restart-dev.sh` or manually:
   ```bash
   npm run dev
   ```

## Font Preload Warning
The warning about unused preloaded font (028c0d39d2e8f589-s.p.woff2) is normal behavior:
- Next.js automatically preloads Geist fonts for performance
- The hash in filename indicates font optimization is working
- This is a performance optimization, not an error

### To reduce warnings (optional):
1. The fonts are being used correctly in layout.tsx
2. Warning appears because fonts load after initial page render
3. This is expected behavior and doesn't affect functionality

## Quick Fix Commands:
```bash
# Clear everything and restart
rm -rf .next node_modules package-lock.json
npm install
npm run dev

# Or use the restart script
./restart-dev.sh
```
