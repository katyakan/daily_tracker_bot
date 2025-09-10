import db from '../db.js';

export function addIntake(chatId, date, kcal) {
  db.prepare(`
    INSERT INTO calories(chat_id,date,intake,burn)
    VALUES(?,?,?,0)
    ON CONFLICT(chat_id,date) DO UPDATE
      SET intake = intake + excluded.intake
  `).run(chatId, date, Math.round(kcal));
}

export function addBurn(chatId, date, kcal) {
  db.prepare(`
    INSERT INTO calories(chat_id,date,intake,burn)
    VALUES(?, ?, 0, ?)
    ON CONFLICT(chat_id,date) DO UPDATE
      SET burn = burn + excluded.burn
  `).run(chatId, date, Math.round(kcal));
}

export function getCaloriesRange(chatId, start, end) {
  return db.prepare(`
    SELECT
      COALESCE(SUM(intake),0) as totalIntake,
      COALESCE(SUM(burn),0) as totalBurn
    FROM calories
    WHERE chat_id = ? AND date BETWEEN ? AND ?
  `).get(chatId, start, end);
}

export function getCaloriesForDate(chatId, date) {
  return db.prepare(`SELECT intake, burn FROM calories WHERE chat_id = ? AND date = ?`).get(chatId, date) || { intake:0, burn:0 };
}