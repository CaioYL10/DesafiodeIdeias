# Atualização do MVP e divisão de tarefas — GR1 (22/10/2026)

## Mudança de orientação

Em 22/10/2026, Caio informou que, por solicitação do professor, o grupo não deve se limitar à prototipação de baixa fidelidade e precisa avançar para um **MVP funcional**. Esta é a orientação mais recente para a execução do GR1.

Em 22/10, Caio definiu para o GR1 a hipótese ampliada de solução: **CRM focado no relacionamento com clientes + gestão leve da qualidade**. O fluxo proposto reúne cadastro básico de clientes/serviços, histórico de feedbacks, triagem humana de problemas, ações com responsável e prazo e verificação de eficácia. A IA pode sugerir sentimento positivo, neutro ou negativo; a equipe revisa quando necessário e decide se abre um problema. Chatbot, CRM comercial amplo e SGQ completo ficam fora. A proposta ainda precisa ser validada com a CTI; ver a [especificação vigente](../../config/superpowers/specs/2026-10-22-crm-sgq-leve-cti-design.md).

O Plano de Ensino v3 prevê desenvolvimento incremental, integração Full Stack e APIs conforme viabilidade, testes, documentação e demonstração. Já o cronograma recebido em 08/10 diz que software funcional não será exigido em 13/11; essa divergência documental foi preservada em [`../cronograma/cronograma.md`](../cronograma/cronograma.md), sem apagar o texto da fonte oficial.

## Divisão registrada na lousa

Fonte: foto **“divisão de tarefas.jpg”**, localizada no Google Drive do grupo em 22/10/2026: [abrir imagem no Drive](https://drive.google.com/file/d/1gFcSaPZWCQQ3kcuCNmgksFtgtVMy8-Jb/view?usp=drivesdk).

| Frente | Responsáveis anotados |
|---|---|
| Prototipação | Felipe; Isabella Dias |
| Análise de mercado | Evellyn |
| Roteiro, vídeo e edição | Nicoly; Isabella P. |
| Slides e ABNT | Gabrielly; Nicoly; Julia; Isabella P. |
| Prompt | Caio; Enzo Avanze |
| Prompt do banco | Enzo Kadooka |

Os nomes foram mantidos como aparecem na lousa. O cadastro de integrantes do repo lista dez pessoas; “Isabella P.” e “Julia” são as formas abreviadas registradas para essas frentes, conforme confirmação do Caio em 22/10.

## Entregáveis anotados

| Frente | Formato / entrega |
|---|---|
| Prototipação | PDFs com telas simples |
| Análise de mercado | ✅ Concluída em 22/10/2026. Relatório DOCX e PDF em [`../entregas/cti/analise_mercado/`](../entregas/cti/analise_mercado) |
| Roteiro | DOCX e PDF |
| Slides | PDF com as telas e o link |
| Documentação | Arquivo em DOCX e PDF |
| Prompt(s) | Arquivo Markdown (`.md`) |

A lousa indicava concluir análise de mercado e roteiro em 22/10 e iniciar as demais frentes. **A análise de mercado foi concluída em 22/10/2026**; o roteiro permanece como a outra entrega prevista para essa data. Também aparece a anotação “CRM — 12/11–19/11”, sem contexto suficiente no registro para determinar a que atividade ou prazo se refere; não foi convertida em prazo oficial.

## Restrições de contexto

- A proposta de CRM + SGQ leve é uma hipótese do grupo; não a descrever como requisito confirmado pela CTI.
- A IA está incluída somente para classificar sentimento em positivo, neutro ou negativo, com possibilidade de revisão humana. Não classifica causas, não abre problemas automaticamente e não define ações.
- Sentimento não equivale a NPS/CSAT. Não tratar a classe positiva/neutra/negativa como nota formal de satisfação.
- Evitar CRM comercial completo e SGQ completo; selecionar apenas a fatia viável para o MVP.
- As suposições da Matriz CSD não devem ser descritas como requisitos confirmados. A divisão de equipe anotada na lousa não foi alterada por esta decisão de escopo.
- A data e os formatos dos entregáveis acima foram transcritos da lousa; não representam, por si só, uma atualização formal do cronograma do SENAI.
