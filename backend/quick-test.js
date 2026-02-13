const http = require('http')

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
  }
}

const req = http.request(options, (res) => {
  let data = ''
  console.log(`Status: ${res.statusCode}`)
  
  res.on('data', (chunk) => {
    data += chunk
  })

  res.on('end', () => {
    console.log('Resposta:')
    try {
      const json = JSON.parse(data)
      console.log(JSON.stringify(json, null, 2))
    } catch (e) {
      console.log(data)
    }
  })
})

req.on('error', (err) => {
  console.error('Erro:', err)
})

console.log('Enviando requisição...')
req.write(payload)
req.end()
