# Mercatto Market Web

Frontend de gestão conectado à
[Market API](https://github.com/saneromachado/market-api). O painel cobre:

- autenticação JWT;
- visão geral da operação;
- catálogo de produtos e categorias;
- movimentações e alertas de estoque;
- frente de caixa e formas de pagamento;
- histórico e cancelamento de vendas.

## Sistema publicado

- Site: <https://saneromachado.github.io/mercatto-market-web/>
- Base REST usada pelo frontend: <https://market-api-njmw.onrender.com/api>
- Saúde da API: <https://market-api-njmw.onrender.com/api/health>
- Swagger: <https://market-api-njmw.onrender.com/docs>
- Integração completa:
  <https://github.com/saneromachado/market-api/blob/main/docs/INTEGRACAO.md>

## Execução local

Com a API rodando em `http://localhost:3000`:

```powershell
Copy-Item .env.example .env.local
npm install
$env:PORT = "3001"
npm run dev
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
npm run build:pages
npm run test:e2e
```

`npm run build` gera o bundle usado pelo Sites. `npm run build:pages` gera a
exportação estática em `out/` quando `GITHUB_PAGES=true` está definido.

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

## GitHub Pages

O workflow `.github/workflows/deploy-pages.yml` gera a exportação estática com
`NEXT_PUBLIC_API_URL=https://market-api-njmw.onrender.com/api` e publica o site
em `https://saneromachado.github.io/mercatto-market-web/` após cada push na branch
`main`.

O repositório deve usar **Settings > Pages > Source: GitHub Actions**. O caminho
base `/mercatto-market-web` é aplicado somente nesse build. Se o frontend exibir
`Failed to fetch`, confirme que o último deploy do Render terminou e que a API
autoriza a origem `https://saneromachado.github.io`.

Consulte a
[documentação completa da integração](https://github.com/saneromachado/market-api/blob/main/docs/INTEGRACAO.md)
para arquitetura, autenticação, CORS, variáveis, deploy e solução de problemas.
