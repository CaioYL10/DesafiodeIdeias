# Sistema integrado de relacionamento com clientes e gestão da qualidade — CTI

**Data:** 22/10/2026

**Status:** desenho aprovado por Caio em 22/10/2026; proposta do grupo ainda não validada pela CTI.

**Contexto:** esta especificação registra a ampliação da solução de feedback da CTI para um CRM focado na experiência do cliente, integrado a um fluxo leve de gestão da qualidade. Ela sucede a proposta anterior de MVP concentrada em avaliações e relatórios.

## Problema e hipótese

A CTI informou ao grupo que não possui um setor dedicado à análise da qualidade. Caio, Product Owner do GR1, decidiu registrar como proposta do projeto integrar o acompanhamento de clientes e feedbacks a um processo simples de identificação e tratamento de problemas.

Essa interpretação é uma **hipótese de solução**, não uma necessidade validada pela CTI. A existência ou ausência de um setor especializado não confirma, por si só, como os relatos são recebidos, analisados ou resolvidos atualmente.

## Objetivo

Propor uma plataforma que centralize informações de clientes, serviços e interações relevantes, receba avaliações, reclamações e sugestões, ajude a equipe a identificar problemas recorrentes e acompanhe ações de melhoria até a verificação de seus resultados.

O sistema deve apoiar a gestão e a melhoria contínua. Não se propõe substituir um CRM comercial completo nem implantar um SGQ completo.

## Escopo funcional proposto

### Relacionamento com clientes

- Manter cadastro básico de clientes corporativos e dos serviços relacionados a cada cliente.
- Registrar e consultar histórico de interações pertinentes à experiência dos serviços.
- Centralizar feedbacks, reclamações e sugestões vinculados, quando possível, ao cliente e ao serviço correspondente.
- Permitir consultar os relatos e seus estados de acompanhamento.

O canal de entrada dos feedbacks — formulário próprio, registro por colaborador ou integração com um canal existente — permanece a validar com a CTI.

### Classificação de sentimento por IA

- Analisar o texto do feedback e sugerir uma classe: **positivo, neutro ou negativo**.
- Guardar a classe sugerida e permitir que uma pessoa revise ou corrija o resultado.
- Distinguir a classificação da IA da classificação final adotada pela equipe, preservando rastreabilidade da revisão.
- Usar o sentimento como dimensão de análise, nunca como nota formal de satisfação ou decisão automática de qualidade.
- Não abrir casos de qualidade, atribuir causas ou definir ações corretivas automaticamente a partir do sentimento.

A tecnologia e o provedor de IA não estão definidos. Antes de processar feedbacks reais, a CTI deve validar o uso, o acesso, a retenção e o envio de dados a qualquer serviço externo. A demonstração deve usar textos sintéticos até essa validação.

### Gestão leve da qualidade

- Permitir que a equipe faça a triagem de relatos e registre um problema de qualidade quando considerar necessário.
- Relacionar o problema a um ou mais feedbacks, clientes e serviços quando aplicável.
- Registrar análise do problema, ação de melhoria, responsável, prazo, estado e evidência de conclusão.
- Permitir registrar uma verificação posterior para avaliar se a ação foi eficaz.
- Exibir histórico do tratamento e permitir identificar problemas recorrentes.

“Problema de qualidade” é o termo operacional inicial. O uso formal de “não conformidade”, critérios de abertura e etapas de aprovação dependem da validação do processo real da CTI.

## Fluxo principal

1. Um feedback, reclamação ou sugestão é recebido ou registrado e relacionado a cliente e serviço quando esses dados estiverem disponíveis.
2. A IA sugere sentimento positivo, neutro ou negativo; a equipe pode revisar ou corrigir a classificação.
3. A equipe analisa o relato e decide se ele exige apenas acompanhamento no histórico ou a abertura de um caso de qualidade.
4. Para um caso de qualidade, a equipe registra análise, ação, responsável e prazo.
5. Após a execução, a equipe registra evidência e verifica a eficácia da ação.
6. Os dados alimentam indicadores para apoiar a gestão e a priorização de melhorias.

Feedback e problema de qualidade são registros relacionados, mas distintos. Nem todo feedback negativo constitui problema de qualidade ou não conformidade.

## Indicadores iniciais

O protótipo pode apresentar:

- distribuição dos sentimentos sugeridos/revisados por período e serviço;
- volume de feedbacks por cliente, serviço, tipo e período;
- quantidade de problemas abertos, em tratamento e encerrados;
- recorrência de problemas por categoria definida pela equipe;
- ações pendentes, vencidas e concluídas;
- eficácia das ações após a verificação.

A classificação de sentimento não equivale a NPS ou CSAT. Se a CTI precisar de uma métrica formal de satisfação, será necessário definir uma pergunta, escala e regra de cálculo próprias.

## Limites do projeto

Ficam fora do escopo desta proposta:

- funil de vendas, oportunidades, campanhas e automação comercial de um CRM amplo;
- todos os processos e controles de um SGQ completo, como auditorias, controle documental e certificações;
- chatbot e geração automática de respostas;
- análise causal ou definição automática de prioridade e ação por IA;
- abertura automática de problema de qualidade ou não conformidade;
- afirmar conformidade com norma ou requisito regulatório sem análise específica.

O escopo do MVP precisa permanecer pequeno o bastante para uma entrega escolar funcional. A seleção final das telas, campos e indicadores deve priorizar o fluxo principal e ser revista após a validação com a CTI.

## Dados conceituais

Entidades candidatas para orientar a modelagem:

- **Cliente:** organização atendida e seus dados básicos necessários ao acompanhamento.
- **Serviço:** serviço da CTI associado ao cliente ou ao feedback.
- **Interação/feedback:** relato, reclamação, sugestão ou outra interação pertinente, com origem, data e histórico.
- **Classificação de sentimento:** classe sugerida pela IA, confiança quando disponível, estado da análise e eventual correção humana.
- **Problema de qualidade:** registro de triagem e tratamento que pode apontar para vários feedbacks.
- **Ação de melhoria:** atividade vinculada ao problema, com responsável, prazo, estado e resultado da verificação de eficácia.

Esta lista é conceitual. Identificadores, campos obrigatórios, regras de acesso e retenção precisam ser definidos com base no processo validado e na viabilidade do MVP.

## Requisitos de qualidade do sistema

- Manter rastreabilidade entre relato original, classificação sugerida, revisão humana, problema e ação relacionada.
- Não perder feedback caso a classificação por IA falhe; a análise deve poder ficar pendente ou ser refeita.
- Mostrar quando a classificação é automática e quando foi revisada por uma pessoa.
- Restringir o acesso a dados de clientes e relatos aos papéis autorizados pela CTI.
- Minimizar dados pessoais e confidenciais; não usar dados reais em serviços externos de IA antes da aprovação do uso pela CTI.
- Não apresentar correlação entre sentimento e causa como causalidade comprovada.

## Decisões de escopo tomadas por Caio para o GR1

- A solução será um CRM focado na experiência e no histórico de feedbacks, integrado a uma gestão leve da qualidade.
- A IA classificará o sentimento em positivo, neutro ou negativo.
- A equipe poderá revisar ou corrigir a classificação.
- A equipe, e não a IA, decide se um relato se torna um problema de qualidade e define o tratamento.
- Chatbot, CRM comercial amplo e SGQ completo ficam fora do escopo.

Essas decisões representam a proposta do grupo e não devem ser descritas como requisitos confirmados pela CTI.

## Pontos para validar com a CTI e o docente

1. Quem registra feedbacks e quem os analisa? Há responsáveis distribuídos entre suporte, comercial ou gestão?
2. Quais canais são usados hoje e há histórico que possa ser consultado?
3. Quais dados de cliente e serviço podem ser armazenados e quem pode acessá-los?
4. Como a empresa distingue reclamação, incidente, problema de qualidade e não conformidade?
5. Como são escolhidos responsáveis, prazos e prioridades das ações atuais?
6. Como a CTI verifica que uma melhoria resolveu o problema?
7. Quais categorias e indicadores ajudam a gestão a tomar decisões?
8. A CTI autoriza o uso de IA para classificar textos? Quais regras de privacidade, retenção e revisão seriam necessárias?
9. A solução deve receber feedback diretamente ou integrar/cadastrar dados de um canal existente?
10. Qual fatia desse fluxo cabe no MVP funcional e na apresentação do GR1?

## Critérios de aceite do desenho

1. O sistema relaciona feedbacks a cliente e serviço quando os dados estiverem disponíveis.
2. A IA sugere somente uma das classes de sentimento positivo, neutro ou negativo; a classificação pode ser revisada por uma pessoa.
3. Falha ou indisponibilidade da IA não apaga nem impede o registro do feedback.
4. A equipe decide se um relato abre um problema de qualidade.
5. Um problema pode ter ação, responsável, prazo, estado e registro de verificação de eficácia.
6. A gestão consegue visualizar tendências de feedback e o estado dos problemas e ações, sem tratar sentimento como NPS/CSAT.
7. O desenho deixa explícitos os limites de CRM e SGQ e as validações ainda necessárias com a CTI.
