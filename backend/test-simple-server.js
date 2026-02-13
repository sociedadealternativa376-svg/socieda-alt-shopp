const express = require('express')
const http = require('http')
const app = express()
const PORT = 3000

app.get('/health', (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /health`)
  res.json({ ok: true })
})

console.log(`[STARTUP] Starting Express server...`)

// Create server without hostname - will listen on all interfaces
const server = http.createServer(app)

server.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] ✅ HTTP Server created and listening on port ${PORT}`)
})

server.on('listening', () => {
  console.log(`[LISTENING] Server is now accepting connections!`)
})

server.on('error', (err) => {
  console.error(`[ERROR] Server error: ${err.message}`)
  console.error(err)
  process.exit(1)
})

process.on('uncaughtException', (err) => {
  console.error(`[UNCAUGHT] Uncaught exception: ${err.message}`)
  console.error(err)
  process.exit(1)
})

