import 'dotenv/config';
import { Telegraf } from 'telegraf';
import './db.js';
import { today } from './utils/date.js';

import * as caloriesSrv from './services/calories.js';
import * as activitiesSrv from './services/activities.js';
import * as weightSrv from './services/weight.js';
import * as careerSrv from './services/career.js';

import { dailyReport } from './reports/daily.js';
import { weeklyReport } from './reports/weekly.js';
import { monthlyReport } from './reports/monthly.js';

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('ERROR: BOT_TOKEN is required in .env');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

const HELP_TEXT = `
🎯 Команды трекера:

📊 Калории:
• калории 200 — добавить калории
• занятия 300 — сожжённые калории

📚 Занятия:
• golang 30 — занятие 30 минут
• медитация 10 — активность 10 минут

⚖️ Вес:
• вес 55.5 — зафиксировать вес

💼 Карьера:
• отклик Яндекс — отклик на вакансию
• ответ Тинькофф — ответ от HR
• собес Google — собеседование

📈 Отчёты:
/day — за сегодня
/week — за неделю
/month — за месяц
`;

// Commands
bot.start(ctx => ctx.reply('🎯 Привет! Я твой трекер целей. Напиши /help для команд.'));
bot.command('help', ctx => ctx.reply(HELP_TEXT));

// Parsers
bot.hears(/^\s*калории\s+(\d+)\s*$/i, ctx => {
  const chatId = String(ctx.chat.id);
  const kcal = Number(ctx.match[1]);
  caloriesSrv.addIntake(chatId, today(), kcal);
  ctx.reply(`🍏 Добавлено ${kcal} ккал (приём)`);
});

bot.hears(/^\s*занятия\s+(\d+)\s*$/i, ctx => {
  const chatId = String(ctx.chat.id);
  const kcal = Number(ctx.match[1]);
  caloriesSrv.addBurn(chatId, today(), kcal);
  ctx.reply(`🔥 Сожжено ${kcal} ккал`);
});

bot.hears(/^\s*вес\s+([\d.]+)\s*$/i, ctx => {
  const chatId = String(ctx.chat.id);
  const weight = Number(ctx.match[1]);
  weightSrv.setWeight(chatId, today(), weight);
  ctx.reply(`⚖️ Вес зафиксирован: ${weight} кг`);
});

bot.hears(/^\s*(отклик|ответ|собес)\s+(.+)$/i, ctx => {
  const chatId = String(ctx.chat.id);
  const type = ctx.match[1].toLowerCase();
  const company = ctx.match[2].trim();
  careerSrv.logCareer(chatId, today(), type, company);
  ctx.reply(`💼 Записано: ${type} — ${company}`);
});

bot.hears(/^\s*(\w+)\s+(\d+)\s*$/i, ctx => {
  const chatId = String(ctx.chat.id);
  const activity = ctx.match[1];
  const minutes = Number(ctx.match[2]);
  activitiesSrv.logActivity(chatId, today(), activity, minutes);
  ctx.reply(`📚 Записано: ${activity} — ${minutes} минут`);
});

// Reports
bot.command('day', ctx => {
  const chatId = String(ctx.chat.id);
  const report = dailyReport(chatId);
  ctx.reply(report);
});

bot.command('week', ctx => {
  const chatId = String(ctx.chat.id);
  const report = weeklyReport(chatId);
  ctx.reply(report);
});

bot.command('month', ctx => {
  const chatId = String(ctx.chat.id);
  const report = monthlyReport(chatId);
  ctx.reply(report);
});

bot.on('text', ctx => {
  ctx.reply('❓ Не понял команду. Попробуй:\n• "golang 30"\n• "калории 200"\n• "вес 55.5"\n\nИли /help для всех команд');
});

bot.launch({ 
  dropPendingUpdates: true 
}).then(() => {
  console.log('🚀 Bot started successfully');
  console.log('📁 Database path:', process.env.DB_PATH || './data/tracker.db');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Добавь healthcheck для логов
setInterval(() => {
  console.log('✅ Bot is alive:', new Date().toISOString());
}, 300000); // каждые 5 минут
