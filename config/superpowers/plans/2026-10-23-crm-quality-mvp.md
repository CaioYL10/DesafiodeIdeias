# Plano de implementação: CRM e qualidade CTI

**Objetivo:** continuar o MVP existente com o fluxo cliente → feedback → triagem humana → problema → ação → eficácia.
**Arquitetura:** manter Express, páginas HTML/JS e SQLite; tabelas adicionais preservam os feedbacks existentes. APIs de gestão exigem a sessão atual. Não há novas dependências.
**Especificação:** `config/superpowers/specs/2026-10-22-crm-sgq-leve-cti-design.md`, aprovada por Caio em 22/10.

## Restrições
- A proposta segue pendente de validação pela CTI.
- A IA somente sugere sentimento; nunca abre problemas nem decide ações.
- Preservar sugestão original e histórico de revisões com gestor e data.
- Usar dados sintéticos na demonstração; não chamar provedores externos nos testes.
- Manter identidade azul CTI, branco e tipografia sem serifa da aplicação existente.
- Não executar commit, push ou publicação nesta etapa.

## Etapas
- [x] Testar cadastro de clientes, vínculo de serviços e feedbacks, revisão humana, autorização e fluxo de qualidade antes da implementação.
- [x] Criar tabelas auxiliares em `app/src/db/schema.sql`: clientes, serviços contratados, contexto do relato, revisões, problemas, vínculos, ações e eventos. Reabrir banco não deve apagar dados.
- [x] Implementar `app/src/routes/crm-routes.js` com cadastro e histórico do cliente, associação do relato e revisões. Rejeitar IDs inexistentes, textos vazios e serviços não vinculados ao cliente.
- [x] Implementar `app/src/routes/quality-routes.js`: abertura humana com feedbacks, ações, conclusão com evidência, verificação posterior e encerramento somente com todas as ações eficazes. Registrar cada mudança no histórico.
- [x] Integrar rotas e páginas protegidas em `app/src/app.js`; ajustar indicadores e filtros para considerar o sentimento revisado, preservando sugestão original.
- [x] Criar telas de clientes, triagem e qualidade usando componentes e identidade existentes. Exibir estados vazios, mensagens de erro, datas, responsáveis e histórico; permitir o fluxo completo pela interface.
- [x] Executar `npm.cmd test`, verificar navegação e fluxo no navegador em desktop e celular, revisar o diff e registrar limitações reais.

## Contratos
- `/api/manager/crm/clients`: GET lista; POST `{name, contact, productIds}`; GET `/:id` histórico.
- `/api/manager/crm/feedback/:id`: PUT `{clientId, productId, kind}`; POST `/:id/reviews` `{sentiment, note}`.
- `/api/manager/quality`: GET problemas e contagens; POST `{title, category, analysis, feedbackIds}`.
- `/api/manager/quality/:id`: GET detalhe/histórico; POST `/:id/actions` `{description, owner, dueDate}`; POST `/:id/close`.
- `/api/manager/quality/actions/:id/complete`: POST `{evidence}`; `/verify`: POST `{effective, note}`.

## Aceite verificável
Teste integrado deve cadastrar cliente e serviço, vincular relato, corrigir sentimento sem sobrescrever sugestão, abrir problema por decisão humana, criar ação, bloquear fechamento prematuro, concluir com evidência, verificar eficácia e então fechar. Testes negativos cobrem acesso anônimo, datas inválidas, entidades inexistentes e estados incompatíveis. Registros legados continuam legíveis.

## Ajuste de execução
O better-sqlite3 exigiu compilação C++ indisponível neste PC. Foi substituído por node:sqlite, disponível no Node mínimo já declarado, mantendo o formato do banco. Os 17 testes antigos passaram com a troca. O módulo emite aviso experimental no Node 24.12.

## Verificação final
- 22 testes automatizados passaram, incluindo fluxo completo, eficácia negativa, filtros, CSV e reabertura do banco.
- Fluxo completo executado no navegador; capturas desktop e celular em `.playwright-mcp/crm-desktop.png` e `.playwright-mcp/crm-mobile.png`. Sem transbordamento horizontal a 390px.
- Revisão de código identificou resposta antiga sobrescrevendo uma nova aba. Corrigido com invalidação por geração da navegação, inclusive após mutações.
- Teste adicional dessa corrida no navegador ficou pendente: revisão automática da ferramenta atingiu limite de uso antes da execução. Não tratar essa correção específica como validada por teste de navegador.
- Nenhum commit, push ou publicação executado.
