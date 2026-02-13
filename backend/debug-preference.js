require('dotenv').config()

const { MercadoPagoConfig, Preference } = require('mercadopago')

async function run() {
  try {
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN
    })

    const preference = new Preference(client)

    const pref = {
      items: [
        {
          id: 'test-1',
          title: 'Produto Teste',
          quantity: 1,
          unit_price: 1.0,
          currency_id: 'BRL'
        }
      ],
      payer: { email: 'teste@teste.com', name: 'Teste' },
      back_urls: {
        success: 'http://localhost:8081/pedido-confirmado',
        pending: 'http://localhost:8081/pedido-pendente',
        failure: 'http://localhost:8081/pagamento-falhou'
      }
    }

    console.log('Criando preferência de teste...')
    const result = await preference.create({ body: pref })
    console.log('Resposta da preferência:')
    console.log(JSON.stringify(result, null, 2))
  } catch (err) {
    console.error('Erro ao criar preferência:')
    if (err.response) {
      try {
        console.error('Status:', err.response.status)
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
