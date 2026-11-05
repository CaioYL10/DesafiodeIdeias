# Reformulação do projeto CTI: CRM e SGQ de relacionamento

> Instruções diretas para o Codex. Leia o contexto e as regras gerais antes de executar a etapa solicitada no repositório CTI / Desafio de Ideias.

## Objetivo

Evoluir gradualmente o projeto existente para uma plataforma de **CRM de relacionamento com clientes e SGQ voltado à qualidade desse relacionamento**, preservando stack, arquitetura útil, identidade visual e funcionalidades pertinentes. Começar por auditoria, aproveitar o que já existe e evitar reconstrução desnecessária.

Um sistema externo coleta feedbacks e analisa problemas técnicos. A plataforma CTI importa esses registros, cadastra automaticamente clientes novos quando houver identificação suficiente, agrupa o histórico e analisa padrões de atendimento e relacionamento. As análises são hipóteses rastreáveis, revisadas por pessoas antes de virarem conclusões ou ações oficiais.

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
12. **Retirada do escopo antigo:** remover a coleta direta de feedbacks pela CTI, formulários públicos ou internos de envio/cadastro manual de feedback, campanhas de coleta e análise de sentimento executada pela plataforma. Retirar telas, rotas, endpoints, serviços, tarefas, indicadores, configurações, dependências exclusivas e documentação desses fluxos, após mapear suas referências. A importação autenticada do sistema externo permanece: ela é necessária ao novo produto.
13. **Tela de feedbacks:** servir exclusivamente à consulta de todos os feedbacks importados, respeitando permissões. Exibir os dados fornecidos pela origem, com paginação, busca/filtros e consulta de detalhes quando necessários. Não oferecer criação manual, envio, edição do conteúdo externo nem análise de sentimento local. Se a origem fornecer sentimento ou classificação, apresentá-los apenas como dados externos, identificando a origem, sem gerar ou recalcular localmente. As hipóteses relacionais próprias e sua revisão ficam no SGQ, vinculadas aos feedbacks como evidências.

## Remoção obrigatória do legado fora do escopo

Esta decisão prevalece sobre orientações genéricas de preservar funcionalidades anteriores. Preservar a stack não significa manter recursos que deixaram de fazer parte do produto. Não apagar dados históricos indiscriminadamente: separar a retirada de código da política de retenção, arquivamento ou migração dos dados. Remover colunas e tabelas somente depois de verificar dependências, compatibilidade e recuperação.

## Regras para todas as etapas

- Em cada etapa, leia instruções locais e contexto atualizado. Não suponha framework, banco, pastas ou provedor.
- Identifique arquivos e fluxos antes de alterar. Preserve trabalho preexistente; não sobrescreva mudanças do usuário.
- Não faça git pull, git push, publicação ou ação externa sem autorização. No início do trabalho em repositório Git, confirme se é necessário git pull, conforme as instruções locais.
- Faça mudanças pequenas e revisáveis. Relate arquivos alterados, decisões, verificações e limitações; não declare sucesso sem evidência.
- Faça checkpoint revisável ao final de cada etapa aprovada. Não crie commit sem perguntar a mensagem; antes, mostre git status --short e git diff --stat. Não faça push.
- Defina contratos de dados antes da integração. Migrações devem ser seguras, preferencialmente aditivas e reversíveis, preservar os dados atuais e documentar recuperação.
- Escreva ou atualize testes proporcionais às regras alteradas. Rode testes específicos primeiro e amplie quando o impacto for transversal. Registre comandos e resultados reais.
- Proteja dados pessoais com minimização, autorização, trilha de auditoria, retenção apropriada e tratamento seguro de segredos. Não exponha dados pessoais em logs, fixtures ou exemplos.
- Não invente detalhes ausentes da API externa. Registre lacunas e avance com contratos ou abstrações desacopladas quando possível.
- Não implemente etapas futuras antecipadamente; registre dependências e justifique qualquer ajuste de escopo.

## Protocolo de execução pelo Codex

Este arquivo é a especificação executável do trabalho. As etapas abaixo contêm instruções diretas, sem necessidade de copiar prompts. O usuário pode solicitar: “Leia REFORMULACAO_CTI_CRM_SGQ.md e execute a etapa 1”. Leia sempre as informações e regras gerais junto com a etapa solicitada.

- Execute a etapa ou sequência solicitada até seus critérios de aceite. Quando várias etapas forem solicitadas, avance entre elas sem pedir aprovação genérica novamente, respeitando confirmações específicas de Git e ações externas.
- Verifique os pré-requisitos no código e nos registros de continuidade. Não presuma que etapas anteriores foram concluídas.
- A inspeção inicial faz parte da etapa 1; não há uma fase independente de aprovação de auditoria.
- Reutilize um registro de acompanhamento existente ou crie docs/reformulation-progress.md. Registre por etapa: estado (pendente, em andamento, concluída ou bloqueada), decisões, arquivos importantes, verificações e resultados, limitações e próximos passos.
- Ao retomar, leia este arquivo e o acompanhamento e confira o código. Continue do ponto registrado, aproveitando verificações anteriores quando ainda válidas.
- Só marque uma etapa concluída quando seus critérios de aceite forem atendidos. Contrato ou credencial externa ausente deve ser registrado como dependência; fixtures não equivalem a homologação real.
- Ao finalizar, atualize o acompanhamento e relate resultados. Um checkpoint pode ser um estado local revisável; faça commit somente após perguntar a mensagem. A ausência de commit não impede outra etapa já solicitada.
- Não invente detalhes externos. Avance nas partes independentes e pergunte apenas quando uma decisão realmente bloquear a execução segura.

## Etapas de implementação

Execute as etapas de 1 a 8 em ordem. Todas as regras e decisões anteriores se aplicam a cada etapa.

## Etapa 1 — Contexto do produto e documentação

**Resultado:** documentação alinhada antes de mudar comportamentos.

Inspecione de forma direcionada a stack, arquitetura, modelos, fluxos, integrações, permissões, banco, migrações, testes e documentação existentes. Registre recursos a preservar, adaptar e remover, seus consumidores compartilhados e riscos. Não pare apenas para solicitar aprovação de um diagnóstico. Em seguida, alinhe a documentação existente ao produto CTI CRM + SGQ de relacionamento. Preserve informações válidas, corrija o que conflita e não implemente funcionalidades nesta etapa.

Documente propósito e limites do produto; responsabilidades do sistema externo e da CTI; importação e cadastro automático; identidade, duplicidade e revisão de ambiguidades; histórico do cliente; análise como hipótese; revisão humana; ocorrência, investigação, ação e eficácia; funções CRM; automações; segurança e LGPD. Diferencie problemas puramente técnicos, relacionais e mistos. Em casos mistos, o SGQ CTI trata somente a dimensão relacional.

Use os arquivos e padrões existentes. Não invente API, campos, tecnologias ou regras legais. Liste lacunas que dependem de decisão ou documentação externa. Ao terminar, informe arquivos alterados e verificações de consistência. Não faça commit.

**Aceite:** responsabilidades técnicas e relacionais estão corretamente separadas em toda a documentação.

## Etapa 2 — Domínio, contratos e migrações

**Resultado:** dados e compatibilidade definidos antes da integração.

A partir do código inspecionado e da documentação alinhada na etapa 1, prepare contratos e modelo de domínio para CRM + SGQ relacional conforme os padrões existentes.

Inspecione os modelos e proponha mudanças mínimas para representar quando necessário: cliente e identidade externa; feedback importado e vínculo com cliente; eventos de histórico; hipótese relacional com evidências, período e estado de revisão; ocorrência SGQ; investigação/causa; plano de ação, responsável, prazo, estado e verificação de eficácia; serviços e lembretes se já fizerem parte do domínio. Reutilize entidades existentes quando seguro.

Defina contrato de importação versionável e idempotente. Preserve identificador da origem, instante de ocorrência/recebimento, conteúdo e classificação técnica de origem quando disponível, sem tratá-la como análise CTI. Separe campos externos de conclusões internas. Planeje correspondência, ambiguidades, registros incompletos, reprocessamento e deduplicação. Campos não confirmados pela origem devem ficar explicitamente pendentes/opcionais.

Apresente plano aditivo de migração, compatibilidade, reversão/recuperação e validações. Implemente conforme os padrões identificados no repositório e documente compatibilidade e recuperação dos dados históricos. Não apague dados. Inclua testes proporcionais e reporte arquivos, decisões, riscos e resultados reais. Não faça commit.

**Aceite:** origem e decisões internas são distinguíveis; repetição não duplica registros; migração preserva os dados atuais.

## Etapa 3 — Importação, cadastro automático e remoção dos fluxos antigos

**Resultado:** fluxo principal de entrada pelo feedback, idempotente e seguro diante de identidade incerta.

Implemente, conforme contratos definidos na etapa 2 e padrões do repositório, a importação dos feedbacks externos e o cadastro automático de clientes como fluxo principal.

Valide o formato; registre origem e identificador externo; processe repetições sem duplicar; crie perfil mínimo quando não houver correspondência confiável e houver dados suficientes; vincule ao cliente existente somente com identidade segura; não una pessoas/empresas apenas por semelhança de nome; encaminhe ambiguidades para revisão; permita completar/corrigir perfil depois. Mantenha cadastro manual secundário. Trate falhas parciais e reprocessamento sem perda. A integração não deve sobrescrever conclusões humanas nem dados internos sem regra explícita.

Respeite autorização, validação no servidor, segurança de credenciais e tratamento de erros. Não registre conteúdo sensível desnecessário. Não conecte a serviço real nem invente URL ou credenciais. Se o contrato externo estiver pendente, use a abstração aprovada e fixtures sintéticas seguras.

Remova coleta direta, envio e cadastro manual de feedback e análise de sentimento local: telas, rotas, endpoints, serviços, tarefas, indicadores, configurações, documentação e dependências exclusivas. Preserve ingestão externa, dados históricos e componentes compartilhados. Atualize testes afetados e verifique que os antigos pontos de entrada não permitem essas operações.

Inclua testes de cliente novo, existente, evento repetido, identidade ambígua, payload inválido, falha/reprocessamento e preservação de dados internos. Rode testes específicos e reporte comandos/resultados. Não faça commit.

**Aceite ponta a ponta:** feedback elegível cria cliente e histórico uma única vez; correspondência ambígua não mescla; cadastro manual continua disponível.

## Etapa 4 — CRM, histórico e consulta dos feedbacks externos

**Resultado:** visão do cliente centrada no relacionamento, rastreável e acessível.

Evolua telas e fluxos CRM existentes, preservando identidade visual e componentes úteis, para apresentar clientes e seu histórico unificado. Use dados reais do domínio e padrões de navegação/acessibilidade existentes.

Mostre identificação e origem, feedbacks, contatos/interações, serviços pertinentes, estado do relacionamento e indicadores com fórmula documentada. Inclua pesquisa/listagem, filtros úteis e navegação entre perfil, feedback e ocorrência. Sinalize dados incompletos e correspondências aguardando revisão. Permita edição controlada e registre alterações importantes conforme os padrões identificados no repositório. Não apresente hipótese não revisada como fato.

Transforme a tela de feedbacks em consulta de todos os registros externos autorizados, com paginação, busca/filtros e detalhes. Exiba os dados da origem, sem criação, envio, edição do conteúdo externo ou análise de sentimento local. Identifique classificações externas como tais e não as recalcule. Mantenha hipóteses relacionais e revisão na área SGQ.

Implemente estados de carregamento, vazio, erro e falta de permissão. Proteja dados pessoais. Não invente indicadores: documente critério/período ou deixe de fora até definição. Atualize testes proporcionais; verifique o fluxo com ferramentas existentes e informe o que realmente verificou. Não faça commit.

**Aceite:** pessoa autorizada localiza o cliente criado por feedback e percorre o histórico sem confundir dados importados com conclusões internas.

## Etapa 5 — Padrões relacionais e revisão humana

**Resultado:** análise própria CTI baseada em evidências, sem conclusão definitiva automática.

Implemente o fluxo de análise de padrões de atendimento e relacionamento da CTI usando feedbacks e histórico. O sistema externo continua responsável pela análise técnica; não replique essa análise.

Detecte ou organize sinais como insatisfação com atendimento, demanda não atendida, comunicação inadequada, demora/falta de retorno, acompanhamento insuficiente, inadequação/desnecessidade do serviço e risco de deterioração/abandono. Para cada sinal, exiba evidências, período, critério de agrupamento e limitações. Toda análise é hipótese: permita estados pendente, confirmada, rejeitada ou ajustada, com responsável, data e justificativa. Confirmação exige pessoa autorizada. Não atribua culpa individual nem abra ocorrência automaticamente sem regra aprovada.

Em casos mistos, encaminhe ao SGQ somente a dimensão relacional e mantenha referência à classificação técnica externa. Explique incerteza; não apresente correlação como causalidade.

Inclua testes de limite de escopo, evidências, autorização/revisão, rejeição e caso misto. Reuse regras determinísticas/arquitetura aprovadas. Não adicione IA ou dependência externa sem autorização e justificativa. Rode verificações focadas, reporte resultados e não faça commit.

**Aceite:** hipótese não revisada fica pendente; conclusões têm evidências e decisão humana rastreáveis; problema técnico isolado não vira ocorrência relacional.

## Etapa 6 — Ocorrências, investigação e planos de ação

**Resultado:** ciclo de melhoria contínua para ocorrências relacionais.

Implemente/adapte o SGQ para gerir ocorrências confirmadas de relacionamento, investigação e ações, seguindo modelos e permissões existentes.

Permita abertura por pessoa autorizada a partir de hipótese confirmada; descrição e evidências; classificação relacional; investigação de causa sem apresentá-la como certeza automática; responsável, prioridade e prazo quando aplicáveis; ações com estados e histórico; acompanhamento; avaliação de eficácia com critério registrado; encerramento ou reabertura justificados. Vincule cliente, feedbacks e decisão originadora. Mantenha trilha de alterações e não apague silenciosamente evidências.

Não inclua tratamento técnico em ocorrência CTI e não transforme toda reclamação em não conformidade. Aplique autorização por papel e valide transições no servidor. Teste ciclo, permissões, estados inválidos, rastreabilidade e eficácia. Migrações devem preservar dados. Reporte verificações; não faça commit.

**Aceite:** ocorrência relacional percorre investigação, ação e eficácia com autoria e histórico; dados técnicos ficam fora da responsabilidade CTI.

## Etapa 7 — Retenção, serviços e automações

**Resultado:** acompanhamento seguro e configurável.

Evolua CRM para apoiar retenção, acompanhamento, serviços e automações de comunicação/manutenção, reutilizando integrações existentes. Antes de adicionar provedor/dependência ou enviar algo real, identifique a configuração; não envie mensagens externas nesta etapa sem autorização explícita.

Implemente apenas recursos sustentados pelo domínio: serviços e datas relevantes se disponíveis; lembretes; tarefas de acompanhamento; preferências/consentimentos; templates revisáveis; histórico de mensagens planejadas/enviadas/falhas; prevenção de duplicidade; cancelamento e retentativa controlada. Separe lembrete de manutenção de diagnóstico técnico. Dê controle de frequência, destinatários e ativação, respeitando autorização e minimização.

Sem provedor/dados necessários, entregue abstração segura e documente configuração pendente, sem simular envio real. Teste agendamento/fuso conforme padrão, consentimento, idempotência, falha e autorização. Execute verificações focadas; reporte resultados; não faça commit.

**Aceite:** automações são configuráveis e rastreáveis, respeitam preferências e não enviam duplicatas nem mensagens sem autorização válida.

## Etapa 8 — Segurança, LGPD, regressão e fechamento

**Resultado:** revisão integrada e evidências de aceite ponta a ponta.

Revise a reformulação CTI CRM + SGQ com foco em segurança, privacidade, coerência e regressões. Não amplie escopo; corrija defeitos necessários aos requisitos aprovados.

Procure referências e acessos residuais aos fluxos removidos, inclusive navegação, tarefas, indicadores e documentação. Confirme que a tela de feedbacks apenas consulta registros externos e que a importação e o SGQ permanecem funcionais.

Verifique permissões/isolamento; validação e proteção da integração; segredos fora do código; logs sem exposição indevida; minimização, finalidade, retenção e correção de dados pessoais; trilha de auditoria; migrações/compatibilidade; idempotência/duplicidade; revisão humana; fronteira entre análise técnica externa e relacional CTI; acessibilidade; documentação e testes.

Execute a jornada disponível: importar feedback; criar cliente automaticamente; repetir evento sem duplicar; agrupar histórico; gerar/visualizar hipótese com evidências; confirmar/rejeitar; abrir ocorrência quando apropriado; registrar investigação/ação; avaliar eficácia; verificar automação sem envio externo não autorizado. Se houver dependência de API, credencial, decisão ou ambiente ausente, indique-a precisamente e valide o restante com fixtures seguras.

Rode testes/verificações relevantes existentes. Não alegue cobertura não executada. Corrija falhas introduzidas e rode novamente os testes afetados. Entregue relatório final com funcionalidades, arquitetura preservada/adaptada, arquivos/migrações importantes, comandos/resultados, critérios atendidos/não atendidos, riscos/dependências e instruções de configuração/execução. Não faça commit nem push. Antes de commit futuro, mostre git status --short e git diff --stat e pergunte a mensagem.

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
- [ ] Migrações preservam dados, com validação e recuperação documentadas.
- [ ] Testes proporcionais, segurança, LGPD, documentação e jornada ponta a ponta foram verificados com resultados reais.
- [ ] Dependências e decisões pendentes são explicitadas, sem invenção ou falsa conclusão.

## Lacunas que podem exigir decisão

Pergunte somente quando a decisão bloquear implementação segura: formato/autenticação da integração; campos mínimos da origem; política de mesclagem/retenção; papéis que confirmam hipótese e encerram ocorrência; provedor e consentimento de e-mail; fórmula de indicadores; prazos e prioridades. Continue tarefas independentes enquanto registra a lacuna e implementa abstrações desacopladas.

