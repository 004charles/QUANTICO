# Validação da versão publicada

Em 27 de agosto de 2026, a rota pública `https://quanticoai-gyxgdyra.manus.space/actions?v=f51eadd2-2` passou a carregar a versão consolidada da Quantico Intelligence após a propagação da publicação automática.

| Verificação | Resultado |
|---|---|
| Navegação das novas áreas | Disponíveis: Conectores e campos, Áreas de análise, Ações e alertas e Equipa e acessos. |
| Rota `/actions` | Carrega o título, o sinal agregado de clientes em risco, criação de ação, avaliação de alertas e criação de alerta. |
| Rota `/onboarding` | Após a propagação do checkpoint `9b4f1de3`, carrega a configuração da organização, prioridades, maturidade dos dados e envio inicial de ficheiro. |
| Rota `/connectors` | Carrega o inventário de fontes, campos de ligação, aviso de credenciais cifradas e mapeamento de colunas por ficheiro. |
| Rota `/areas` | Carrega os painéis de Direcção, Vendas, Clientes e Operações, com a explicação de que a visibilidade pessoal não substitui as permissões do servidor. |
| Rota `/reports` | Carrega a criação de relatórios e a explicação dos controlos de activar, pausar e retomar cadências. O carregamento das listas exige sessão autenticada, como esperado para dados multi-tenant. |
| Segurança da apresentação | A página pública apresentada usa o workspace de demonstração e não mostra segredos, credenciais ou linhas brutas de dados. |

Esta verificação é complementar à suíte automatizada de 79 testes e à revisão responsiva realizada antes do checkpoint `f51eadd2`.
