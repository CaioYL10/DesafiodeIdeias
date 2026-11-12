# CRM CTI — apresentação audiovisual

Vídeo institucional do **protótipo local CRM CTI**. Duração: 82 segundos; 1920 × 1080; 30 fps. Os dados exibidos no aplicativo são de demonstração. A proposta CRM + gestão leve da qualidade ainda não foi validada pela CTI.

## Roteiro e storyboard

| Tempo | Cena | Capturas reais | Texto principal | Movimento |
| --- | --- | --- | --- | --- |
| 0–6 s | Abertura | Marca CTI do app | CRM CTI | Entrada tipográfica, círculos discretos |
| 6–15 s | Proposta | Página pública e visão geral | Tudo em um só lugar | Troca de tela e aproximação lenta |
| 15–25 s | Relacionamento | Lista e perfil de cliente | Cada cliente tem contexto | Pan e zoom suave |
| 25–35 s | Feedbacks | Lista e filtro aplicado | Da manifestação à leitura | Corte entre estados da interação |
| 35–48 s | Triagem | Reincidência e modal de análise | Padrões merecem atenção | Aproximação sobre revisão humana |
| 48–61 s | Ações | Ação criada e acompanhamento | Decisão vira ação | Corte entre criação e atualização |
| 61–75 s | Indicadores | Três painéis reais | Visão para decidir | Montagem de dashboards |
| 75–82 s | Encerramento | Marca CTI do app | Conheça. Escute. Acompanhe. Melhore. | Redução gradual da trilha |

## Limites reais do protótipo

O projeto local usa Node.js, HTML, CSS e JavaScript, sem banco de dados. O login é visual; os dados ficam no armazenamento do navegador. Não há portal do cliente, envio público de feedback, protocolo, perfis separados de atendente/supervisor/gestor ou IA integrada. O agrupamento de relatos recorrentes usa **regras locais** e exige decisão humana. O vídeo evita mostrar as funcionalidades da pré-apresentação que ainda não existem no código.

As 15 capturas são quadros de estados reais de interações executadas pelo Playwright, animados na edição. Não há gravação contínua de tela: o gravador de vídeo do Playwright exigia um FFmpeg adicional ausente neste ambiente, e as mudanças de estado foram registradas diretamente em imagens para manter a captura isolada e reproduzível.

## Reproduzir as capturas

1. No diretório `app`, execute `npm.cmd start`.
2. Neste diretório, execute `npm.cmd install`.
3. Execute `node capture.cjs`. O script usa o Chrome local e cria um contexto descartável. A alteração demonstrada não persiste na base do projeto.

## Renderizar novamente

1. Execute `node generate-audio.cjs` para recriar a trilha original.
2. Execute `npx.cmd remotion render src/index.ts CrmCti CRM-CTI-Apresentacao.mp4 --codec h264 --audio-codec aac --browser-executable="C:\Program Files\Google\Chrome\Application\chrome.exe"`.

As durações e textos ficam em `src/scenes/Film.tsx`; resolução e fps ficam em `src/root.tsx`. As imagens usadas estão em `public/captures/` e a trilha em `public/audio/`.
