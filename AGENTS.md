# Contexto do projeto — Desafio de Ideias (SENAI, GR1)

Leia este arquivo antes de ajudar o Caio com qualquer coisa neste repositório. Ele existe para que uma sessão do Codex em **qualquer PC** retome o contexto sem precisar perguntar tudo de novo.

## O projeto

Trabalho escolar do Caio no SENAI (Técnico em Desenvolvimento de Sistemas, turma **2IEDS | 2026**), disciplina "Desafio de Ideias": os alunos pegam uma demanda real cadastrada no site **SENAI Saga** por uma empresa parceira e conduzem um processo de descoberta/prototipação com ela.

- **Grupo:** GR1 (existem também GR2, GR3, GR4 na turma, cada um com sua própria demanda/empresa — não confundir os cronogramas, todos compartilham o mesmo calendário mas entregas são por grupo).
- **Integrantes do GR1:** Caio Yuri Lima, Enzo Yudi Kadooka, Evellyn Silva de Lima, Gabrielly Carvalho Alves, Isabella Dias da Silva, Isabella Radael, Isabella Trópico Puzenato, Nicoly Ribeiro de Souza, Enzo Avanze, Felipe Bertaco Cruz (os dois últimos entraram em 08/10/2026 como Developers). Escola SENAI de Informática, Santo André.
- **⚠️ Escopo atual da CTI (ler [`docs/contexto/mudanca_de_escopo_cti.md`](docs/contexto/mudanca_de_escopo_cti.md) e [especificação CRM + SGQ leve](config/superpowers/specs/2026-10-22-crm-sgq-leve-cti-design.md)):** CTI (https://www.cti.com.br) é provedora B2B de internet corporativa, cloud e cibersegurança. Após a reunião de 08/10, o grupo registrou que a empresa não tem setor dedicado à análise da qualidade. Em 22/10, o grupo propôs evoluir a solução de feedback para um **CRM focado na experiência do cliente integrado a uma gestão leve da qualidade**. A proposta ainda **não foi validada pela CTI**. A IA está incluída somente para sugerir sentimento **positivo, neutro ou negativo**, com revisão humana; chatbot segue fora. RA e gamificação deixaram de ser o núcleo. Tudo abaixo marcado como "Avanade" é histórico da versão anterior.
- **Empresa/demanda (versão original, histórico):** Avanade do Brasil Ltda. — Projeto Integrador 2025/02 1.34 08: "Desenvolvimento de Jogo-Aplicativo Gamificado com RA e ChatBot para Reviews de Produtos e Serviços". Detalhes completos da demanda (benefícios esperados, justificativa) estão no roteiro de entrevista, seção "2. GR1".
- **Docente responsável (roteiro geral da turma):** Paulo Cesar de Camargo. Coordenação do curso: Marcos Alves. Coordenação pedagógica: Antônio Marcos. **Orientadores do relatório do GR1:** Prof. Paulo e Prof. Raul.

## Instruções vigentes para continuidade

- A proposta CRM + gestão leve da qualidade é hipótese do grupo e ainda não foi validada pela CTI.
- Consulte `config/superpowers/specs/2026-10-22-crm-sgq-leve-cti-design.md` para o escopo proposto. O protótipo que existe hoje está em `app/`; os planos em `config/superpowers/plans/` são registros de etapas anteriores e podem divergir do código atual.
- O protótipo usa dados locais e fictícios. Não o descreva como sistema de produção, autenticação real, IA funcional ou integração validada.
- Não implemente funcionalidades quando o pedido for apenas editar o planejamento. Preserve documentos oficiais e entregáveis históricos, salvo pedido explícito.

## Convenção de pastas neste PC

Neste computador (perfil `Dev_2o_Ano`), todo projeto novo do Caio vai em `Documents\projeto\<NomeDoProjeto>` — este repositório é `Documents\projeto\DesafioDeIdeias`. Se estiver rodando em outra máquina, ignore esse detalhe local.

## Estrutura deste repositório

- `AGENTS.md` — este arquivo (contexto para qualquer sessão do Codex).
- `docs/cronograma/cronograma.md` — cronograma completo da turma + onde o GR1 está.
- `docs/contexto/mudanca_de_escopo_cti.md` — nova empresa (CTI), novo escopo, comparação antes × depois, impacto nos entregáveis e pontos em aberto.
- `config/superpowers/specs/2026-10-22-crm-sgq-leve-cti-design.md` — especificação vigente da proposta CRM + SGQ leve, incluindo IA para sentimento; hipótese do grupo ainda não validada pela CTI.
- `app/` — protótipo local AvaliaPlay CTI; interface em `app/public/`, servidor HTTP mínimo em `app/server.js`, sem backend de CRM.
- `docs/contexto/divisao_tarefas_mvp_22-10-2026.md` — orientação mais recente sobre MVP, divisão da equipe e entregáveis registrados na lousa em 22/10.
- `docs/fontes/Plano_de_Ensino_GR1_v2.docx` e `docs/fontes/Plano_de_Ensino_GR1_v3.docx` — versões do Plano de Ensino do GR1; v2/v3 registram a refatoração para a CTI, e a v3 prevê implementação Full Stack conforme viabilidade.
- `docs/fontes/` — PDFs originais recebidos do SENAI (roteiro-modelo do GR1, orientações gerais de entrevista, cronograma). Não editar, são referência.
- `docs/entregas/README.md` — índice dos entregáveis e explicação da organização por fase.
- `docs/entregas/cti/` — entregáveis atuais da CTI, separados em `descoberta/`, `ideacao/` e `analise_mercado/`.
- `docs/entregas/historico_avanade/` — materiais produzidos para o escopo anterior da Avanade, preservados como histórico.
- `docs/scripts/documents/generate_roteiro.js` — script Node (usa o pacote `docx`) que gera o roteiro Avanade em `docs/entregas/historico_avanade/`, replicando o layout visual do modelo original. Rodar com `node docs/scripts/documents/generate_roteiro.js` depois de `npm install`.
- `docs/scripts/documents/generate_sintese_matriz.js` — gera `docs/entregas/historico_avanade/Sintese_Entrevista_Modelo_GR1.docx` e `docs/entregas/historico_avanade/Matriz_CSD_Pre_Preenchida_GR1.docx` (mesmo estilo visual; PDFs exportados pelo Word como no item abaixo).
- `docs/scripts/documents/generate_matriz_csd_cti.js` — gera a Matriz CSD da CTI (baseada em suposições); confira o caminho de saída no script antes de executar.
- `docs/scripts/documents/generate_csd_hipoteses.js` — gera `docs/entregas/historico_avanade/CSD_Inicial_GR1.docx` e `docs/entregas/historico_avanade/Hipoteses_Respostas_Roteiro_GR1.docx`. Os `.pdf` correspondentes são exportados a partir desses `.docx` via automação COM do Word (pacote Python `pywin32`, instalado em escopo de usuário nesta máquina) — não há LibreOffice instalado aqui.
- `docs/scripts/documents/generate_pesquisa_mercado.js` e `docs/scripts/documents/generate_pesquisa_mercado_pdf.py` — geram o relatório de mercado em `docs/entregas/cti/analise_mercado/`.

## Preferências de trabalho do Caio (aplicam-se a este projeto também)

- Responder sempre em português do Brasil.
- Nível intermediário: escreve código sozinho, quer acelerar e aprender boas práticas; explicar decisões técnicas de forma direta.
- Alta autonomia para leitura/teste/build; pedir confirmação antes de `git push`, publicar pacote, abrir PR ou qualquer ação que saia da máquina.
- Nunca escrever a mensagem de commit por conta própria — preparar o stage, mostrar `git status --short` e `git diff --stat`, e perguntar a mensagem antes de commitar (a menos que ele peça sugestão).
