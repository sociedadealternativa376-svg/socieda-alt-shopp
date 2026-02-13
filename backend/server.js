#!/usr/bin/env node

/**
 * Backend do Mercado Pago - Checkout Transparente
 * Logs detalhados em cada etapa
 */

console.log('[INIT] Iniciando servidor...')

// ============== SETUP INICIAL ==============
require('dotenv').config()
console.log('[ENV] .env carregado')

const express = require('express')
const cors = require('cors')
const { MercadoPagoConfig, Payment, Preference } = require('mercadopago')

console.log('[DEPS] Dependências carregadas')

// ============== APP SETUP ==============
const app = express()
console.log('[APP] Express criado')

// CORS
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
console.log('[CORS] Habilitado para origem *')

// Debug middleware: log all requests
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path}`)
  next()
})

// JSON Parser
app.use(express.json({ limit: '50mb' }))
console.log('[JSON] Parser configurado')

// ============== MERCADO PAGO CONFIG ==============
const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN
console.log(`[MP] Access Token: ${accessToken ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}`)

if (!accessToken) {
  console.error('[ERROR] MP_ACCESS_TOKEN ou MERCADO_PAGO_ACCESS_TOKEN não está configurado!')
  process.exit(1)
}

const client = new MercadoPagoConfig({ accessToken })
const payment = new Payment(client)
const preference = new Preference(client)
console.log('[MP] Cliente Mercado Pago inicializado')

// ============== ROTAS ==============

// HEALTH CHECK - Validação básica
app.get('/health', (req, res) => {
  console.log('[GET /health] Request recebida')
  try {
    res.status(200).json({
      status: 'OK',
      backend: 'online',
      timestamp: new Date().toISOString(),
      mp: accessToken ? 'configured' : 'not_configured'
    })
    console.log('[GET /health] ✅ Resposta enviada')
  } catch (err) {
    console.error('[GET /health] ❌ Erro:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// CREATE PREFERENCE (Checkout Pro)
app.post('/api/create-preference', (req, res) => {
  console.log('[POST /api/create-preference] Request recebida')
  console.log('[POST /api/create-preference] Body:', JSON.stringify(req.body, null, 2))

  try {
    const { items, payer, description } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('[POST /api/create-preference] ❌ items vazio ou inválido')
      return res.status(400).json({ error: 'items array é obrigatório' })
    }

    const body = {
      items: items.map(item => ({
        id: item.id || '1',
        title: item.title || 'Produto',
        quantity: item.quantity || 1,
        unit_price: parseFloat(item.unit_price) || 0
      })),
      payer: payer || { email: 'test@test.com' },
      description: description || 'Compra via Checkout Transparente',
      back_urls: {
        success: 'http://localhost:8080/checkout',
        failure: 'http://localhost:8080/checkout',
        pending: 'http://localhost:8080/checkout'
      },
      // Do not force auto_return to avoid API validation issues in local sandbox
      // auto_return: 'approved'
    }

    console.log('[POST /api/create-preference] Enviando para Mercado Pago:', JSON.stringify(body, null, 2))

    preference.create({ body }).then(result => {
      console.log('[POST /api/create-preference] ✅ Preference criada:', result.id)
      res.status(201).json({
        success: true,
        id: result.id,
        init_point: result.init_point,
        sandbox_init_point: result.sandbox_init_point
      })
    }).catch(err => {
      console.error('[POST /api/create-preference] ❌ Erro Mercado Pago:', err.message)
      res.status(400).json({
        error: 'Erro ao criar preferência',
        details: err.message
      })
    })
  } catch (err) {
    console.error('[POST /api/create-preference] ❌ Erro geral:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// CREATE PAYMENT (Checkout Transparente - Cartão)
app.post('/api/create-payment', (req, res) => {
  console.log('[POST /api/create-payment] Request recebida')
  console.log('[POST /api/create-payment] Body:', JSON.stringify(req.body, null, 2))

  try {
    const { token, amount, installments, payment_method_id, description, payer } = req.body

    // Support alternative shapes: { card: { token } } and compute amount from items
    const finalToken = token || (req.body.card && req.body.card.token) || null
    let finalAmount = amount
    if ((!finalAmount || finalAmount === 0) && Array.isArray(req.body.items)) {
      finalAmount = req.body.items.reduce((sum, it) => sum + (Number(it.unit_price || it.price || 0) * Number(it.quantity || 1)), 0)
    }

    // Validação
    if (!finalToken) {
      console.error('[POST /api/create-payment] ❌ Token ausente')
      return res.status(400).json({ error: 'token é obrigatório' })
    }
    if (!finalAmount || finalAmount <= 0) {
      console.error('[POST /api/create-payment] ❌ Amount inválido')
      return res.status(400).json({ error: 'amount deve ser > 0' })
    }

    const body = {
      transaction_amount: parseFloat(finalAmount),
      token: finalToken,
      description: description || 'Pagamento via Checkout Transparente',
      installments: parseInt(installments) || 1,
      payer: {
        email: payer?.email || 'test@test.com',
        identification: {
          type: payer?.id_type || 'CPF',
          number: payer?.id_number || '12345678900'
        }
      }
    }

    // include payment_method_id only if explicitly provided
    if (payment_method_id) body.payment_method_id = payment_method_id

    console.log('[POST /api/create-payment] Enviando para Mercado Pago:', JSON.stringify(body, null, 2))

    payment.create({ body }).then(result => {
      console.log('[POST /api/create-payment] ✅ Pagamento criado:', result.id)
      res.status(201).json({
        success: true,
        id: result.id,
        status: result.status,
        status_detail: result.status_detail,
        transaction_details: result.transaction_details
      })
    }).catch(err => {
      console.error('[POST /api/create-payment] ❌ Erro Mercado Pago:', err.message)
      res.status(400).json({
        error: 'Erro ao processar pagamento',
        details: err.message
      })
    })
  } catch (err) {
    console.error('[POST /api/create-payment] ❌ Erro geral:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// DEV helper: create card token via Mercado Pago public API (only in development)
app.post('/api/dev/create-card-token', async (req, res) => {
  console.log('[POST /api/dev/create-card-token] Request recebida')
  console.log('[POST /api/dev/create-card-token] Body:', JSON.stringify(req.body, null, 2))
  try {
    if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'Not allowed in production' })
    const publicKey = process.env.MP_PUBLIC_KEY || process.env.VITE_MP_PUBLIC_KEY || process.env.MERCADO_PAGO_PUBLIC_KEY
    if (!publicKey) return res.status(400).json({ error: 'Public key not configured' })

    const card = req.body.card
    if (!card) return res.status(400).json({ error: 'card object required' })

    const fetchRes = await fetch(`https://api.mercadopago.com/v1/card_tokens?public_key=${encodeURIComponent(publicKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        card_number: String(card.number || card.card_number),
        expiration_month: String(card.expiration_month || card.month || card.exp_month),
        expiration_year: String(card.expiration_year || card.year || card.exp_year),
        security_code: String(card.security_code || card.cvv),
        cardholder: { name: card.holder_name || card.name || '' }
      })
    })

    const data = await fetchRes.json()
    if (!fetchRes.ok) return res.status(400).json({ error: 'Failed creating token', details: data })
    return res.status(201).json({ token: data.id, raw: data })
  } catch (err) {
    console.error('[POST /api/dev/create-card-token] ❌', err)
    return res.status(500).json({ error: err.message })
  }
})

// CREATE PIX PAYMENT
app.post('/api/create-pix', (req, res) => {
  console.log('[POST /api/create-pix] Request recebida')
  console.log('[POST /api/create-pix] Body:', JSON.stringify(req.body, null, 2))

  try {
    const { amount, description, payer } = req.body

    if (!amount || amount <= 0) {
      console.error('[POST /api/create-pix] ❌ Amount inválido')
      return res.status(400).json({ error: 'amount deve ser > 0' })
    }

    const body = {
      transaction_amount: parseFloat(amount),
      description: description || 'Pagamento Pix',
      payment_method_id: 'pix',
      payer: {
        email: payer?.email || 'test@test.com'
      }
    }

    console.log('[POST /api/create-pix] Enviando para Mercado Pago:', JSON.stringify(body, null, 2))

    payment.create({ body }).then(result => {
      console.log('[POST /api/create-pix] ✅ Pagamento Pix criado:', result.id)
      res.status(201).json({
        success: true,
        id: result.id,
        status: result.status,
        point_of_interaction: result.point_of_interaction
      })
    }).catch(err => {
      console.error('[POST /api/create-pix] ❌ Erro Mercado Pago:', err.message)
      res.status(400).json({
        error: 'Erro ao criar Pix',
        details: err.message
      })
    })
  } catch (err) {
    console.error('[POST /api/create-pix] ❌ Erro geral:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// DEV endpoint: Full payment flow (tokenize + create payment) in one call
app.post('/api/dev/pay-complete', async (req, res) => {
  console.log('[POST /api/dev/pay-complete] DEV ENDPOINT - Full payment flow')
  console.log('[POST /api/dev/pay-complete] Body:', JSON.stringify(req.body, null, 2))

  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Not allowed in production' })
    }

    const { card, amount, description, payer } = req.body
    if (!card) return res.status(400).json({ error: 'card object required' })
    if (!amount || amount <= 0) return res.status(400).json({ error: 'amount must be > 0' })

    // Step 1: Create card token
    const publicKey = process.env.MP_PUBLIC_KEY || process.env.VITE_MP_PUBLIC_KEY || process.env.MERCADO_PAGO_PUBLIC_KEY
    if (!publicKey) return res.status(400).json({ error: 'Public key not configured' })

    console.log('[POST /api/dev/pay-complete] Step 1: Creating card token...')
    const tokenRes = await fetch(`https://api.mercadopago.com/v1/card_tokens?public_key=${encodeURIComponent(publicKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        card_number: String(card.number || card.card_number),
        expiration_month: String(card.expiration_month || card.month || card.exp_month),
        expiration_year: String(card.expiration_year || card.year || card.exp_year),
        security_code: String(card.security_code || card.cvv),
        cardholder: { name: card.holder_name || card.name || 'Customer' }
      })
    })
    const tokenData = await tokenRes.json()
    if (!tokenRes.ok) {
      console.error('[POST /api/dev/pay-complete] ❌ Token creation failed:', tokenData)
      return res.status(400).json({ error: 'Failed creating token', details: tokenData })
    }
    const cardToken = tokenData.id
    console.log('[POST /api/dev/pay-complete] ✅ Card token created:', cardToken)

    // Step 2: Create payment
    console.log('[POST /api/dev/pay-complete] Step 2: Creating payment...')
    const paymentBody = {
      transaction_amount: parseFloat(amount),
      token: cardToken,
      description: description || 'Test payment from dev endpoint',
      installments: 1,
      payer: {
        email: payer?.email || 'devtest@test.com'
      }
    }

    const payRes = await payment.create({ body: paymentBody })
    console.log('[POST /api/dev/pay-complete] ✅ Payment created:', payRes.id)

    return res.status(201).json({
      success: true,
      payment_id: payRes.id,
      status: payRes.status,
      status_detail: payRes.status_detail,
      amount: payRes.transaction_amount,
      description: payRes.description,
      payer_email: payRes.payer?.email,
      transaction_details: payRes.transaction_details
    })
  } catch (err) {
    console.error('[POST /api/dev/pay-complete] ❌ Error:', err.message)
    return res.status(500).json({ error: 'Payment failed', details: err.message })
  }
})

// GET PAYMENT STATUS
app.get('/api/payment/:id', (req, res) => {
  console.log(`[GET /api/payment/:id] Request para ID: ${req.params.id}`)

  try {
    payment.get({ id: req.params.id }).then(result => {
      console.log(`[GET /api/payment/:id] ✅ Pagamento recuperado:`, result.id)
      res.status(200).json({
        success: true,
        id: result.id,
        status: result.status,
        status_detail: result.status_detail
      })
    }).catch(err => {
      console.error(`[GET /api/payment/:id] ❌ Erro:`, err.message)
      res.status(404).json({
        error: 'Pagamento não encontrado',
        details: err.message
      })
    })
  } catch (err) {
    console.error(`[GET /api/payment/:id] ❌ Erro geral:`, err.message)
    res.status(500).json({ error: err.message })
  }
})

// ============== ERROR HANDLER ==============
app.use((err, req, res, next) => {
  console.error('[ERROR-HANDLER] Erro não tratado:', err.message)
  console.error('[ERROR-HANDLER] Stack:', err.stack)
  res.status(err.status || 500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// 404 Handler
app.use((req, res) => {
  console.warn(`[404] Rota não encontrada: ${req.method} ${req.path}`)
  res.status(404).json({ error: 'Rota não encontrada' })
})

// ============== SERVER START ==============
const PORT = process.env.PORT || 3000

console.log('[SERVER] Iniciando express.listen()...')

const server = app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🔥 Backend Mercado Pago - Checkout Transparente`)
  console.log(`🚀 Rodando na porta: ${PORT}`)
  console.log(`📝 Ambiente: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🌐 URL: http://localhost:${PORT}`)
  console.log(`💰 MP Token: ${accessToken ? '✅ Configurado' : '❌ Não configurado'}`)
  console.log(`${'='.repeat(60)}\n`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[SERVER-ERROR] Porta ${PORT} já está em uso!`)
  } else {
    console.error(`[SERVER-ERROR] ${err.message}`)
  }
  process.exit(1)
})

// ============== GRACEFUL SHUTDOWN ==============
process.on('SIGTERM', () => {
  console.log('[SHUTDOWN] SIGTERM recebido, fechando servidor...')
  server.close(() => {
    console.log('[SHUTDOWN] Servidor fechado com sucesso')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('[SHUTDOWN] SIGINT recebido, fechando servidor...')
  server.close(() => {
    console.log('[SHUTDOWN] Servidor fechado com sucesso')
    process.exit(0)
  })
})

console.log('[READY] Backend pronto para aceitar conexões!')
