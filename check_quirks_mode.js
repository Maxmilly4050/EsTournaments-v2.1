const fs = require('fs');
const path = require('path');

// Function to check for DOCTYPE in HTML files
function checkForDoctype(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const hasDoctype = content.trim().toLowerCase().startsWith('<!doctype html>');
        return {
            file: filePath,
            hasDoctype,
            firstLine: content.split('\n')[0].trim()
        };
    } catch (error) {
        return {
            file: filePath,
            error: error.message
        };
    }
}

// Check layout.tsx (Next.js App Router)
console.log('Checking Next.js App Router layout...');
const layoutResult = checkForDoctype('./app/layout.tsx');
console.log('Layout check:', layoutResult);

// Check if there are any HTML files in public directory
console.log('\nChecking for HTML files in public directory...');
const publicDir = './public';
if (fs.existsSync(publicDir)) {
    const files = fs.readdirSync(publicDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));

    if (htmlFiles.length > 0) {
        htmlFiles.forEach(file => {
            const result = checkForDoctype(path.join(publicDir, file));
            console.log('HTML file check:', result);
        });
    } else {
        console.log('No HTML files found in public directory');
    }
}

// Check next.config.mjs for any custom HTML generation
console.log('\nChecking next.config.mjs...');
if (fs.existsSync('./next.config.mjs')) {
    const configContent = fs.readFileSync('./next.config.mjs', 'utf8');
    console.log('Next.js config found - checking for custom HTML settings');
    if (configContent.includes('html') || configContent.includes('head')) {
        console.log('Custom HTML configuration detected in next.config.mjs');
    }
}

console.log('\nNote: In Next.js App Router, DOCTYPE is automatically added by the framework when using <html> in layout.tsx');
console.log('If Quirks Mode is detected, it might be due to:');
console.log('1. Missing <html> element in layout');
console.log('2. Custom middleware interfering with HTML generation');
console.log('3. Static HTML files being served directly');
