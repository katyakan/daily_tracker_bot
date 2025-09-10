import db from '../db.js';

export function logActivity(chatId, date, type, minutes) {
  db.prepare(`INSERT INTO activities(chat_id,date,type,minutes) VALUES(?,?,?,?)`)
    .run(chatId, date, type.trim().toLowerCase(), Math.round(minutes));
}

export function getActivitiesByDate(chatId, date) {
  return db.prepare(`SELECT type, minutes FROM activities WHERE chat_id = ? AND date = ? ORDER BY id`).all(chatId, date);
}

export function getActivitiesRangeAggregated(chatId, start, end) {
  return db.prepare(`
    SELECT type, COALESCE(SUM(minutes),0) as totalMinutes, COUNT(*) as sessions
    FROM activities
    WHERE chat_id = ? AND date BETWEEN ? AND ?
    GROUP BY type
    ORDER BY totalMinutes DESC
  `).all(chatId, start, end);
}

export function getActiveDaysCount(chatId, start, end) {
  return db.prepare(`
    SELECT COUNT(DISTINCT d) as cnt FROM (
      SELECT date as d FROM activities WHERE chat_id = ? AND date BETWEEN ? AND ?
      UNION
      SELECT date as d FROM calories WHERE chat_id = ? AND burn>0 AND date BETWEEN ? AND ?
    )
  `).get(chatId, start, end, chatId, start, end).cnt;
}