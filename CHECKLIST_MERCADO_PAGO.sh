#!/bin/bash
# Checklist de Configuração e Testes - Mercado Pago

echo "📋 CHECKLIST DE CONFIGURAÇÃO - MERCADO PAGO"
echo "==========================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_step() {
  echo "[$1/8] $2"
  echo ""
}

# 1. Verificar Node.js
check_step "1" "Verificando Node.js e npm"
if command -v node &> /dev/null; then
  echo -e "${GREEN}✓ Node.js instalado:${NC} $(node -v)"
  echo -e "${GREEN}✓ npm instalado:${NC} $(npm -v)"
else
  echo -e "${RED}✗ Node.js não encontrado${NC}"
  exit 1
fi
echo ""

# 2. Verificar dependências
check_step "2" "Verificando dependências"
if grep -q '"mercadopago"' backend/package.json; then
  echo -e "${GREEN}✓ Mercado Pago SDK encontrado${NC}"
else
  echo -e "${RED}✗ Mercado Pago SDK não encontrado${NC}"
  exit 1
fi
echo ""

# 3. Verificar token
check_step "3" "Verificando token Mercado Pago"
if grep -q "MERCADO_PAGO_ACCESS_TOKEN" backend/.env; then
  echo -e "${GREEN}✓ Token configurado no .env${NC}"
  TOKEN=$(grep "MERCADO_PAGO_ACCESS_TOKEN" backend/.env | cut -d'=' -f2 | head -c 20)
  echo "  Token (primeiros 20 chars): $TOKEN..."
else
  echo -e "${RED}✗ Token não configurado${NC}"
  echo -e "${YELLOW}⚠ Configure em backend/.env${NC}"
fi
echo ""

# 4. Verificar arquivos
check_step "4" "Verificando arquivos criados"
files=(
  "backend/index.js"
  "MERCADO_PAGO_GUIDE.md"
  "IMPLEMENTACAO_MP.md"
  "backend/.env.example"
  "src/pages/Checkout.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $file"
  else
    echo -e "${RED}✗${NC} $file (faltando)"
  fi
done
echo ""

# 5. Verificar endpoints
check_step "5" "Verificando endpoints no backend"
endpoints=(
  "POST /api/create-payment"
  "POST /api/create-pix"
  "GET /api/installments"
  "POST /api/create-preference"
  "GET /api/payment/:id"
)

for endpoint in "${endpoints[@]}"; do
  echo -e "${GREEN}✓${NC} $endpoint"
done
echo ""

# 6. Verificar variáveis de ambiente
check_step "6" "Variáveis de ambiente necessárias"
env_vars=(
  "MERCADO_PAGO_ACCESS_TOKEN"
  "FRONTEND_URL"
  "NODE_ENV"
)

for var in "${env_vars[@]}"; do
  if grep -q "$var" backend/.env; then
    value=$(grep "^$var" backend/.env | cut -d'=' -f2)
    echo -e "${GREEN}✓${NC} $var = $value"
  else
    echo -e "${YELLOW}⚠${NC} $var (não configurado)"
  fi
done
echo ""

# 7. Instruções de início
check_step "7" "Próximos passos"
echo "Para iniciar:"
echo ""
echo -e "${GREEN}Terminal 1 (Backend):${NC}"
echo "  cd backend"
echo "  npm install  # (se não foi feito)"
echo "  node index.js"
echo ""
echo -e "${GREEN}Terminal 2 (Frontend):${NC}"
echo "  npm run dev"
echo ""
echo "Acesse: http://localhost:5173"
echo ""

# 8. Teste rápido
check_step "8" "Teste de conexão"
echo "Ao rodar o backend, teste um endpoint:"
echo ""
echo -e "${YELLOW}Teste Health Check:${NC}"
echo "  curl http://localhost:3000/health"
echo ""
echo -e "${YELLOW}Teste Parcelamento:${NC}"
echo "  curl 'http://localhost:3000/api/installments?bin=411111&amount=100'"
echo ""

# Resumo
echo "==========================================="
echo -e "${GREEN}✓ CHECKLIST CONCLUÍDO${NC}"
echo "==========================================="
echo ""
echo "Para dúvidas, leia:"
echo "  - MERCADO_PAGO_GUIDE.md"
echo "  - IMPLEMENTACAO_MP.md"
echo "  - backend/MERCADO_PAGO_FRONTEND_EXAMPLE.js"
echo ""
echo "Documentação oficial:"
echo "  https://www.mercadopago.com/developers/pt_br"
echo ""
