# Desafio de Ideias — GR1 (SENAI)

Repositório de trabalho do grupo GR1 no projeto "Desafio de Ideias" do SENAI (turma 2IEDS | 2026).

**Empresa atual:** [CTI](https://www.cti.com.br/) — provedora B2B de internet corporativa, cloud e cibersegurança. Em 22/10/2026, Caio definiu como **hipótese de solução para o GR1** um CRM focado no relacionamento com clientes, integrado a uma gestão leve da qualidade. O fluxo proposto centraliza feedbacks, permite triagem humana de problemas e acompanha ações de melhoria; uma IA sugere sentimento positivo, neutro ou negativo, com possibilidade de revisão humana. A proposta ainda precisa ser validada com a CTI; chatbot, CRM comercial amplo e SGQ completo ficam fora. A especificação está em [`config/superpowers/specs/2026-10-22-crm-sgq-leve-cti-design.md`](config/superpowers/specs/2026-10-22-crm-sgq-leve-cti-design.md). **Análise de mercado concluída em 22/10/2026**, com relatório DOCX e PDF em [`docs/entregas/cti/analise_mercado/`](docs/entregas/cti/analise_mercado). Por solicitação do professor, a equipe também recebeu a orientação de avançar para um **MVP funcional**.

> Escopo anterior (Avanade do Brasil: jogo-aplicativo gamificado com RA e ChatBot) foi refatorado após reunião com a empresa. Detalhes em [`docs/contexto/mudanca_de_escopo_cti.md`](docs/contexto/mudanca_de_escopo_cti.md).

Para o contexto completo e atualizado (fase atual, escopo, MVP, divisão da equipe e pontos a validar), veja [`AGENTS.md`](AGENTS.md), [`CLAUDE.md`](CLAUDE.md), [`docs/contexto/mudanca_de_escopo_cti.md`](docs/contexto/mudanca_de_escopo_cti.md) e [`docs/contexto/divisao_tarefas_mvp_22-10-2026.md`](docs/contexto/divisao_tarefas_mvp_22-10-2026.md).

## Executar o MVP local

Requer Node.js 22.13 ou superior. Usa Express e o SQLite integrado ao Node; não precisa de compilador C++ nem de servidor de banco. No Node 24.12 o módulo SQLite ainda emite um aviso experimental.

```powershell
cd app
npm.cmd ci
npm.cmd run demo
```

A demonstração fica em `http://127.0.0.1:3100/workspace`, com acesso `gestor@demo.local` e senha `demonstracao-cti-2026`. Usa exclusivamente dados fictícios em memória, descartados ao parar; não chama IA nem altera o banco normal.

Para uso local persistente, dentro de `app/`, configure `.env` a partir de `.env.example`, defina `MANAGER_EMAIL` e `MANAGER_PASSWORD` (mínimo de 12 caracteres), execute `npm.cmd run manager:create` e `npm.cmd start`. O banco padrão fica em `data/feedback.sqlite`; faça cópia desse arquivo com o servidor parado antes de transferi-lo para outra máquina. Credenciais da demonstração não são criadas no banco persistente.

### Fluxo implementado em 23/10

1. Cadastre serviços no catálogo e clientes com seus serviços vinculados.
2. Receba o relato pelo formulário público com organização e contato informados ou registre e-mail, telefone e atendimento interno na **Triagem**. Depois vincule organização, contato e serviço contratado existentes.
3. Registre a revisão humana do sentimento. A sugestão da IA permanece intacta e cada revisão guarda gestor, data e observação.
4. Na triagem, abra um problema com análise e categoria; podem ser relacionados vários relatos.
5. Adicione ações com responsável e prazo, registre evidência da execução e verifique a eficácia posteriormente.
6. Se a ação for ineficaz, refaça e registre nova evidência. O histórico mantém as tentativas. O problema só encerra quando todas as ações forem eficazes.

Dashboard, filtros e CSV consideram o sentimento adotado; o CSV também mantém a sugestão original e a revisão humana. A classificação de sentimento não é NPS ou CSAT.

Validação: `npm.cmd test`. Ainda fora desta etapa: edição/exclusão de clientes e serviços, integrações com canais externos, anexos, permissões granulares e publicação. A proposta segue sujeita à validação da CTI; IA real requer configuração e autorização de uso dos dados.

## Pastas

### CRM de organizações e contatos (31/10)

Em **Clientes e qualidade → Clientes**, é possível cadastrar e atualizar a organização e seu responsável interno, manter vários contatos com função, e-mail e telefone opcionais, e registrar interações com tipo, data, resumo e contato relacionado opcional. O detalhe da organização reúne contatos, interações em ordem cronológica, serviços vinculados e relatos. O campo livre antigo é convertido em contato marcado como legado ao abrir o banco; os relatos existentes permanecem vinculados. Contatos e interações são atualizados sem exclusão física. Essas regras são premissas provisórias do MVP, ainda não validadas pela CTI.

Esta é a **Etapa 1** do plano de 31/10.

### Serviços contratados por organização (31/10)

Na área **Clientes**, cada organização pode cadastrar várias instâncias do mesmo serviço do catálogo. Cada instância tem nome de referência, local/unidade, identificador externo, descrição curta e estado ativo ou inativo. A triagem permite escolher uma instância ou deixar o serviço específico sem identificação; o detalhe do problema mostra o contexto e permite completá-lo depois. O vínculo com o item genérico do catálogo continua disponível. Os vínculos antigos de organização e catálogo geram uma instância básica, sem local ou identificador inventados; relatos e problemas antigos recebem essa instância quando o vínculo é inequívoco. Nenhum registro é apagado na edição. Não se armazenam credenciais nem dados técnicos de acesso. Essas regras são premissas do MVP, ainda não validadas pela CTI.

Esta é a **Etapa 2** do plano de 31/10.

### Origem e autor dos relatos (31/10)

O formulário público pede nome da organização e do contato, com e-mail opcional, sem listar clientes cadastrados. A equipe pode registrar relatos de e-mail, telefone ou atendimento interno na **Triagem**, com protocolo externo opcional. O relato guarda canal, data de recebimento, autor e organização informados; esses dados permanecem separados dos cadastros vinculados pela equipe. Na triagem, é possível associar ou corrigir organização, contato e instância do serviço. A avaliação exige nota de 1 a 5; reclamação e sugestão aceitam ausência de nota. Um protocolo repetido no mesmo canal gera aviso e pode ser registrado após confirmação humana. O comentário original, a sugestão de sentimento e as revisões humanas são preservados separadamente. A análise de sentimento só é solicitada para texto marcado como demonstrativo; falhas não impedem o registro. Bancos antigos são migrados ao abrir, preservando os relatos. Estas são premissas provisórias do MVP, não requisitos validados pela CTI.

Esta é a **Etapa 3** do plano de 31/10. A análise estruturada dos problemas permanece na etapa 4.

### Análise e tratamento de problemas de qualidade (31/10)

Na triagem, a abertura de um problema continua sendo uma decisão humana. O formulário registra impacto (baixo, médio, alto ou crítico), prioridade (baixa, normal ou alta), contenção inicial, causa identificada quando conhecida e recorrência, com referência opcional a um problema anterior. A causa pode ficar pendente durante a investigação; **o encerramento exige causa identificada e todas as ações verificadas como eficazes**. O detalhe permite atualizar a análise enquanto o caso estiver aberto e mostra os relatos relacionados. Alterações de impacto, prioridade, contenção, causa e recorrência entram no histórico com gestor e data. Cada execução de ação tem sua própria evidência e verificação; uma tentativa ineficaz permanece consultável após nova execução. Problemas e ações antigos são preservados na migração, com impacto médio, prioridade normal e causa pendente quando esses dados não existiam.

Esta é a **Etapa 4** do plano de 31/10. Os valores e regras são premissas do MVP, ainda não validados pela CTI.

### Fluxo integrado e verificação (31/10)

O cenário sintético automatizado em `app/test/crm-quality.test.js` cria organização, responsável, contato, interação e serviço contratado; recebe relatos por canal interno; associa os relatos na triagem; deixa uma reclamação sem problema e outro relato sem instância identificada; abre um caso com dois relatos e referência a um caso anterior; registra contenção, causa, ação, duas execuções e verificações (a primeira ineficaz); encerra após comprovação; e atualiza organização, contato e serviço para conferir os vínculos e o histórico. Execute com `cd app` e `node --test test/crm-quality.test.js`. A suíte completa usa `npm.cmd test`.

Esta é a **Etapa 5** do plano de 31/10. Limitações das quatro áreas: o vínculo entre relatos e problemas é definido na abertura e não é editável depois; a recorrência aponta para um caso anterior, sem detecção automática; registros legados sem causa permanecem abertos até análise humana; a sugestão de sentimento é demonstrativa e não usa provedor externo.

| Pasta | Responsabilidade |
| --- | --- |
| `app/src/` | Backend Express, regras, autenticação e banco SQLite |
| `app/public/` | Páginas, estilos e JavaScript do navegador |
| `app/test/` | Testes automatizados da aplicação |
| `app/test-support/` | Apoio à execução dos testes |
| `app/scripts/` | Comandos administrativos e demonstração do MVP |
| `docs/` | Contexto, cronograma, fontes, entregas e geradores escolares |
| `config/` | Especificações, planos e referências visuais; veja o [índice](config/README.md) |
| `app/data/` | Banco local gerado em execução, ignorado pelo Git |

### Materiais escolares

- [`docs/contexto/`](docs/contexto) — mudança de escopo, divisão de tarefas do MVP, dados da empresa e pontos em aberto.
- [`docs/cronograma/`](docs/cronograma) — cronograma da turma e status do GR1.
- [`config/superpowers/specs/`](config/superpowers/specs) — desenho vigente da solução e registros substituídos de decisões anteriores.
- [`docs/fontes/`](docs/fontes) — documentos originais do SENAI (roteiro-modelo, orientações gerais, cronogramas e Planos de Ensino v2/v3).
- [`docs/entregas/`](docs/entregas) — veja o [índice dos entregáveis](docs/entregas/README.md); materiais atuais da CTI separados por frente e documentos Avanade arquivados como histórico.
- [`docs/scripts/documents/`](docs/scripts/documents) — geradores de documentos das entregas; veja os [comandos e requisitos](docs/scripts/README.md).
