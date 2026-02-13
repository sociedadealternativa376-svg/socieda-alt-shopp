const http = require('http')

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/health',
  method: 'GET',
  timeout: 5000
}

console.log('Testando http://127.0.0.1:3000/health')

const req = http.request(options, (res) => {
  console.log(`✅ Status: ${res.statusCode}`)
  let data = ''
  res.on('data', (chunk) => { data += chunk })
  res.on('end', () => {
    console.log(`✅ Resposta: ${data}`)
    process.exit(0)
  })
})

req.on('error', (err) => {
  console.error(`❌ Erro: ${err.code} - ${err.message}`)
  process.exit(1)
})

req.on('timeout', () => {
  console.error('❌ Timeout')
  req.destroy()
  process.exit(1)
})

req.end()
