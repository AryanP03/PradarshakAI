import { Router, Request, Response } from 'express';
import { TelegramBotService, TelegramUpdate } from '../services/TelegramBotService';

const router = Router();

/**
 * POST /api/telegram/webhook
 * Receives incoming messages and callback queries from Telegram.
 */
router.post('/webhook', (req: Request, res: Response) => {
  const secretHeader = req.headers['x-telegram-bot-api-secret-token'];
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (expectedSecret && secretHeader && secretHeader !== expectedSecret) {
    console.warn('[Telegram Webhook] Unauthorized request received, secret header mismatch.');
    res.status(403).json({ error: 'Invalid secret token' });
    return;
  }

  // Always respond with 200 OK immediately so Telegram doesn't wait or retry
  res.status(200).json({ ok: true });

  const update = req.body as TelegramUpdate;
  if (!update || (!update.message && !update.callback_query)) {
    return;
  }

  // Asynchronously process the update through TelegramBotService
  TelegramBotService.handleUpdate(update).catch((err) => {
    console.error('[Telegram Webhook Error]', err);
  });
});

/**
 * GET /api/telegram/status
 * Check bot profile and webhook registration status
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    if (!TelegramBotService.isConfigured()) {
      res.status(503).json({
        configured: false,
        error: 'TELEGRAM_BOT_TOKEN is not configured in backend environment.',
      });
      return;
    }

    const [botInfo, webhookInfo] = await Promise.all([
      TelegramBotService.getMe(),
      TelegramBotService.getWebhookInfo(),
    ]);

    res.json({
      configured: true,
      bot: botInfo,
      webhook: webhookInfo,
    });
  } catch (err: any) {
    console.error('[Telegram Status Error]', err);
    res.status(500).json({ error: 'Failed to retrieve bot status', detail: err.message });
  }
});

/**
 * POST /api/telegram/set-webhook
 * Registers or updates the webhook URL with Telegram
 */
router.post('/set-webhook', async (req: Request, res: Response) => {
  try {
    if (!TelegramBotService.isConfigured()) {
      res.status(503).json({
        error: 'TELEGRAM_BOT_TOKEN is not configured.',
      });
      return;
    }

    const webhookUrl =
      req.body?.url ||
      req.query?.url ||
      process.env.TELEGRAM_WEBHOOK_URL ||
      'https://pradarshakai.onrender.com/api/telegram/webhook';

    const secret =
      req.body?.secret ||
      req.query?.secret ||
      process.env.TELEGRAM_WEBHOOK_SECRET;

    const result = await TelegramBotService.setWebhook(webhookUrl, secret);

    res.json({
      success: result.ok,
      webhookUrl,
      result,
    });
  } catch (err: any) {
    console.error('[Telegram Set Webhook Error]', err);
    res.status(500).json({ error: 'Failed to set webhook', detail: err.message });
  }
});

export default router;
