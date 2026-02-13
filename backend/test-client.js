const http = require('http')

console.log('Tentando conectar a localhost:3000/health...')

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET'
}

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`)
  let data = ''
  res.on('data', (chunk) => { data += chunk })
  res.on('end', () => {
    console.log(`✅ Response: ${data}`)
    process.exit(0)
  })
})

req.on('error', (err) => {
  console.error(`❌ Error type: ${err.code}`)
  console.error(`❌ Full error:`, err.message)
  process.exit(1)
})

req.setTimeout(10000, () => {
  console.error('❌ Request timeout')
  process.exit(1)
})

req.end()

setTimeout(() => {
  console.log('Timeout - connection not established after 10 seconds')
  process.exit(1)
}, 10000)
