const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnosing JavaScript and Font Loading Issues');
console.log('================================================');

// Check Next.js configuration
console.log('\n1. Checking Next.js Configuration:');
const nextConfigPath = './next.config.mjs';
if (fs.existsSync(nextConfigPath)) {
    const config = fs.readFileSync(nextConfigPath, 'utf8');
    console.log('✓ next.config.mjs found');

    // Check for potential issues in config
    if (config.includes('unoptimized: true')) {
        console.log('⚠️  Image optimization disabled - this could affect static assets');
    }

    if (config.includes('Content-Security-Policy')) {
        console.log('⚠️  CSP headers detected - checking for script-src issues');
        const cspMatch = config.match(/script-src[^"]*"([^"]+)"/);
        if (cspMatch) {
            const scriptSrc = cspMatch[1];
            if (!scriptSrc.includes("'self'")) {
                console.log('❌ CSP script-src missing "self" - this could block main-app.js');
            } else {
                console.log('✓ CSP script-src includes "self"');
            }
        }
    }
} else {
    console.log('❌ next.config.mjs not found');
}

// Check layout.tsx for font configuration
console.log('\n2. Checking Font Configuration:');
const layoutPath = './app/layout.tsx';
if (fs.existsSync(layoutPath)) {
    const layout = fs.readFileSync(layoutPath, 'utf8');
    console.log('✓ layout.tsx found');

    if (layout.includes('GeistSans') || layout.includes('GeistMono')) {
        console.log('✓ Geist fonts imported');

        // Check if fonts are properly applied
        if (layout.includes('GeistSans.variable') && layout.includes('GeistMono.variable')) {
            console.log('✓ Font variables properly configured');
        } else {
            console.log('⚠️  Font variables may not be properly configured');
        }

        if (layout.includes('GeistSans.className')) {
            console.log('✓ Font className applied to body');
        } else {
            console.log('⚠️  Font className not applied to body - unused preload warning expected');
        }
    }
}

// Check for .next build directory
console.log('\n3. Checking Build Directory:');
const buildDir = './.next';
if (fs.existsSync(buildDir)) {
    console.log('✓ .next build directory exists');

    // Check for static chunks
    const staticDir = path.join(buildDir, 'static');
    if (fs.existsSync(staticDir)) {
        console.log('✓ Static directory exists');

        const chunksDir = path.join(staticDir, 'chunks');
        if (fs.existsSync(chunksDir)) {
            console.log('✓ Chunks directory exists');
            const chunks = fs.readdirSync(chunksDir);
            const appChunks = chunks.filter(chunk => chunk.includes('app') || chunk.includes('main'));
            if (appChunks.length > 0) {
                console.log(`✓ Found ${appChunks.length} app-related chunks:`, appChunks.slice(0, 3));
            } else {
                console.log('⚠️  No main app chunks found - this could cause loading errors');
            }
        }
    }
} else {
    console.log('❌ No .next build directory - run "npm run build" first');
}

// Check middleware
console.log('\n4. Checking Middleware:');
const middlewarePath = './middleware.js';
if (fs.existsSync(middlewarePath)) {
    const middleware = fs.readFileSync(middlewarePath, 'utf8');
    console.log('✓ middleware.js found');

    // Check matcher configuration
    if (middleware.includes('_next/static')) {
        console.log('✓ Middleware excludes static files');
    } else {
        console.log('⚠️  Middleware might interfere with static file serving');
    }
} else {
    console.log('✓ No middleware.js (not an issue)');
}

console.log('\n📋 Diagnosis Summary:');
console.log('===================');
console.log('Common causes for these issues:');
console.log('1. Development server not running or restarted needed');
console.log('2. Browser cache containing stale references');
console.log('3. Build artifacts missing or corrupted');
console.log('4. CSP headers blocking script execution');
console.log('5. Font preloading by Geist package but not immediately used');

console.log('\n🔧 Recommended Fixes:');
console.log('1. Clear browser cache and hard refresh');
console.log('2. Delete .next directory and rebuild: rm -rf .next && npm run build');
console.log('3. Restart development server: npm run dev');
console.log('4. Check browser console for detailed error messages');
