import http from 'http'

console.log('Testando http://127.0.0.1:3000/health...\n')

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/health',
  method: 'GET'
}

const req = http.request(options, (res) => {
  console.log(`✅ Status: ${res.statusCode}`)
  
  let data = ''
  res.on('data', (chunk) => {
    data += chunk
  })
  
  res.on('end', () => {
    console.log(`✅ Response:\n${data}\n`)
    process.exit(0)
  })
})

req.on('error', (e) => {
  console.error(`❌ Erro: ${e.message}`)
  process.exit(1)
})

req.end()

setTimeout(() => {
  console.error('❌ Timeout - sem resposta após 5s')
  process.exit(1)
}, 5000)
