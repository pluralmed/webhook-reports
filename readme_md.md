# Power BI Webhook para ChatGPT

Este projeto cria um webhook que permite integrar dados do Power BI com um GPT personalizado do ChatGPT.

## 🚀 Deploy na Vercel

### Pré-requisitos
- Conta no GitHub
- Conta na Vercel
- Credenciais do Power BI

### Passo a passo

1. **Clone/Fork este repositório**
2. **Configure as variáveis de ambiente na Vercel**
3. **Faça o deploy**

## 🔧 Configuração

### Variáveis de Ambiente (Opcional)

Na Vercel, configure estas variáveis para maior segurança:

```
POWERBI_CLIENT_ID=seu_client_id_aqui
POWERBI_CLIENT_SECRET=seu_client_secret_aqui
```

### Endpoints Disponíveis

- `GET /api/test` - Teste se a API está funcionando
- `POST /api/` - Endpoint principal para consultas

## 📊 Como Usar

### Teste Manual

```bash
# Teste se está funcionando
curl https://seu-app.vercel.app/api/test

# Consulta dados
curl -X POST https://seu-app.vercel.app/api/ \
  -H "Content-Type: application/json" \
  -d '{"question": "Quantos registros temos no total?"}'
```

### Integração com ChatGPT

Use este schema OpenAPI no seu GPT personalizado:

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Power BI Data API",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "https://seu-app.vercel.app"
    }
  ],
  "paths": {
    "/api": {
      "post": {
        "operationId": "getPowerBIData",
        "summary": "Buscar dados do Power BI",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "question": {
                    "type": "string",
                    "description": "Pergunta do usuário sobre os dados"
                  },
                  "customQuery": {
                    "type": "string",
                    "description": "Query DAX personalizada (opcional)"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Dados obtidos com sucesso"
          }
        }
      }
    }
  }
}
```

## 🔍 Tipos de Perguntas Suportadas

- **Totais**: "Quantos registros temos?"
- **Setores**: "Mostre a distribuição por setor"
- **Colaboradores**: "Quais colaboradores aparecem mais?"
- **Atividades**: "Quais são as principais atividades?"
- **Dados gerais**: Qualquer outra pergunta retorna uma amostra dos dados

## 🛠️ Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# A API estará disponível em http://localhost:3000
```

## 📝 Estrutura do Projeto

```
powerbi-webhook/
├── api/
│   └── index.js          # Função serverless principal
├── package.json          # Dependências do projeto
├── vercel.json          # Configuração da Vercel
└── README.md            # Este arquivo
```

## 🔒 Segurança

⚠️ **Importante**: 
- Use variáveis de ambiente para dados sensíveis
- Considere implementar autenticação no webhook
- Monitore o uso para evitar abuse

## 🐛 Troubleshooting

### Erro de Token
- Verifique se as credenciais estão corretas
- Confirme se o aplicativo tem as permissões necessárias no Power BI

### Erro de Dados
- Verifique se os IDs do workspace e dataset estão corretos
- Confirme se a query DAX está correta

### Timeout
- Queries muito complexas podem demorar mais de 30 segundos
- Considere otimizar as queries ou aumentar o timeout na Vercel

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs na Vercel
2. Teste os endpoints manualmente
3. Confirme as configurações do Power BI