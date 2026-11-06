# Reformulação CTI — plano executável com Codex, Git Worktrees e Orca

> Planejamento apenas. Este documento não declara funcionalidades implementadas.
> Auditoria: 05/11/2026, repositório `CaioYL10/DesafiodeIdeias`, base `f8afc69106b2acef4f98e99e4e8c4dff14e0291a`.
> Revalidar o delta da base antes de executar. Até **3 sessões Codex no total: coordenador C + workers A e B**. Não são três workers adicionais.

## 1. Contexto e objetivo da reformulação

Evoluir o produto existente para CRM de relacionamento e SGQ da qualidade desse relacionamento. A entrega continua sendo uma demonstração **local**, com feedbacks fictícios de origem externa simulada e comunicações simuladas. Não implementar integração externa real, provedor de e-mail, IA nova, nova stack, servidor/banco para simular a origem nem fase de remodelagem de domínio/migrações.

As sete etapas funcionais originais continuam normativas no anexo A, integralmente quanto ao produto, aos testes e aos aceites. As ondas reorganizam sua execução; não reduzem seu conteúdo. Os únicos ajustes são operacionais: ordem por dependência, divisão em tarefas, commits autônomos e integração local autorizada. Segurança e LGPD são condições de cada tarefa.

**Precedência:** autorização atual do usuário e regras de produto deste plano prevalecem sobre instruções antigas de coleta/sentimento e de pedir mensagem de commit em `AGENTS.md`, `CLAUDE.md`, documentos e etapas anteriores. T01 deve alinhar as instruções ativas sem apagar registros históricos. Não descrever a proposta como validada pela CTI sem evidência. Não executar funcionalidades ao receber somente pedido para editar este planejamento.

## 2. Arquitetura atual e arquitetura desejada

### 2.1 Evidências da base analisada

| Área | Implementação existente | Consequência para o plano |
|---|---|---|
| Runtime | `app/package.json`: Node >=22.13.0, CommonJS, Express 5.3, `node --test`; dependências express/docx | Preservar stack; não pressupor Vue, Laravel, MySQL, bundler, linter ou Docker |
| Composição | `app/src/app.js`, `server.js` | Rotas, páginas protegidas, arquivos estáticos e injeção de sentimento se concentram aqui |
| Persistência | `app/src/db/database.js`, `schema.sql`, `feedback-repository.js`; `node:sqlite`, WAL para arquivo | Banco é ponto de serialização; bootstrap já adapta estruturas antigas e recria view |
| Entidades | clients, client_contacts, client_interactions, client_products, service_instances, feedbacks, feedback_context, sentiment_reviews, quality_problems/actions/attempts/events | Reutilizar; faltam garantias explícitas de identidade externa/idempotência, hipótese relacional e automação no desenho atual |
| CRM | `routes/crm-routes.js` monta `client-routes.js`; associação de feedback, revisão de sentimento e cadastro manual existentes | Cadastro de cliente permanece; revisão de sentimento local deve sair, revisão de hipótese é outro comportamento |
| SGQ | `routes/quality-routes.js`, `workflow-utils.js` | Já há investigação, ações, tentativas, eficácia e bloqueios de encerramento; preservar e adaptar ao recorte relacional |
| Coleta/IA legadas | `feedback-routes.js`, `services/sentiment.js`, `manager-routes.js`, configuração OPENAI em `.env.example` | Remover produtores e consumidores exclusivos, não apenas esconder botões |
| Front | `public/workspace.js/html/css`, `app.js`, `manager-feedbacks.html`, dashboard, navigation, products | CRM, triagem e qualidade compartilham workspace.js; app.js também atende múltiplas páginas |
| Segurança | `middleware/require-manager.js`, `security/sessions.js`, `passwords.js` | Autenticação de gestor não prova granularidade de papéis: verificar e adaptar permissões necessárias no servidor |
| Execução | `npm start`, `npm run dev`, `npm run demo`, `npm run manager:create`, `npm test`, sempre dentro de `app/` | Demo atual usa memória; repetição após reinício também precisa ser testada com banco temporário em arquivo |
| Testes | `app/test/*.test.js`, `app/test-support/server.js` | Servidor de teste em porta efêmera; há testes que afirmam comportamento legado e precisarão ser substituídos por testes negativos |
| Documentação | README, AGENTS, CLAUDE, docs/contexto e config/superpowers/specs | Há instruções históricas de sentimento/coleta incompatíveis com o escopo atual |

Inspeção de código realizada; testes funcionais da aplicação não foram executados nesta edição documental. Não confundir inspeção com aprovação de segurança ou validação funcional.

### 2.2 Arquitetura desejada, sem reconstrução

Manter Express, SQLite e HTML/CSS/JS. Um fornecedor simples de dados fictícios alimenta ingestão validada/idempotente; esta cria/vincula clientes com identidade segura e preserva histórico. Consultas CRM/feedbacks leem esses registros. O SGQ organiza hipóteses relacionais, decisão humana e ocorrências/ações/eficácia. Retenção usa relógio controlável e saída de comunicação simulada substituível. Não há chamada de rede necessária à jornada.

Definir interfaces internas mínimas **dentro da auditoria/documentação T01**, não uma fase nova de contratos nem contrato oficial com o sistema externo. Ajustes indispensáveis de persistência ocorrem na tarefa funcional consumidora, pelo mecanismo existente, com compatibilidade e recuperação; não criar programa de migrações nem redesenhar todo o domínio.

## 3. Regras de negócio e requisitos preservados

O anexo A mantém decisões, sete especificações e checklist originais. Em especial:

- Origem externa coleta feedbacks e analisa técnica; CTI importa, gere clientes e analisa somente relacionamento. Feedback misto mantém referência técnica externa e separa dimensão relacional.
- Cadastro automático é a entrada principal; dados mínimos confiáveis, identificador estável/CNPJ quando aplicável, regras explícitas de correspondência e revisão de ambiguidades. Nome semelhante não autoriza vínculo. Cadastro manual de **clientes** permanece secundário.
- Repetição e reprocessamento não duplicam, falhas parciais não perdem registros nem sobrescrevem decisões humanas/dados internos sem regra.
- Feedbacks autorizados ficam em consulta paginada, busca/filtros/detalhes, sem criação, envio, edição do conteúdo externo ou sentimento local. Classificação externa tem origem identificada.
- Hipóteses mostram evidências, período, critérios, limitações; revisão pendente/confirmada/rejeitada/ajustada, com autoria/data/justificativa. Sem culpa, causalidade ou ocorrência automática.
- Ocorrências relacionais partem de hipótese confirmada por pessoa autorizada; investigação, responsável, prioridade/prazo quando aplicáveis, ações, eficácia e encerramento/reabertura justificados e auditáveis. Nem todo feedback é não conformidade.
- Retenção/serviços/oportunidades pertinentes e automações respeitam consentimento, frequência, destinatários, configuração, cancelamento, retentativa e idempotência; envio é exclusivamente simulado e identificado.
- Retirada de código legado não apaga dados históricos. Minimização, autorização, finalidade, retenção, correção, trilha, segredos e logs seguros são requisitos transversais.

## 4. Mapa de dependências entre tarefas

IDs abaixo são lógicos; mapear aos IDs reais do Orca. “Concluída” no Orca não significa integrada: dependentes só iniciam após revisão, merge local e registro do SHA de integração.

| Tarefa | Origem | Dependências duras | Entrega consumida |
|---|---|---|---|
| T01 Contexto, inventário e acordos internos | E1 | nenhuma | Mapa de arquivos/consumidores, decisões mínimas, fixtures e permissões planejadas |
| T02 Ingestão/identidade | E2 | T01 | Persistência compatível, entrada fictícia e API interna de leitura estáveis |
| T03 Retirada de coleta/sentimento no servidor | E2 | T02 | Composição/rotas somente no escopo; importação preservada |
| T04 CRM e consulta de feedbacks | E3 + retirada visual E2 | T03 | Visão e navegação com dados importados e somente consulta de feedback |
| T05 Hipóteses/revisão no servidor | E4 | T03 | Hipótese e decisão humana rastreáveis, leitura para ocorrência |
| T06 Ocorrências/investigação/ações no servidor | E5 | T04, T05 | Ciclo relacional completo, transições e reabertura |
| T07 Interface SGQ | E4/E5 | T04, T06 | Hipóteses, revisão e ciclo de qualidade acessíveis |
| T08 Retenção/automações no servidor | E6 | T06 | Comunicação simulada e preferências persistidas; relógio controlável |
| T09 Interface retenção/automações | E6 | T07, T08 | Controles, prévia e histórico de simulação |
| T10 Auditoria integrada e regressão | E7 | T09 | Evidência completa da jornada e correções validadas |

T04 e T05 podem começar juntos. T07 e T08 também. T06 espera T04/T05 integradas para validar os vínculos cliente/feedback antes do ciclo SGQ e fechar a barreira de regressão da onda 3. T08 espera T06 porque ambos podem necessitar do schema/bootstrap. Não usar status “ready” do Orca sozinho como autorização para iniciar.

## 5. Plano de execução em ondas paralelas

C é uma sessão coordenadora permanente; executa tarefas seriais e integra. A e B são workers efêmeros, papéis reutilizáveis, não agentes extras permanentes. Ondas são barreiras de integração; dentro delas despachar assim que a tarefa estiver elegível. Não ocupar sessões ociosas para atingir artificialmente três agentes.

| Onda | Trabalho simultâneo | Sessões recomendadas | Pré-requisito e barreira de saída | Integração |
|---|---|---:|---|---|
| 0 | C: T01 | 1 | Inventário e interfaces internas mínimos publicados; nenhuma funcionalidade | Commit documental local |
| 1 | A: T02; C acompanha | 2 | T01; testes de ingestão/compatibilidade e dados preservados | Revisar e integrar T02 |
| 2 | A: T03; C acompanha | 2 | T02; remoção backend sem quebrar ingestão/consumidores | Integrar T03 antes de UI/análise |
| 3 | A: T04 **em paralelo** com B: T05 | 3 | T03; UI usa leituras estabilizadas, backend SGQ sem tocar front | Integrar T05 e T04, testar consumidores cruzados |
| 4 | A: T06; C acompanha | 2 | T04/T05 integradas; schema/bootstrap ficam exclusivos de T06 | Integrar T06 e estabilizar ciclo SGQ |
| 5 | A: T07 **em paralelo** com B: T08 | 3 | T06; UI SGQ usa T05/T06, automações não alteram workspace | Integrar T08 e T07, validar navegação/composição |
| 6 | A: T09; C acompanha | 2 | T07/T08; workspace liberado e endpoints simulados estáveis | Integrar T09 e executar smoke da jornada |
| 7 | A: T10 segurança/servidor **em paralelo** com B: T10 UX/docs/testes de interface; C integra | 3 | T09; auditorias inicialmente sem escrita compartilhada | Correções com locks, suíte/jornada integrada e relatório |

**Total: 8 ondas (0–7).** C não modifica arquivos reservados a workers ativos. Na onda 7 revisores não aprovam sozinhos mudanças próprias; C revisa. Se auditorias acharem defeito em arquivo de outro dono, registrar e devolver ao dono; nunca dois corretores simultâneos no mesmo arquivo. A verificação final ocorre depois de todas as correções integradas.

## 6. Tarefas individuais, escopo e critérios de aceite

### 6.1 Ownership e interfaces de trabalho

Os caminhos abaixo são permissões máximas, não obrigação de criar arquivos. Caminhos novos são propostas a confirmar por C em T01. Cada tarefa pode escrever seu relatório `docs/reformulation/tasks/Txx.md` e testes próprios `app/test/reformulation-Txx.test.js`. Testes compartilhados só podem mudar com reserva explícita. Todo caminho não listado exige negociação antes da alteração.

**Arquivos compartilhados:** `app/src/app.js`, `server.js`, `db/schema.sql`, `db/database.js`, `public/workspace.js`, `public/app.js`, `public/navigation.js`, CSS global, scripts demo, manifests/lockfile e testes antigos têm um único dono por intervalo. `docs/reformulation-progress.md` e este plano são escritos somente por C. Mesmo worktrees separados não eliminam conflitos semânticos.

| Tarefa/dono | Pode modificar | Interface necessária antes de iniciar | Aceite e verificações mínimas |
|---|---|---|---|
| T01/C | AGENTS.md, CLAUDE.md, README.md, docs textuais ativos, config/superpowers/specs ativos, docs/reformulation/* | Base Git real e instruções locais lidas | E1 integral: limites técnicos/relacionais em docs; inventário preservar/adaptar/remover; formatos fictícios, mapa de consumidores, ownership e matriz de aceite. `git diff --check` e revisão de consistência; nenhuma funcionalidade |
| T02/A | db/schema.sql, database.js, feedback-repository.js; novos serviços locais de ingestão/fixture; scripts de carga/demo; testes de ingestão | Chave de evento, mínimos de cliente, correspondência, falhas e autoridade de campos acordados em T01 | E2 de ingestão integral: novo/existente/repetido/ambíguo/inválido/falha/reprocessamento/dados internos; cadastro manual preservado. Testes com SQLite memória e arquivo temporário, reinício e compatibilidade |
| T03/A | app.js, server.js, routes/feedback-routes.js, manager-routes.js, crm-routes.js, services/sentiment.js, .env.example, package.json/lock se exclusivos, testes legados afetados | Ingestão T02 integrada; consumidores de sentimento e view mapeados | E2 de retirada backend: coleta/reanálise/revisão de sentimento não executáveis; dados históricos/consultas preservados; ausência de chamadas externas. Testes de endpoints negativos e autorização, consulta/exportação sem sentimento local |
| T04/A | routes/client-routes.js; public/workspace.js/html/css, app.js, manager-feedbacks.html, feedback.html, index.html, dashboard.html, navigation.js, styles.css; testes CRM e páginas | Leituras de cliente/feedback T03 e regras de associação/imutabilidade estabilizadas | E3 integral + remoção visual E2: histórico, origem, filtros/paginação/detalhes e cadastro secundário; estados vazio/erro/carregamento/sem permissão, acessibilidade e indicadores definidos; testes CRM/rotas/escape e verificação visual local |
| T05/B | novo services/relationship-analysis.js, routes/relationship-routes.js; schema.sql/database.js; app/src/app.js para montagem única; testes próprios | Evidências importadas e distinção de dimensões T03; transições/permissões e resposta de hipótese registradas | E4 integral: sinais relacionais, evidências/período/limitações, pendente/confirmada/rejeitada/ajustada, auditoria e autorização. Técnico isolado excluído e misto separado; determinismo, revisão e casos negativos testados |
| T06/A | quality-routes.js, workflow-utils.js; schema.sql/database.js se indispensável; testes SGQ antigos/próprios | T05 integrada e interface hipótese→ocorrência, IDs/evidências/revisão definida | E5 integral: só pessoa autorizada abre a partir de confirmada; vínculo cliente/decisão/feedback, investigação sem certeza automática, ações/eficácia, encerramento/reabertura e trilha. Testar ciclo, estados inválidos, autorização e recuperação |
| T07/A | public/workspace.js/html/css, testes SGQ de interface próprios | T04/T06 integradas; APIs de hipóteses e ocorrências estáveis | E4/E5 visíveis e operáveis: evidência, incerteza, decisões justificadas, investigação/ação/eficácia e reabertura. Testes de navegação, estados, acesso e revisão visual |
| T08/B | novos services/retention.js, services/simulated-mail.js, routes/retention-routes.js; app/src/app.js; schema.sql/database.js; testes próprios | T06 integrada; cliente/serviço/preferências, relógio/fuso, deduplicação e resultado de saída definidos | E6 de servidor integral: datas sustentadas pelo domínio, tarefas/lembretes/templates, configuração/frequência/destinatários, consentimento, cancelamento/retentativa/histórico; testes fuso/relógio, sucesso/falha simulados, idempotência/autorização, sem envio real |
| T09/A | public/workspace.js/html/css, navigation.js se necessário; testes interface próprios | T07/T08 integradas e formato de retorno estável | E6 visual integral: controles humanos e preferências, prévia, estados planejada/sucesso/falha explicitamente simulados, cancelamento/retentativa; teste da jornada com relógio controlado e ausência de entrega real |
| T10/A+B+C | A: auditoria servidor/dados; B: auditoria front/docs; C: progresso/relatório final e integração. Correções somente após reserva por caminho | Todos os módulos integrados; matriz de aceite e evidência por SHA | E7 e checklist original integrais; suíte relevante, jornada com reinício, acessibilidade, permissões/LGPD e resíduos legados. Registrar critérios não atendidos; não declarar sucesso parcial como conclusão |

T03 deve deixar a aplicação inicializável ao remover dependências de sentimento; adaptar fixtures e testes antigos no mesmo pacote. T05 monta sua rota em `app/src/app.js` enquanto T04 trabalha em `app/public/app.js`: são arquivos distintos. T08 só ocupa schema depois de T06. Não montar rotas no front nem tratar teste de ocultação de botão como autorização do servidor.

### 6.2 Acordos internos mínimos de T01

Registrar em `docs/reformulation/interfaces.md`, com exemplos fictícios, campos efetivamente suportados e consumidores. Reutilizar nomes/convenções existentes e decidir somente o necessário:

1. Fonte local: campos obrigatórios/opcionais, identificador de origem/evento/cliente, datas, conteúdo, serviço e classificação externa; validação e erro por item/lote; formato demonstrativo não oficial.
2. Ingestão: chave única estável, atomicidade por registro e retomada; identidade segura vs pendência; campos externos imutáveis e internos protegidos; revisão e mesclagem controlada de ambiguidades.
3. Consultas internas: rotas existentes preservadas/adaptadas, filtros/paginação, envelope de retorno/erro e autorização; distinguir ausência de classificação de erro. Não inventar endpoint de importação pública.
4. Hipótese: evidências imutáveis por referência, período/critério/limitação, estado, autor/data/justificativa, transições autorizadas e leitura para ocorrência. Regra determinística não é análise de sentimento.
5. Ocorrência: pré-condição confirmada, classificação relacional, cliente/feedback/decisão, transições, reabertura justificada e eficácia. Bloquear transição inválida no servidor.
6. Automação: serviço/data sustentados, consentimento/preferência e destinatário mínimo, frequência/ativação, chave de deduplicação, relógio/fuso, cancelamento/retentativa, resultados sempre simulados.

T01 não implementa essas interfaces. Ao descobrir limitação real, registrar proposta e afetados antes de alterar; C resolve pelas regras existentes ou solicita decisão de produto apenas se bloqueante. Não adiar tarefa local por credenciais/API externa inexistente.

## 7. Estratégia de branches e worktrees

1. Inspecionar `git status --short`, `git branch --show-current`, `git rev-parse HEAD`, `git worktree list`. Preservar alterações preexistentes. Não fazer stash/reset/clean/pull por conveniência.
2. C cria branch local `integration/cti-crm-sgq` em worktree separado, partindo do SHA inspecionado. Nome já existente deve ser inspecionado, nunca sobrescrito. Não mudar commits/ref da master/main.
3. No fluxo Orca supervisionado, deixar `worker-start --worktree new-child` criar cada checkout filho da integração. Nomes sugeridos `cti-t02`, `cti-t04`, etc.; registrar caminho, branch e SHA retornados, sem pressupor que o nome da branch será igual ao worktree.
4. Antes de cada worker editar, conferir base, branch não principal e status limpo. A instrução inicial exige parar se a base divergir. Cada novo worker nasce após integração dos seus pré-requisitos; conferir merge-base/ancestralidade real.
5. Sem Orca supervisionado, usar Git explicitamente em fallback, sem também pedir ao Orca para recriar o mesmo worktree.

Exemplo Git para criar **a integração** em shell dentro do checkout original (caminhos ilustrativos; usar diretório irmão livre):

```bash
git status --short
git rev-parse HEAD
# Substitua BASE_SHA pelo SHA realmente inspecionado.
git worktree add -b integration/cti-crm-sgq ../cti-integration BASE_SHA
```

Fallback Git para um worker, executado na integração depois de seu gate:

```bash
git worktree add -b task/cti-t04 ../cti-t04 HEAD
```

**Isolamento de execução:** instalar dependências por worktree quando necessário; não compartilhar `node_modules` por padrão. Cada worker usa SQLite em memória ou caminho temporário exclusivo via `DB_PATH`; arquivo, WAL e SHM são exclusivos. Nunca testes destrutivos sobre banco do usuário. `PORT` diferente por processo; testes existentes usam porta efêmera. `.env` e credenciais não entram em Git nem são copiados indiscriminadamente. Não compartilhar `data/` por hooks/diretórios Orca. Auditar hooks antes de `--setup run`: podem executar código, alterar banco ou causar ações externas. Usar `--setup skip` se não forem seguros, preparar ambiente local explicitamente.

Antes de atualizar base de worker, exigir checkpoint limpo e nenhum trabalho concorrente: no worktree dele executar `git merge integration/cti-crm-sgq`, resolver com seu dono e rodar testes afetados. Não rebasear silenciosamente trabalho de outro agente. Atualizar somente quando houver interface necessária ou conflito real; preferir novos workers na base atualizada. Não integrar branch antiga que contenha versões incompatíveis sem revisão.

## 8. Política de commits, merges e permissões

**Autorizado:** branches/worktrees, implementação dentro do escopo quando solicitada, commits locais com mensagens escolhidas pelo agente, testes direcionados, correções, revisão cruzada e merges locais na integração. Não perguntar a cada commit. Registrar `git status --short` e `git diff --stat`; adicionar somente caminhos próprios, nunca `git add .` indiscriminado. Convenção sugerida `feat(crm): ...`, `fix(sgq): ...`, `test(import): ...`, `docs(plan): ...`.

**Exige autorização específica:** push, modificar a branch principal, deploy/publicação e descartar alterações preexistentes. Não fazer pull automaticamente. Necessidade de atualizar remoto é bloqueio separado, não motivo para impedir trabalho local independente.

**Gate de integração de C:** comparar diff/base e lista permitida; verificar requisitos, segurança, testes e evidência; revisar contratos e referências a schema/view/rotas; devolver problemas ao dono. Branch só aprovada com working tree limpa e commits identificados. C integra uma por vez na sua branch:

```bash
# No worktree de integração; TASK_BRANCH é a branch real registrada, não um placeholder literal.
git status --short
git diff --stat integration/cti-crm-sgq...TASK_BRANCH
git merge --no-ff TASK_BRANCH
```

Conflito: reservar arquivos aos envolvidos, entender ambas as intenções, resolver e rodar verificações afetadas. Se não for seguro prosseguir, usar `git merge --abort` apenas para o merge iniciado pelo próprio C com árvore previamente limpa; não descartar trabalho alheio. Não marcar integrada antes do gate. Não apagar branches/worktrees durante execução; limpeza só depois de confirmar commits recuperáveis, árvore limpa e nenhum processo ativo. Não usar `--force` para limpar bloqueio.

## 9. Protocolo de comunicação entre os agentes

C mantém `docs/reformulation-progress.md`: base, tarefas/IDs Orca, deps, estado, dono, paths reservados, branch/worktree, SHA entregue/integrado, testes (comando, resultado, ambiente), riscos e próxima ação. Cada worker mantém apenas seu relatório Txx. Os documentos são planejamento de criação futura; esta edição não cria infraestrutura desnecessária.

Estados de planejamento: pendente → pronta → executando → em revisão → integrada, ou bloqueada. Não confundir com os estados nativos do Orca. Despacho deve conter ID, SHA-base, dependências **integradas**, caminhos permitidos, interfaces lidas, requisitos do anexo A, aceite/testes e proibições. Contratos não mudam por conversa informal: C registra alteração versionada e avisa consumidores antes de retomá-los.

Formato de mensagem: `Txx | estado | SHA | evidência | bloqueio | próxima ação`. Mensagens não levam segredos, dados reais ou logs extensos. Bloqueio traz erro exato sanitizado, tentativa e decisão necessária; worker pode continuar apenas nas partes independentes de seu escopo. Não chamar outro worker por conta própria nem exceder duas vagas subordinadas a C.

Prompt de tarefa (preencher, sem mandar o repositório inteiro):

```text
Execute apenas Txx do docs/REFORMULACAO_CTI_CRM_SGQ.md.
Base exigida: <SHA integrado>. Dependências integradas: <IDs e SHAs>.
Leia AGENTS.md, regras gerais/seção da tarefa/anexo A aplicável,
interfaces.md e apenas os relatórios dos pré-requisitos necessários.
Paths permitidos: <lista exata>. Não altere outros sem negociar com C.
Resultado e critérios: <copiar critérios relevantes, sem omiti-los>.
Verificações: <comandos direcionados e casos de negócio>.
Use somente dados/entrada/comunicações locais simulados; segurança e LGPD agora.
Preserve trabalho anterior. Commits locais autorizados; sem push/deploy/alteração da principal.
Confirme base e worktree antes de editar. Registre evidências em tasks/Txx.md.
Reporte commits, testes reais, critérios cobertos e bloqueios pelo protocolo do dispatch.
Não execute próximas tarefas nem crie outros agentes.
```

## 10. Estratégia de testes e validação

Durante esta tarefa documental: diff/consistência/rastreabilidade, sem alegar testes funcionais. Durante implementação, C estabelece baseline uma vez após T01, com Node compatível e `npm ci` em `app/` quando necessário. Registrar falhas preexistentes separadamente; testes antigos que esperam coleta/sentimento devem ser adaptados com justificativa e cobertura negativa equivalente, não apagados para esverdear a suíte.

Comandos reais disponíveis no repositório (executar em `app/`):

```bash
node --version
npm ci
node --test test/auth.test.js test/auth-access.test.js
node --test test/feedback-origin.test.js test/crm-quality.test.js
node --test test/manager.test.js test/app-routes.test.js test/products-access.test.js
npm test
npm run demo
```

Os grupos são pontos de partida; os nomes e expectativas evoluem ao remover legado. Para novos testes próprios, usar `node --test test/reformulation-Txx.test.js` somente depois de criar o arquivo. `node --check src/app.js` verifica sintaxe de um arquivo; não substitui testes. Não há script build/lint/e2e no package.json auditado: não inventar execução bem-sucedida.

| Mudança | Durante tarefa | Na integração / saída |
|---|---|---|
| Docs | Consistência, links locais, rastreio e `git diff --check` | Sem suíte completa só por texto |
| Ingestão/banco | Validação, identidade/ambiguidade, repetição, falha parcial, dados internos, reinício/compatibilidade em arquivo temporário | Revalidar consumidores de view/schema e preservação dos dados |
| Rotas/segurança | Casos positivos/negativos, sessão/papel, entrada inválida e proibição de escrita externa | Regressão de auth, consulta/export e ausência de vias alternativas |
| SGQ | Técnico/relacional/misto, evidências, estados, revisão, causa/eficácia/reabertura e trilha | Jornada cliente→hipótese→decisão→ocorrência→ação→eficácia |
| Automação | Relógio e fuso controlados, consentimento/revogação, duplicidade, cancelamento/retentativa, falha e sem rede | Jornada com configurações e estados de simulação claros |
| Front | Carregamento/vazio/erro/sem permissão, escape de conteúdo, foco/teclado/labels, navegação | Revisão visual e jornadas em servidor local; registrar navegador e passos reais |

Segurança a cada pacote: validar servidor, queries parametrizadas, autorização e vínculos, escape XSS de feedback importado, CSRF conforme sessões existentes, exportação segura quando mantida, ausência de credenciais e de dados pessoais desnecessários. Revisar retenção/correção sem destruir evidências; não inventar prazo legal. Fixtures exclusivamente fictícias.

Não executar suíte inteira a cada edição. Executar testes tocados e consumidores; ampliar quando schema, sessão, composição, utilitário compartilhado ou falha indicar impacto transversal. Em T10 rodar suíte relevante completa depois do último merge, além da jornada original completa, inclusive reinício/repetição e histórico preservado. Documentar limitações do ambiente. Reutilizar evidência por SHA, comando, fixtures/ambiente; mudança na dependência invalida a parte afetada, não todas as verificações de todos os agentes.

## 11. Instruções de orquestração com Orca CLI

### 11.1 Fontes, versão e limites da verificação

Comandos abaixo verificados **na documentação/código oficial**, não executados contra o Orca do usuário. Não há binário/runtime Orca neste ambiente; a versão instalada, disponibilidade do recurso e configuração do usuário permanecem por verificar. Consulta oficial de 05/11/2026: repositório `stablyai/orca`, SHA `b47835025b5900e0faaf2ef00804b990c77e46a9`. Documentação muda; o guia servido pelo binário instalado prevalece na sintaxe.

Fontes:

- [CLI overview](https://www.onorca.dev/docs/cli/overview)
- [CLI reference](https://www.onorca.dev/docs/cli/reference)
- [Guia oficial de orquestração](https://github.com/stablyai/orca/blob/b47835025b5900e0faaf2ef00804b990c77e46a9/skill-guides/orchestration.md)
- [DAG e coordenador](https://github.com/stablyai/orca/blob/b47835025b5900e0faaf2ef00804b990c77e46a9/skill-guides/orchestration/references/coordinator-loop.md)
- [Placement/worktrees](https://github.com/stablyai/orca/blob/b47835025b5900e0faaf2ef00804b990c77e46a9/skill-guides/orchestration/references/placement-and-remote.md)
- [Mensagens e gates](https://github.com/stablyai/orca/blob/b47835025b5900e0faaf2ef00804b990c77e46a9/skill-guides/orchestration/references/messaging-and-gates.md)
- [Recuperação](https://github.com/stablyai/orca/blob/b47835025b5900e0faaf2ef00804b990c77e46a9/skill-guides/orchestration/references/recovery-and-cleanup.md)

**Run é namespace/inbox, não scheduler nem agente.** Task é trabalho/dependências; dispatch é tentativa atribuída; worker-start inicia worker. O coordenador é uma sessão Codex real já aberta no Orca, não um processo criado por run-create. Não usar comandos legados `orchestration run`, `run-stop`, `coordinator-start` ou `coordinator-stop` como lançadores. Limite de concorrência deste plano é aplicado por C, não por flag fictícia `--max-agents`.

### 11.2 Preparação, sem iniciar implementação inadvertidamente

Abrir o projeto no Orca, registrar seu CLI nas configurações se necessário e habilitar orquestração caso a versão a exponha como experimental. Confirmar Codex instalado/autenticado no host; não solicitar nem registrar tokens. Abrir uma sessão Codex que será C, no worktree de integração (ou criar a integração antes de iniciar essa sessão).

```bash
# No PowerShell/Windows, use Get-Command orca no lugar de command -v.
command -v orca
orca status --json
orca skills get orchestration
orca skills get orchestration --reference references/coordinator-loop.md
orca skills get orca-cli
orca worktree current --json
orca worktree ps --json
```

Se `--reference` não existir, carregar `orca skills get orchestration --full` e ler a referência correspondente. Validar comandos com ajuda/guia da instalação. Não instalar outro programa homônimo “orca”. Ler hooks/política de setup antes de autorizar `--setup run`; não configurar atualização/install automático de ferramentas como parte da reformulação.

### 11.3 Criar run, registrar tarefas e iniciar explicitamente

Executar por C **dentro da integração**, após ler o plano e validar ambiente. Exemplos com `<...>` precisam ser substituídos pelos valores retornados; não colar placeholders literalmente. Guardar IDs reais no progresso. `--deps` recebe um array JSON de IDs de tarefas reais, não T01/T02 textuais.

```bash
orca orchestration run-create --objective "CTI CRM e SGQ local; C mais até dois workers; sem push ou deploy" --json
# O run acima não lançou nenhum agente.
# Substituir a spec por um despacho completo do modelo da seção 9.
# C executa T01 e registra sua integração no progresso, sem task Orca pendurada.
# Criar tasks Orca a partir dos trabalhos efetivamente delegados:
orca orchestration task-create --spec "<despacho completo T02, T01 já integrada>" --json
orca orchestration task-list --ready --brief
orca orchestration worker-start --task <TASK_ID_T02> --worktree new-child --name cti-t02 --agent codex --setup skip --json
```

T01 executada pelo próprio C fica no progresso versionado. Para manter DAG nativo completo, criar também sua task e delegá-la a um worker isolado, aguardando seu dispatch real, com C+1 sessão; o número de ondas e critérios não muda. Não inventar comando de completion. Não liberar T02 antes de T01 integrada em nenhuma variante.

Depois de T03 integrada, exemplo de dependências e partida simultânea na onda 3:

```bash
# T03 precisa ser uma task Orca real concluída E ter sido integrada por C.
orca orchestration task-create --spec "<despacho completo T04>" --deps '["<TASK_ID_T03>"]' --json
orca orchestration task-create --spec "<despacho completo T05>" --deps '["<TASK_ID_T03>"]' --json
orca orchestration task-list --ready --brief
orca orchestration worker-start --task <TASK_ID_T04> --worktree new-child --name cti-t04 --agent codex --setup skip --json
orca orchestration worker-start --task <TASK_ID_T05> --worktree new-child --name cti-t05 --agent codex --setup skip --json
```

Criar demais tasks conforme seção 4. T03 depende do ID real T02, T06 de T04/T05, T07 de T04/T06, T08 de T06, T09 de T07/T08 e T10 de T09. Para T10 criar duas subtasks de auditoria com escopos distintos. Se tarefas forem criadas antecipadamente, **não despachar automaticamente só porque ficaram ready**: respeitar merge/locks/base. O gate integrado é controle de C documentado no progresso. Em vários runs, ler referência e passar `--run` onde suportado, evitando selecionar o run errado; este plano prefere um único run.

Cada receipt de worker-start deve provar task/dispatch/worktree/terminal e conter instruções de acompanhamento. Registrar IDs/caminho/branch retornados e obedecer `next`. A spec obriga worker a conferir SHA-base antes de escrever; `new-child` não deve ser presumido como garantia do SHA desejado. Não lançar Codex adicional no terminal do mesmo worker: worker-start já o inicia. Não usar `--worktree current` para workers editores compartilharem integração.

### 11.4 Acompanhar, desbloquear e receber entrega

Após iniciar todos os workers elegíveis, C encerra seu turno e deixa Orca acordá-lo. Não iniciar loops de polling/watch nem consumir a inbox em script paralelo: isso pode retirar mensagens do coordenador. Ao acordar, processar mensagens recebidas ou o comando `check` indicado pelo runtime; seguir entrega/ack e `next` do guia correspondente. Inspeção sem consumir quando necessária:

```bash
orca orchestration check --peek --format --json
# Recuperar mensagens já processadas, se perder contexto:
orca orchestration inbox --terminal run:<RUN_ID> --limit 50
# Mensagem a uma tentativa específica (enqueue não prova leitura):
orca orchestration send --to dispatch:<DISPATCH_ID> --subject "T04: interface estável" --body "<orientação objetiva e SHA>"
# Responder pergunta recebida, somente quando a resposta decorrer do escopo autorizado:
orca orchestration reply --id <MESSAGE_ID> --body "<decisão e referência>"
```

Workers seguem o preâmbulo com Task/Dispatch IDs para `ask` e `worker_done`: usar a sintaxe fornecida pelo runtime, não inventar envio manual nem declarar tarefa concluída em nome de outro. Worker terminado não é merge aprovado. Silêncio, timeout ou terminal ocioso não provam sucesso nem liberação de arquivos. Se worker-start falhar, não repetir cegamente: verificar `failedStage`, ler `references/recovery-and-cleanup.md`, confirmar que não existe tentativa viva antes de relançar. Nunca duplicar um worker de estado desconhecido.

C revisa relatório/diff/testes, integra conforme seção 8, registra SHA, atualiza base dos consumidores quando necessário e lança próximas tarefas assim que dependências **integradas**, vagas e locks permitirem. Ao abrir vaga não despachar tarefa bloqueada só para manter ocupação. Guardar saída resumida e testes, não transcrições extensas.

### 11.5 Fallback explícito

Se a instalação não suportar supervisão, não fingir run/worker. Usar guia local `orca-cli` e worktrees Git da seção 7, com C despachando prompts e recolhendo relatórios manualmente. Comandos documentados para iniciar um Codex em worktree existente:

```bash
orca terminal create --worktree path:<CAMINHO_ABSOLUTO_DO_WORKTREE> --command "codex" --json
```

Enviar o prompt pelo terminal/UI identificado no retorno, conforme seletores e confirmação de submit do guia instalado; não enviar ao terminal ativo sem conferir identidade. Apenas criar terminal não entrega a tarefa; confirmar que Codex recebeu o despacho e iniciou na base correta. Não misturar esse fallback com worker-start para a mesma tarefa. Se nem CLI estiver disponível, abrir até três sessões pelo Orca UI em worktrees separados, mantendo o mesmo protocolo versionado; informar que o acompanhamento não é supervisionado automaticamente.

### Instruções para o agente orquestrador

1. Leia regras gerais, anexo A, AGENTS/CLAUDE e progresso; preserve produto e precedência desta autorização. Confirme que o usuário pediu **execução**, não apenas planejamento.
2. Inspecione status/base/delta sem pull; preserve trabalho anterior e prepare integração isolada. Não modifique principal.
3. Valide runtime/guia do Orca e Codex no host. Execute T01, ou delegue-a explicitamente sem exceder três sessões totais.
4. Publique inventário, interfaces internas mínimas, matriz de ownership e fixtures planejadas; não introduza fase de contratos/migrações.
5. Crie run/tasks reais e despachos completos. Agende por dependências integradas, paths livres e vagas (C+até dois workers).
6. Deixe Orca criar worktrees dos workers supervisionados; audite setup e exija conferência de SHA antes de edição. Isole banco/porta/env.
7. Aguarde eventos; responda bloqueios com decisões já autorizadas; não copie contextos inteiros nem consuma inbox em scripts paralelos.
8. Revise evidências e diff, devolva defeitos, integre sequencialmente e registre SHA. Atualize bases somente em checkpoint limpo.
9. Execute verificações cruzadas proporcionais, libere sucessoras e reutilize resultados válidos. Não impeça trabalho independente por integração real fora do escopo.
10. Após T10 e último merge, execute suíte/jornada final; informe critérios atendidos e pendentes, riscos, branch/SHA e instruções locais. Deixe entrega local revisável, sem push/deploy/merge na principal.

## 12. Checklist final de conclusão

- [ ] T01–T10 integradas e aceites E1–E7 do anexo A comprovados; nenhum requisito foi reduzido pela divisão.
- [ ] Até três sessões totais; paths/banco/portas isolados; nenhuma edição concorrente de arquivos compartilhados.
- [ ] Origem técnica externa e dimensão relacional CTI separadas, inclusive casos mistos.
- [ ] Todos os itens do checklist funcional original ao final do anexo A verificados.
- [ ] Fonte e e-mail fictícios substituíveis, sem integração real, envio real ou dependência de credenciais.
- [ ] Código legado retirado com cobertura negativa e dados históricos preservados.
- [ ] Segurança/LGPD e acessibilidade verificadas durante tarefas e na revisão final.
- [ ] Testes associados a SHAs reais; suíte relevante e jornada com reinício após último merge.
- [ ] Progresso/relatórios contêm comandos, resultados, limitações e instruções de execução reais.
- [ ] Entrega na integração local; principal/alterações anteriores preservadas; sem push/deploy.

## Anexo A — Especificação funcional original preservada

O texto abaixo preserva o escopo, decisões, requisitos, instruções funcionais, testes e critérios das sete etapas da base auditada. Regras operacionais antigas foram substituídas pelas seções 4–11: a execução não precisa ser linear e commits locais estão autorizados. A divisão não dispensa nenhum parágrafo aplicável. Referências a “etapa seguinte” significam dependência funcional satisfeita, não barreira artificial para trabalho independente.

## Objetivo

Evoluir gradualmente o projeto existente para uma plataforma de **CRM de relacionamento com clientes e SGQ voltado à qualidade desse relacionamento**, preservando stack, arquitetura útil, identidade visual e funcionalidades pertinentes. Começar por auditoria, aproveitar o que já existe e evitar reconstrução desnecessária.

Um sistema externo coleta feedbacks e analisa problemas técnicos. A plataforma CTI importa esses registros, cadastra automaticamente clientes novos quando houver identificação suficiente, agrupa o histórico e analisa padrões de atendimento e relacionamento. As análises são hipóteses rastreáveis, revisadas por pessoas antes de virarem conclusões ou ações oficiais.

## Escopo atual: aplicação local com simulação

Implemente uma versão local demonstrável. Todos os feedbacks e dados atribuídos à aplicação externa serão fictícios e carregados localmente, passando pelo mesmo fluxo que cria clientes, vincula históricos e alimenta o SGQ. As referências a “importação” ou “dados externos” neste documento descrevem essa origem simulada no escopo atual.

Não implemente a integração real agora nem uma etapa de contratos, remodelagem de domínio ou migrações. Reutilize a stack e a estrutura de dados existentes, adaptando apenas o necessário em cada funcionalidade. Prepare o futuro com um ponto simples de leitura substituível, evitando arquitetura adicional sem necessidade. Registre o formato demonstrativo utilizado, sem tratá-lo como contrato oficial da outra aplicação.

E-mails e automações também devem funcionar em modo simulado e claramente identificado. O aceite exige a jornada local completa; conectividade com outra aplicação fica para trabalho futuro.

## Decisões de produto consolidadas

1. **Sistema externo:** coleta e armazena feedbacks e analisa padrões técnicos, como concentração por serviço, local, instalação ou tipo de problema. A CTI consome os registros e resultados disponíveis, sem duplicar a análise técnica.
2. **Plataforma CTI:** gere relacionamento e investiga sinais de atendimento insatisfatório, demanda não atendida, comunicação inadequada, falta de acompanhamento, serviço inadequado ou desnecessário e risco de perda do cliente.
3. **Escopo do SGQ:** qualidade do relacionamento. Em feedback misto, o SGQ trata somente a dimensão relacional; a parte técnica permanece sob responsabilidade do sistema externo.
4. **Entrada de clientes:** feedbacks importados são a principal fonte de criação. Ao receber feedback de cliente ainda não cadastrado, criar seu perfil automaticamente quando houver dados mínimos confiáveis. Cadastro manual fica disponível como alternativa para exceções, correções e complementação.
5. **Identidade e duplicidades:** preferir identificador estável da origem e, quando aplicável, CNPJ. E-mail ou telefone podem apoiar correspondência conforme regras explícitas. Nome parecido, sozinho, não autoriza associação automática. Casos ambíguos vão para revisão e eventual mesclagem controlada.
6. **Histórico:** vincular feedbacks, contatos, atendimentos, serviços, comunicações, ocorrências, ações e resultados ao perfil, preservando origem e identificadores externos.
7. **Análises:** registrar hipóteses com evidências, período, critérios e limitações. Permitir confirmar, rejeitar, editar ou deixar pendente, com autoria, data e justificativa. Não atribuir culpa automaticamente.
8. **Ocorrências e melhoria:** padrões confirmados podem gerar ocorrência relacional, investigação, responsáveis, prazos, plano de ação e verificação de eficácia. Nem todo feedback vira não conformidade.
9. **CRM:** apoiar visão do cliente, histórico, satisfação, retenção, necessidades, serviços e oportunidades pertinentes.
10. **Automações:** prever e-mail e lembretes de manutenção/acompanhamento quando adequados. Respeitar consentimento e preferências, registrar execução e falhas, evitar duplicidade e permitir configuração humana.
11. **Preservação:** manter stack, convenções e componentes que continuem pertinentes ao novo escopo. Remover funcionalidades obsoletas conforme a decisão abaixo. Evitar dependências novas sem necessidade demonstrada.
12. **Retirada do escopo antigo:** remover a coleta direta de feedbacks pela CTI, formulários públicos ou internos de envio/cadastro manual de feedback, campanhas de coleta e análise de sentimento executada pela plataforma. Retirar telas, rotas, endpoints, serviços, tarefas, indicadores, configurações, dependências exclusivas e documentação desses fluxos, após mapear suas referências. A entrada simulada de dados externos permanece e deve poder ser substituída por uma integração real no futuro.
13. **Tela de feedbacks:** servir exclusivamente à consulta de todos os feedbacks importados, respeitando permissões. Exibir os dados fornecidos pela origem, com paginação, busca/filtros e consulta de detalhes quando necessários. Não oferecer criação manual, envio, edição do conteúdo externo nem análise de sentimento local. Se a origem fornecer sentimento ou classificação, apresentá-los apenas como dados externos, identificando a origem, sem gerar ou recalcular localmente. As hipóteses relacionais próprias e sua revisão ficam no SGQ, vinculadas aos feedbacks como evidências.

## Remoção obrigatória do legado fora do escopo

Esta decisão prevalece sobre orientações genéricas de preservar funcionalidades anteriores. Preservar a stack não significa manter recursos que deixaram de fazer parte do produto. Não apagar dados históricos indiscriminadamente: separar a retirada de código da política de retenção, arquivamento ou migração dos dados. Remover colunas e tabelas somente depois de verificar dependências, compatibilidade e recuperação.


## Etapa 1 — Contexto do produto e documentação

**Resultado:** documentação alinhada antes de mudar comportamentos.

Inspecione de forma direcionada a stack, arquitetura, modelos, fluxos, integrações, permissões, banco, migrações, testes e documentação existentes. Registre recursos a preservar, adaptar e remover, seus consumidores compartilhados e riscos. Não pare apenas para solicitar aprovação de um diagnóstico. Em seguida, alinhe a documentação existente ao produto CTI CRM + SGQ de relacionamento. Preserve informações válidas, corrija o que conflita e não implemente funcionalidades nesta etapa.

Documente propósito e limites do produto; responsabilidades do sistema externo e da CTI; importação e cadastro automático; identidade, duplicidade e revisão de ambiguidades; histórico do cliente; análise como hipótese; revisão humana; ocorrência, investigação, ação e eficácia; funções CRM; automações; segurança e LGPD. Diferencie problemas puramente técnicos, relacionais e mistos. Em casos mistos, o SGQ CTI trata somente a dimensão relacional.

Use os arquivos e padrões existentes. Defina dados fictícios coerentes para a demonstração local, identificados como simulados; não os apresente como formato oficial da futura aplicação externa. Ao terminar, informe arquivos alterados e verificações de consistência.

**Aceite:** responsabilidades técnicas e relacionais estão corretamente separadas em toda a documentação.

## Etapa 2 — Importação, cadastro automático e remoção dos fluxos antigos

**Resultado:** fluxo principal de entrada pelo feedback, idempotente e seguro diante de identidade incerta.

Implemente, usando uma fonte local simulada e os padrões do repositório, a importação dos feedbacks externos e o cadastro automático de clientes como fluxo principal.

Valide o formato; registre origem e identificador externo; processe repetições sem duplicar; crie perfil mínimo quando não houver correspondência confiável e houver dados suficientes; vincule ao cliente existente somente com identidade segura; não una pessoas/empresas apenas por semelhança de nome; encaminhe ambiguidades para revisão; permita completar/corrigir perfil depois. Mantenha cadastro manual secundário. Trate falhas parciais e reprocessamento sem perda. A integração não deve sobrescrever conclusões humanas nem dados internos sem regra explícita.

Use dados fictícios locais com identificadores estáveis, datas, cliente, serviço e conteúdo suficientes para demonstrar as jornadas. Reutilize a persistência e os mecanismos existentes; não crie servidor ou banco novo para simular a origem. Centralize o fornecimento desses dados em um ponto substituível por uma fonte real no futuro. A carga pode ocorrer por seed, inicialização ou ferramenta de desenvolvimento, sem recriar um formulário de coleta na tela de feedbacks. Demonstre novos clientes, cliente recorrente, evento repetido, identidade ambígua e casos técnicos, relacionais e mistos. Não dependa de rede ou credenciais.

Remova coleta direta, envio e cadastro manual de feedback e análise de sentimento local: telas, rotas, endpoints, serviços, tarefas, indicadores, configurações, documentação e dependências exclusivas. Preserve ingestão externa, dados históricos e componentes compartilhados. Atualize testes afetados e verifique que os antigos pontos de entrada não permitem essas operações.

Inclua testes de cliente novo, existente, evento repetido, identidade ambígua, payload inválido, falha/reprocessamento e preservação de dados internos. Rode testes específicos e reporte comandos/resultados.

**Aceite ponta a ponta:** feedback elegível cria cliente e histórico uma única vez; correspondência ambígua não mescla; cadastro manual continua disponível.

## Etapa 3 — CRM, histórico e consulta dos feedbacks externos

**Resultado:** visão do cliente centrada no relacionamento, rastreável e acessível.

Evolua telas e fluxos CRM existentes, preservando identidade visual e componentes úteis, para apresentar clientes e seu histórico unificado. Use os dados simulados carregados no fluxo local e padrões de navegação/acessibilidade existentes.

Mostre identificação e origem, feedbacks, contatos/interações, serviços pertinentes, estado do relacionamento e indicadores com fórmula documentada. Inclua pesquisa/listagem, filtros úteis e navegação entre perfil, feedback e ocorrência. Sinalize dados incompletos e correspondências aguardando revisão. Permita edição controlada e registre alterações importantes conforme os padrões identificados no repositório. Não apresente hipótese não revisada como fato.

Transforme a tela de feedbacks em consulta de todos os registros externos autorizados, com paginação, busca/filtros e detalhes. Exiba os dados da origem, sem criação, envio, edição do conteúdo externo ou análise de sentimento local. Identifique classificações externas como tais e não as recalcule. Mantenha hipóteses relacionais e revisão na área SGQ.

Implemente estados de carregamento, vazio, erro e falta de permissão. Proteja dados pessoais. Não invente indicadores: documente critério/período ou deixe de fora até definição. Atualize testes proporcionais; verifique o fluxo com ferramentas existentes e informe o que realmente verificou.

**Aceite:** pessoa autorizada localiza o cliente criado por feedback e percorre o histórico sem confundir dados importados com conclusões internas.

## Etapa 4 — Padrões relacionais e revisão humana

**Resultado:** análise própria CTI baseada em evidências, sem conclusão definitiva automática.

Implemente o fluxo de análise de padrões de atendimento e relacionamento da CTI usando feedbacks e histórico. O sistema externo continua responsável pela análise técnica; não replique essa análise.

Detecte ou organize sinais como insatisfação com atendimento, demanda não atendida, comunicação inadequada, demora/falta de retorno, acompanhamento insuficiente, inadequação/desnecessidade do serviço e risco de deterioração/abandono. Para cada sinal, exiba evidências, período, critério de agrupamento e limitações. Toda análise é hipótese: permita estados pendente, confirmada, rejeitada ou ajustada, com responsável, data e justificativa. Confirmação exige pessoa autorizada. Não atribua culpa individual nem abra ocorrência automaticamente sem regra aprovada.

Em casos mistos, encaminhe ao SGQ somente a dimensão relacional e mantenha referência à classificação técnica externa. Explique incerteza; não apresente correlação como causalidade.

Inclua testes de limite de escopo, evidências, autorização/revisão, rejeição e caso misto. Reuse regras determinísticas/arquitetura aprovadas. Não adicione IA ou dependência externa sem autorização e justificativa. Rode verificações focadas, reporte resultados.

**Aceite:** hipótese não revisada fica pendente; conclusões têm evidências e decisão humana rastreáveis; problema técnico isolado não vira ocorrência relacional.

## Etapa 5 — Ocorrências, investigação e planos de ação

**Resultado:** ciclo de melhoria contínua para ocorrências relacionais.

Implemente/adapte o SGQ para gerir ocorrências confirmadas de relacionamento, investigação e ações, seguindo modelos e permissões existentes.

Permita abertura por pessoa autorizada a partir de hipótese confirmada; descrição e evidências; classificação relacional; investigação de causa sem apresentá-la como certeza automática; responsável, prioridade e prazo quando aplicáveis; ações com estados e histórico; acompanhamento; avaliação de eficácia com critério registrado; encerramento ou reabertura justificados. Vincule cliente, feedbacks e decisão originadora. Mantenha trilha de alterações e não apague silenciosamente evidências.

Não inclua tratamento técnico em ocorrência CTI e não transforme toda reclamação em não conformidade. Aplique autorização por papel e valide transições no servidor. Teste ciclo, permissões, estados inválidos, rastreabilidade e eficácia. Preserve os dados locais existentes. Reporte verificações.

**Aceite:** ocorrência relacional percorre investigação, ação e eficácia com autoria e histórico; dados técnicos ficam fora da responsabilidade CTI.

## Etapa 6 — Retenção, serviços e automações

**Resultado:** acompanhamento seguro e configurável.

Evolua CRM para apoiar retenção, acompanhamento, serviços e automações locais simuladas de comunicação/manutenção. Use um relógio/data de referência ou mecanismo local simples que permita demonstrar vencimentos e execução sem serviços externos. Não envie e-mails reais nem configure provedores.

Implemente apenas recursos sustentados pelo domínio: serviços e datas relevantes se disponíveis; lembretes; tarefas de acompanhamento; preferências/consentimentos; templates revisáveis; histórico de mensagens planejadas/enviadas/falhas; prevenção de duplicidade; cancelamento e retentativa controlada. Separe lembrete de manutenção de diagnóstico técnico. Dê controle de frequência, destinatários e ativação, respeitando autorização e minimização.

Simule o envio localmente, exibindo claramente prévia e estado de simulação, com registros de sucesso/falha simulados e prevenção de duplicidade. Não apresente mensagem simulada como entregue a destinatário real. Mantenha o mecanismo simples e substituível no futuro. Teste agendamento/fuso conforme padrão, consentimento, idempotência, falha e autorização. Execute verificações focadas; reporte resultados.

**Aceite:** automações são configuráveis e rastreáveis, respeitam preferências e não enviam duplicatas nem mensagens sem autorização válida.

## Etapa 7 — Segurança, LGPD, regressão e fechamento

**Resultado:** revisão integrada e evidências de aceite ponta a ponta.

Revise a reformulação CTI CRM + SGQ com foco em segurança, privacidade, coerência e regressões. Não amplie escopo; corrija defeitos necessários aos requisitos aprovados.

Procure referências e acessos residuais aos fluxos removidos, inclusive navegação, tarefas, indicadores e documentação. Confirme que a tela de feedbacks apenas consulta registros externos e que a importação e o SGQ permanecem funcionais.

Verifique permissões/isolamento; validação da entrada simulada; ausência de credenciais e chamadas externas necessárias; logs sem exposição indevida; minimização, finalidade, retenção e correção de dados pessoais; trilha de auditoria; preservação dos dados locais; idempotência/duplicidade; revisão humana; fronteira entre análise técnica externa e relacional CTI; acessibilidade; documentação e testes.

Execute a jornada disponível: importar feedback; criar cliente automaticamente; repetir evento sem duplicar; agrupar histórico; gerar/visualizar hipótese com evidências; confirmar/rejeitar; abrir ocorrência quando apropriado; registrar investigação/ação; avaliar eficácia; verificar automação sem envio externo não autorizado. Execute toda a jornada com os dados simulados, sem API externa, credenciais ou serviços remotos. Reinicie/recarregue a aplicação conforme o mecanismo local adotado e verifique a repetição segura da carga.

Rode testes/verificações relevantes existentes. Não alegue cobertura não executada. Corrija falhas introduzidas e rode novamente os testes afetados. Entregue relatório final com funcionalidades, arquitetura preservada/adaptada, arquivos importantes, comandos/resultados, critérios atendidos/não atendidos, riscos/dependências e instruções de configuração/execução.

## Critérios globais de aceite

- [ ] Coleta direta, cadastro manual de feedback e análise de sentimento local foram retirados, inclusive acessos, tarefas e referências residuais.
- [ ] Tela de feedbacks consulta todos os registros externos autorizados, sem criação/envio/edição local ou análise de sentimento própria.
- [ ] Dados e classificações externos têm origem identificada; hipóteses relacionais e revisão humana permanecem no SGQ.
- [ ] Remoção do legado preservou importação, componentes compartilhados e dados históricos conforme plano seguro.
- [ ] Repositório auditado e evoluído; stack e funcionalidades úteis preservadas ou mudanças justificadas.
- [ ] Sistema externo coleta e analisa aspectos técnicos; CTI analisa relacionamento.
- [ ] Feedback elegível cria cliente automaticamente com dados mínimos suficientes.
- [ ] Repetição não duplica; identidade incerta aguarda revisão; cadastro manual de clientes é secundário e existe.
- [ ] Histórico reúne feedbacks/interações com origem e autoria identificáveis.
- [ ] Análise CTI cobre relacionamento, mostra evidências e aguarda revisão humana antes de conclusão.
- [ ] Caso misto separa parcela técnica da relacional.
- [ ] Ocorrências, investigação, ações e eficácia são rastreáveis e autorizadas.
- [ ] Retenção, serviços e automações respeitam preferências, idempotência e registro de execução.
- [ ] A demonstração funciona localmente com dados fictícios; a carga repetida não duplica registros e os dados locais existentes foram preservados.
- [ ] Testes proporcionais, segurança, LGPD, documentação e jornada ponta a ponta foram verificados com resultados reais.
- [ ] Fonte de feedbacks e envio de e-mail simulados estão isolados em pontos simples de substituição; a integração real futura não é requisito de conclusão.

## Lacunas que podem exigir decisão

Pergunte somente sobre decisões que bloqueiem o comportamento local e não possam ser resolvidas pelas convenções existentes. Não bloqueie a execução por formato de API, autenticação externa, credenciais ou provedor de e-mail: esses elementos pertencem a uma integração futura. Documente apenas onde a fonte simulada e o envio simulado poderão ser substituídos.


