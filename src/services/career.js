import db from '../db.js';

export function logCareer(chatId, date, type, company) {
  db.prepare(`INSERT INTO career(chat_id,date,type,company) VALUES(?,?,?,?)`)
    .run(chatId, date, type.toLowerCase(), company.trim());
}

export function getCareerCounts(chatId, start, end) {
  return db.prepare(`
    SELECT type, COUNT(*) as cnt
    FROM career
    WHERE chat_id = ? AND date BETWEEN ? AND ?
    GROUP BY type
  `).all(chatId, start, end);
}

export function getCareerForDate(chatId, date) {
  return db.prepare(`SELECT type, company FROM career WHERE chat_id = ? AND date = ?`).all(chatId, date);
}