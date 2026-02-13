require("dotenv").config()

const express = require("express")
const http = require("http")
const cors = require("cors")
const { MercadoPagoConfig, Payment, Preference } = require("mercadopago")

const app = express()

app.use(cors())
app.use(express.json())

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN
})

const payment = new Payment(client)
const preference = new Preference(client)

// Helper: create card token via MercadoPago public API (used only in development fallback)
async function createCardTokenWithPublicKey(card) {
  const publicKey = process.env.MP_PUBLIC_KEY || process.env.MERCADO_PAGO_PUBLIC_KEY || process.env.VITE_MP_PUBLIC_KEY
  if (!publicKey) throw new Error('MP public key not configured')

  const fetch = await import('node-fetch').then(m => m.default)
  const url = `https://api.mercadopago.com/v1/card_tokens?public_key=${encodeURIComponent(publicKey)}`

  const body = {
    card_number: String(card.number),
    expiration_month: Number(card.expiration_month),
    expiration_year: Number(card.expiration_year),
    security_code: String(card.security_code),
    cardholder: {
      name: card.holder_name || card.holderName || card.cardholderName || ''
    }
  }

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  const data = await resp.json()
  if (!resp.ok) {
    const msg = data && (data.message || data.cause || JSON.stringify(data))
    throw new Error(`Failed creating card token: ${msg}`)
  }

  return data.id
}

// ============== ROTAS DE PAGAMENTO ==============

// 1. Criar pagamento com Cartão de Crédito
app.post("/api/create-payment", async (req, res) => {
  try {
    const { items, payer, card, installments } = req.body

    if (!items || !payer || !card) {
      return res.status(400).json({ 
        success: false, 
        message: "Dados incompletos: items, payer e card são obrigatórios" 
      })
    }

    const total = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)

    const paymentData = {
      transaction_amount: Number(total.toFixed(2)),
      description: `Compra - ${items.length} itens`,
      payment_method_id: "credit_card",
      installments: installments || 1,
      payer: {
        email: payer.email,
        first_name: payer.name || payer.first_name
      }
    }

    // Usar token se disponível (gerado pelo Mercado Pago SDK no frontend)
    // Prefer tokenization for security (checkout invisível)
    if (card.token) {
      paymentData.token = card.token
    } else {
      // In production we require client-side tokenization. In development we can
      // optionally create a token server-side when MP public key is configured,
      // to make local testing easier.
      if (process.env.NODE_ENV === 'development') {
        try {
          const token = await createCardTokenWithPublicKey(card)
          paymentData.token = token
        } catch (err) {
          console.error('Failed to create card token server-side:', err.message || err)
          return res.status(400).json({ success: false, message: 'Não foi possível tokenizar o cartão no servidor: ' + (err.message || err) })
        }
      } else {
        console.warn('Rejected raw card data — token missing')
        return res.status(400).json({
          success: false,
          message: 'Cartão deve ser tokenizado no cliente. Envie `card.token` gerado pelo SDK do Mercado Pago.'
        })
      }
    }

    console.log('PAYMENT DATA SENT TO SDK:', JSON.stringify(paymentData, null, 2))
    const result = await payment.create({ body: paymentData })

    return res.json({
      success: result.status === "approved",
      id: result.id,
      status: result.status,
      message: result.status === "approved" ? "Pagamento aprovado!" : "Pagamento processado",
      data: result
    })

  } catch (error) {
    console.error("❌ ERRO ao processar pagamento:", error.stack || error)
    return res.status(500).json({
      success: false,
      message: error.message || "Erro ao processar pagamento"
    })
  }
})

// 2. Criar pagamento Pix (QR Code)
app.post("/api/create-pix", async (req, res) => {
  try {
    const { items, payer } = req.body

    if (!items || !payer) {
      return res.status(400).json({
        success: false,
        message: "items e payer são obrigatórios"
      })
    }

    const total = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)

    const result = await payment.create({
      body: {
        transaction_amount: Number(total.toFixed(2)),
        description: `Compra - ${items.length} itens`,
        payment_method_id: "pix",
        payer: {
          email: payer.email,
          first_name: payer.name || payer.first_name
        }
      }
    })

    const qrData = result.point_of_interaction?.transaction_data || {}

    return res.json({
      success: true,
      id: result.id,
      status: result.status,
      qr_code: qrData.qr_code || null,
      qr_code_base64: qrData.qr_code_base64 || null,
      qr_code_text: qrData.qr_code_text || null,
      expires_in: 1800,
      message: "QR Code gerado com sucesso"
    })

  } catch (error) {
    console.error("❌ ERRO ao criar Pix:", error.message)
    return res.status(500).json({
      success: false,
      message: error.message || "Erro ao gerar Pix"
    })
  }
})

// 3. Obter opções de parcelamento
app.get("/api/installments", async (req, res) => {
  try {
    const { bin, amount } = req.query

    if (!bin || !amount) {
      return res.status(400).json({
        success: false,
        message: "bin e amount são obrigatórios"
      })
    }

    const fetch = await import("node-fetch").then(m => m.default)
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN

    const url = `https://api.mercadopago.com/v1/payment_methods/installments?bin=${encodeURIComponent(String(bin))}&amount=${encodeURIComponent(String(amount))}`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: data.message || "Erro ao buscar parcelamento"
      })
    }

    return res.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error("❌ ERRO ao buscar parcelamento:", error.message)
    return res.status(500).json({
      success: false,
      message: error.message || "Erro ao buscar parcelamento"
    })
  }
})

// 4. Criar preferência (Checkout Pro)
app.post("/api/create-preference", async (req, res) => {
  try {
    const { items, payer, notificationUrl } = req.body

    if (!items || !payer) {
      return res.status(400).json({
        success: false,
        message: "items e payer são obrigatórios"
      })
    }

    const preferenceData = {
      items: items.map(item => ({
        id: String(item.id),
        title: item.name || item.title,
        quantity: item.quantity,
        unit_price: Number(item.unit_price || item.price),
        currency_id: "BRL"
      })),
      payer: {
        email: payer.email,
        name: payer.name || payer.first_name
      },
      back_urls: {
        success: process.env.FRONTEND_URL + "/pedido-confirmado",
        pending: process.env.FRONTEND_URL + "/pedido-pendente",
        failure: process.env.FRONTEND_URL + "/pagamento-falhou"
      },
      notification_url: notificationUrl || process.env.WEBHOOK_URL,
      auto_return: "approved",
      external_reference: `order-${Date.now()}`,
      payment_methods: {
        excluded_payment_types: [],
        installments: 12
      }
    }

    const result = await preference.create({ body: preferenceData })

    return res.json({
      success: true,
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
      message: "Preferência criada com sucesso"
    })

  } catch (error) {
    console.error("❌ ERRO ao criar preferência:", error.stack || error)
    return res.status(500).json({
      success: false,
      message: error.message || "Erro ao criar preferência"
    })
  }
})

// 5. Consultar status de um pagamento
app.get("/api/payment/:id", async (req, res) => {
  try {
    const { id } = req.params

    const result = await payment.get({ id })

    return res.json({
      success: true,
      id: result.id,
      status: result.status,
      status_detail: result.status_detail,
      amount: result.transaction_amount,
      payer_email: result.payer?.email,
      payment_method: result.payment_method_id,
      created_at: result.date_created,
      approved_at: result.date_approved
    })

  } catch (error) {
    console.error("❌ ERRO ao consultar pagamento:", error.message)
    return res.status(500).json({
      success: false,
      message: error.message || "Erro ao consultar pagamento"
    })
  }
})

// ============== WEBHOOK ==============

app.post("/webhook", (req, res) => {
  const { type, data } = req.query
  console.log(`🔔 Webhook recebido: type=${type}, payment_id=${data?.id}`)
  
  // Aqui você pode processar webhooks de notificação de pagamento
  // Confirmar o ID no banco de dados e atualizar o status do pedido
  
  res.sendStatus(200)
})

// ============== HEALTH CHECK ==============

app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    mercadopagoConfigured: !!process.env.MERCADO_PAGO_ACCESS_TOKEN || !!process.env.MP_ACCESS_TOKEN
  })
})

// ============== ERROR HANDLER ==============

app.use((err, req, res, next) => {
  console.error("❌ Erro não tratado:", err.message)
  res.status(500).json({
    success: false,
    message: "Erro interno do servidor",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  })
})

// ============== SERVER ==============

const PORT = process.env.PORT || 3000

console.log(`[PRE-LISTEN] Sobre iniciar servidor na porta ${PORT}`)

const server = app.listen(PORT, '0.0.0.0', function() {
  const addr = server.address()
  console.log(`🔥 Backend Mercado Pago rodando na porta ${PORT}`)
  console.log(`📝 Ambiente: ${process.env.NODE_ENV || "development"}`)
  console.log(`[SERVER-ADDR] ${JSON.stringify(addr)}`)
})

server.on('listening', function() {
  console.log(`[LISTENING-EVENT] Servidor agora está escutando!`)
})

server.on('error', (err) => {
  console.error(`[ERROR] Server error: ${err.code} - ${err.message}`)
  process.exit(1)
})

process.on('uncaughtException', (err) => {
  console.error(`[UNCAUGHT] Uncaught exception: ${err.message}`)
  console.error(err.stack)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error(`[UNHANDLED] Unhandled rejection:`, reason)
})

server.on('error', (err) => {
  console.error('❌ Erro ao iniciar servidor:', err.message)
  process.exit(1)
})
