# Push notifications no celular (Web Push + PWA)

Hoje os alertas só funcionam com o app aberto no navegador (`useNotificationScheduler` roda em `setInterval` no front). Para receber avisos com o app fechado, precisamos de Web Push real: app instalável + service worker + envio pelo backend.

## Como vai funcionar

1. O app passa a ser instalável (Adicionar à Tela de Início). No iPhone o push só funciona depois de instalar o app na tela inicial — isso é limitação da Apple, não do projeto.
2. Na página Notificações aparece um botão "Ativar push neste dispositivo". Ao aceitar, o navegador gera uma inscrição que salvamos no banco (um registro por aparelho).
3. Um serviço no backend roda a cada minuto e envia os alertas para os aparelhos inscritos:
   - Lembretes diários (casa/horário/dias da semana) — os mesmos que já existem.
   - Torneios finalizando (aviso 24h antes e no dia do fechamento).
   - Eventos da agenda de torneios próximos.
4. Ao tocar na notificação, o celular abre o app na página relevante.
5. O popup irritante atual continua funcionando quando o app está aberto; o push cobre o app fechado, sem duplicar o mesmo alerta (controle de "já enviado" por dia).

## O que você precisa saber

- Android/Chrome: funciona logo após ativar.
- iPhone/Safari: precisa instalar o app na tela inicial (iOS 16.4+) e ativar dentro do app instalado.
- Se você desinstalar o app ou limpar dados, precisa reativar o push.

## Detalhes técnicos

- **PWA**: `public/manifest.webmanifest` + ícones 192/512 + tags no `index.html` (`manifest`, `theme-color`, `apple-touch-icon`), `display: standalone`. Sem service worker de cache/offline — apenas o worker de mensagens.
- **Service worker de push**: `public/push-sw.js` com handlers `push` e `notificationclick` (abre/foca a URL). Registro guardado por um wrapper que não registra em preview/iframe/dev.
- **Banco**: nova tabela `push_subscriptions` (`user_id`, `endpoint` unique, `p256dh`, `auth`, `user_agent`, `created_at`, `last_seen_at`) com RLS por `auth.uid()` + GRANTs, e `push_sent_log` (`user_id`, `alert_key`, `sent_date`) para deduplicar envios.
- **Chaves VAPID**: par gerado e salvo como secrets (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`). A pública é lida pelo front via edge function.
- **Edge functions**:
  - `push-subscribe` — grava/atualiza a inscrição do dispositivo (valida JWT + payload com Zod).
  - `push-public-key` — devolve a chave pública.
  - `push-dispatch` — varre `casino_reminders`, `tournaments` e `tournament_schedule` no fuso America/Sao_Paulo, monta os payloads, envia com `npm:web-push`, remove inscrições que retornarem 404/410 e registra em `push_sent_log`.
- **Agendamento**: `pg_cron` + `pg_net` chamando `push-dispatch` a cada minuto.
- **Front**: `src/lib/push.ts` (registro/inscrição/cancelamento) e um card "Notificações push" em `src/pages/Notifications.tsx` mostrando estado por dispositivo.

## Fora do escopo

App nativo em loja (App Store/Play) — isso exigiria o caminho Capacitor, que é bem mais trabalhoso. Podemos avaliar depois se o push web não for suficiente.
