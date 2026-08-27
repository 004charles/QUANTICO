# Referências externas — Conectores Google Sheets

## Princípios usados na implementação

| Fonte | Informação aplicada |
|---|---|
| [OAuth 2.0 para Google APIs](https://developers.google.com/identity/protocols/oauth2) | A aplicação deve pedir permissões de forma incremental, enviar tokens em cabeçalhos de autorização e guardar tokens de actualização em armazenamento seguro. |
| [Criar credenciais Google Workspace](https://developers.google.com/workspace/guides/create-credentials) | Para uma planilha específica, uma conta de serviço deve receber partilha directa no ficheiro; os papéis IAM por si só não concedem acesso a Sheets. |
| [Scopes da Google Sheets API](https://developers.google.com/workspace/sheets/api/scopes) | A validação usa exclusivamente o scope de leitura `https://www.googleapis.com/auth/spreadsheets.readonly`. |

Estas fontes foram consultadas em 27 de agosto de 2026. A Quantico guarda a credencial introduzida apenas cifrada no servidor e testa metadados da planilha, sem enviar a credencial para o navegador.
