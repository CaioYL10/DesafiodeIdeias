# Desenho do MVP de feedback da CTI

> **SUBSTITUÍDO EM 22/10/2026:** esta versão refletia o escopo anterior, concentrado em formulário público, notas e relatórios. Não usar como referência vigente nem como requisito de produto. Consultar [`2026-10-22-crm-sgq-leve-cti-design.md`](2026-10-22-crm-sgq-leve-cti-design.md), aprovado por Caio e ainda sujeito à validação da CTI. Este arquivo foi preservado apenas como histórico da decisão anterior.

**Data:** 22/10/2026

**Status:** substituído em 22/10/2026; preservado como histórico da proposta anterior.

**Contexto histórico:** o GR1 mudou da prototipação de baixa fidelidade para um MVP funcional. A proposta anterior era receber, armazenar e analisar feedbacks dos serviços da CTI para a equipe de gestão. Naquele desenho, a IA foi considerada somente para classificar o sentimento de comentários demonstrativos.

## Objetivo

Entregar uma aplicação local funcional para registrar feedbacks sem conta de cliente e permitir que gestores autenticados acompanhem os registros, sua classificação de sentimento e o andamento de cada tratativa.

O produto é um sistema focado em feedback e qualidade. “CRM” descreve a experiência de acompanhamento para a gestão; não significa CRM comercial com contatos, vendas, campanhas ou oportunidades.

## Fluxos principais

### Enviar feedback

1. O cliente abre o formulário público, sem criar conta.
2. Informa o serviço avaliado, uma nota de 1 a 5 e um comentário obrigatório.
3. A aplicação valida e grava o feedback no SQLite antes de chamar o serviço de IA.
4. O servidor envia somente dados demonstrativos à OpenAI API para classificar o comentário como positivo, neutro ou negativo.
5. O cliente recebe confirmação do registro. A classificação não precisa aparecer ao cliente.

Serviços iniciais propostos: Internet, Cloud, Cibersegurança, Suporte e Outro. Esses rótulos são premissas de protótipo e precisam ser validados com a CTI.

Se a chamada de IA falhar, o feedback continua salvo e sua análise fica marcada como pendente. Um gestor poderá solicitar nova tentativa. A aplicação não deve descartar o comentário por indisponibilidade externa.

### Consultar e acompanhar feedbacks

1. Um gestor entra com sua conta.
2. O painel mostra quantidade de feedbacks, média das notas, evolução das notas ao longo do tempo e distribuição de sentimentos.
3. O gestor pesquisa e filtra a lista por serviço, período, sentimento e status de tratativa.
4. O gestor muda o status de um feedback entre **Novo**, **Em análise** e **Resolvido**.
5. O gestor exporta o conjunto filtrado em CSV para abrir em uma planilha.

O MVP não terá criação pública de contas, edição ou exclusão de comentários, exportação XLSX/PDF, envio de pesquisa por e-mail, chatbot, respostas generativas nem gestão de contatos comerciais.

## Arquitetura

- **Servidor:** Node.js com Express. Serve os arquivos da interface e disponibiliza a API no mesmo endereço local, evitando configuração de CORS no MVP.
- **Interface:** HTML, CSS e JavaScript sem framework ou identidade visual da CTI. O foco visual é clareza, formulário acessível e um painel de gestão legível em desktop e celular.
- **Persistência:** SQLite em arquivo local dentro de `data/`, excluído do Git.
- **Banco de dados:** tabelas para gestores, sessões e feedbacks. Cada feedback guarda serviço, nota, comentário, data de criação, sentimento, estado da análise e status da tratativa.
- **Classificação de sentimento:** chamada feita pelo servidor à OpenAI Responses API, com chave lida de variável de ambiente e nunca enviada ao navegador. A saída deve seguir um esquema restrito com os rótulos `positive`, `neutral` e `negative`; a interface apresenta esses rótulos em português. A documentação da API descreve saídas estruturadas com JSON Schema para restringir o formato da resposta ([Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)).
- **Dependências novas previstas:** Express e um driver SQLite para Node.js. A integração HTTP com OpenAI pode usar `fetch` do Node.js, sem expor credenciais no cliente.

### API inicial

- `POST /api/feedback` — público; valida e registra um novo feedback, depois tenta classificar seu sentimento.
- `POST /api/auth/login` — autentica um gestor.
- `POST /api/auth/logout` — encerra a sessão.
- `GET /api/auth/session` — informa se existe sessão de gestor válida.
- `GET /api/manager/summary` — protegido; retorna métricas do painel.
- `GET /api/manager/feedback` — protegido; lista e filtra feedbacks.
- `PATCH /api/manager/feedback/:id/status` — protegido; atualiza o status de tratativa.
- `POST /api/manager/feedback/:id/reanalyze` — protegido; tenta novamente uma classificação pendente.
- `GET /api/manager/export.csv` — protegido; exporta os filtros aplicados.

Os nomes são uma proposta de contrato para orientar a implementação; podem ser ajustados sem alterar o fluxo do produto.

## Acesso e dados

- Apenas gestores fazem login; não existe cadastro público.
- A conta inicial de gestão é criada por comando local de configuração, sem senha padrão gravada no repositório.
- Senhas são armazenadas com hash usando `scrypt` do Node.js, nunca em texto simples.
- A sessão expira e usa cookie `HttpOnly` e `SameSite`; os endpoints de consulta, painel, atualização de status e exportação exigem sessão válida.
- O servidor escuta apenas em `127.0.0.1` nesta etapa. O MVP não será publicado para acesso público.
- A rota pública só aceita novos feedbacks. Ela não expõe listagem, métricas ou exportação.
- Comentários podem conter informações pessoais ou confidenciais. Para este MVP, usar exclusivamente textos sintéticos de demonstração. Nenhum feedback real da CTI deve ser encaminhado à OpenAI API.
- A chave `OPENAI_API_KEY` fica em variável de ambiente local, não em arquivos versionados nem no navegador.
- O CSV deve escapar campos corretamente e neutralizar valores iniciados por caracteres de fórmula, para reduzir o risco de executar conteúdo ao abrir em planilhas.

Esses controles são a base mínima para uma demonstração local com login. Implantação, TLS, proteção contra abuso em escala, gestão avançada de sessão, papéis múltiplos e requisitos LGPD devem ser tratados antes de uso real.

## Regras de validação e estados

- Serviço deve pertencer à lista permitida.
- Nota deve ser um inteiro de 1 a 5.
- Comentário é obrigatório, após remover espaços nas extremidades, e tem limite inicial de 1.000 caracteres.
- Data e hora são definidas pelo servidor em UTC.
- Estado da análise de IA: `pending`, `completed` ou `failed`.
- Sentimento: `positive`, `neutral` ou `negative`, preenchido somente quando a classificação for válida.
- Status da tratativa: `new`, `in_review` ou `resolved`.
- Uma falha do serviço externo não desfaz a transação de criação do feedback.

## Testes e verificação

A implementação deve cobrir, sem chamadas reais à OpenAI API:

- validação de campos obrigatórios, nota e limite de comentário;
- criação pública de feedback sem permitir leitura pública;
- proteção dos endpoints de gestor sem sessão e acesso com sessão válida;
- cálculo das métricas e aplicação coerente dos filtros;
- mudança de status e exportação CSV dos registros filtrados;
- classificação simulada para os três rótulos e persistência do estado pendente em falhas do provedor;
- escape de campos do CSV e ausência da chave OpenAI nos arquivos enviados ao navegador.

Para verificação manual, o projeto deve funcionar com dados sintéticos e deixar claro como configurar `OPENAI_API_KEY` e criar o primeiro gestor. Se a chave não estiver configurada, o formulário ainda deve salvar feedbacks, deixando a análise pendente.

## Critérios de aceite

1. Uma pessoa sem conta consegue enviar um feedback com serviço, nota e comentário; o registro fica no SQLite.
2. A aplicação não revela feedbacks nem indicadores sem login de gestor.
3. Um gestor consegue entrar, consultar os indicadores, filtrar registros e atualizar status.
4. O gestor consegue exportar em CSV o resultado dos filtros atuais.
5. Com chave configurada e dados demonstrativos, o servidor grava uma das três classes de sentimento.
6. Se a IA estiver indisponível, o feedback continua disponível no painel com análise pendente e pode ser reprocessado.
7. O sistema roda apenas localmente e não exige identidade visual da CTI.

## Premissas que precisam de validação futura

- Quais serviços e categorias de feedback a CTI quer usar.
- Se nota de 1 a 5 representa adequadamente a avaliação.
- Se status **Novo / Em análise / Resolvido** representa o fluxo real de tratativas.
- Quais indicadores e periodicidade a gestão considera úteis.
- Como a empresa autorizará qualquer envio futuro de comentários reais a um provedor de IA e qual será a política de retenção e acesso.
