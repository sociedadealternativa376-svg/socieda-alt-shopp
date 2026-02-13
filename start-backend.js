#!/usr/bin/env node

/**
 * Script para iniciar o backend do Mercado Pago
 * Uso: node start-backend.js
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Iniciando backend do Mercado Pago...\n');

const backendPath = path.join(__dirname, 'backend');
const serverFile = path.join(backendPath, 'server.js');
const envFile = path.join(backendPath, '.env');

// Verificar se o arquivo server.js existe
if (!fs.existsSync(serverFile)) {
  console.error('❌ Erro: Arquivo server.js não encontrado em backend/');
  console.error('   Verifique se você está na raiz do projeto.');
  process.exit(1);
}

// Verificar se o .env existe
if (!fs.existsSync(envFile)) {
  console.warn('⚠️  Aviso: Arquivo .env não encontrado em backend/');
  console.warn('   O servidor pode não funcionar sem as credenciais do Mercado Pago.');
  console.warn('   Crie um arquivo backend/.env com:');
  console.warn('   MERCADO_PAGO_ACCESS_TOKEN=TEST-seu-token-aqui');
  console.warn('   MP_PUBLIC_KEY=TEST-sua-public-key-aqui\n');
}

// Mudar para o diretório do backend
process.chdir(backendPath);

// Iniciar o servidor
console.log('📦 Iniciando servidor na porta 3000...\n');
console.log('💡 Pressione Ctrl+C para parar o servidor\n');
console.log('─'.repeat(60));

const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  shell: true
});

server.on('error', (err) => {
  console.error('❌ Erro ao iniciar servidor:', err.message);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`\n❌ Servidor encerrado com código ${code}`);
  }
  process.exit(code || 0);
});

// Tratamento de sinais
process.on('SIGINT', () => {
  console.log('\n\n🛑 Parando servidor...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  server.kill('SIGTERM');
});
