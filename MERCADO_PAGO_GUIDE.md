# 🛒 Integração Mercado Pago - Guia Completo

Este documento descreve como usar a integração Mercado Pago no seu site de e-commerce.

## 📋 Índice

- [Configuração Inicial](#configuração-inicial)
- [Endpoints Disponíveis](#endpoints-disponíveis)
- [Como Usar no Frontend](#como-usar-no-frontend)
- [Métodos de Pagamento](#métodos-de-pagamento)
- [Webhook e Notificações](#webhook-e-notificações)
- [Troubleshooting](#troubleshooting)

## 🔧 Configuração Inicial

### 1. Obter Token do Mercado Pago

1. Acesse https://www.mercadopago.com.br/developers/panel
2. Faça login com sua conta
3. Vá até **Credenciais** 
4. Copie o **Access Token** do ambiente SANDBOX (para testes)
5. Para produção, use o token de PRODUCTION

### 2. Configurar Variáveis de Ambiente

No arquivo `.env` do backend, adicione:

```env
MERCADO_PAGO_ACCESS_TOKEN=TEST-seu-token-aqui
FRONTEND_URL=http://localhost:5173
WEBHOOK_URL=http://localhost:3000/webhook
PORT=3000
NODE_ENV=development
```

Use `TEST-` para testes (SANDBOX) e seu token real para produção.

### 3. Instalar Dependências

```bash
cd backend
npm install
```

A dependência `mercadopago` já está no `package.json`.

## 🔌 Endpoints Disponíveis

### 1. Criar Pagamento com Cartão

**POST** `/api/create-payment`

```javascript
{
  "items": [
    {
      "id": "product-1",
      "unit_price": 99.90,
      "quantity": 2
    }
  ],
  "payer": {
    "email": "cliente@exemplo.com",
    "name": "João Silva",
    "phone": "11999999999"
  },
  "card": {
    "number": "4111111111111111",
    "holder_name": "JOAO SILVA",
    "expiration_month": 12,
    "expiration_year": 25,
    "security_code": "123"
  },
  "installments": 1
}
```

**Resposta (sucesso):**
```javascript
{
  "success": true,
  "id": 123456,
  "status": "approved",
  "message": "Pagamento aprovado!"
}
```

### 2. Criar Pagamento com Pix

**POST** `/api/create-pix`

```javascript
{
  "items": [
    {
      "unit_price": 99.90,
      "quantity": 2
    }
  ],
  "payer": {
    "email": "cliente@exemplo.com",
    "name": "João Silva"
  }
}
```

**Resposta (sucesso):**
```javascript
{
  "success": true,
  "id": 123456,
  "status": "pending",
  "qr_code": "00020126580014...",
  "qr_code_base64": "data:image/png;base64,...",
  "qr_code_text": "00020126580014...",
  "expires_in": 1800,
  "message": "QR Code gerado com sucesso"
}
```

### 3. Obter Opções de Parcelamento

**GET** `/api/installments?bin=411111&amount=199.80`

**Resposta:**
```javascript
{
  "success": true,
  "data": [
    {
      "payment_method_id": "credit_card",
      "payer_costs": [
        {
          "installments": 1,
          "installment_rate": 0,
          "discount_rate": 0,
          "recommended_message": "1x de R$ 199,80"
        },
        {
          "installments": 2,
          "installment_rate": 2.05,
          "discount_rate": 0,
          "recommended_message": "2x de R$ 102,75"
        }
      ]
    }
  ]
}
```

### 4. Criar Preferência (Checkout Pro)

**POST** `/api/create-preference`

Usado para redirecionar para o checkout hospedado do Mercado Pago.

```javascript
{
  "items": [
    {
      "id": "product-1",
      "name": "Produto X",
      "quantity": 2,
      "price": 99.90
    }
  ],
  "payer": {
    "email": "cliente@exemplo.com",
    "name": "João Silva"
  }
}
```

**Resposta:**
```javascript
{
  "success": true,
  "id": "preference-id-123",
  "init_point": "https://www.mercadopago.com/checkout/v1/redirect?...",
  "sandbox_init_point": "https://sandbox.mercadopago.com/checkout/v1/redirect?..."
}
```

### 5. Consultar Status de Pagamento

**GET** `/api/payment/:id`

Retorna o status atual de um pagamento.

```javascript
{
  "success": true,
  "id": 123456,
  "status": "approved",
  "status_detail": "accredited",
  "amount": 199.80,
  "payment_method": "credit_card",
  "created_at": "2026-02-01T10:30:00Z",
  "approved_at": "2026-02-01T10:31:00Z"
}
```

## 💻 Como Usar no Frontend

### Exemplo: Pagar com Cartão

```tsx
const handleCardPayment = async () => {
  try {
    const response = await fetch('/api/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          {
            id: "1",
            unit_price: 99.90,
            quantity: 2
          }
        ],
        payer: {
          email: "cliente@exemplo.com",
          name: "João Silva",
          phone: "11999999999"
        },
        card: {
          number: "4111111111111111",
          holder_name: "JOAO SILVA",
          expiration_month: 12,
          expiration_year: 25,
          security_code: "123"
        },
        installments: 1
      })
    })

    const result = await response.json()

    if (result.success) {
      alert('Pagamento aprovado!')
      // Redirecionar para página de sucesso
    } else {
      alert('Erro: ' + result.message)
    }
  } catch (error) {
    console.error('Erro:', error)
  }
}
```

### Exemplo: Pagar com Pix

```tsx
const handlePixPayment = async () => {
  try {
    const response = await fetch('/api/create-pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          {
            unit_price: 99.90,
            quantity: 2
          }
        ],
        payer: {
          email: "cliente@exemplo.com",
          name: "João Silva"
        }
      })
    })

    const result = await response.json()

    if (result.success) {
      // Exibir QR Code
      const img = new Image()
      img.src = `data:image/png;base64,${result.qr_code_base64}`
      document.body.appendChild(img)

      // Copiar código para clipboard
      navigator.clipboard.writeText(result.qr_code_text)
    }
  } catch (error) {
    console.error('Erro:', error)
  }
}
```

## 💳 Métodos de Pagamento

### Cartão de Crédito

- Suporta parcelamento de até 12x
- Cartões de teste: 
  - Visa: `4111 1111 1111 1111`
  - Mastercard: `5105 1051 0510 5100`
  - Amex: `3782 822463 10005`

### Pix

- Pagamento instantâneo
- Gera QR Code válido por 30 minutos
- Sem parcelamento
- Ideal para pagamentos rápidos

### Boleto (Opcional)

Adicione `payment_method_id: "ticket"` para aceitar boleto.

## 🔔 Webhook e Notificações

O Mercado Pago envia notificações para `WEBHOOK_URL` quando um pagamento é processado.

### Endpoint Webhook

**POST** `/webhook?type=payment&data.id=123456`

Você recebe um `query parameter` com o ID do pagamento. Implemente a lógica para:

1. Buscar o pagamento pelo ID
2. Verificar o status
3. Atualizar o banco de dados (status do pedido)
4. Enviar email de confirmação

**Exemplo:**

```javascript
app.post("/webhook", async (req, res) => {
  const { type, data } = req.query

  if (type === "payment" && data?.id) {
    try {
      // Buscar status do pagamento
      const result = await payment.get({ id: data.id })

      if (result.status === "approved") {
        // Atualizar pedido no banco de dados
        // await updateOrderStatus(data.id, "confirmed")
        
        // Enviar email
        // await sendConfirmationEmail(result.payer.email)
      }

      res.sendStatus(200)
    } catch (error) {
      console.error("Erro ao processar webhook:", error)
      res.sendStatus(500)
    }
  } else {
    res.sendStatus(200)
  }
})
```

## 🧪 Teste as Integrações

### Com Cartão:

Use os seguintes dados de teste:

| Campo | Valor |
|-------|-------|
| Número | `4111 1111 1111 1111` |
| Titular | `APRO` |
| Validade | `12/25` |
| CVV | `123` |

### Com Pix:

O QR Code gerado é válido e pode ser testado no seu banco.

## 🛠️ Troubleshooting

### Erro: "Invalid access token"

- Verifique se o token foi copiado corretamente
- Certifique-se de não incluir espaços em branco
- Use um token SANDBOX para testes (começa com `TEST-`)

### Erro: "Insufficient data/Invalid request"

- Valide o formato do JSON
- Certifique-se que `items` não está vazio
- Verifique se `payer.email` é válido

### Pix não gera QR Code

- Verifique se o ambiente Sandbox está correto
- Teste com um valor mínimo (ex: R$ 1,00)
- Veja os logs no console do backend

### Pagamento não aparece como aprovado

- O Mercado Pago pode levar alguns segundos
- Implemente polling ou use webhooks
- Verifique o status com `/api/payment/:id`

## 📚 Recursos Adicionais

- [Documentação Mercado Pago](https://www.mercadopago.com/developers/pt_br)
- [SDK JavaScript](https://www.mercadopago.com/developers/pt_br/reference/sdks/javascript)
- [API Reference](https://www.mercadopago.com/developers/pt_br/reference/payments/_payments/post)

## ⚙️ Suporte

Para problemas com a integração, entre em contato com:

- Suporte Mercado Pago: https://www.mercadopago.com/contact
- Issues do repositório: [seu-repo/issues]
