# Progresso técnico da reformulação CTI CRM + SGQ

**Run Orca:** `run_be2ef9864b87`. Coordenador C: sessão Codex nesta worktree. Limite: C + até dois workers. Branch de integração: `integration/cti-crm-sgq`, caminho `C:/Users/Ygor/orca/workspaces/DesafiodeIdeias/integration-cti-crm-sgq`. Sem push, deploy ou alteração da principal.

**Base:** plano auditado em `f8afc69106b2acef4f98e99e4e8c4dff14e0291a`; HEAD inicial real `1dbaac251b3f4d39cddd0b6bdb5be166382a8ba8`, igual a `origin/master` após `git fetch` e `git pull --ff-only origin master` autorizados em 05/11/2026. Delta: apenas `AGENTS.md` e o plano, sem mudança de aplicação. Worktree de integração já existia, separada da principal e limpa no início. Não há branch remota de integração nem upstream; o pull explícito retornou `up-to-date`.

| Tarefa | Estado real | Dono / modelo | Dependências integradas | Branch, worktree, SHA | Verificações / próxima ação |
| --- | --- | --- | --- | --- | --- |
| T01 | Integrada | C / modelo da sessão, inalterado | Nenhuma | Integração; commit `20d26daedce26867343b00a822b67d60ccfcec57` | `git diff --cached --check` sem erros; inventário e acordos registrados |
| T02 | Em revisão, correção solicitada | A / `gpt-6.1-terra`, `high` (recibo confirmado) | T01, HEAD `ee7fc2855ee1e592404619b1e05d8ffd978bf22b` | `CaioYL10/cti-t02`, `C:/Users/Ygor/orca/workspaces/DesafiodeIdeias/cti-t02`, base `ee7fc28`, primeira entrega `d8f68453dd38559b7a7194afa95c89e348cb199f` | Task `task_fcf2c8966bb1`, dispatch `ctx_f195babff099`; follow-up `task_2e82da7f5a69` / `ctx_29768dc6fd8d`; aguardar ajuste e revisar |
| T03 | Pendente | A / a selecionar | T02 | A criar | Remoção servidor |
| T04 e T05 | Pendentes | A e B | T03 | A criar | Onda paralela, paths distintos |
| T06 | Pendente | A | T04 e T05 | A criar | Ciclo SGQ |
| T07 e T08 | Pendentes | A e B | T06 | A criar | Onda paralela, paths distintos |
| T09 | Pendente | A | T07 e T08 | A criar | Interface automação |
| T10 | Pendente | A, B e C | T09 | A criar | Auditoria, suíte e jornada |

**Reservas:** T01 somente C, arquivos documentais ativos e `docs/reformulation/*`; nenhuma implementação. Próxima elegível após integração: T02. Acordos em [`reformulation/interfaces.md`](reformulation/interfaces.md), inventário em [`reformulation/inventory.md`](reformulation/inventory.md), matriz em [`reformulation/acceptance.md`](reformulation/acceptance.md).

**Ambiente Orca/Codex:** Orca 1.4.250, runtime local pronto, `worker-start` suporta `--model`/`--effort` (exige `--model`). Catálogo Codex local confirmado por `codex debug models`: `gpt-6.1-sol`, `gpt-6-astra`, `gpt-6.1-terra`, `gpt-6-sol`, `gpt-6-luna` e modelos 5.6; níveis `low` a `ultra` para os modelos 6 listados, exceto Luna sem `ultra`. Configuração global `gpt-6-sol/high`; não alterada. Seleção por tarefa e recibo de lançamento serão registrados no despacho. Setup de worktrees: `--setup skip` até auditoria; nenhum hook de setup foi encontrado no repositório pelos padrões de nome; não compartilhar `data/`, `.env` ou banco.

**Riscos atuais:** o bootstrap recria `feedback_overview` e conserva referências a sentimento; T02/T03 precisam testar compatibilidade. O único papel existente é gestor. Datas de manutenção e destinatários não existem no domínio atual e devem ser sustentados antes da automação, sem inventar envio real. A proposta do produto não foi validada pela CTI.

**Despacho T02:** `orca orchestration worker-start` iniciou worker Codex em worktree filha isolada, `--setup skip`. Recibo: terminal `term_a8fc595d-f7b9-420c-8ae2-2387e2344532`, modelo e esforço acima, estado `ready`. Conferência posterior com `git worktree list`, `git -C ... branch --show-current`, `rev-parse HEAD` e `status --short`: branch `CaioYL10/cti-t02`, SHA igual à integração e árvore limpa antes da edição. Caminhos reservados: schema/bootstrap/repositório, novos serviços locais de ingestão, script demo/carga, teste e relatório T02. T03 permanece bloqueada até revisão e merge da T02.

**Revisão T02 (primeira entrega):** worker reportou 25 testes direcionados aprovados, incluindo rollback, reinício e banco legado, com `npm ci --offline`; C conferiu árvore limpa, `git diff --check`, base e paths. Falha encontrada em `feedback-ingestion.js`: pendência por conflito entre identificador externo A e CNPJ B era criada, mas `review(link, B)`/`review(create)` falhavam ao tentar remapear o identificador global. C devolveu correção ao mesmo terminal via `orca orchestration send`; decisão: resolver apenas o feedback por revisão humana, preservar mapeamento global e deixar novos conflitos pendentes. Ainda não integrada.

**Baseline após T01 (`20d26da`):** Node `v24.0.2`. Primeira execução de `npm.cmd test` falhou (8 arquivos) somente por `MODULE_NOT_FOUND: express`, pois esta worktree não tinha `node_modules`. `npm.cmd ci` instalou as dependências do lockfile localmente (86 pacotes, 0 vulnerabilidades reportadas). Nova execução de `npm.cmd test`: **32/32 testes passaram** em 5,75 s. Esses testes ainda afirmam fluxos legados de coleta e sentimento; T03 deve substituí-los por cobertura negativa, sem apagá-los para obter verde. Nenhum banco do usuário foi usado.
