# Contexto do projeto — Desafio de Ideias (SENAI, GR1)

Leia este arquivo antes de ajudar o Caio com qualquer coisa neste repositório. Ele existe para que uma sessão do Claude em **qualquer PC** retome o contexto sem precisar perguntar tudo de novo.

## O projeto

Trabalho escolar do Caio no SENAI (Técnico em Desenvolvimento de Sistemas, turma **2IEDS | 2026**), disciplina "Desafio de Ideias": os alunos pegam uma demanda real cadastrada no site **SENAI Saga** por uma empresa parceira e conduzem um processo de descoberta/prototipação com ela.

- **Grupo:** GR1 (existem também GR2, GR3, GR4 na turma, cada um com sua própria demanda/empresa — não confundir os cronogramas, todos compartilham o mesmo calendário mas entregas são por grupo).
- **Integrantes do GR1:** Caio Yuri Lima, Enzo Yudi Kadooka, Evellyn Silva de Lima, Gabrielly Carvalho Alves, Isabella Dias da Silva, Isabella Radael, Isabella Trópico Puzenato, Nicoly Ribeiro de Souza. Escola SENAI de Informática, Santo André.
- **Empresa/demanda:** Avanade do Brasil Ltda. — Projeto Integrador 2025/02 1.34 08: "Desenvolvimento de Jogo-Aplicativo Gamificado com RA e ChatBot para Reviews de Produtos e Serviços". Detalhes completos da demanda (benefícios esperados, justificativa) estão no roteiro de entrevista, seção "2. GR1".
- **Docente responsável (roteiro geral da turma):** Paulo Cesar de Camargo. Coordenação do curso: Marcos Alves. Coordenação pedagógica: Antônio Marcos. **Orientadores do relatório do GR1:** Prof. Paulo e Prof. Raul.

## Fluxo do programa — não pular etapas

1. **SENAI Saga** (fase atual): descoberta → entrevista com a empresa → Matriz CSD → brainstorming → seleção da solução → **protótipo de baixa/média fidelidade**. Entregável desta fase é só protótipo (wireframes, fluxos), **não** um app funcional.
2. Só se a empresa aprovar a ideia nessa fase é que o projeto migra para o **Inova SENAI**, onde aí sim entra desenvolvimento de aplicação real.

**Implicação prática:** enquanto estivermos na fase SENAI Saga, não sugerir nem começar implementação de código de app — o trabalho certo aqui é documentação de descoberta e prototipação visual.

## Onde estamos (atualizado em 02/10/2026)

Ver [`cronograma/cronograma.md`](cronograma/cronograma.md) para o cronograma completo da turma. Resumo do estado atual:

- ✅ Concluído (etapa 3. Imersão, 17–18/09): **Persona** (Adriana Lima, 38 anos, São Caetano, SP) e **Mapa de Empatia**, registrados em `entregas/RelatorioDesafioIdeias_Imersao.pdf` (fotos dos formulários preenchidos à mão) e transcritos com cuidado (zoom em alta resolução, campo por campo) em [`entregas/persona_e_mapa_empatia.md`](entregas/persona_e_mapa_empatia.md) para ficar pesquisável.
- ✅ Concluído: **Roteiro de entrevista do GR1**, revisado e formatado em Word — [`entregas/Roteiro_Entrevista_GR1_Atualizado.docx`](entregas/Roteiro_Entrevista_GR1_Atualizado.docx). Partiu do modelo oficial (`fontes/Roteiro_Entrevista_GR1_original.pdf`, 20 perguntas em 4 seções A–D) e ganhou 3 perguntas novas, aprovadas pelo Caio, para fechar lacunas encontradas contra o checklist de encerramento do documento de orientações gerais (`fontes/Orientacoes_Gerais_Entrevistas.pdf`):
  - Pergunta 6 (seção A): setor/mercado prioritário para o piloto.
  - Pergunta 12 (seção B): comunidade/colaboração entre usuários.
  - Pergunta 23 (nova seção E): disponibilidade da empresa para validar o protótipo depois da entrevista.
- ✅ Concluído: **CSD inicial** (Certezas / Suposições / Dúvidas) — [`entregas/CSD_Inicial_GR1.docx`](entregas/CSD_Inicial_GR1.docx) / [.pdf](entregas/CSD_Inicial_GR1.pdf), montada a partir da demanda, do roteiro de entrevista e da persona/mapa de empatia.
- ✅ Concluído: **Hipóteses de resposta para as 23 perguntas do roteiro** — [`entregas/Hipoteses_Respostas_Roteiro_GR1.docx`](entregas/Hipoteses_Respostas_Roteiro_GR1.docx) / [.pdf](entregas/Hipoteses_Respostas_Roteiro_GR1.pdf). Depois da entrevista real (01–02/10), comparar cada hipótese com a resposta verdadeira (confirmada/parcial/errada) — isso alimenta a Matriz CSD atualizada.
- ✅ Concluído (rascunho pré-entrevista): **Matriz CSD pré-preenchida** — [`entregas/Matriz_CSD_Pre_Preenchida_GR1.docx`](entregas/Matriz_CSD_Pre_Preenchida_GR1.docx) / [.pdf](entregas/Matriz_CSD_Pre_Preenchida_GR1.pdf) (7 certezas, 8 suposições, 13 dúvidas, ligadas às 23 perguntas e às hipóteses) e **modelo da síntese da entrevista** — [`entregas/Sintese_Entrevista_Modelo_GR1.docx`](entregas/Sintese_Entrevista_Modelo_GR1.docx) / [.pdf](entregas/Sintese_Entrevista_Modelo_GR1.pdf). Ambos estão em branco nos campos de evidência até haver resposta real da Avanade ou de usuários; hipóteses não são fatos.
- ✅ Concluído: **roteiro validado** pelo Prof. Paulo (confirmado pelo Caio em 02/10). Etapa 4 (Preparação da entrevista) fechada.
- ⏳ **Em andamento — aguardando retorno da empresa:** o roteiro foi encaminhado às unidades (25/09) e o Caio conversou com a **Dani CRI em 28/09**, que repassou o roteiro de perguntas às unidades (conforme a planilha atualizada do docente). A entrevista (GR1 "Em andamento", 25%) ainda não tem resposta da Avanade até 02/10, então o registro (01/10) e a síntese (02/10) dependem desse retorno. **Atualização de 02/10:** o grupo voltou a falar com a Dani CRI, que orientou procurar o **coordenador do SENAI São Caetano, Juscelino**, unidade onde a solicitação da demanda foi cadastrada. O grupo ligou para a unidade e foi orientado a **ligar de novo hoje (02/10/2026) após as 13h** para falar com ele. Objetivo da ligação: confirmar se o roteiro chegou à Avanade, obter o contato direto do responsável (ou uma data de retorno) e oferecer formato leve (videochamada de ~20 min ou resposta por escrito às perguntas críticas). Próximos passos: registrar o resultado da ligação com o Juscelino (nome, cargo, promessas e prazo), perguntar ao GR2 (já "Concluído") como obteve a resposta e, sem esperar, entrevistar usuários reais do perfil da persona e pesquisar concorrentes. Registrar as datas dos contatos.
- 🔜 **Próxima entrega:** Matriz CSD atualizada (08/10).
- Depois disso: entrevista real com a Avanade (prevista 01–02/10, pendente), atualização da Matriz CSD (08–09/10), brainstorming (15–16/10), seleção da solução (22–23/10), protótipo V1 (29–30/10) e V2 (05–06/11), consolidação e entrega final da 1ª fase (12–13/11).

## Convenção de pastas neste PC

Neste computador (perfil `Dev_2o_Ano`), todo projeto novo do Caio vai em `Documents\projeto\<NomeDoProjeto>` — este repositório é `Documents\projeto\DesafioDeIdeias`. Se estiver rodando em outra máquina, ignore esse detalhe local.

## Estrutura deste repositório

- `CLAUDE.md` — este arquivo (contexto para qualquer sessão do Claude).
- `cronograma/cronograma.md` — cronograma completo da turma + onde o GR1 está.
- `fontes/` — PDFs originais recebidos do SENAI (roteiro-modelo do GR1, orientações gerais de entrevista, cronograma). Não editar, são referência.
- `entregas/` — entregáveis finais já prontos (ex.: roteiro de entrevista atualizado em .docx).
- `scripts/generate_roteiro.js` — script Node (usa o pacote `docx`) que gera o `.docx` do roteiro replicando fielmente o layout visual do modelo original (cores, fontes, logo extraída do PDF, tabelas com borda). Rodar com `node scripts/generate_roteiro.js` depois de `npm install` para regenerar o roteiro se o conteúdo mudar.
- `scripts/generate_sintese_matriz.js` — gera `entregas/Sintese_Entrevista_Modelo_GR1.docx` e `entregas/Matriz_CSD_Pre_Preenchida_GR1.docx` (mesmo estilo visual; PDFs exportados pelo Word como no item abaixo).
- `scripts/generate_csd_hipoteses.js` — gera `entregas/CSD_Inicial_GR1.docx` e `entregas/Hipoteses_Respostas_Roteiro_GR1.docx`. Os `.pdf` correspondentes são exportados a partir desses `.docx` via automação COM do Word (pacote Python `pywin32`, instalado em escopo de usuário nesta máquina) — não há LibreOffice instalado aqui.

## Preferências de trabalho do Caio (aplicam-se a este projeto também)

- Responder sempre em português do Brasil.
- Nível intermediário: escreve código sozinho, quer acelerar e aprender boas práticas; explicar decisões técnicas de forma direta.
- Alta autonomia para leitura/teste/build; pedir confirmação antes de `git push`, publicar pacote, abrir PR ou qualquer ação que saia da máquina.
- Nunca escrever a mensagem de commit por conta própria — preparar o stage, mostrar `git status --short` e `git diff --stat`, e perguntar a mensagem antes de commitar (a menos que ele peça sugestão).
