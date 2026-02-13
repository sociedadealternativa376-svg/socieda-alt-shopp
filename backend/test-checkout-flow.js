// Simulate complete checkout flow: 
// 1. Frontend sends POST to /api/create-preference
// 2. Backend returns sandbox_init_point
// 3. Display checkout URL

(async () => {
  try {
    console.log('\n=== MERCADO PAGO CHECKOUT FLOW TEST ===\n')
    
    const payload = {
      items: [
        { id: '1', title: 'Produto Teste', quantity: 2, unit_price: 50.0 },
        { id: '2', title: 'Outro Produto', quantity: 1, unit_price: 100.0 }
      ],
      payer: {
        email: 'cliente@teste.com.br',
        name: 'João da Silva'
      }
    }

    console.log('Payload enviado ao backend:')
    console.log(JSON.stringify(payload, null, 2))
    console.log('\n---\n')

    const response = await fetch('http://localhost:3000/api/create-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const responseData = await response.json()
    
    console.log('Status da resposta:', response.status)
    console.log('\nResposta do backend:')
    console.log(JSON.stringify(responseData, null, 2))

    if (responseData.sandbox_init_point) {
      console.log('\n✅ CHECKOUT LINK GERADO COM SUCESSO!\n')
      console.log('🔗 Abra este link no navegador para testar o pagamento:')
      console.log(responseData.sandbox_init_point)
      console.log('\n💳 Cartões de teste Mercado Pago:')
      console.log('  - Aprovado: 4509 9535 6623 3704 (12/2030 CVV: 123)')
      console.log('  - Recusado: 4012 8888 8888 1881 (12/2030 CVV: 123)')
      console.log('  - Pendente: 4235 6400 1111 1111 (12/2030 CVV: 123)\n')
    } else {
      console.log('\n❌ ERRO ao gerar checkout')
      console.log('Mensagem:', responseData.message)
    }

  } catch (err) {
    console.error('\n❌ Erro ao testar checkout:', err.message)
  }
})()
