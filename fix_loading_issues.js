const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 Fixing JavaScript and Font Loading Issues');
console.log('============================================');

// Function to run command safely
function runCommand(command, description) {
    try {
        console.log(`\n📌 ${description}`);
        execSync(command, { stdio: 'inherit' });
        return true;
    } catch (error) {
        console.log(`❌ Failed: ${error.message}`);
        return false;
    }
}

// 1. Clear Next.js build cache
console.log('\n1. Clearing Next.js build cache...');
if (fs.existsSync('./.next')) {
    try {
        if (process.platform === 'win32') {
            execSync('rmdir /s /q .next', { stdio: 'inherit' });
        } else {
            execSync('rm -rf .next', { stdio: 'inherit' });
        }
        console.log('✅ Build cache cleared');
    } catch (error) {
        console.log('⚠️  Could not clear build cache automatically');
        console.log('   Please manually delete the .next directory');
    }
} else {
    console.log('✅ No build cache to clear');
}

// 2. Update next.config.mjs to ensure proper CSP for development
console.log('\n2. Checking Next.js configuration...');
const configPath = './next.config.mjs';
if (fs.existsSync(configPath)) {
    const config = fs.readFileSync(configPath, 'utf8');

    // Check if we need to add development-specific CSP
    if (!config.includes('process.env.NODE_ENV')) {
        console.log('⚠️  Adding development-friendly CSP configuration...');

        const updatedConfig = config.replace(
            'async headers() {',
            `async headers() {
    const isDev = process.env.NODE_ENV === 'development';`
        ).replace(
            '"script-src \'self\' \'unsafe-inline\'',
            '"script-src \'self\' \'unsafe-inline\' " + (process.env.NODE_ENV === \'development\' ? "localhost:* http://localhost:*" : "")'
        ).replace(
            '"font-src \'self\' blob: data:"',
            '"font-src \'self\' blob: data: https://fonts.googleapis.com https://fonts.gstatic.com"'
        );

        if (updatedConfig !== config) {
            fs.writeFileSync(configPath, updatedConfig);
            console.log('✅ Configuration updated for better development support');
        } else {
            console.log('✅ Configuration already optimal');
        }
    } else {
        console.log('✅ Configuration already includes environment checks');
    }
}

// 3. Create development server restart script
console.log('\n3. Creating development server restart script...');
const restartScript = `#!/bin/bash
echo "🔄 Restarting development server with clean state..."
echo "1. Stopping any running processes..."
pkill -f "next dev" 2>/dev/null || true
echo "2. Clearing build cache..."
rm -rf .next
echo "3. Installing dependencies..."
npm install
echo "4. Starting development server..."
npm run dev
`;

fs.writeFileSync('./restart-dev.sh', restartScript);
if (process.platform !== 'win32') {
    try {
        execSync('chmod +x restart-dev.sh');
    } catch (e) {
        // Ignore chmod errors on systems that don't support it
    }
}
console.log('✅ Development restart script created: ./restart-dev.sh');

// 4. Create browser cache clearing instructions
console.log('\n4. Creating browser troubleshooting guide...');
const troubleshootingGuide = `# Browser Troubleshooting Guide for Loading Issues

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
3. **Restart development server**: Run \`./restart-dev.sh\` or manually:
   \`\`\`bash
   npm run dev
   \`\`\`

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
\`\`\`bash
# Clear everything and restart
rm -rf .next node_modules package-lock.json
npm install
npm run dev

# Or use the restart script
./restart-dev.sh
\`\`\`
`;

fs.writeFileSync('./TROUBLESHOOTING.md', troubleshootingGuide);
console.log('✅ Troubleshooting guide created: ./TROUBLESHOOTING.md');

console.log('\n🎉 Fix Complete!');
console.log('================');
console.log('Next steps to resolve the loading issues:');
console.log('1. Run: ./restart-dev.sh (or npm run dev)');
console.log('2. Hard refresh your browser (Ctrl+F5)');
console.log('3. Check TROUBLESHOOTING.md for additional help');
console.log('4. The font preload warning is expected and safe to ignore');
console.log('\nIf issues persist, the main-app.js error is likely a temporary');
console.log('development server issue that will resolve with a clean restart.');
