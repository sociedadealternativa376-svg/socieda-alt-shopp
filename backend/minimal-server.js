#!/usr/bin/env node

require('dotenv').config()

const express = require('express')
const cors = require('cors')

// Initialize Express app
const app = express()

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Simple echo endpoint for testing
app.post('/test', (req, res) => {
  res.json({ received: req.body, timestamp: new Date().toISOString() })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ error: err.message })
})

// Start server
const PORT = parseInt(process.env.PORT || '3000', 10)

const server = app.listen(PORT, '0.0.0.0', function() {
  const addr = server.address()
  console.log(`[${new Date().toISOString()}] Server listening on ${addr.address}:${addr.port}`)
})

server.on('error', (err) => {
  console.error(`[ERROR] ${err.message}`)
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`)
  }
  process.exit(1)
})

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
