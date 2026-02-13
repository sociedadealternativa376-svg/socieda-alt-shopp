#!/usr/bin/env node
/**
 * Start server + Run test automatically
 */

import { spawn } from 'child_process'
import http from 'http'

console.log('【server】 Iniciando servidor...\n')

const server = spawn('node', ['backend/server.js'], {
  cwd: 'c:\\Users\\Cauan\\socieda-alt-shop',
  stdio: ['ignore', 'pipe', 'pipe']
})

let serverStarted = false
let serverOutput = ''

server.stdout.on('data', (data) => {
  process.stdout.write(data)
  serverOutput += data.toString()
  if (serverOutput.includes('Backend pronto')) {
    serverStarted = true
    runTest()
  }
})

server.stderr.on('data', (data) => {
  process.stderr.write(data)
})

// Timeout de 5 segundos pra server iniciar
setTimeout(() => {
  if (!serverStarted) {
    console.log('\n⏳ Server levou > 5s, tentando teste mesmo assim...')
    runTest()
  }
}, 5000)

function runTest() {
  console.log('\n【test】 Iniciando teste...\n')

  const payload = JSON.stringify({
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
  })

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/dev/pay-complete',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    },
    timeout: 5000
  }

  const req = http.request(options, (res) => {
    let data = ''
    console.log(`【response】 Status ${res.statusCode}\n`)

    res.on('data', (chunk) => { data += chunk })
    res.on('end', () => {
      try {
        const json = JSON.parse(data)
        console.log(JSON.stringify(json, null, 2))

        if (res.statusCode === 201 && json.payment_id) {
          console.log('\n✅ PAGAMENTO CRIADO COM SUCESSO!')
          console.log(`ID: ${json.payment_id}`)
          console.log(`Status: ${json.status}`)
          console.log(`Valor: R$ ${json.amount}\n`)
        } else {
          console.log('\n❌ Erro na resposta\n')
        }
      } catch (e) {
        console.log('Erro parsing:', e.message)
        console.log('Raw:', data)
      }
      
      server.kill()
      process.exit(res.statusCode === 201 ? 0 : 1)
    })
  })

  req.on('error', (err) => {
    console.error(`【error】 ${err.message}\n`)
    server.kill()
    process.exit(1)
  })

  req.write(payload)
  req.end()
}
