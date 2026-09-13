import { pool } from '../db/pool';
import { process as orchestrateChat } from './ChatOrchestrator';
import { calculateFinancialPlan } from './FinancialEngine';

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';
const SITE_URL = process.env.FRONTEND_URL || 'https://pradarsakai.vercel.app';

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: string;
  title?: string;
  first_name?: string;
  username?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export class TelegramBotService {
  private static token: string = process.env.TELEGRAM_BOT_TOKEN || '';

  public static getToken(): string {
    return this.token || process.env.TELEGRAM_BOT_TOKEN || '';
  }

  public static isConfigured(): boolean {
    return Boolean(this.getToken());
  }

  /**
   * Helper to make Telegram Bot API requests
   */
  public static async apiCall(method: string, body?: any): Promise<any> {
    const token = this.getToken();
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured');
    }
    const res = await fetch(`${TELEGRAM_API_BASE}${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    return data;
  }

  /**
   * Safe HTML escaping for Telegram HTML parse_mode
   */
  public static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Convert standard Markdown (*, **, `, [text](url)) to Telegram HTML format
   */
  public static markdownToTelegramHtml(markdown: string): string {
    if (!markdown) return '';

    // First escape raw HTML special characters
    let html = this.escapeHtml(markdown);

    // Convert code blocks ```code``` -> <pre>code</pre>
    html = html.replace(/```([\s\S]*?)```/g, '<pre>$1</pre>');

    // Convert inline code `code` -> <code>code</code>
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Convert bold **text** or __text__ -> <b>text</b>
    html = html.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    html = html.replace(/__([^_]+)__/g, '<b>$1</b>');

    // Convert italic *text* or _text_ -> <i>text</i>
    html = html.replace(/\*([^*]+)\*/g, '<i>$1</i>');
    html = html.replace(/(?<!\w)_([^_]+)_(?!\w)/g, '<i>$1</i>');

    // Convert links [label](url) -> <a href="url">label</a>
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');

    return html;
  }

  /**
   * Send a text message to a chat
   */
  public static async sendMessage(
    chatId: number | string,
    text: string,
    options?: {
      parseMode?: 'HTML' | 'MarkdownV2';
      replyMarkup?: any;
    }
  ): Promise<any> {
    const parseMode = options?.parseMode ?? 'HTML';
    // Telegram message character limit is 4096. Split if exceeds limit.
    const maxLen = 4000;
    if (text.length <= maxLen) {
      return this.apiCall('sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        reply_markup: options?.replyMarkup,
        disable_web_page_preview: false,
      });
    }

    // Split text into chunks
    const chunks: string[] = [];
    let current = text;
    while (current.length > 0) {
      if (current.length <= maxLen) {
        chunks.push(current);
        break;
      }
      let splitAt = current.lastIndexOf('\n', maxLen);
      if (splitAt <= 0) splitAt = maxLen;
      chunks.push(current.substring(0, splitAt));
      current = current.substring(splitAt).trimStart();
    }

    let lastResult = null;
    for (let i = 0; i < chunks.length; i++) {
      lastResult = await this.apiCall('sendMessage', {
        chat_id: chatId,
        text: chunks[i],
        parse_mode: parseMode,
        reply_markup: i === chunks.length - 1 ? options?.replyMarkup : undefined,
      });
    }
    return lastResult;
  }

  /**
   * Send typing action indicator
   */
  public static async sendTyping(chatId: number | string): Promise<void> {
    try {
      await this.apiCall('sendChatAction', {
        chat_id: chatId,
        action: 'typing',
      });
    } catch {}
  }

  /**
   * Acknowledge callback query
   */
  public static async answerCallback(callbackQueryId: string, text?: string): Promise<void> {
    try {
      await this.apiCall('answerCallbackQuery', {
        callback_query_id: callbackQueryId,
        text,
      });
    } catch {}
  }

  /**
   * Register Webhook with Telegram
   */
  public static async setWebhook(url: string, secretToken?: string): Promise<any> {
    const payload: any = {
      url,
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: false,
    };
    if (secretToken) {
      payload.secret_token = secretToken;
    }
    return this.apiCall('setWebhook', payload);
  }

  /**
   * Get Webhook Info
   */
  public static async getWebhookInfo(): Promise<any> {
    return this.apiCall('getWebhookInfo');
  }

  /**
   * Get Bot Profile Info
   */
  public static async getMe(): Promise<any> {
    return this.apiCall('getMe');
  }

  /**
   * Main Dispatcher for all incoming Telegram Updates
   */
  public static async handleUpdate(update: TelegramUpdate): Promise<void> {
    try {
      if (update.message && update.message.text) {
        await this.handleMessage(update.message);
      } else if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      }
    } catch (err) {
      console.error('[TelegramBotService] Error handling update:', err);
    }
  }

  /**
   * Handle incoming message
   */
  private static async handleMessage(message: TelegramMessage): Promise<void> {
    const chatId = message.chat.id;
    const text = message.text?.trim() || '';
    const userFirstName = message.from?.first_name || 'Citizen';

    // Route commands
    if (text.startsWith('/start')) {
      await this.sendStartMessage(chatId, userFirstName);
    } else if (text.startsWith('/schemes')) {
      await this.sendSchemesList(chatId);
    } else if (text.startsWith('/calculate')) {
      await this.handleCalculateCommand(chatId, text);
    } else if (text.startsWith('/help')) {
      await this.sendHelpMessage(chatId);
    } else {
      // Natural Language Scheme Advisory via AI Orchestrator
      await this.handleAiQuestion(chatId, text);
    }
  }

  /**
   * Handle interactive button clicks (Callback Queries)
   */
  private static async handleCallbackQuery(query: TelegramCallbackQuery): Promise<void> {
    const callbackId = query.id;
    const data = query.data || '';
    const chatId = query.message?.chat.id || query.from.id;
    const userFirstName = query.from.first_name || 'Citizen';

    await this.answerCallback(callbackId);

    if (data === 'cmd_start') {
      await this.sendStartMessage(chatId, userFirstName);
    } else if (data === 'cmd_schemes') {
      await this.sendSchemesList(chatId);
    } else if (data === 'cmd_calculate') {
      await this.handleCalculateCommand(chatId, '/calculate');
    } else if (data === 'cmd_help') {
      await this.sendHelpMessage(chatId);
    } else if (data.startsWith('calc_sample_')) {
      // Sample EMI calculation button pressed
      const parts = data.replace('calc_sample_', '').split('_');
      const principalLakh = parseFloat(parts[0]) || 5;
      const rate = parseFloat(parts[1]) || 6;
      const years = parseInt(parts[2], 10) || 5;
      await this.executeEmiCalculation(chatId, principalLakh, rate, years);
    } else if (data.startsWith('scheme_detail_')) {
      const schemeId = parseInt(data.replace('scheme_detail_', ''), 10);
      if (!isNaN(schemeId)) {
        await this.sendSchemeDetail(chatId, schemeId);
      }
    }
  }

  /**
   * /start command response
   */
  private static async sendStartMessage(chatId: number | string, name: string): Promise<void> {
    const welcome =
      `🦁 <b>Namaste, ${this.escapeHtml(name)}!</b>\n` +
      `Welcome to <b>PradarshakAI (प्रदर्शक AI)</b> — Ministry of Social Justice & Empowerment, Government of India.\n\n` +
      `I am your intelligent assistant designed to help you discover, evaluate, and access welfare loan and education schemes.\n\n` +
      `<b>Here is what you can do:</b>\n` +
      `• 📜 <b>/schemes</b> — Explore concessional welfare loan schemes (NSFDC, NBCFDC, NSKFDC, etc.)\n` +
      `• 💰 <b>/calculate</b> — Calculate EMI, government margin subsidy & money saved from loan sharks\n` +
      `• ❓ <b>/help</b> — Learn how to ask questions and find channel partners\n\n` +
      `💡 <i>You can also simply type any question in English, Hindi, or your regional language (e.g. "What loans are available for SC women to start a business?").</i>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📜 Browse Popular Schemes', callback_data: 'cmd_schemes' },
          { text: '💰 Loan & EMI Calculator', callback_data: 'cmd_calculate' },
        ],
        [
          { text: '🌐 Open PradarshakAI Web Portal', url: SITE_URL },
          { text: '❓ Help & Guide', callback_data: 'cmd_help' },
        ],
      ],
    };

    await this.sendMessage(chatId, welcome, { replyMarkup: keyboard });
  }

  /**
   * /schemes command response
   */
  private static async sendSchemesList(chatId: number | string): Promise<void> {
    await this.sendTyping(chatId);

    try {
      const { rows } = await pool.query(
        `SELECT id, name, short_name, category, min_loan_lakh, max_loan_lakh, interest_rate_min, interest_rate_max, description 
         FROM schemes 
         WHERE active = TRUE 
         ORDER BY id ASC 
         LIMIT 6`
      );

      if (rows.length === 0) {
        await this.sendMessage(chatId, 'No active schemes currently available. Please visit the web portal.');
        return;
      }

      let text = `🏛️ <b>Major Welfare & Concessional Loan Schemes:</b>\n\n`;

      const buttons: any[] = [];

      rows.forEach((s, idx) => {
        const title = s.short_name || s.name;
        const maxLoan = s.max_loan_lakh ? `₹${s.max_loan_lakh} Lakhs` : 'Varies';
        const rate = s.interest_rate_min
          ? `${s.interest_rate_min}% - ${s.interest_rate_max || s.interest_rate_min}% p.a.`
          : 'Subsidized';

        text += `<b>${idx + 1}. ${this.escapeHtml(title)}</b>\n`;
        text += `• <b>Category:</b> ${this.escapeHtml(s.category || 'General')}\n`;
        text += `• <b>Max Funding:</b> Up to ${maxLoan} | <b>Interest:</b> ${rate}\n\n`;

        buttons.push([
          {
            text: `🔍 Details: ${title.substring(0, 30)}`,
            callback_data: `scheme_detail_${s.id}`,
          },
        ]);
      });

      buttons.push([
        { text: '🌐 Explore All Schemes Online', url: `${SITE_URL}/schemes` },
        { text: '💰 Calculate EMI', callback_data: 'cmd_calculate' },
      ]);

      text += `<i>Tap any button below for required documents & eligibility criteria.</i>`;

      await this.sendMessage(chatId, text, {
        replyMarkup: { inline_keyboard: buttons },
      });
    } catch (err: any) {
      console.error('[Telegram schemes error]', err);
      await this.sendMessage(chatId, 'Failed to fetch schemes list. Please try again or visit our website.');
    }
  }

  /**
   * Detailed breakdown for a single scheme
   */
  private static async sendSchemeDetail(chatId: number | string, schemeId: number): Promise<void> {
    await this.sendTyping(chatId);

    try {
      const { rows } = await pool.query('SELECT * FROM schemes WHERE id = $1', [schemeId]);
      if (rows.length === 0) {
        await this.sendMessage(chatId, 'Scheme not found.');
        return;
      }

      const s = rows[0];
      const title = s.name;
      const rateMin = s.interest_rate_min || '4.0';
      const rateMax = s.interest_rate_max || rateMin;
      const maxLoan = s.max_loan_lakh ? `₹${s.max_loan_lakh} Lakhs` : 'As per project cost';
      const coverage = s.coverage_percent ? `${s.coverage_percent}%` : 'Up to 90-95%';
      const moratorium = s.moratorium_months_max ? `${s.moratorium_months_max} Months` : 'Up to 6 Months';
      const tenure = s.max_tenure_months ? `${s.max_tenure_months / 12} Years (${s.max_tenure_months} Months)` : '5-7 Years';

      let text = `📜 <b>${this.escapeHtml(title)}</b>\n\n`;
      if (s.description) {
        text += `ℹ️ ${this.escapeHtml(s.description)}\n\n`;
      }

      text += `<b>Key Parameters:</b>\n`;
      text += `• <b>Target Beneficiary:</b> ${this.escapeHtml(s.category || 'SC / OBC / Safai Karamcharis')}\n`;
      text += `• <b>Maximum Funding:</b> ${maxLoan}\n`;
      text += `• <b>Interest Rate:</b> ${rateMin}% - ${rateMax}% p.a.\n`;
      text += `• <b>Govt Margin Coverage:</b> ${coverage}\n`;
      text += `• <b>Grace / Moratorium:</b> ${moratorium}\n`;
      text += `• <b>Repayment Period:</b> ${tenure}\n\n`;

      if (Array.isArray(s.documents_required) && s.documents_required.length > 0) {
        text += `<b>📑 Key Documents Required:</b>\n`;
        s.documents_required.slice(0, 5).forEach((doc: string) => {
          text += `  ✓ ${this.escapeHtml(doc)}\n`;
        });
        text += `\n`;
      }

      const sampleLoanLakh = s.max_loan_lakh ? Math.min(Number(s.max_loan_lakh), 5) : 3;
      const sampleRate = Number(rateMin) || 6;

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: `💰 Calculate EMI for ₹${sampleLoanLakh}L @ ${sampleRate}%`,
              callback_data: `calc_sample_${sampleLoanLakh}_${sampleRate}_5`,
            },
          ],
          [
            { text: '🌐 View Full Details & Partners', url: `${SITE_URL}/schemes` },
            { text: '🔙 Back to Schemes', callback_data: 'cmd_schemes' },
          ],
        ],
      };

      await this.sendMessage(chatId, text, { replyMarkup: keyboard });
    } catch (err) {
      console.error('[Telegram scheme detail error]', err);
      await this.sendMessage(chatId, 'Unable to load scheme details right now.');
    }
  }

  /**
   * /calculate command response & interactive loan calculator
   */
  private static async handleCalculateCommand(chatId: number | string, text: string): Promise<void> {
    // Check if arguments were passed: /calculate <amount_in_lakhs> [rate] [tenure_years]
    // Example: /calculate 5 6 5
    const tokens = text
      .replace('/calculate', '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (tokens.length >= 1) {
      const principalLakh = parseFloat(tokens[0].replace(/[^0-9.]/g, ''));
      const rate = tokens.length >= 2 ? parseFloat(tokens[1].replace(/[^0-9.]/g, '')) : 6.0;
      const years = tokens.length >= 3 ? parseInt(tokens[2].replace(/[^0-9]/g, ''), 10) : 5;

      if (!isNaN(principalLakh) && principalLakh > 0) {
        await this.executeEmiCalculation(chatId, principalLakh, rate || 6.0, years || 5);
        return;
      }
    }

    // Default interactive guidance if no valid params
    const guideText =
      `💰 <b>PradarshakAI Concessional Loan & EMI Calculator</b>\n\n` +
      `Calculate your monthly repayment and see how much money you save through government interest subsidies compared to local moneylenders.\n\n` +
      `<b>Command Format:</b>\n` +
      `<code>/calculate &lt;Amount in Lakhs&gt; &lt;Interest Rate %&gt; &lt;Tenure in Years&gt;</code>\n\n` +
      `<i>Examples:</i>\n` +
      `• <code>/calculate 5 6 5</code> → ₹5 Lakhs at 6% for 5 years\n` +
      `• <code>/calculate 2.5 5 3</code> → ₹2.5 Lakhs at 5% for 3 years\n\n` +
      `👇 <b>Or tap one of these common quick calculation scenarios:</b>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '₹1 Lakh @ 5% (3 Yrs)', callback_data: 'calc_sample_1_5_3' },
          { text: '₹3 Lakh @ 5% (5 Yrs)', callback_data: 'calc_sample_3_5_5' },
        ],
        [
          { text: '₹5 Lakh @ 6% (5 Yrs)', callback_data: 'calc_sample_5_6_5' },
          { text: '₹10 Lakh @ 4% (7 Yrs)', callback_data: 'calc_sample_10_4_7' },
        ],
        [
          { text: '🌐 Advanced Loan Planner on Web', url: `${SITE_URL}/chat` },
        ],
      ],
    };

    await this.sendMessage(chatId, guideText, { replyMarkup: keyboard });
  }

  /**
   * Compute and format financial plan
   */
  private static async executeEmiCalculation(
    chatId: number | string,
    principalLakh: number,
    ratePercent: number,
    tenureYears: number
  ): Promise<void> {
    await this.sendTyping(chatId);

    const principalRupees = principalLakh * 100000;
    const totalTenureMonths = tenureYears * 12;

    const plan = calculateFinancialPlan({
      principal: principalRupees,
      annualRatePercent: ratePercent,
      totalTenureMonths,
      moratoriumMonths: 6, // 6 month standard govt grace period
      borrowerMode: 'individual',
      informalRatePercent: 36, // Standard informal lending rate
    });

    const formatInr = (val: number) =>
      '₹' + Math.round(val).toLocaleString('en-IN');

    const resultText =
      `📊 <b>Loan Repayment & EMI Breakdown:</b>\n\n` +
      `• <b>Loan Amount:</b> ${formatInr(principalRupees)} (${principalLakh} Lakhs)\n` +
      `• <b>Annual Interest Rate:</b> ${ratePercent.toFixed(1)}% p.a. (Govt Concessional)\n` +
      `• <b>Tenure:</b> ${tenureYears} Years (${totalTenureMonths} Months)\n` +
      `• <b>Moratorium (Grace Period):</b> 6 Months\n\n` +
      `💵 <b>Estimated Monthly EMI:</b> <code>${formatInr(plan.monthlyEMI)}</code> / month\n` +
      `• <b>Total Interest Paid:</b> ${formatInr(plan.totalInterest)}\n` +
      `• <b>Total Repayment:</b> ${formatInr(plan.totalRepayment)}\n` +
      `• <b>Promoter Contribution (Margin):</b> ${formatInr(plan.promoterContribution)} (Only 5%)\n\n` +
      `🛡️ <b>DEBT TRAP SHIELD (Wealth Preserved):</b>\n` +
      `If borrowed from an informal moneylender (36% interest), total interest would be <b>${formatInr(
        plan.informalTotalInterest
      )}</b>.\n` +
      `🎉 <b>You preserve ${formatInr(
        plan.netWealthPreserved
      )} in wealth</b> by choosing this government scheme!`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📜 Browse Schemes for this Amount', callback_data: 'cmd_schemes' },
          { text: '🌐 View Full Amortization Schedule', url: `${SITE_URL}/chat` },
        ],
      ],
    };

    await this.sendMessage(chatId, resultText, { replyMarkup: keyboard });
  }

  /**
   * /help command response
   */
  private static async sendHelpMessage(chatId: number | string): Promise<void> {
    const help =
      `ℹ️ <b>How to use PradarshakAI Telegram Bot:</b>\n\n` +
      `<b>1. Natural Language Scheme Advisory:</b>\n` +
      `Simply type any question in normal language! For example:\n` +
      `• <i>"Which schemes provide loans for dairy farming?"</i>\n` +
      `• <i>"What is the maximum loan under Mahila Samriddhi Yojana?"</i>\n` +
      `• <i>"अनुसूचित जाति के छात्रों के लिए कौन सी छात्रवृत्ति है?"</i>\n\n` +
      `<b>2. Available Commands:</b>\n` +
      `• <b>/start</b> — Restart the bot and view main menu\n` +
      `• <b>/schemes</b> — Browse top government loan & welfare schemes\n` +
      `• <b>/calculate</b> — Calculate EMI and savings for any loan amount\n` +
      `• <b>/help</b> — Show this help guide\n\n` +
      `<b>3. Channel Partners & Loan Applications:</b>\n` +
      `You can apply and submit documents with state channelising agencies and designated banks. Visit our official web platform to check nearest channel partners.`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📜 Browse Schemes', callback_data: 'cmd_schemes' },
          { text: '💰 EMI Calculator', callback_data: 'cmd_calculate' },
        ],
        [{ text: '🌐 PradarshakAI Web Application', url: SITE_URL }],
      ],
    };

    await this.sendMessage(chatId, help, { replyMarkup: keyboard });
  }

  /**
   * Freeform questions handled by ChatOrchestrator AI engine
   */
  private static async handleAiQuestion(chatId: number | string, userMessage: string): Promise<void> {
    await this.sendTyping(chatId);

    try {
      const sessionId = `tg_${chatId}`;

      // Call Unified AI Scheme Advisory Orchestrator
      const response = await orchestrateChat(
        userMessage,
        sessionId,
        'en'
      );

      const replyText = this.markdownToTelegramHtml(response.message);

      const buttons: any[] = [];
      if (Array.isArray(response.quickActions) && response.quickActions.length > 0) {
        const actionRow: any[] = [];
        response.quickActions.slice(0, 2).forEach((qa) => {
          actionRow.push({
            text: qa.label,
            callback_data: qa.label.toLowerCase().includes('emi')
              ? 'cmd_calculate'
              : 'cmd_schemes',
          });
        });
        if (actionRow.length > 0) {
          buttons.push(actionRow);
        }
      }

      buttons.push([
        { text: '📜 Browse Schemes', callback_data: 'cmd_schemes' },
        { text: '🌐 Explore on Web Portal', url: `${SITE_URL}/chat` },
      ]);

      await this.sendMessage(chatId, replyText, {
        replyMarkup: { inline_keyboard: buttons },
      });
    } catch (err: any) {
      console.error('[Telegram AI advisory error]', err);
      const fallback =
        `I am here to help you with government loan schemes, eligibility criteria, and EMI calculations.\n\n` +
        `You can use <b>/schemes</b> to browse active schemes or <b>/calculate</b> to estimate loan repayments.`;
      await this.sendMessage(chatId, fallback, {
        replyMarkup: {
          inline_keyboard: [
            [{ text: '📜 Browse Schemes', callback_data: 'cmd_schemes' }],
            [{ text: '🌐 Visit Web Portal', url: SITE_URL }],
          ],
        },
      });
    }
  }
}
