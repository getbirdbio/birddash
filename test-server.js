#!/usr/bin/env node

// Minimal test server for Railway debugging
console.log('🎯 Test server starting...');
console.log('🎯 Node.js version:', process.version);
console.log('🎯 Platform:', process.platform);
console.log('🎯 Architecture:', process.arch);
console.log('🎯 Working directory:', process.cwd());
console.log('🎯 PORT from env:', process.env.PORT);
console.log('🎯 All Railway env vars:');
Object.keys(process.env).filter(k => k.includes('RAILWAY')).forEach(key => {
    console.log(`  ${key}=${process.env[key]}`);
});

import http from 'http';

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    console.log('📞 Request:', req.method, req.url);
    
    if (req.url === '/alive') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('alive');
        return;
    }
    
    if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Test Server Running</h1><p>Server is working!</p>');
        return;
    }
    
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Test server running on port ${PORT}`);
    console.log(`🌐 Server listening on: 0.0.0.0:${PORT}`);
    console.log(`💓 Health check: http://0.0.0.0:${PORT}/alive`);
});

server.on('error', (error) => {
    console.error('❌ Server error:', error);
    process.exit(1);
});

// Global error handlers
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
    process.exit(1);
});

console.log('✅ Test server setup completed');
