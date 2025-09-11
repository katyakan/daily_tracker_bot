import db from '../db.js';
import { today } from '../utils/date.js';

export function setGoal(chatId, type, activity, target) {
  db.prepare(`
    INSERT INTO goals(chat_id, type, activity, target, created_date, completed)
    VALUES(?,?,?,?,?,0)
    ON CONFLICT(chat_id, type, activity) DO UPDATE
      SET target = excluded.target, created_date = excluded.created_date, completed = 0
  `).run(chatId, type, activity || '', target, today());
}

export function getActiveGoals(chatId) {
  return db.prepare(`
    SELECT type, activity, target, created_date
    FROM goals 
    WHERE chat_id = ? AND completed = 0
  `).all(chatId);
}

export function getGoalProgress(chatId, type, activity = '') {
  const goal = db.prepare(`
    SELECT created_date FROM goals 
    WHERE chat_id = ? AND type = ? AND activity = ? AND completed = 0
  `).get(chatId, type, activity);
  
  if (!goal) return 0;
  
  switch(type) {
    case 'калории':
      return db.prepare(`
        SELECT COALESCE(SUM(intake), 0) as current
        FROM calories WHERE chat_id = ? AND date >= ?
      `).get(chatId, goal.created_date).current;
      
    case 'активности':
      return db.prepare(`
        SELECT COALESCE(SUM(minutes), 0) as current
        FROM activities WHERE chat_id = ? AND type = ? AND date >= ?
      `).get(chatId, activity, goal.created_date).current;
      
    case 'карьера':
      return db.prepare(`
        SELECT COUNT(*) as current
        FROM career WHERE chat_id = ? AND type = ? AND date >= ?
      `).get(chatId, activity, goal.created_date).current;
      
    default: return 0;
  }
}

export function checkAndCompleteGoal(chatId, type, activity = '') {
  const goal = db.prepare(`
    SELECT target FROM goals 
    WHERE chat_id = ? AND type = ? AND activity = ? AND completed = 0
  `).get(chatId, type, activity);
  
  if (!goal) return null;
  
  const current = getGoalProgress(chatId, type, activity);
  
  if (current >= goal.target) {
    db.prepare(`
      UPDATE goals SET completed = 1, completed_date = ?
      WHERE chat_id = ? AND type = ? AND activity = ? AND completed = 0
    `).run(today(), chatId, type, activity);
    
    return { completed: true, target: goal.target, current };
  }
  
  return { completed: false, target: goal.target, current };
}



