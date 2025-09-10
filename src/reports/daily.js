import { today } from '../utils/date.js';
import { getCaloriesForDate } from '../services/calories.js';
import { getActivitiesByDate } from '../services/activities.js';
import { getWeightForDate } from '../services/weight.js';
import { getCareerForDate } from '../services/career.js';

export function dailyReport(chatId) {
  const date = today();
  const cal = getCaloriesForDate(chatId, date);
  const activities = getActivitiesByDate(chatId, date);
  const weight = getWeightForDate(chatId, date);
  const career = getCareerForDate(chatId, date);

  const balance = (cal.intake || 0) - (cal.burn || 0);

  let text = `📅 Отчёт за ${date}\n\n`;
  text += `🍽️ Калории: принято ${cal.intake || 0} ккал, сожжено ${cal.burn || 0} ккал\n`;
  text += `🔢 Баланс: ${balance} ккал\n\n`;

  if (activities.length) {
    text += `🏋️‍♀️ Занятия:\n`;
    activities.forEach(a => text += `  • ${a.type} — ${a.minutes} мин\n`);
  } else {
    text += `🏋️‍♀️ Занятия: —\n`;
  }

  text += `\n⚖️ Вес: ${weight !== null ? weight + ' кг' : '—'}\n\n`;

  if (career.length) {
    text += `💼 Карьера:\n`;
    career.forEach(c => text += `  • ${c.type} — ${c.company}\n`);
  } else {
    text += `💼 Карьера: —\n`;
  }

  return text;
}