import db from '../db.js';
import { today } from '../utils/date.js';

export function setGoal(chatId, activity, target) {
  db.prepare(`
    INSERT INTO goals(chat_id, activity, target, created_date, completed)
    VALUES(?,?,?,?,0)
    ON CONFLICT(chat_id, activity) DO UPDATE
      SET target = excluded.target, created_date = excluded.created_date, completed = 0
  `).run(chatId, activity.toLowerCase(), target, today());
}

export function getActiveGoals(chatId) {
  return db.prepare(`
    SELECT activity, target, created_date
    FROM goals 
    WHERE chat_id = ? AND completed = 0
  `).all(chatId);
}

export function getGoalProgress(chatId, activity) {
  // Считаем с момента создания цели
  const goal = db.prepare(`
    SELECT created_date FROM goals 
    WHERE chat_id = ? AND activity = ? AND completed = 0
  `).get(chatId, activity);
  
  if (!goal) return 0;
  
  return db.prepare(`
    SELECT COALESCE(SUM(minutes), 0) as current
    FROM activities 
    WHERE chat_id = ? AND type = ? AND date >= ?
  `).get(chatId, activity, goal.created_date).current;
}

export function checkAndCompleteGoal(chatId, activity) {
  const goal = db.prepare(`
    SELECT target FROM goals 
    WHERE chat_id = ? AND activity = ? AND completed = 0
  `).get(chatId, activity);
  
  if (!goal) return null;
  
  const current = getGoalProgress(chatId, activity);
  
  if (current >= goal.target) {
    // Закрываем цель
    db.prepare(`
      UPDATE goals 
      SET completed = 1, completed_date = ?
      WHERE chat_id = ? AND activity = ? AND completed = 0
    `).run(today(), chatId, activity);
    
    return { completed: true, target: goal.target, current };
  }
  
  return { completed: false, target: goal.target, current };
}