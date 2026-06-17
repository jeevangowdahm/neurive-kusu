const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env manually
let env = {};
try {
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      env[key] = value;
    }
  });
} catch (e) {
  console.log('Could not read .env file:', e.message);
}

const currentUrl = env.NEXT_PUBLIC_SUPABASE_URL || '';
const currentKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const newUrl = 'https://zereuddgsdrvgoiangep.supabase.co';

console.log('--- Configured Supabase ---');
console.log('URL:', currentUrl);
console.log('Key length:', currentKey ? currentKey.length : 0);

console.log('\n--- New Supabase ---');
console.log('URL:', newUrl);

async function testSupabase(url, key) {
  try {
    const client = createClient(url, key);
    const { data, error } = await client.from('documents').select('id, title').limit(1);
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, count: data ? data.length : 0, sample: data };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

async function run() {
  console.log('\nTesting configured Supabase...');
  const res1 = await testSupabase(currentUrl, currentKey);
  console.log('Result:', res1);

  console.log('\nTesting new Supabase with configured key...');
  const res2 = await testSupabase(newUrl, currentKey);
  console.log('Result:', res2);
}

run();
