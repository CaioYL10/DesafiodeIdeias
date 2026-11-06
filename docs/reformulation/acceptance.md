# Matriz de aceite e evidência

Cada linha exige teste real ou inspeção documentada em T10; `pendente` não equivale a aprovado. Os critérios completos estão no anexo A do plano.

| Critério | Tarefa principal | Evidência necessária | Estado em T01 |
| --- | --- | --- | --- |
| Limites de origem técnica externa e SGQ relacional, inclusive misto | T01, T05, T06 | Documentos, testes de técnico/misto | Documento alinhado; funcional pendente |
| Importação local idempotente, transacional e reiniciável | T02 | Testes memória/arquivo, repetição, falha parcial | Pendente |
| Identidade segura, ambiguidade e cadastro manual secundário | T02, T04 | Casos novo/existente/ambíguo e correção autorizada | Pendente |
| Retirada de coleta/sentimento e preservação de dados | T03, T04 | Endpoints negativos, busca de resíduos, banco legado | Pendente |
| Consulta paginada e autorizada; histórico CRM e origem | T04 | Testes de rota/UI e navegação local | Pendente |
| Hipóteses com evidência, revisão humana e autoria | T05, T07 | Testes de transição, escopo e interface | Pendente |
| Ocorrência somente confirmada, investigação, ação, eficácia, reabertura | T06, T07 | Ciclo completo, estados inválidos e trilha | Pendente |
| Retenção e comunicação somente simulada, consentimento e idempotência | T08, T09 | Clock/fuso, falha/retentativa, UI e ausência de rede | Pendente |
| Segurança, LGPD, acessibilidade e regressão integrada | Todas, T10 | Suíte, revisão, jornada e reinício após último merge | Pendente |

Critérios de autorização: sessão de gestor para consultas internas e mutações, vínculos cliente/feedback/serviço validados no servidor, justificativa para decisões e eventos auditáveis. O papel único atual de gestor não deve ser descrito como RBAC granular. Exportação CSV, se mantida, precisa de autenticação, neutralização de fórmula e dados mínimos. A política de retenção não define prazo legal fictício nem apaga evidências sem decisão documentada.
