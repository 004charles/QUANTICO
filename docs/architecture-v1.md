# Quantico Intelligence — Arquitetura da Versão 1

## Decisão de implementação

A primeira versão usa uma aplicação React com backend TypeScript integrado, banco relacional gerenciado e uma API tipada. Essa escolha reduz a complexidade operacional inicial e preserva contratos de serviço claros para uma posterior extração para Django/DRF. As responsabilidades de domínio são isoladas por módulos, evitando acoplamento da interface aos mecanismos de análise, consulta e IA.

## Limites de segurança

Toda consulta é vinculada a uma organização e a um utilizador autenticado. A camada analítica aceita somente instruções de leitura, aplica uma lista explícita de palavras bloqueadas e não expõe cadeias de conexão, credenciais ou chaves de IA ao cliente. A integração com provedores de IA é encapsulada no servidor por uma interface de provedor, permitindo que a Groq seja ativada por variável de ambiente na fase de integração.

## Primeiro incremento

O primeiro incremento entrega um cockpit executivo responsivo com módulos de receita, vendas, clientes, previsões, oportunidades e uma experiência “Pergunte ao seu negócio”. Os dados exibidos antes de uma importação real são identificados como dados de demonstração. A base também inclui entidades de organização, fontes de dados, conjuntos importados, consultas analíticas, relatórios e conversas de IA.

