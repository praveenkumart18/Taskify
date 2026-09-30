import express from 'express';
import {
  getTaskLists,
  createTaskList,
  getTaskListById,
  updateTaskList,
  deleteTaskList,
} from '../controllers/taskListController.js';
import { protect } from '../middleware/authMiddleware.js';
import { getRandomTask } from '../controllers/taskController.js';
import taskRoutes from './taskRoutes.js';

const router = express.Router();

// Enforce authentication for all tasklist endpoints
router.use(protect);

// Nested routes: /api/tasklists/:listId/tasks
router.use('/:listId/tasks', taskRoutes);

// Random task route: /api/tasklists/:listId/random
router.get('/:listId/random', getRandomTask);

router.route('/')
  .get(getTaskLists)
  .post(createTaskList);

router.route('/:id')
  .get(getTaskListById)
  .put(updateTaskList)
  .delete(deleteTaskList);

export default router;
