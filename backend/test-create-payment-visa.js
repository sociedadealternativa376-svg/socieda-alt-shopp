(async () => {
  try {
    const PUBLIC_KEY = 'TEST-1caa955b-34ff-4f63-8559-1412fd802501'

    const cardData = {
      card_number: '4509953566233704',
      expiration_month: '12',
      expiration_year: '2030',
      security_code: '123',
      cardholder: { name: 'Teste' }
    }

    console.log('Creating card token via Mercado Pago public API...')
    const tokenRes = await fetch(`https://api.mercadopago.com/v1/card_tokens?public_key=${PUBLIC_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cardData)
    })

    const tokenJson = await tokenRes.json()
    if (!tokenRes.ok) {
      console.error('Failed to create card token:', tokenRes.status, tokenJson)
      return
    }

    const cardToken = tokenJson.id
    console.log('Card token created:', cardToken)

    const payload = {
      amount: 10.0,
      token: cardToken,
      installments: 1,
      payment_method_id: 'visa',
      payer: { email: 'teste@teste.com', identification: { type: 'CPF', number: '12345678909' } }
    }

    console.log('Sending to http://localhost:3000/api/create-payment')
    const res = await fetch('http://localhost:3000/api/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    console.log('Status:', res.status)
    const text = await res.text()
    try {
      console.log('Body:', JSON.stringify(JSON.parse(text), null, 2))
    } catch (e) {
      console.log('Body (raw):', text)
    }
  } catch (err) {
    console.error('Request failed:', err)
  }
})()
