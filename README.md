# Desafio de Ideias — GR1 (SENAI)

Repositório de trabalho do grupo GR1 no projeto "Desafio de Ideias" do SENAI (turma 2IEDS | 2026).

**Empresa atual:** [CTI](https://www.cti.com.br/) — provedora B2B de internet corporativa, cloud e cibersegurança. Em 22/10/2026, Caio definiu como **hipótese de solução para o GR1** um CRM focado no relacionamento com clientes, integrado a uma gestão leve da qualidade. O fluxo proposto centraliza feedbacks, permite triagem humana de problemas e acompanha ações de melhoria; uma IA sugere sentimento positivo, neutro ou negativo, com possibilidade de revisão humana. A proposta ainda precisa ser validada com a CTI; chatbot, CRM comercial amplo e SGQ completo ficam fora. A especificação está em [`docs/superpowers/specs/2026-10-22-crm-sgq-leve-cti-design.md`](docs/superpowers/specs/2026-10-22-crm-sgq-leve-cti-design.md). **Análise de mercado concluída em 22/10/2026**, com relatório DOCX e PDF em [`entregas/cti/analise_mercado/`](entregas/cti/analise_mercado/). Por solicitação do professor, a equipe também recebeu a orientação de avançar para um **MVP funcional**.

> Escopo anterior (Avanade do Brasil: jogo-aplicativo gamificado com RA e ChatBot) foi refatorado após reunião com a empresa. Detalhes em [`contexto/mudanca_de_escopo_cti.md`](contexto/mudanca_de_escopo_cti.md).

Para o contexto completo e atualizado (fase atual, escopo, MVP, divisão da equipe e pontos a validar), veja [`AGENTS.md`](AGENTS.md), [`CLAUDE.md`](CLAUDE.md), [`contexto/mudanca_de_escopo_cti.md`](contexto/mudanca_de_escopo_cti.md) e [`contexto/divisao_tarefas_mvp_22-10-2026.md`](contexto/divisao_tarefas_mvp_22-10-2026.md).

## Executar o MVP local

Requer Node.js 22.13 ou superior. Usa Express e o SQLite integrado ao Node; não precisa de compilador C++ nem de servidor de banco. No Node 24.12 o módulo SQLite ainda emite um aviso experimental.

```powershell
npm.cmd ci
npm.cmd run demo
```

A demonstração fica em `http://127.0.0.1:3100/workspace`, com acesso `gestor@demo.local` e senha `demonstracao-cti-2026`. Usa exclusivamente dados fictícios em memória, descartados ao parar; não chama IA nem altera o banco normal.

Para uso local persistente, configure `.env` a partir de `.env.example`, defina `MANAGER_EMAIL` e `MANAGER_PASSWORD` (mínimo de 12 caracteres), execute `npm.cmd run manager:create` e `npm.cmd start`. O banco padrão fica em `data/feedback.sqlite`; faça cópia desse arquivo com o servidor parado antes de transferi-lo para outra máquina. Credenciais da demonstração não são criadas no banco persistente.

### Fluxo implementado em 23/10

1. Cadastre serviços no catálogo e clientes com seus serviços vinculados.
2. Receba feedback pelo formulário existente. Em **Clientes e qualidade → Triagem**, associe cliente/serviço e tipo do relato.
3. Registre a revisão humana do sentimento. A sugestão da IA permanece intacta e cada revisão guarda gestor, data e observação.
4. Na triagem, abra um problema com análise e categoria; podem ser relacionados vários relatos.
5. Adicione ações com responsável e prazo, registre evidência da execução e verifique a eficácia posteriormente.
6. Se a ação for ineficaz, refaça e registre nova evidência. O histórico mantém as tentativas. O problema só encerra quando todas as ações forem eficazes.

Dashboard, filtros e CSV consideram o sentimento adotado; o CSV também mantém a sugestão original e a revisão humana. A classificação de sentimento não é NPS ou CSAT.

Validação: `npm.cmd test`. Ainda fora desta etapa: edição/exclusão de clientes e serviços, integrações com canais externos, anexos, permissões granulares e publicação. A proposta segue sujeita à validação da CTI; IA real requer configuração e autorização de uso dos dados.

## Pastas

- [`contexto/`](contexto) — mudança de escopo, divisão de tarefas do MVP, dados da empresa e pontos em aberto.
- [`cronograma/`](cronograma) — cronograma da turma e status do GR1.
- [`docs/superpowers/specs/`](docs/superpowers/specs/) — desenho vigente da solução e registros substituídos de decisões anteriores.
- [`fontes/`](fontes) — documentos originais do SENAI (roteiro-modelo, orientações gerais, cronogramas e Planos de Ensino v2/v3).
- [`entregas/`](entregas) — veja o [índice dos entregáveis](entregas/README.md); materiais atuais da CTI separados por frente e documentos Avanade arquivados como histórico.
- [`scripts/`](scripts) — scripts para gerar documentos das entregas em DOCX e PDF.
