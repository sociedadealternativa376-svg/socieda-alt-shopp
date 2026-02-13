require('dotenv').config()

const { MercadoPagoConfig, Payment } = require('mercadopago')

async function run() {
  try {
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN
    })

    const payment = new Payment(client)

    console.log('Usando token:', (process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN) ? 'SIM' : 'NAO')

    const body = {
      transaction_amount: 1.0,
      description: 'Teste Pix debug',
      payment_method_id: 'pix',
      payer: {
        email: 'teste@teste.com',
        first_name: 'Teste'
      }
    }

    console.log('Enviando requisição ao Mercado Pago...')
    const result = await payment.create({ body })

    console.log('Resposta MP:')
    console.log(JSON.stringify(result, null, 2))
  } catch (err) {
    console.error('Erro detalhado ao chamar Mercado Pago:')
    if (err.response) {
      try {
        console.error('Status:', err.response.status)
        console.error('Headers:', err.response.headers)
        console.error('Body:', JSON.stringify(err.response.data || err.response.body || err.response, null, 2))
      } catch (e) {
        console.error(err)
      }
    } else {
      console.error(err && err.message ? err.message : err)
    }
    process.exit(1)
  }
}

run()
