import { today, dateNDaysAgo, rangeDaysCount } from '../utils/date.js';
import { getCaloriesRange } from '../services/calories.js';
import { getActivitiesRangeAggregated, getActiveDaysCount } from '../services/activities.js';
import { getAvgWeight } from '../services/weight.js';
import { getCareerCounts } from '../services/career.js';

export function monthlyReport(chatId) {
  const end = today();
  const start = dateNDaysAgo(29);
  const days = rangeDaysCount(start, end);

  const cal = getCaloriesRange(chatId, start, end);
  const acts = getActivitiesRangeAggregated(chatId, start, end);
  const avgWeight = getAvgWeight(chatId, start, end);
  const career = getCareerCounts(chatId, start, end);
  const activeDays = getActiveDaysCount(chatId, start, end);

  let text = `📊 Отчёт за месяц ${start} — ${end}\n\n`;
  text += `🥗 Калории: принято ${cal.totalIntake} ккал, сожжено ${cal.totalBurn} ккал\n`;
  text += `🔥 Баланс: ${cal.totalIntake - cal.totalBurn} ккал\n\n`;

  text += `🕒 Занятия:\n`;
  if (acts.length) {
    acts.forEach(a => text += `  • ${a.type} — ${a.totalMinutes} мин (${a.sessions} сессий)\n`);
  } else text += `  —\n`;

  text += `\n⚖️ Средний вес: ${avgWeight ? (+avgWeight).toFixed(1) + ' кг' : '—'}\n\n`;

  text += `✅ Активных дней: ${activeDays}/${days} — Пропусков: ${days - activeDays}\n\n`;

  if (career.length) {
    text += `💼 Карьера:\n`;
    career.forEach(c => text += `  • ${c.type} — ${c.cnt}\n`);
  } else {
    text += `💼 Карьера: —\n`;
  }

  return text;
}