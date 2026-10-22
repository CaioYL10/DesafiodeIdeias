# Sincronização do contexto do CRM + SGQ leve — plano de atualização

**Objetivo:** alinhar os documentos de contexto do GR1 à especificação aprovada de CRM focado no relacionamento com clientes, gestão leve da qualidade e classificação de sentimento por IA.

**Abordagem:** atualizar primeiro a fonte detalhada de escopo e o registro do MVP; em seguida alinhar os resumos do repositório e o índice de entregáveis; por fim, identificar claramente os documentos antigos de implementação como substituídos. Manter documentos oficiais do SENAI e entregáveis históricos sem alteração.

**Tecnologias:** Markdown e links relativos existentes; sem mudanças de código ou dependências.

**Especificação:** [`../specs/2026-10-22-crm-sgq-leve-cti-design.md`](../specs/2026-10-22-crm-sgq-leve-cti-design.md)

## Restrições globais

- A integração CRM + SGQ leve é uma proposta do grupo, ainda não validada pela CTI.
- A IA sugere sentimento positivo, neutro ou negativo; a equipe pode revisar e decide se abre um problema de qualidade.
- Chatbot, CRM comercial amplo e SGQ completo permanecem fora do escopo.
- Preservar a divergência entre a orientação relatada de MVP funcional e o cronograma oficial de 13/11.
- Preservar entregáveis históricos Avanade e arquivos oficiais recebidos do SENAI.

---

### Tarefa 1: atualizar a fonte detalhada do escopo CTI

**Arquivos:** `contexto/mudanca_de_escopo_cti.md`.

- [x] Registrar a evolução da proposta CTI em 22/10, separando informação relatada pela empresa de hipótese do grupo.
- [x] Descrever CRM focado na experiência, gestão leve da qualidade, sentimento por IA, fluxo humano de triagem e pontos a validar.
- [x] Corrigir a afirmação antiga de que toda IA está fora do escopo; deixar claro que chatbot segue excluído.

### Tarefa 2: alinhar o registro do MVP e do cronograma

**Arquivos:** `contexto/divisao_tarefas_mvp_22-10-2026.md`, `cronograma/cronograma.md`.

- [x] Registrar que o MVP funcional segue a especificação CRM + SGQ leve, sem inventar decisão sobre arquitetura, provedor de IA ou divisão de equipe.
- [x] Atualizar a nota recente do cronograma e manter intacta a linha transcrita da fonte oficial.

### Tarefa 3: sincronizar os resumos e o índice

**Arquivos:** `AGENTS.md`, `CLAUDE.md`, `README.md`, `entregas/README.md`.

- [x] Atualizar resumos executivos, fase atual, pontos em aberto e links para a especificação canônica.
- [x] Distinguir o escopo atual da CTI do histórico Avanade.

### Tarefa 4: retirar autoridade de documentos substituídos

**Arquivos:** `docs/superpowers/specs/2026-10-22-mvp-feedback-cti-design.md`, `docs/superpowers/plans/2026-10-22-mvp-feedback-cti.md`.

- [x] Preservar os documentos antigos, mas marcá-los como substituídos e não executáveis para o novo escopo.
- [x] Apontar a especificação CRM + SGQ leve como referência vigente; não inventar novo stack nem contratos de API.

### Tarefa 5: revisar consistência documental

- [x] Buscar afirmações vigentes incorretas de que toda IA está fora do escopo ou que o MVP se limita a avaliações e relatórios.
- [x] Conferir os links relativos novos e confirmar que documentos oficiais e históricos não foram alterados.
