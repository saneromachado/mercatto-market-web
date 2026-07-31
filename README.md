# Mercatto Market Web

Frontend de gestão conectado à [Market API](../market-api). O painel cobre:

- autenticação JWT;
- visão geral da operação;
- catálogo de produtos e categorias;
- movimentações e alertas de estoque;
- frente de caixa e formas de pagamento;
- histórico e cancelamento de vendas.

## Execução local

Com a API rodando em `http://localhost:3000`:

```bash
cp .env.example .env.local
npm install
$env:PORT=3001; npm run dev
```

Abra `http://localhost:3001` e use o usuário
criado pelo seed da API:

- e-mail: `admin@market.local`
- senha: `admin123`

A URL do backend também pode ser alterada na tela de login ou no botão de
configurações do painel.

## Validação

```bash
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

O teste de ponta a ponta pressupõe:

- Market API em `http://localhost:3000/api`;
- Mercatto Market Web em `http://localhost:3001`.

## Ambiente de produção

Configure:

```env
NEXT_PUBLIC_API_URL=https://market-api-njmw.onrender.com/api
```

O backend precisa estar disponível por HTTPS e permitir CORS para o domínio do
frontend.
