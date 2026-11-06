# Inventário direcionado da reformulação CTI

Base verificada em 05/11/2026: `1dbaac251b3f4d39cddd0b6bdb5be166382a8ba8`. O plano foi redigido sobre `f8afc69106b2acef4f98e99e4e8c4dff14e0291a`; o delta contém somente `AGENTS.md` e o próprio plano. A branch de integração está limpa no início da T01. Esta auditoria descreve código existente, não aceite funcional.

## Preservar, adaptar, retirar

| Área | Preservar | Adaptar ou retirar | Consumidores e risco |
| --- | --- | --- | --- |
| Runtime | Node >=22.13, Express, `node:sqlite`, HTML/CSS/JS, `node --test` | Nenhuma dependência nova prevista | `app/package.json`, scripts e todos os testes |
| Banco | `clients`, contatos, interações, serviços, `feedbacks`, `feedback_context`, ações/tentativas/eventos de qualidade | Acrescentar apenas garantias de origem/identidade, hipótese e automação em cada tarefa consumidora; preservar colunas históricas de sentimento sem produção local | `database.js` recria `feedback_overview` em todo bootstrap; todas as rotas e testes de CRM/SGQ a consomem. Validar reinício e banco legado |
| Ingestão | `feedback-repository.js` e transação local SQLite como ponto de entrada reutilizável | T02: fonte fictícia substituível, chave única e correspondência segura; T03 retira `POST /api/feedback` e `/internal` | `feedback-routes.js`, `app.js`, `server.js`, `start-demo.js`, testes `feedback*` |
| CRM | Cadastro manual de clientes, contatos, interações, serviços e vínculo por cliente | T04: histórico importado, feedback somente consulta, identidade pendente e edição controlada | `client-routes.js`, `crm-routes.js`, `manager-routes.js`, `workspace.*`, `app.js` do front, páginas e testes |
| SGQ | Tentativas, eficácia e trilha de eventos | T05: hipóteses/evidências/revisão; T06: ocorrência somente relacional derivada de decisão confirmada, reabertura | `quality-routes.js`, `workflow-utils.js`, `workspace.*`, schema/bootstrap e testes `crm-quality` |
| Sentimento | Classificação **externa**, quando presente, como dado de origem | T03 retira `services/sentiment.js`, revisão/reanálise local e `OPENAI_API_KEY`; T04 remove controles e indicadores derivados | `app.js` servidor, `crm-routes.js`, `manager-routes.js`, `feedback-repository.js`, `feedback_overview`, dashboard, CSV, `.env.example`, `sentiment.test.js` |
| Automação | Serviços e datas efetivamente disponíveis | T08/T09: lembrete e comunicação exclusivamente simulados, preferências, consentimento, relógio e histórico | `service_instances`, CRM/SGQ, `workspace.*`; sem provedor de e-mail |
| Acesso | Sessão com cookie e `requireManager` | Definir permissões para decisões e comunicação no servidor; UI apenas reflete | `sessions.js`, `auth-routes.js`, todas as rotas internas; hoje há um papel de gestor, sem granularidade |
| Documentação | Entregáveis escolares anteriores como evidência histórica | README e instruções ativas apontam para o plano; descrição de IA/coleta antiga fica identificada como história | `AGENTS.md`, `CLAUDE.md`, `README.md`, especificação de 22/10 |

## Ownership e barreiras

As reservas máximas são as da seção 6.1 do plano. T02 ocupa schema/bootstrap/repositório/fixture; T03 passa a ocupar composição e remoção de rotas; T04 e T05 coexistem porque T04 usa `app/public/app.js` e T05 usa `app/src/app.js`. T06 ocupa schema/bootstrap depois de ambas integradas. T07 ocupa `workspace.*`, T08 ocupa schema/bootstrap e `app/src/app.js`. T09 retoma `workspace.*`. Apenas C escreve o progresso e integra. Arquivos não previstos exigem acordo versionado antes da escrita.

## Segurança e preservação

Usar somente fixtures fictícias e `:memory:` ou arquivo SQLite temporário exclusivo por worktree. Não copiar `.env` nem `data/`. Não remover dados históricos por conveniência: colunas antigas podem ficar legíveis até a política de retenção ser definida. `feedback_overview` e os testes legados precisam ser adaptados juntos para que a retirada de sentimento não quebre consultas. A separação técnica/relacional é aplicada no servidor, inclusive nos casos mistos. Consultas usam sessão e SQL parametrizado; mudanças de estado exigem autoria, validação de vínculos e trilha. Nenhuma credencial, e-mail ou integração externa é necessária à demonstração.
