#!/usr/bin/env node

const https = require('https');
const http = require('http');

const urls = [
  'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1665460/8ab1221163d79fb5cc64ce59cf96fa39f7af0d35/capsule_616x353.jpg?t=1755123708',
  'https://wallpapercave.com/wp/wp15596619.jpg',
  'https://viefhctoekpdeyniubwi.supabase.co',
  'https://ui.shadcn.com/schema.json'
];

function testUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https:') ? https : http;

    const req = client.get(url, (res) => {
      resolve({
        url: url,
        status: 'SUCCESS',
        statusCode: res.statusCode,
        headers: res.headers
      });
    });

    req.on('error', (err) => {
      resolve({
        url: url,
        status: 'ERROR',
        error: err.message,
        code: err.code
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        url: url,
        status: 'TIMEOUT',
        error: 'Request timeout after 10 seconds'
      });
    });
  });
}

async function testAllUrls() {
  console.log('Testing external URLs for DNS resolution...\n');

  for (const url of urls) {
    console.log(`Testing: ${url}`);
    const result = await testUrl(url);

    if (result.status === 'SUCCESS') {
      console.log(`✅ SUCCESS - Status: ${result.statusCode}`);
    } else {
      console.log(`❌ ${result.status} - ${result.error}`);
      if (result.code) {
        console.log(`   Error Code: ${result.code}`);
      }
    }
    console.log('');
  }
}

testAllUrls().catch(console.error);
