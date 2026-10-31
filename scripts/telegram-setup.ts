/**
 * Registers the Telegram webhook at https://soft4u.top/api/telegram/webhook
 * (secret_token = TELEGRAM_WEBHOOK_SECRET) plus the bot command list.
 * Run once after the production deploy is live:
 *
 *   bun run telegram:setup
 */
import { setupTelegramWebhook, tgCall } from '../lib/telegram';

async function main() {
  const result = await setupTelegramWebhook();
  console.log(JSON.stringify(result, null, 2));
  const info = await tgCall('getWebhookInfo');
  console.log(JSON.stringify(info.result ?? info, null, 2));
  process.exit(result.ok ? 0 : 1);
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
