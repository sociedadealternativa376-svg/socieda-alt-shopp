(async () => {
  try {
    console.log('\n=== TESTE: DEV PAY COMPLETE ===\n')

    const payload = {
      card: {
        number: '4509953566233704',
        expiration_month: '12',
        expiration_year: '2030',
        security_code: '123',
        holder_name: 'Teste Cliente'
      },
      amount: 25.50,
      description: 'Teste de Pagamento Transparente',
      payer: { email: 'cliente@teste.com.br' }
    }

    console.log('📤 Enviando payload:')
    console.log(JSON.stringify(payload, null, 2))
    console.log('\n---\n')

    const response = await fetch('http://127.0.0.1:3000/api/dev/pay-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    console.log(`📥 Status: ${response.status}`)
    const data = await response.json()
    console.log('📥 Resposta:')
    console.log(JSON.stringify(data, null, 2))

    if (response.ok && data.payment_id) {
      console.log('\n✅ PAGAMENTO CRIADO COM SUCESSO!\n')
      console.log(`💳 ID do Pagamento: ${data.payment_id}`)
      console.log(`📊 Status: ${data.status}`)
      console.log(`💰 Valor: R$ ${data.amount}`)
      console.log(`📧 Payer: ${data.payer_email}`)
    } else {
      console.log('\n❌ ERRO ao processar pagamento\n')
    }
  } catch (err) {
    console.error('❌ Request failed:', err.message)
  }
})()
