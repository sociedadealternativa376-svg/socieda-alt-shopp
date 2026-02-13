require('dotenv').config()

const token = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN
console.log('Token:', token ? 'loaded' : 'NOT LOADED')

;(async () => {
  try {
    const fetch = await import('node-fetch').then(m => m.default)
    const resp = await fetch('https://api.mercadopago.com/v1/payment_methods', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    console.log('Status:', resp.status)
    const data = await resp.text()
    console.log('Response:', data.substring(0, 200))
  } catch (err) {
    console.error('Error:', err.message)
  }
})()
