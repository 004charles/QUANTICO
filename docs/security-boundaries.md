# Quantico Intelligence — Limites de Segurança

## Isolamento por organização

Cada recurso de negócio recebe um `organizationId`. A resolução da organização atual ocorre no servidor através de uma associação entre utilizador autenticado e organização, e não por um identificador fornecido pelo cliente. O primeiro acesso autenticado cria uma organização própria e uma associação com papel de proprietária; acessos futuros só retornam a organização da qual o utilizador é membro.

## Consultas analíticas

A API não executa SQL bruto recebido do cliente. Consultas candidatas são validadas, auditadas e somente fluxos de leitura podem seguir para uma futura camada de execução. O validador rejeita múltiplas instruções, comentários, comandos de escrita ou administração, funções de arquivo, metadados do sistema e operações de atraso. As primeiras consultas executáveis são construídas a partir de métricas previamente aprovadas e incluem o `organizationId` como parâmetro definido exclusivamente no servidor.

## Inteligência artificial

O frontend não recebe chaves de provedores de IA. A integração com Groq é chamada apenas pelo backend através da variável de ambiente `GROQ_API_KEY` e de uma interface de provedor, preservando a possibilidade de introduzir outros provedores sem alterar a experiência do cliente. Antes de enviar um pedido à IA, o backend resolve a organização do utilizador, obtém métricas exclusivamente pelo read model autorizado e impede análises quantitativas quando não há dados conectados.

## Relatórios recorrentes

Cada relatório tem um identificador de tarefa de agendamento persistido. O endpoint recorrente aceita apenas chamadas autenticadas como cron e resolve o relatório por esse identificador; não confia em `reportId` enviado pelo corpo da requisição. A ativação de cadências exige uma versão publicada, pois o agendador chama a URL de produção.
