const http = require('http')

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/create-pix',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}

const body = JSON.stringify({
  amount: 25.50,
  description: 'Teste PIX Prod',
  payer: { email: 'cliente@teste.com.br' }
})

const req = http.request(options, (res) => {
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => {
    console.log('Status:', res.statusCode)
    try {
      const json = JSON.parse(data)
      if (json.success) {
        console.log('✅ PIX CRIADO!')
        console.log('ID:', json.id)
        console.log('Status:', json.status)
        if (json.point_of_interaction?.transaction_data?.qr_code) {
          console.log('QR CODE:', json.point_of_interaction.transaction_data.qr_code.substring(0, 50))
        }
      } else {
        console.log('❌ ERRO:', json.error || json.message)
        console.log('Details:', json.details)
      }
    } catch(e) {
      console.log('Response:', data)
    }
  })
})

req.on('error', err => console.error('Error:', err.message))
req.write(body)
req.end()
