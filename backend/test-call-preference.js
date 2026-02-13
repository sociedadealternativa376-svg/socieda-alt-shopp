// Test script: call local backend /api/create-preference
(async () => {
  try {
    const payload = {
      items: [{ id: '1', title: 'Produto Teste', quantity: 1, unit_price: 10.0 }],
      payer: { email: 'teste@teste.com', name: 'Teste' }
    }

    console.log('Calling http://localhost:3000/api/create-preference')
    const res = await fetch('http://localhost:3000/api/create-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    console.log('Status:', res.status)
    const text = await res.text()
    try {
      console.log('Response:', JSON.stringify(JSON.parse(text), null, 2))
    } catch (e) {
      console.log('Response (raw):', text)
    }
  } catch (err) {
    console.error('Request failed:', err)
  }
})();
