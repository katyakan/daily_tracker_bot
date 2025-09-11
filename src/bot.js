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
• цель калории 1500 — цель по калориям (принято)
• цель занятия 1000 — цель по сожжённым калориям
• цель golang 100 — цель по занятиям
• цель отклик 10 — цель по откликам
• /goals — просмотр активных целей
`;

// Commands
bot.start(ctx => ctx.reply('🎯 Привет! Я твой трекер целей. Напиши /help для команд.'));
bot.command('help', ctx => ctx.reply(HELP_TEXT));

// Parsers
bot.hears(/^\s*калории\s+(\d+)\s*$/i, ctx => {
  const chatId = String(ctx.chat.id);
  const kcal = Number(ctx.match[1]);
  caloriesSrv.addIntake(chatId, today(), kcal);
  
  const goalCheck = goalsSrv.checkAndCompleteGoal(chatId, 'калории');
  if (goalCheck?.completed) {
    ctx.reply(`🍏 Добавлено ${kcal} ккал\n\n🎉 ЦЕЛЬ ДОСТИГНУТА! Калории — ${goalCheck.target} ккал!`);
  } else {
    ctx.reply(`🍏 Добавлено ${kcal} ккал`);
  }
});

bot.hears(/^\s*занятия\s+(\d+)\s*$/i, ctx => {
  const chatId = String(ctx.chat.id);
  const kcal = Number(ctx.match[1]);
  caloriesSrv.addBurn(chatId, today(), kcal);
  
  const goalCheck = goalsSrv.checkAndCompleteGoal(chatId, 'занятия');
  if (goalCheck?.completed) {
    ctx.reply(`🔥 Сожжено ${kcal} ккал\n\n🎉 ЦЕЛЬ ДОСТИГНУТА! Сожжено — ${goalCheck.target} ккал!`);
  } else {
    ctx.reply(`🔥 Сожжено ${kcal} ккал`);
  }
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

// Парсеры для разных типов целей
bot.hears(/^\s*цель\s+калории\s+(\d+)\s*$/i, ctx => {
  const chatId = String(ctx.chat.id);
  const target = Number(ctx.match[1]);
  goalsSrv.setGoal(chatId, 'калории', '', target);
  ctx.reply(`🎯 Цель: калории — ${target} ккал`);
});

bot.hears(/^\s*цель\s+(отклик|ответ|собес)\s+(\d+)\s*$/i, ctx => {
  const chatId = String(ctx.chat.id);
  const activity = ctx.match[1];
  const target = Number(ctx.match[2]);
  goalsSrv.setGoal(chatId, 'карьера', activity, target);
  ctx.reply(`🎯 Цель: ${activity} — ${target} раз`);
});

bot.hears(/^\s*цель\s+(\w+)\s+(\d+)\s*$/i, ctx => {
  const chatId = String(ctx.chat.id);
  const activity = ctx.match[1];
  const target = Number(ctx.match[2]);
  goalsSrv.setGoal(chatId, 'активности', activity, target);
  ctx.reply(`🎯 Цель: ${activity} — ${target} минут`);
});

// Добавляем парсер для цели по сожжённым калориям
bot.hears(/^\s*цель\s+занятия\s+(\d+)\s*$/i, ctx => {
  const chatId = String(ctx.chat.id);
  const target = Number(ctx.match[1]);
  goalsSrv.setGoal(chatId, 'занятия', '', target);
  ctx.reply(`🎯 Цель: сожжённые калории — ${target} ккал`);
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

// Обновляем парсер калорий - проверяем цели
bot.hears(/^\s*калории\s+(\d+)\s*$/i, ctx => {
  const chatId = String(ctx.chat.id);
  const kcal = Number(ctx.match[1]);
  caloriesSrv.addIntake(chatId, today(), kcal);
  
  const goalCheck = goalsSrv.checkAndCompleteGoal(chatId, 'калории');
  if (goalCheck?.completed) {
    ctx.reply(`🍏 Добавлено ${kcal} ккал\n\n🎉 ЦЕЛЬ ДОСТИГНУТА! Калории — ${goalCheck.target} ккал!`);
  } else {
    ctx.reply(`🍏 Добавлено ${kcal} ккал`);
  }
});

// Обновляем парсер карьеры - проверяем цели
bot.hears(/^\s*(отклик|ответ|собес)\s+(.+)$/i, ctx => {
  const chatId = String(ctx.chat.id);
  const type = ctx.match[1].toLowerCase();
  const company = ctx.match[2].trim();
  careerSrv.logCareer(chatId, today(), type, company);
  
  const goalCheck = goalsSrv.checkAndCompleteGoal(chatId, 'карьера', type);
  if (goalCheck?.completed) {
    ctx.reply(`💼 Записано: ${type} — ${company}\n\n🎉 ЦЕЛЬ ДОСТИГНУТА! ${type} — ${goalCheck.target} раз!`);
  } else {
    ctx.reply(`💼 Записано: ${type} — ${company}`);
  }
});

// Команда для просмотра активных целей
bot.command('goals', ctx => {
  const chatId = String(ctx.chat.id);
  const goals = goalsSrv.getActiveGoals(chatId);
  
  if (!goals.length) {
    return ctx.reply('🎯 Нет активных целей. Установи: "цель занятия 1000"');
  }
  
  let text = '🎯 Активные цели:\n\n';
  
  goals.forEach(goal => {
    const current = goalsSrv.getGoalProgress(chatId, goal.type, goal.activity);
    const percent = Math.min(Math.round((current / goal.target) * 100), 100);
    const filled = Math.round(percent / 10);
    const empty = 10 - filled;
    
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const name = goal.activity || goal.type;
    text += `${name}: ${bar} ${percent}%\n`;
    text += `${current}/${goal.target} ${goal.type === 'активности' ? 'минут' : goal.type === 'калории' || goal.type === 'занятия' ? 'ккал' : 'раз'}\n\n`;
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








