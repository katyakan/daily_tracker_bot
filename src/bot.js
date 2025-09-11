import 'dotenv/config';
import { Telegraf } from 'telegraf';
import './db.js';
import { today } from './utils/date.js';

import * as caloriesSrv from './services/calories.js';
import * as activitiesSrv from './services/activities.js';
import * as weightSrv from './services/weight.js';
import * as careerSrv from './services/career.js';
import * as goalsSrv from './services/goals.js';

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

🎯 Цели:
• цель golang 100 — установить цель
• goals — просмотр активных целей
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

// Парсер для целей: "цель golang 100"
bot.hears(/^\s*цель\s+(\w+)\s+(\d+)\s*$/i, ctx => {
  const chatId = String(ctx.chat.id);
  const activity = ctx.match[1].toLowerCase();
  const target = Number(ctx.match[2]);
  
  goalsSrv.setGoal(chatId, activity, target);
  ctx.reply(`🎯 Новая цель: ${activity} — ${target} минут`);
});

// Обновляем парсер активностей - проверяем цели
bot.hears(/^\s*(\w+)\s+(\d+)\s*$/i, ctx => {
  const chatId = String(ctx.chat.id);
  const activity = ctx.match[1];
  const minutes = Number(ctx.match[2]);
  
  activitiesSrv.logActivity(chatId, today(), activity, minutes);
  
  // Проверяем цель
  const goalCheck = goalsSrv.checkAndCompleteGoal(chatId, activity.toLowerCase());
  
  if (goalCheck?.completed) {
    ctx.reply(`📚 Записано: ${activity} — ${minutes} минут\n\n🎉 ЦЕЛЬ ДОСТИГНУТА! ${activity} — ${goalCheck.target} минут выполнено!`);
  } else {
    ctx.reply(`📚 Записано: ${activity} — ${minutes} минут`);
  }
});

// Команда для просмотра активных целей
bot.command('goals', ctx => {
  const chatId = String(ctx.chat.id);
  const goals = goalsSrv.getActiveGoals(chatId);
  
  if (!goals.length) {
    return ctx.reply('🎯 Нет активных целей. Установи: "цель golang 100"');
  }
  
  let text = '🎯 Активные цели:\n\n';
  
  goals.forEach(goal => {
    const current = goalsSrv.getGoalProgress(chatId, goal.activity);
    const percent = Math.min(Math.round((current / goal.target) * 100), 100);
    const filled = Math.round(percent / 10);
    const empty = 10 - filled;
    
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    text += `${goal.activity}: ${bar} ${percent}%\n`;
    text += `${current}/${goal.target} минут\n\n`;
  });
  
  ctx.reply(text);
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



