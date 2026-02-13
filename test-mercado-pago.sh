#!/bin/bash
# Script de teste para validar integração Mercado Pago

echo "🧪 Testando Integração Mercado Pago"
echo "===================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Teste de Health Check
echo -e "${BLUE}1. Verificando saúde do servidor...${NC}"
response=$(curl -s http://localhost:3000/health)
if echo $response | grep -q "ok"; then
  echo -e "${GREEN}✓ Servidor respondendo${NC}"
else
  echo -e "${RED}✗ Servidor não respondendo${NC}"
  exit 1
fi
echo ""

# 2. Teste de Parcelamento
echo -e "${BLUE}2. Testando cálculo de parcelamento...${NC}"
response=$(curl -s "http://localhost:3000/api/installments?bin=411111&amount=199.80")
if echo $response | grep -q "success"; then
  echo -e "${GREEN}✓ Parcelamento funcionando${NC}"
  echo "Resposta:" $(echo $response | head -c 100)"..."
else
  echo -e "${RED}✗ Erro ao buscar parcelamento${NC}"
fi
echo ""

# 3. Teste de Pagamento Pix
echo -e "${BLUE}3. Testando geração de Pix...${NC}"
payload='{
  "items": [{"unit_price": 50.00, "quantity": 1}],
  "payer": {"email": "teste@teste.com", "name": "Teste"}
}'
response=$(curl -s -X POST http://localhost:3000/api/create-pix \
  -H "Content-Type: application/json" \
  -d "$payload")

if echo $response | grep -q "QR Code gerado"; then
  echo -e "${GREEN}✓ Pix gerado com sucesso${NC}"
else
  echo -e "${RED}✗ Erro ao gerar Pix${NC}"
fi
echo ""

echo -e "${BLUE}===================================${NC}"
echo -e "${GREEN}✓ Testes básicos concluídos!${NC}"
echo ""
echo "Para testes completos, acesse:"
echo "  Frontend: http://localhost:5173"
echo "  Backend: http://localhost:3000"
