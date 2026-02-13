#!/usr/bin/env node
/**
 * Simple test for /api/dev/pay-complete endpoint
 * Runs independently - doesn't kill server
 */

const http = require('http')
const { URL } = require('url')

const testPayload = {
  card: {
    number: '4509953566233704',
    expiration_month: '12',
    expiration_year: '2030',
    security_code: '123',
    holder_name: 'Teste Cliente'
  },
  amount: 25.50,
  description: 'Teste de Pagamento Transparente',
  payer: { email: 'cliente@teste.com.br' }
}

console.log('\n')
console.log('╔═══════════════════════════════════════════════╗')
console.log('║     TESTE: /api/dev/pay-complete              ║')
console.log('╚═══════════════════════════════════════════════╝')
console.log('\n📤 Payload:')
console.log(JSON.stringify(testPayload, null, 2))
console.log('\n⏳ Enviando requisição para http://localhost:3000/api/dev/pay-complete...\n')

const body = JSON.stringify(testPayload)

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/dev/pay-complete',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  },
  timeout: 10000
}

const req = http.request(options, (res) => {
  let data = ''

  console.log(`📊 Status: ${res.statusCode}`)
  console.log(`📋 Headers: ${JSON.stringify(res.headers, null, 2)}`)
  console.log('\n📥 Resposta:\n')

  res.on('data', (chunk) => {
    data += chunk
  })

  res.on('end', () => {
    try {
      const parsed = JSON.parse(data)
      console.log(JSON.stringify(parsed, null, 2))
      
      if (res.statusCode === 201 && parsed.payment_id) {
        console.log('\n✅ SUCESSO!\n')
        console.log(`💳 Payment ID: ${parsed.payment_id}`)
        console.log(`📊 Status: ${parsed.status}`)
        console.log(`💰 Amount: R$ ${parsed.amount}`)
        console.log(`📧 Payer: ${parsed.payer_email}`)
        console.log('\n')
        process.exit(0)
      } else if (res.statusCode >= 400) {
        console.log('\n❌ ERRO na resposta\n')
        process.exit(1)
      }
    } catch (e) {
      console.log('❌ Erro ao parsear resposta:', e.message)
      console.log('Raw response:', data)
      process.exit(1)
    }
  })
})

req.on('error', (err) => {
  console.error('\n❌ ERRO na requisição:')
  console.error(err.message)
  
  if (err.code === 'ECONNREFUSED') {
    console.error('\n⚠️  Servidor NÃO está rodando na porta 3000')
    console.error('Execute em outro terminal: node backend/server.js')
  }
  
  process.exit(1)
})

req.on('timeout', () => {
  console.error('\n❌ TIMEOUT: Servidor não respondeu em 10s')
  req.destroy()
  process.exit(1)
})

req.write(body)
req.end()
