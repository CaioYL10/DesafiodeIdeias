# Desafio de Ideias — GR1 (SENAI)

Repositório escolar do Grupo 1, turma 2IEDS (2026). A proposta atual é um CRM voltado à experiência do cliente da CTI, integrado a uma gestão leve da qualidade. **É uma hipótese do grupo, ainda não validada pela CTI.** A demanda original da Avanade e os documentos escolares anteriores estão preservados como histórico.

## Aplicação atual

`app/` contém um protótipo local AvaliaPlay CTI, baseado no Figma e adaptado para demonstrar fluxos de CRM. É servido por um servidor HTTP mínimo em Node.js, com interface HTML, CSS e JavaScript, sem dependências externas. A interface reúne visão geral, login demonstrativo, feedbacks, clientes, serviços, relações e acompanhamento de problemas e ações de qualidade. Não há envio público de feedback nesta versão.

```powershell
cd app
npm.cmd start
```

Acesse `http://localhost:3000`. O login é apenas demonstrativo: basta informar um e-mail válido e uma senha não vazia; não há autenticação ou proteção real. A sessão demonstrativa fica no `sessionStorage`, e os dados e alterações ficam no `localStorage` do navegador. Os dados iniciais são fictícios, inclusive contatos, métricas financeiras, SLA e feedbacks. Empresas mostradas na lista são exemplos visuais e não indicam relação comercial confirmada com a CTI.

A triagem local reúne feedbacks negativos de atendimento com o mesmo motivo quando há pelo menos **3 relatos**; podem ser de empresas diferentes. Isso é uma regra demonstrativa no navegador, não IA nem processo validado pela CTI. O app também não tem banco de dados, integração externa, envio de mensagens ou persistência compartilhada entre usuários. **Não use dados reais ou confidenciais.**

## Contexto e documentação

- [`docs/contexto/mudanca_de_escopo_cti.md`](docs/contexto/mudanca_de_escopo_cti.md): histórico da mudança Avanade → CTI e hipótese atual.
- [`config/superpowers/specs/2026-10-22-crm-sgq-leve-cti-design.md`](config/superpowers/specs/2026-10-22-crm-sgq-leve-cti-design.md): referência de escopo proposta pelo grupo, pendente de validação pela CTI.
- [`docs/contexto/backlog_futuro_produto.md`](docs/contexto/backlog_futuro_produto.md): ideias futuras, sem compromisso de implementação.
- [`docs/README.md`](docs/README.md): mapa dos materiais escolares, entregáveis e scripts.
- [`config/README.md`](config/README.md): mapa das especificações e registros técnicos.

Os documentos em `config/superpowers/plans/` registram planos e decisões de etapas anteriores; não descrevem necessariamente a implementação atual. Veja `app/` para o comportamento presente. Os arquivos oficiais em `docs/fontes/` e os entregáveis em `docs/entregas/historico_avanade/` são preservados como referência histórica.
