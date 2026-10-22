# Contexto do projeto — Desafio de Ideias (SENAI, GR1)

Leia este arquivo antes de ajudar o Caio com qualquer coisa neste repositório. Ele existe para que uma sessão do Claude em **qualquer PC** retome o contexto sem precisar perguntar tudo de novo.

## O projeto

Trabalho escolar do Caio no SENAI (Técnico em Desenvolvimento de Sistemas, turma **2IEDS | 2026**), disciplina "Desafio de Ideias": os alunos pegam uma demanda real cadastrada no site **SENAI Saga** por uma empresa parceira e conduzem um processo de descoberta/prototipação com ela.

- **Grupo:** GR1 (existem também GR2, GR3, GR4 na turma, cada um com sua própria demanda/empresa — não confundir os cronogramas, todos compartilham o mesmo calendário mas entregas são por grupo).
- **Integrantes do GR1:** Caio Yuri Lima, Enzo Yudi Kadooka, Evellyn Silva de Lima, Gabrielly Carvalho Alves, Isabella Dias da Silva, Isabella Radael, Isabella Trópico Puzenato, Nicoly Ribeiro de Souza, Enzo Avanze, Felipe Bertaco Cruz (os dois últimos entraram em 08/10/2026 como Developers). Escola SENAI de Informática, Santo André.
- **⚠️ Escopo atual da CTI (ler [`contexto/mudanca_de_escopo_cti.md`](contexto/mudanca_de_escopo_cti.md) e [especificação CRM + SGQ leve](docs/superpowers/specs/2026-10-22-crm-sgq-leve-cti-design.md)):** CTI (https://www.cti.com.br) é provedora B2B de internet corporativa, cloud e cibersegurança. Após a reunião de 08/10, o grupo registrou que a empresa não tem setor dedicado à análise da qualidade. Em 22/10, o grupo propôs evoluir a solução de feedback para um **CRM focado na experiência do cliente integrado a uma gestão leve da qualidade**. A proposta ainda **não foi validada pela CTI**. A IA está incluída somente para sugerir sentimento **positivo, neutro ou negativo**, com revisão humana; chatbot segue fora. RA e gamificação deixaram de ser o núcleo. Tudo abaixo marcado como "Avanade" é histórico da versão anterior.
- **Empresa/demanda (versão original, histórico):** Avanade do Brasil Ltda. — Projeto Integrador 2025/02 1.34 08: "Desenvolvimento de Jogo-Aplicativo Gamificado com RA e ChatBot para Reviews de Produtos e Serviços". Detalhes completos da demanda (benefícios esperados, justificativa) estão no roteiro de entrevista, seção "2. GR1".
- **Docente responsável (roteiro geral da turma):** Paulo Cesar de Camargo. Coordenação do curso: Marcos Alves. Coordenação pedagógica: Antônio Marcos. **Orientadores do relatório do GR1:** Prof. Paulo e Prof. Raul.

## Fluxo do programa — atualização de escopo em 22/10/2026

1. A etapa inicial do **SENAI Saga** cobriu descoberta, entrevista com a CTI, Matriz CSD, brainstorming e seleção da solução.
2. Em 22/10/2026, Caio informou que, por solicitação do professor, o grupo deve avançar de prototipação de baixa fidelidade para um **MVP funcional**. Esta é a orientação de execução mais recente para o GR1.
3. Em 22/10, Caio decidiu adotar como hipótese para o GR1 um CRM focado em clientes, serviços e feedbacks, integrado a um fluxo leve de qualidade: triagem humana, problemas de qualidade, ações com responsáveis/prazos e verificação de eficácia. A IA sugere sentimento positivo, neutro ou negativo, sujeito a revisão humana; não abre casos nem define causas ou ações. Chatbot continua fora. Detalhes em [`docs/superpowers/specs/2026-10-22-crm-sgq-leve-cti-design.md`](docs/superpowers/specs/2026-10-22-crm-sgq-leve-cti-design.md).

**Divergência documental:** o cronograma recebido em 08/10 ainda diz que software funcional não será exigido na entrega de 13/11. O Plano de Ensino v3, por sua vez, prevê desenvolvimento Full Stack conforme viabilidade, testes e demonstração funcional. A orientação do professor relatada em 22/10 prevalece para o trabalho atual; registrar eventual atualização oficial do cronograma/plano quando disponível. Não voltar a restringir o trabalho a wireframes sem considerar essa orientação.

## Onde estamos (atualizado em 22/10/2026)

- **Escopo CTI atualizado em 22/10:** CRM focado no relacionamento e gestão leve da qualidade, com IA limitada à classificação de sentimento e revisão humana. É uma proposta do grupo baseada, entre outros pontos, no relato de que a CTI não possui setor dedicado à análise da qualidade; não descrever como requisito validado. A especificação vigente é [`docs/superpowers/specs/2026-10-22-crm-sgq-leve-cti-design.md`](docs/superpowers/specs/2026-10-22-crm-sgq-leve-cti-design.md).
- A entrevista de contexto com a CTI ocorreu em 08/10 (confirmado pelo Caio), mas **as respostas ainda não foram registradas no repo**. Não inventar conteúdo: pedir ao Caio as anotações.
- **Papéis do grupo:** Caio = Product Owner; Isabella Dias da Silva = Scrum Master; demais = Developers.
- **Matriz CSD da CTI feita por suposições (08/10):** [`entregas/cti/descoberta/Matriz_CSD_CTI_GR1.docx`](entregas/cti/descoberta/Matriz_CSD_CTI_GR1.docx) / [.pdf](entregas/cti/descoberta/Matriz_CSD_CTI_GR1.pdf), gerada por `scripts/generate_matriz_csd_cti.js` (7 certezas com fonte, 13 suposições, 14 dúvidas). As respostas da reunião ainda não foram transcritas; a hipótese CRM + SGQ leve também precisa de validação com a CTI. Suposições não são fatos: só marcar veredito com evidência real.
- **Etapa atual:** seleção da solução (22–23/10), com preparação para o MVP funcional. A **análise de mercado foi concluída em 22/10**; relatório editável e PDF em [`entregas/cti/analise_mercado/Pesquisa_Analise_Mercado_Feedback_CTI_GR1.docx`](entregas/cti/analise_mercado/Pesquisa_Analise_Mercado_Feedback_CTI_GR1.docx) e [`entregas/cti/analise_mercado/Pesquisa_Analise_Mercado_Feedback_CTI_GR1.pdf`](entregas/cti/analise_mercado/Pesquisa_Analise_Mercado_Feedback_CTI_GR1.pdf). As ideias do brainstorming de 15/10 estão em [`entregas/cti/ideacao/Atividade_Brainstorming_GR1_15-10-2026.docx`](entregas/cti/ideacao/Atividade_Brainstorming_GR1_15-10-2026.docx).
- **Divisão da equipe e entregáveis de 22/10:** ver [`contexto/divisao_tarefas_mvp_22-10-2026.md`](contexto/divisao_tarefas_mvp_22-10-2026.md). A lousa distribui prototipação, análise de mercado, roteiro/vídeo/edição, slides/ABNT e prompts; indica concluir análise e roteiro no dia e iniciar as demais frentes.
- Os entregáveis da fase Avanade (roteiro, CSD inicial, hipóteses, matriz pré-preenchida, síntese) ficam como histórico e podem ser regenerados pelos scripts.
- **Pontos em aberto** (lista completa nos arquivos de contexto): transcrever as respostas da entrevista; validar com CTI e docente a hipótese de CRM + SGQ leve; validar canal de entrada, processo atual de qualidade, indicadores e uso de IA em dados reais; resolver a divergência entre orientação de MVP funcional e cronograma oficial; revisar a persona Adriana B2C para o contexto B2B.

### Histórico até 02/10/2026 (versão Avanade)

Ver [`cronograma/cronograma.md`](cronograma/cronograma.md) para o cronograma completo da turma. Resumo do estado atual:

- ✅ Concluído (etapa 3. Imersão, 17–18/09): **Persona** (Adriana Lima, 38 anos, São Caetano, SP) e **Mapa de Empatia**, registrados em `entregas/historico_avanade/RelatorioDesafioIdeias_Imersao.pdf` (fotos dos formulários preenchidos à mão) e transcritos com cuidado (zoom em alta resolução, campo por campo) em [`entregas/historico_avanade/persona_e_mapa_empatia.md`](entregas/historico_avanade/persona_e_mapa_empatia.md) para ficar pesquisável.
- ✅ Concluído: **Roteiro de entrevista do GR1**, revisado e formatado em Word — [`entregas/historico_avanade/Roteiro_Entrevista_GR1_Atualizado.docx`](entregas/historico_avanade/Roteiro_Entrevista_GR1_Atualizado.docx). Partiu do modelo oficial (`fontes/Roteiro_Entrevista_GR1_original.pdf`, 20 perguntas em 4 seções A–D) e ganhou 3 perguntas novas, aprovadas pelo Caio, para fechar lacunas encontradas contra o checklist de encerramento do documento de orientações gerais (`fontes/Orientacoes_Gerais_Entrevistas.pdf`):
  - Pergunta 6 (seção A): setor/mercado prioritário para o piloto.
  - Pergunta 12 (seção B): comunidade/colaboração entre usuários.
  - Pergunta 23 (nova seção E): disponibilidade da empresa para validar o protótipo depois da entrevista.
- ✅ Concluído: **CSD inicial** (Certezas / Suposições / Dúvidas) — [`entregas/historico_avanade/CSD_Inicial_GR1.docx`](entregas/historico_avanade/CSD_Inicial_GR1.docx) / [.pdf](entregas/historico_avanade/CSD_Inicial_GR1.pdf), montada a partir da demanda, do roteiro de entrevista e da persona/mapa de empatia.
- ✅ Concluído: **Hipóteses de resposta para as 23 perguntas do roteiro** — [`entregas/historico_avanade/Hipoteses_Respostas_Roteiro_GR1.docx`](entregas/historico_avanade/Hipoteses_Respostas_Roteiro_GR1.docx) / [.pdf](entregas/historico_avanade/Hipoteses_Respostas_Roteiro_GR1.pdf). Depois da entrevista real (01–02/10), comparar cada hipótese com a resposta verdadeira (confirmada/parcial/errada) — isso alimenta a Matriz CSD atualizada.
- ✅ Concluído (rascunho pré-entrevista): **Matriz CSD pré-preenchida** — [`entregas/historico_avanade/Matriz_CSD_Pre_Preenchida_GR1.docx`](entregas/historico_avanade/Matriz_CSD_Pre_Preenchida_GR1.docx) / [.pdf](entregas/historico_avanade/Matriz_CSD_Pre_Preenchida_GR1.pdf) (7 certezas, 8 suposições, 13 dúvidas, ligadas às 23 perguntas e às hipóteses) e **modelo da síntese da entrevista** — [`entregas/historico_avanade/Sintese_Entrevista_Modelo_GR1.docx`](entregas/historico_avanade/Sintese_Entrevista_Modelo_GR1.docx) / [.pdf](entregas/historico_avanade/Sintese_Entrevista_Modelo_GR1.pdf). Ambos estão em branco nos campos de evidência até haver resposta real da Avanade ou de usuários; hipóteses não são fatos.
- ✅ Concluído: **roteiro validado** pelo Prof. Paulo (confirmado pelo Caio em 02/10). Etapa 4 (Preparação da entrevista) fechada.
- ⏳ **Em andamento — aguardando retorno da empresa:** o roteiro foi encaminhado às unidades (25/09) e o Caio conversou com a **Dani CRI em 28/09**, que repassou o roteiro de perguntas às unidades (conforme a planilha atualizada do docente). A entrevista (GR1 "Em andamento", 25%) ainda não tem resposta da Avanade até 02/10, então o registro (01/10) e a síntese (02/10) dependem desse retorno. **Atualização de 02/10:** o grupo voltou a falar com a Dani CRI, que orientou procurar o **coordenador do SENAI São Caetano, Juscelino**, unidade onde a solicitação da demanda foi cadastrada. O grupo ligou para a unidade e foi orientado a **ligar de novo hoje (02/10/2026) após as 13h** para falar com ele. Objetivo da ligação: confirmar se o roteiro chegou à Avanade, obter o contato direto do responsável (ou uma data de retorno) e oferecer formato leve (videochamada de ~20 min ou resposta por escrito às perguntas críticas). Próximos passos: registrar o resultado da ligação com o Juscelino (nome, cargo, promessas e prazo), perguntar ao GR2 (já "Concluído") como obteve a resposta e, sem esperar, entrevistar usuários reais do perfil da persona e pesquisar concorrentes. Registrar as datas dos contatos.
- 🔜 **Próxima entrega:** Matriz CSD atualizada (08/10).
- Depois disso: entrevista real com a Avanade (prevista 01–02/10, pendente), atualização da Matriz CSD (08–09/10), brainstorming (15–16/10), seleção da solução (22–23/10), protótipo V1 (29–30/10) e V2 (05–06/11), consolidação e entrega final da 1ª fase (12–13/11).

## Convenção de pastas neste PC

Neste computador (perfil `Dev_2o_Ano`), todo projeto novo do Caio vai em `Documents\projeto\<NomeDoProjeto>` — este repositório é `Documents\projeto\DesafioDeIdeias`. Se estiver rodando em outra máquina, ignore esse detalhe local.

## Estrutura deste repositório

- `CLAUDE.md` — este arquivo (contexto para qualquer sessão do Claude).
- `cronograma/cronograma.md` — cronograma completo da turma + onde o GR1 está.
- `contexto/mudanca_de_escopo_cti.md` — nova empresa (CTI), novo escopo, comparação antes × depois, impacto nos entregáveis e pontos em aberto.
- `docs/superpowers/specs/2026-10-22-crm-sgq-leve-cti-design.md` — especificação vigente da proposta CRM + SGQ leve, incluindo IA para sentimento; hipótese do grupo ainda não validada pela CTI.
- `contexto/divisao_tarefas_mvp_22-10-2026.md` — orientação mais recente sobre MVP, divisão da equipe e entregáveis registrados na lousa em 22/10.
- `fontes/Plano_de_Ensino_GR1_v2.docx` e `fontes/Plano_de_Ensino_GR1_v3.docx` — versões do Plano de Ensino do GR1; v2/v3 registram a refatoração para a CTI, e a v3 prevê implementação Full Stack conforme viabilidade.
- `fontes/` — PDFs originais recebidos do SENAI (roteiro-modelo do GR1, orientações gerais de entrevista, cronograma). Não editar, são referência.
- `entregas/README.md` — índice dos entregáveis e explicação da organização por fase.
- `entregas/cti/` — entregáveis atuais da CTI, separados em `descoberta/`, `ideacao/` e `analise_mercado/`.
- `entregas/historico_avanade/` — materiais produzidos para o escopo anterior da Avanade, preservados como histórico.
- `scripts/generate_roteiro.js` — script Node (usa o pacote `docx`) que gera o roteiro Avanade em `entregas/historico_avanade/`, replicando o layout visual do modelo original. Rodar com `node scripts/generate_roteiro.js` depois de `npm install`.
- `scripts/generate_sintese_matriz.js` — gera `entregas/historico_avanade/Sintese_Entrevista_Modelo_GR1.docx` e `entregas/historico_avanade/Matriz_CSD_Pre_Preenchida_GR1.docx` (mesmo estilo visual; PDFs exportados pelo Word como no item abaixo).
- `scripts/generate_matriz_csd_cti.js` — gera `entregas/cti/descoberta/Matriz_CSD_CTI_GR1.docx` (versão CTI, por suposições); PDF exportado pelo Word via COM como os demais.
- `scripts/generate_csd_hipoteses.js` — gera `entregas/historico_avanade/CSD_Inicial_GR1.docx` e `entregas/historico_avanade/Hipoteses_Respostas_Roteiro_GR1.docx`. Os `.pdf` correspondentes são exportados a partir desses `.docx` via automação COM do Word (pacote Python `pywin32`, instalado em escopo de usuário nesta máquina) — não há LibreOffice instalado aqui.
- `scripts/generate_pesquisa_mercado.js` e `scripts/generate_pesquisa_mercado_pdf.py` — geram o relatório de mercado em `entregas/cti/analise_mercado/`.

## Preferências de trabalho do Caio (aplicam-se a este projeto também)

- Responder sempre em português do Brasil.
- Nível intermediário: escreve código sozinho, quer acelerar e aprender boas práticas; explicar decisões técnicas de forma direta.
- Alta autonomia para leitura/teste/build; pedir confirmação antes de `git push`, publicar pacote, abrir PR ou qualquer ação que saia da máquina.
- Nunca escrever a mensagem de commit por conta própria — preparar o stage, mostrar `git status --short` e `git diff --stat`, e perguntar a mensagem antes de commitar (a menos que ele peça sugestão).
