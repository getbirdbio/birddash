#!/usr/bin/env node

// Railway-specific startup script with enhanced logging
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚄 Railway startup script initiated');
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('📡 Port:', process.env.PORT || 3000);
console.log('📁 Working directory:', process.cwd());

// List directory contents for debugging
console.log('📂 Directory contents:');
try {
    const files = fs.readdirSync('.');
    files.forEach(file => {
        const stats = fs.statSync(file);
        console.log(`  ${stats.isDirectory() ? '📁' : '📄'} ${file}`);
    });
} catch (error) {
    console.error('❌ Error reading directory:', error);
}

// Check if server directory exists
if (fs.existsSync('./server')) {
    console.log('✅ Server directory found');
    if (fs.existsSync('./server/server.js')) {
        console.log('✅ Server file found');
    } else {
        console.error('❌ Server file not found');
    }
} else {
    console.error('❌ Server directory not found');
}

// Create database directory if it doesn't exist
const dbDir = './database';
try {
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log('✅ Database directory created');
    } else {
        console.log('✅ Database directory exists');
    }
} catch (error) {
    console.error('❌ Error creating database directory:', error);
}

// Start the main server
console.log('🚀 Starting main server...');
const server = spawn('node', ['server/server.js'], {
    stdio: 'inherit',
    env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || 'production'
    }
});

server.on('error', (error) => {
    console.error('❌ Server process error:', error);
    process.exit(1);
});

server.on('exit', (code, signal) => {
    console.log(`🛑 Server process exited with code ${code} and signal ${signal}`);
    process.exit(code || 0);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down...');
    server.kill('SIGTERM');
});

process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down...');
    server.kill('SIGINT');
});
