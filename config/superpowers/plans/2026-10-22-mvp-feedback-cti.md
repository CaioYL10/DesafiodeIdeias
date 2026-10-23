# MVP de feedback da CTI — plano de implementação

> **SUPERADO EM 22/10/2026 — NÃO EXECUTAR:** este plano implementa o escopo anterior de feedback com formulário público e painel, sem cadastro relacional de clientes, casos de qualidade ou ações corretivas. O provedor e a integração técnica de IA descritos aqui não foram aprovados para a nova solução. Use [`../specs/2026-10-22-crm-sgq-leve-cti-design.md`](../specs/2026-10-22-crm-sgq-leve-cti-design.md) como especificação vigente. Um novo plano técnico só deve ser definido depois de validar a proposta com a CTI e escolher a fatia viável do MVP.

> **Para execução por agente:** implementar as tarefas em sequência e revisar o diff ao final de cada tarefa. Cada tarefa preserva os fluxos aprovados na especificação.

**Objetivo:** entregar uma aplicação local em que clientes enviam feedback sem conta e gestores autenticados acompanham sentimento, indicadores, tratativas e exportações.

**Arquitetura:** Node.js e Express servem a interface e a API local. SQLite armazena gestores, sessões e feedbacks. O servidor envia somente comentários demonstrativos à OpenAI Responses API para classificação estruturada de sentimento; uma falha de IA não impede o registro.

**Stack:** Node.js, Express, better-sqlite3, HTML, CSS, JavaScript, OpenAI API via `fetch` e `node:test`.

**Especificação:** `config/superpowers/specs/2026-10-22-mvp-feedback-cti-design.md`

## Restrições globais

- O servidor deve escutar somente em `127.0.0.1`.
- Apenas gestores têm login; o formulário de feedback é público.
- Comentário é obrigatório e limitado inicialmente a 1.000 caracteres.
- Nota é um inteiro de 1 a 5; o serviço deve pertencer à lista configurada.
- Serviços de protótipo: Internet, Cloud, Cibersegurança, Suporte e Outro.
- A senha de gestor usa `scrypt`; não existe senha padrão nem cadastro público.
- A sessão de gestor usa cookie `HttpOnly`, `SameSite=Strict` e expiração.
- `OPENAI_API_KEY` e `OPENAI_MODEL` são lidos do ambiente e nunca enviados ao navegador.
- Só dados sintéticos de demonstração podem ser enviados à OpenAI API.
- Uma falha externa deixa o feedback armazenado e a análise pendente ou falha recuperável.
- O CSV exporta somente o resultado dos filtros atuais e neutraliza valores que poderiam ser interpretados como fórmulas.
- Não incluir chatbot, CRM comercial, deployment público, exportação XLSX/PDF ou identidade visual CTI.
- Seguir o idioma português do Brasil nos textos da interface e nos comentários de código.
- Não modificar nem regenerar entregáveis acadêmicos existentes.

## Arquivos e responsabilidades

- `app/package.json` — scripts de execução, inicialização do gestor e verificação.
- `.gitignore` — proteger `.env`, bancos SQLite e diretórios temporários locais.
- `app/.env.example` — nomes das variáveis sem valores secretos.
- `app/src/server.js` — inicializar configuração, banco, rotas e servidor em loopback.
- `app/src/app.js` — montar Express, middleware, API e arquivos estáticos.
- `app/src/db/database.js` — abrir SQLite, configurar pragmas e executar o esquema.
- `app/src/db/schema.sql` — tabelas e índices.
- `app/src/db/feedback-repository.js` — gravação, consultas, status e métricas.
- `app/src/db/manager-repository.js` — busca e criação de gestores e sessões.
- `app/src/security/passwords.js` — hash e validação de senha por `scrypt`.
- `app/src/security/sessions.js` — criar, consultar, expirar e remover sessões.
- `app/src/middleware/require-manager.js` — negar rotas de gestão sem sessão válida.
- `app/src/services/sentiment.js` — chamar OpenAI Responses API e validar os rótulos estruturados.
- `app/src/routes/feedback-routes.js` — endpoint público de criação de feedback.
- `app/src/routes/auth-routes.js` — login, sessão atual e logout.
- `app/src/routes/manager-routes.js` — resumo, lista, alteração de status, nova análise e CSV.
- `app/scripts/create-manager.js` — criar o primeiro gestor por comando local, sem senha padrão.
- `app/public/index.html` — formulário público de feedback.
- `app/public/login.html` — login de gestores.
- `app/public/dashboard.html` — painel CRM de feedbacks.
- `app/public/app.js` — estados e interações dos fluxos públicos e de gestão.
- `app/public/styles.css` — apresentação neutra, responsiva e acessível, sem marca CTI.
- `app/test/` — testes com banco temporário e provedor de sentimento simulado; sem chamadas externas.
- `README.md` — requisitos locais, configuração de ambiente, criação de gestor e execução do MVP.

## Tarefa 1: base local, banco e contas de gestor

**Arquivos:** `app/package.json`, `.gitignore`, `app/.env.example`, `app/src/server.js`, `app/src/app.js`, `app/src/db/database.js`, `app/src/db/schema.sql`, `app/src/db/manager-repository.js`, `app/src/security/passwords.js`, `app/src/security/sessions.js`, `app/src/middleware/require-manager.js`, `app/src/routes/auth-routes.js`, `app/scripts/create-manager.js`, `app/test/auth.test.js`.

**Interfaces:**

- `createApp({ database, sentimentService })` retorna uma aplicação Express sem abrir porta, para uso pelo servidor e pelos testes.
- `openDatabase(filename)` abre SQLite, habilita `foreign_keys` e `busy_timeout`, executa `schema.sql` e retorna o handle.
- `hashPassword(password, salt?)` retorna `{ salt, hash }`; `verifyPassword(password, salt, hash)` retorna boolean.
- `createManager(database, { email, password })` normaliza e persiste o gestor; duplicidade de e-mail é rejeitada.
- `requireManager` valida o cookie de sessão contra a tabela de sessões e adiciona `req.manager`.
- `POST /api/auth/login` recebe `{ email, password }`; `GET /api/auth/session` responde `{ authenticated: boolean }`; `POST /api/auth/logout` remove a sessão.

- [ ] **Passo 1: criar um teste de login que falha inicialmente.**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { createTestDatabase } from './helpers/database.js';

test('login rejeita senha incorreta e não cria sessão', async () => {
  const database = createTestDatabase();
  const app = createApp({ database, sentimentService: { classify: async () => ({ sentiment: 'neutral' }) } });
  const response = await fetch(await startTestServer(app), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'gestor@demo.local', password: 'senha-incorreta' })
  });
  assert.equal(response.status, 401);
  assert.equal(response.headers.get('set-cookie'), null);
});
```

- [ ] **Passo 2: executar o teste focado e confirmar que falha antes da implementação.**

Run: `node --test test/auth.test.js`

Esperado: FAIL porque `createApp` e o fluxo de login ainda não existem.

- [ ] **Passo 3: implementar o esquema e a configuração do banco.** Criar tabelas `managers(id, email, password_salt, password_hash, created_at)`, `sessions(id_hash, manager_id, expires_at, created_at)` e `feedbacks(id, service, rating, comment, created_at, sentiment, sentiment_status, handling_status)`. Criar índices para `created_at`, `service`, `sentiment` e `handling_status`; valores válidos também são validados no código.

- [ ] **Passo 4: implementar senha e sessão.** Usar `node:crypto` com `scrypt` e salt aleatório de 16 bytes. Comparar hashes com `timingSafeEqual`. Gerar token de sessão aleatório de 32 bytes, guardar somente o SHA-256 do token no SQLite e devolver o token em cookie `HttpOnly; SameSite=Strict; Path=/`, com expiração de 8 horas. Em localhost, não exigir `Secure`; permitir ativá-lo por configuração quando houver HTTPS.

- [ ] **Passo 5: implementar setup de gestor sem credencial embutida.** O comando `npm run manager:create` lê `MANAGER_EMAIL` e `MANAGER_PASSWORD` do ambiente, valida a senha, cria o gestor e limpa a sessão do processo ao terminar. Rejeitar e-mail duplicado; nunca imprimir a senha.

- [ ] **Passo 6: implementar rotas de autenticação e middleware.** O login usa resposta genérica para e-mail desconhecido ou senha errada. Regenerar a sessão após login; logout apaga a sessão do SQLite e expira o cookie. Adicionar limite de corpo JSON pequeno e mensagens de erro sem stack trace.

- [ ] **Passo 7: executar os testes de autenticação e ajustar até passarem.**

Run: `node --test test/auth.test.js`

Esperado: login inválido retorna 401; login válido cria cookie; sessão válida acessa rota de gestão; sessão ausente retorna 401; logout invalida o cookie; senha em texto simples não aparece no banco.

## Tarefa 2: formulário público, persistência e classificação de sentimento

**Arquivos:** `app/src/db/feedback-repository.js`, `app/src/services/sentiment.js`, `app/src/routes/feedback-routes.js`, `app/src/app.js`, `app/test/feedback.test.js`, `app/test/sentiment.test.js`.

**Interfaces:**

- `createFeedback(database, { service, rating, comment, createdAt })` grava feedback com `sentiment = NULL`, `sentiment_status = 'pending'` e `handling_status = 'new'`.
- `classifyComment(comment, { apiKey, model, fetchImpl })` retorna `{ sentiment: 'positive' | 'neutral' | 'negative' }` ou erro controlado.
- `POST /api/feedback` recebe `{ service, rating, comment }`, retorna `{ id, message, sentimentStatus }` com HTTP 201 após persistir.
- O serviço de rotas recebe `sentimentService` por injeção para permitir simulação de falhas nos testes.

- [ ] **Passo 1: escrever testes de validação do formulário.** Confirmar que serviço desconhecido, nota decimal, nota fora do intervalo, comentário vazio ou acima de 1.000 caracteres retornam HTTP 400 e não criam linha no banco.

- [ ] **Passo 2: executar `node --test test/feedback.test.js` e confirmar falha antes de implementar as regras.**

- [ ] **Passo 3: implementar `createFeedback` e validação do endpoint.** Serviços aceitos: `internet`, `cloud`, `cybersecurity`, `support`, `other`. Aplicar `trim()` ao comentário e definir data UTC no servidor. Não aceitar `createdAt`, sentimento ou status enviados pelo navegador.

- [ ] **Passo 4: testar o caminho feliz e a persistência em falha da IA.** O teste com serviço simulado deve confirmar que o feedback permanece no SQLite como `pending` quando a classificação lança erro; a resposta pública confirma o registro sem revelar stack trace.

- [ ] **Passo 5: implementar o adaptador OpenAI no servidor.** Fazer `POST https://api.openai.com/v1/responses` usando `OPENAI_API_KEY` no cabeçalho, `OPENAI_MODEL` em configuração e somente o texto sintético do comentário como entrada. Solicitar saída estruturada que aceite apenas `positive`, `neutral` ou `negative`; validar novamente a saída antes de gravar. Não enviar o comentário nem a chave para logs ou ao browser.

- [ ] **Passo 6: concluir estados de análise.** Em sucesso, salvar sentimento e `completed`. Sem configuração ou em falha de rede, autenticação, resposta inválida ou timeout, manter o feedback e salvar `failed` com mensagem interna sem dado do comentário. O endpoint responde HTTP 201 sempre que o registro foi salvo.

- [ ] **Passo 7: executar os testes focados sem rede externa.**

Run: `node --test test/feedback.test.js test/sentiment.test.js`

Esperado: entradas válidas persistem; inválidas são rejeitadas; cada rótulo é aceito; rótulo inesperado falha com segurança; falha do provedor não perde feedback; chave ausente não impede envio.

## Tarefa 3: consulta protegida, métricas, status e exportação

**Arquivos:** `app/src/db/feedback-repository.js`, `app/src/routes/manager-routes.js`, `app/src/app.js`, `app/test/manager.test.js`, `app/test/export.test.js`.

**Interfaces:**

- `listFeedbacks(database, filters)` aceita `service`, `sentiment`, `handlingStatus`, `from`, `to`, `search`, `page`, `pageSize` e retorna `{ items, total }`.
- `getSummary(database, filters)` retorna `{ total, averageRating, ratingTrend, sentimentCounts, serviceCounts }`.
- `updateHandlingStatus(database, id, status)` aceita apenas `new`, `in_review`, `resolved`.
- `toCsv(rows)` retorna texto CSV UTF-8 com cabeçalho e campos escapados.
- `GET /api/manager/feedback`, `GET /api/manager/summary`, `PATCH /api/manager/feedback/:id/status`, `POST /api/manager/feedback/:id/reanalyze` e `GET /api/manager/export.csv` exigem `requireManager`.

- [ ] **Passo 1: escrever testes com dados de feedback conhecidos.** Confirmar total, média, distribuição de nota e sentimento, tendência por dia e filtros combinados por serviço, período, sentimento e status.

- [ ] **Passo 2: executar `node --test test/manager.test.js test/export.test.js` e confirmar falha antes da implementação.**

- [ ] **Passo 3: implementar consultas SQL parametrizadas.** Não concatenar filtros do usuário no SQL. Limitar `pageSize` a 100, validar datas ISO e usar ordenação estável por `created_at DESC, id DESC`.

- [ ] **Passo 4: implementar alteração de status e nova tentativa de IA.** Rejeitar status inválido e feedback inexistente. Reanalisar somente um registro com sentimento pendente/falha; manter seu comentário e status de tratativa.

- [ ] **Passo 5: implementar CSV filtrado.** Escapar aspas e quebras de linha; prefixar com apóstrofo campos de texto que, após espaços, comecem por `=`, `+`, `-` ou `@`; usar `Content-Disposition: attachment` e BOM UTF-8 para compatibilidade com planilhas.

- [ ] **Passo 6: executar testes de gestão e exportação.**

Run: `node --test test/manager.test.js test/export.test.js`

Esperado: dados e métricas corretos; acesso sem sessão retorna 401; filtros não vazam dados de fora; exportação respeita filtros, escapa conteúdo e só funciona com sessão válida.

## Tarefa 4: interface pública e painel de gestão

**Arquivos:** `app/public/index.html`, `app/public/login.html`, `app/public/dashboard.html`, `app/public/app.js`, `app/public/styles.css`, `app/src/app.js`, `app/test/app-routes.test.js`.

**Interfaces:**

- `/` apresenta formulário público.
- `/login` apresenta autenticação de gestor.
- `/dashboard` apresenta o painel e exige sessão válida; sem sessão, direciona para `/login`.
- O JavaScript consome somente os endpoints definidos nas tarefas anteriores e nunca contém credenciais.

- [ ] **Passo 1: escrever testes de integração de rotas.** Confirmar que as três páginas respondem, arquivos CSS/JS carregam, e `/dashboard` redireciona sem sessão.

- [ ] **Passo 2: executar `node --test test/app-routes.test.js` e confirmar a falha antes de criar as páginas.**

- [ ] **Passo 3: criar o formulário público.** Incluir serviço, nota de 1 a 5, comentário obrigatório com contador de caracteres e confirmação de registro. Enviar para `POST /api/feedback`; informar que o feedback foi salvo mesmo quando a análise estiver pendente.

- [ ] **Passo 4: criar login de gestores.** Enviar e-mail e senha para a API; mostrar erro genérico de autenticação; encaminhar para o painel após sucesso; botão de sair invalida a sessão.

- [ ] **Passo 5: criar painel de gestão.** Mostrar cartões simples para total, média, sentimento positivo/neutro/negativo e tendência; apresentar filtros, tabela de feedbacks, comentário, serviço, nota, sentimento, data, status e ação de atualizar status/reprocessar sentimento; exportação baixa o CSV com filtros ativos.

- [ ] **Passo 6: aplicar apresentação neutra e responsiva.** Usar cores de interface funcionais sem logo, paleta ou tipografia de marca. Manter rótulos em português, contraste legível, foco de teclado visível, formulários com `label`, tabelas navegáveis e estados de carregamento/erro/vazio.

- [ ] **Passo 7: executar testes de rotas e fazer verificação manual do fluxo em navegador.**

Run: `node --test test/app-routes.test.js`

Esperado: páginas e recursos estáticos respondem; painel não aparece sem login; os fluxos de envio, login, filtros, status e download chamam os endpoints corretos.

## Tarefa 5: configuração, documentação e revisão final

**Arquivos:** `README.md`, `app/.env.example`, `.gitignore`, `app/package.json`, `app/test/`.

- [ ] **Passo 1: documentar a instalação local.** Registrar a versão mínima de Node compatível com `better-sqlite3`, `npm install`, como definir `OPENAI_API_KEY` e `OPENAI_MODEL`, como criar gestor com variáveis de ambiente, como rodar a aplicação, onde fica o SQLite e como limpar dados de demonstração.
- [ ] **Passo 2: revisar proteção contra dados secretos.** Confirmar que `.env`, bancos SQLite, arquivos WAL/SHM e exports gerados não entram no Git; confirmar que o navegador não recebe a chave.
- [ ] **Passo 3: executar toda a suíte automatizada sem chamadas reais a serviços externos.**

Run: `node --test`

Esperado: todos os testes passam e não há chamadas de rede real para sentimento.

- [ ] **Passo 4: executar verificação manual com dados sintéticos.** Criar um gestor de demonstração, enviar feedbacks positivos, neutros e negativos usando o provedor simulado; validar cards, filtros, status, exportação e sessão. Rodar uma verificação separada com `OPENAI_API_KEY` de demonstração se a chave estiver disponível; sem chave, confirmar persistência com análise pendente.
- [ ] **Passo 5: revisar todos os critérios de aceite da especificação e os diffs.** Preparar `git status --short` e `git diff --stat`; solicitar a mensagem de commit ao usuário antes de qualquer commit, conforme `AGENTS.md`.

## Auto-revisão do plano

- **Cobertura da especificação:** fluxos públicos e de gestão na Tarefa 4; SQLite, autenticação, sessões e setup de gestor na Tarefa 1; persistência e IA tolerante a falhas na Tarefa 2; métricas, filtros, status e CSV na Tarefa 3; instalação, segredos e critérios de aceite na Tarefa 5.
- **Consistência:** nomes de colunas, estados, endpoints e contratos usados nas tarefas são consistentes com o desenho aprovado.
- **Limites:** nenhuma chamada real à OpenAI API nos testes; somente texto demonstrativo poderá ser enviado ao provedor; publicação externa e uso com dados reais continuam fora do MVP.
