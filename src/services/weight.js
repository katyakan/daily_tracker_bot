import db from '../db.js';

export function setWeight(chatId, date, value) {
  db.prepare(`INSERT INTO weight(chat_id,date,value) VALUES(?,?,?) ON CONFLICT(chat_id,date) DO UPDATE SET value = excluded.value`)
    .run(chatId, date, Number(value));
}

export function getAvgWeight(chatId, start, end) {
  return db.prepare(`SELECT AVG(value) as avgWeight FROM weight WHERE chat_id = ? AND date BETWEEN ? AND ?`).get(chatId, start, end).avgWeight;
}

export function getWeightForDate(chatId, date) {
  return db.prepare(`SELECT value FROM weight WHERE chat_id = ? AND date = ?`).get(chatId, date)?.value ?? null;
}