# Acordos internos mínimos da demonstração local

Estes formatos são **fictícios**, não contrato da futura origem externa. São decisões de implementação para T02–T09, apoiadas nas tabelas e convenções atuais. Mudança incompatível exige registro por C e aviso aos consumidores antes de continuar.

## 1. Fonte e ingestão

O fornecedor local exporta uma função que devolve registros sem rede e sem segredo. Cada item traz `sourceSystem` (`demo-external`), `externalEventId` estável, `externalClientId` quando conhecido, `occurredAt` ISO 8601, `service`, `kind` (`feedback`, `complaint` ou `suggestion`), `comment`, `dimension` (`technical`, `relationship` ou `mixed`) e objeto `client` com `name` e `cnpj` válido quando houver. `rating`, `contact`, `email`, `phone`, `externalClassification` e `technicalReference` são opcionais. Classificação externa conserva nome/origem; `null` significa ausente, nunca erro de análise local. Exemplo fictício:

```json
{"sourceSystem":"demo-external","externalEventId":"evt-1001","externalClientId":"cli-100","occurredAt":"2026-11-01T12:00:00.000Z","service":"internet","kind":"complaint","comment":"Não recebemos retorno sobre o prazo informado.","dimension":"relationship","client":{"name":"Alvorada Exemplo Ltda","cnpj":"11222333000181"},"technicalReference":null}
```

T02 valida campos/tamanhos/datas e registra erro por item sem travar todo o lote. `sourceSystem + externalEventId` é único e repetição devolve o registro existente sem sobrescrever conteúdo externo nem decisões internas. Cada item é transação SQLite: cliente/vínculo/feedback confirmam juntos ou revertem juntos. Após falha, reprocessar somente pendentes; banco em arquivo deve resistir a reinício. A fonte é chamada por script ou seed local, **sem endpoint público de importação**.

Conjunto demonstrativo planejado, todo fictício:

| Evento | Identidade | Dimensão | Verificação |
| --- | --- | --- | --- |
| `evt-1001` | `cli-100`, Alvorada Exemplo Ltda | Relacional | Cria perfil e histórico |
| `evt-1002` | Mesmo `cli-100` | Mista | Vincula ao perfil; referência técnica externa separada |
| `evt-1002` repetido | Mesmo ID de evento | Mista | Não duplica nem muda decisão humana |
| `evt-1003` | Identificadores conflitantes | Relacional | Pendência de identidade, sem mesclagem |
| `evt-1004` | Cliente identificado | Técnica | Consulta CRM; sem hipótese relacional |
| `evt-1005` | Cliente novo com CNPJ único | Relacional | Cadastro automático adicional |

T02 deve produzir a fixture no ponto local substituível e testar ainda item inválido e falha parcial antes de reprocessar. Não colocar e-mail ou telefone real em fixtures.

## 2. Identidade e autoridade de dados

Prioridade: vínculo previamente revisado para `sourceSystem + externalClientId`; em seguida CNPJ válido e único; e-mail/telefone só apoiam revisão, não bastam para mesclagem automática. Nome semelhante sozinho nunca vincula. Identificador conflitando com CNPJ ou múltiplos candidatos gera pendência consultável; não cria perfil nem une registros até decisão humana. Cliente novo só nasce com nome e identificador estável sem conflito ou CNPJ válido. A revisão de pendência exige gestor autenticado, escolha explícita de cliente/criação ou rejeição, justificativa, autor/data e transação; não há mesclagem destrutiva. Dados do feedback de origem são imutáveis na CTI. Campos internos de cliente, associação, interação e decisão não são substituídos pelo reprocessamento. Cadastro manual de cliente permanece como exceção.

## 3. Consultas CRM e feedbacks

Preservar prefixos `/api/manager/crm` e `/api/manager/feedback`, sob sessão de gestor. `GET /api/manager/feedback` mantém envelope `{items,total,page,pageSize}` com paginação limitada e filtros validados. `GET /api/manager/crm/feedback/:id` mostra origem, classificação externa e vínculo/pendência; não oferece escrita do conteúdo externo. `GET /api/manager/crm/clients/:id` agrega feedbacks, contatos, interações, serviços, hipóteses e ocorrências compatíveis. Erros seguem `{error}` e status 400/401/403/404/409 conforme causa. Rotas de estado interno, se mantidas, só alteram acompanhamento CTI com autoria. Nenhum dado importado é apresentado como conclusão humana.

## 4. Hipótese e ocorrência

Regra determinística local identifica **sinais de relacionamento**, não sentimento nem causa. Técnico isolado não produz hipótese relacional; misto considera só trecho/sinal relacional e guarda `technicalReference` sem analisá-lo. Hipótese guarda cliente, IDs de feedback como evidência imutável por referência, período ISO, critério, limitação, estado `pending|confirmed|rejected|adjusted`, autor/data/justificativa da revisão e histórico das decisões. Ajuste preserva texto e evidência anteriores. Confirmação/rejeição/ajuste exigem gestor autenticado e justificativa; hipótese pendente não é fato. Leitura de hipótese confirmada fornece ao SGQ ID, cliente e evidências.

Ocorrência relacional só abre por gestor a partir de hipótese `confirmed`, com cliente e feedbacks coerentes; abertura não é automática. Guarda vínculo à decisão originadora, descrição, investigação, responsável, prioridade/prazo quando aplicáveis e eventos. Reutilizar ações/tentativas/eficácia existentes. Transições inválidas retornam 409; encerramento exige eficácia verificada e justificativa, reabertura exige justificativa/autoria/data. Conteúdo técnico externo nunca entra como causa CTI.

## 5. Retenção e automação

Usar serviços/datas sustentados por `service_instances` ou acompanhamento humano; não inferir prazo de manutenção de texto livre. Clock injetável em UTC, datas locais com fuso explícito `America/Sao_Paulo` na apresentação. Preferência por cliente guarda finalidade, consentimento ativo, destinatário permitido, frequência e ativação; gestor autorizado controla. Simulação local cria prévia, tarefa/lembrete e registro `planned|simulated_success|simulated_failure|cancelled`. Chave de deduplicação combina cliente, regra, evento e janela de frequência. Sem consentimento ou destinatário válido, não executar. Retentativa somente de falha, com autoria/histórico e mesma chave; cancelamento impede execução futura. Adaptador `simulated-mail` registra resultado fictício, sem chamada de rede, SMTP ou indicação de entrega real.

## 6. Matriz curta de consumidores

| Interface | Produtor | Consumidores | Gate |
| --- | --- | --- | --- |
| Fonte, identidade e `feedback_overview` | T02 | T03, T04, T05 | T02 integrada |
| Rotas de consulta sem sentimento local | T03 | T04, T05 | T03 integrada |
| CRM e feedbacks | T04 | T06, T07 | T04 integrada |
| Hipótese e decisão | T05 | T06, T07 | T05 integrada |
| Ocorrência relacional | T06 | T07, T08 | T06 integrada |
| Automação simulada | T08 | T09 | T08 integrada |

Permissões atuais: apenas gestor autenticado. Não declarar papéis extras até existirem no domínio. A decisão humana e a automação precisam de verificação no servidor; esconder controles na interface não concede nem revoga autorização. Dados pessoais são mínimos para a demonstração, logs não exibem conteúdo importado e consultas não vazam registros sem sessão.
