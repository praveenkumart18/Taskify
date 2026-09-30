import express from 'express';
import {
  getTasksByList,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getRandomTask,
} from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

// Protect all task endpoints with authentication
router.use(protect);

// Nested routes: /api/tasklists/:listId/tasks
router.route('/')
  .get(getTasksByList)
  .post(createTask);

// Random task: /api/tasklists/:listId/tasks/random
router.get('/random', getRandomTask);

// Direct task routes: /api/tasks/:taskId
router.route('/:taskId')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

// Task status toggle: /api/tasks/:taskId/status
router.route('/:taskId/status')
  .patch(updateTaskStatus);

export default router;
