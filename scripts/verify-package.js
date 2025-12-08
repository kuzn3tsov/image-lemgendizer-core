#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

console.log('🔍 Verifying package contents...\n');

// Check package.json
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
console.log('📦 Package name:', packageJson.name);
console.log('🏷️  Version:', packageJson.version);
console.log('📁 Files to publish:', packageJson.files.join(', '));

// Build if dist doesn't exist
if (!existsSync('dist')) {
    console.log('\n🔨 Building package...');
    execSync('npm run build', { stdio: 'inherit' });
}

// Check dist contents (cross-platform)
console.log('\n📂 Checking dist/ contents:');

function listFiles(dir, prefix = '') {
    const files = readdirSync(dir);

    files.forEach(file => {
        const filePath = join(dir, file);
        const stat = statSync(filePath);

        if (stat.isDirectory()) {
            listFiles(filePath, join(prefix, file));
        } else {
            const fullPath = join(prefix, file);
            const size = stat.size;
            const kb = (size / 1024).toFixed(2);
            console.log(`  ${join(dir, fullPath)} (${kb} KB)`);
        }
    });
}

if (existsSync('dist')) {
    listFiles('dist');
} else {
    console.log('❌ dist/ directory does not exist');
    process.exit(1);
}

// Dry run npm pack
console.log('\n📦 Testing npm pack...');
try {
    const packOutput = execSync('npm pack --dry-run --json', { encoding: 'utf8' });
    const packInfo = JSON.parse(packOutput);

    console.log('✅ Package would include:');
    packInfo[0].files.forEach(file => {
        console.log(`  ${file.path} (${(file.size / 1024).toFixed(2)} KB)`);
    });

    console.log(`\n📏 Total size: ${(packInfo[0].size / 1024 / 1024).toFixed(2)} MB`);
    console.log('✅ Verification complete!');
} catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
}