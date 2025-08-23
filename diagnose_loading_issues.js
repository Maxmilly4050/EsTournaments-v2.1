#!/usr/bin/env node

console.log("🔍 Diagnosing loading issues...\n");

// Check for common issues that cause script loading failures
const fs = require('fs');
const path = require('path');

console.log("1. Checking Next.js configuration...");
try {
  const nextConfigPath = path.join(__dirname, 'next.config.mjs');
  const nextConfigExists = fs.existsSync(nextConfigPath);
  console.log(`   ✓ next.config.mjs exists: ${nextConfigExists}`);

  if (nextConfigExists) {
    const configContent = fs.readFileSync(nextConfigPath, 'utf8');
    const hasCSP = configContent.includes('Content-Security-Policy');
    console.log(`   ⚠️  Strict CSP headers detected: ${hasCSP}`);
    if (hasCSP) {
      console.log("   → CSP might be blocking script loading in development");
    }
  }
} catch (error) {
  console.log(`   ❌ Error reading next.config.mjs: ${error.message}`);
}

console.log("\n2. Checking package.json dependencies...");
try {
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  console.log(`   ✓ Next.js version: ${packageJson.dependencies.next}`);
  console.log(`   ✓ React version: ${packageJson.dependencies.react}`);

  // Check for problematic dependencies
  const styledComponents = packageJson.dependencies['styled-components'];
  const tournamentBrackets = packageJson.dependencies['@g-loot/react-tournament-brackets'];

  if (styledComponents && tournamentBrackets) {
    console.log(`   ⚠️  styled-components: ${styledComponents}`);
    console.log(`   ⚠️  @g-loot/react-tournament-brackets: ${tournamentBrackets}`);
    console.log("   → Version conflict detected - this may cause build issues");
  }
} catch (error) {
  console.log(`   ❌ Error reading package.json: ${error.message}`);
}

console.log("\n3. Checking critical files...");
const criticalFiles = [
  'app/layout.tsx',
  'app/page.jsx',
  'app/globals.css'
];

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  console.log(`   ${exists ? '✓' : '❌'} ${file}: ${exists ? 'exists' : 'missing'}`);
});

console.log("\n4. Checking for node_modules...");
const nodeModulesPath = path.join(__dirname, 'node_modules');
const nodeModulesExists = fs.existsSync(nodeModulesPath);
console.log(`   ${nodeModulesExists ? '✓' : '❌'} node_modules: ${nodeModulesExists ? 'exists' : 'missing'}`);

if (nodeModulesExists) {
  try {
    const nextPath = path.join(nodeModulesPath, 'next');
    const nextExists = fs.existsSync(nextPath);
    console.log(`   ${nextExists ? '✓' : '❌'} next module: ${nextExists ? 'installed' : 'missing'}`);
  } catch (error) {
    console.log(`   ❌ Error checking Next.js installation: ${error.message}`);
  }
}

console.log("\n🚨 LIKELY CAUSES OF LOADING FAILURES:");
console.log("1. Dependency version conflicts (styled-components compatibility)");
console.log("2. Strict Content Security Policy headers blocking scripts");
console.log("3. Incomplete or corrupted node_modules installation");
console.log("4. Font preloading issues with Geist fonts");

console.log("\n💡 RECOMMENDED FIXES:");
console.log("1. Remove CSP headers temporarily for development");
console.log("2. Install dependencies with --legacy-peer-deps");
console.log("3. Remove problematic styled-components dependency");
console.log("4. Add proper font-display: swap to reduce preload warnings");

console.log("\n✅ Diagnosis complete!");
