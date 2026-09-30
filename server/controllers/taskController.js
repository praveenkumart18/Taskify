import mongoose from 'mongoose';
import Task from '../models/Task.js';
import TaskList from '../models/TaskList.js';

/**
 * Helper to verify that a TaskList exists and is owned by the logged-in user
 */
const verifyTaskListOwnership = async (taskListId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(taskListId)) {
    return null;
  }
  const taskList = await TaskList.findById(taskListId);
  if (!taskList || taskList.userId.toString() !== userId.toString()) {
    return null;
  }
  return taskList;
};

/**
 * Helper to verify that a Task exists and belongs to a TaskList owned by the logged-in user
 */
const verifyTaskOwnership = async (taskId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return null;
  }
  const task = await Task.findById(taskId);
  if (!task) {
    return null;
  }
  const taskList = await verifyTaskListOwnership(task.taskListId, userId);
  if (!taskList) {
    return null;
  }
  return { task, taskList };
};

/**
 * @desc    Get all tasks for a specific task list (filtered & sorted)
 * @route   GET /api/tasklists/:listId/tasks
 * @access  Private
 */
export const getTasksByList = async (req, res) => {
  try {
    const { listId } = req.params;
    const { status, priority, search, sort, page, limit } = req.query;

    // Verify task list ownership
    const taskList = await verifyTaskListOwnership(listId, req.user.id);
    if (!taskList) {
      return res.status(404).json({
        success: false,
        message: 'Task list not found',
      });
    }

    // Build filter query
    const filter = { taskListId: taskList._id };

    if (status && ['pending', 'completed'].includes(status.toLowerCase())) {
      filter.status = status.toLowerCase();
    }

    if (priority && ['low', 'medium', 'high'].includes(priority.toLowerCase())) {
      filter.priority = priority.toLowerCase();
    }

    // Search query across name, title, and description
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { name: searchRegex },
        { title: searchRegex },
        { description: searchRegex },
      ];
    }

    // Determine sorting order (default to sequential task number: 1, 2, 3...)
    let sortOption = { number: 1, createdAt: 1 };
    if (sort === 'number') {
      sortOption = { number: 1, createdAt: 1 };
    } else if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'dueDate') {
      sortOption = { dueDate: 1, createdAt: -1 };
    }

    // Pagination parameters
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || (page ? 20 : 100)));
    const skip = (pageNum - 1) * limitNum;

    const total = await Task.countDocuments(filter);
    const tasks = await Task.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      data: tasks,
    });
  } catch (error) {
    console.error('getTasksByList error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving tasks',
    });
  }
};

/**
 * @desc    Create a new task inside a task list
 * @route   POST /api/tasklists/:listId/tasks
 * @access  Private
 */
export const createTask = async (req, res) => {
  try {
    const { listId } = req.params;
    const { name, title, number, description, priority, dueDate } = req.body;

    // Verify task list ownership
    const taskList = await verifyTaskListOwnership(listId, req.user.id);
    if (!taskList) {
      return res.status(404).json({
        success: false,
        message: 'Task list not found',
      });
    }

    // Validate name (accept either name or title)
    const taskName = (name || title || '').trim();
    if (!taskName) {
      return res.status(400).json({
        success: false,
        message: 'Task name is required',
      });
    }

    // Validate priority if provided
    let taskPriority = 'medium';
    if (priority) {
      const lowerPriority = priority.toLowerCase();
      if (!['low', 'medium', 'high'].includes(lowerPriority)) {
        return res.status(400).json({
          success: false,
          message: 'Priority must be either low, medium, or high',
        });
      }
      taskPriority = lowerPriority;
    }

    // Determine sequential task number if not explicitly passed
    let taskNumber = number !== undefined && number !== null ? parseInt(number, 10) : null;
    if (!taskNumber || isNaN(taskNumber) || taskNumber < 1) {
      const lastTask = await Task.findOne({ taskListId: taskList._id }).sort({ number: -1 });
      taskNumber =
        lastTask && typeof lastTask.number === 'number' ? lastTask.number + 1 : 1;
    }

    // Create task strictly with listId from URL
    const task = await Task.create({
      taskListId: taskList._id,
      number: taskNumber,
      name: taskName,
      title: taskName,
      description: description ? description.trim() : '',
      priority: taskPriority,
      status: 'pending',
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task,
    });
  } catch (error) {
    console.error('createTask error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating task',
    });
  }
};

/**
 * @desc    Create multiple tasks in bulk for a task list
 * @route   POST /api/tasklists/:listId/tasks/bulk
 * @access  Private
 */
export const createBulkTasks = async (req, res) => {
  try {
    const listId = req.params.listId || req.body.listId;
    const { tasks } = req.body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tasks list is required and must contain at least one task',
      });
    }

    const taskList = await verifyTaskListOwnership(listId, req.user.id);
    if (!taskList) {
      return res.status(404).json({
        success: false,
        message: 'Task list not found',
      });
    }

    // Determine current highest task number to auto-increment sequentially
    const lastTask = await Task.findOne({ taskListId: taskList._id }).sort({ number: -1 });
    let currentNumber = lastTask && typeof lastTask.number === 'number' ? lastTask.number : 0;

    const toInsert = [];
    for (const item of tasks) {
      const taskName = (item.name || item.title || '').trim();
      if (!taskName) continue;

      let taskNum = item.number && !isNaN(item.number) && item.number >= 1 
        ? parseInt(item.number, 10) 
        : ++currentNumber;
      
      let taskPriority = 'medium';
      if (item.priority && ['low', 'medium', 'high'].includes(item.priority.toLowerCase())) {
        taskPriority = item.priority.toLowerCase();
      }

      toInsert.push({
        taskListId: taskList._id,
        number: taskNum,
        name: taskName,
        title: taskName,
        description: item.description ? item.description.trim() : '',
        priority: taskPriority,
        status: 'pending',
      });
    }

    if (toInsert.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid tasks found to create',
      });
    }

    const created = await Task.insertMany(toInsert);

    return res.status(201).json({
      success: true,
      message: `Successfully created ${created.length} tasks`,
      count: created.length,
      data: created,
    });
  } catch (error) {
    console.error('createBulkTasks error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating tasks in bulk',
    });
  }
};

/**
 * @desc    Get a single task by ID (ownership verified through TaskList)
 * @route   GET /api/tasks/:taskId
 * @access  Private
 */
export const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;

    const verification = await verifyTaskOwnership(taskId, req.user.id);
    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: verification.task,
    });
  } catch (error) {
    console.error('getTaskById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving task',
    });
  }
};

/**
 * @desc    Update a task (ownership verified through TaskList)
 * @route   PUT /api/tasks/:taskId
 * @access  Private
 */
export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { name, title, number, description, priority, status, dueDate } = req.body;

    const verification = await verifyTaskOwnership(taskId, req.user.id);
    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const { task } = verification;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Task name cannot be empty',
        });
      }
      task.name = name.trim();
      task.title = name.trim();
    } else if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Task title cannot be empty',
        });
      }
      task.title = title.trim();
      task.name = title.trim();
    }

    if (number !== undefined) {
      const parsedNum = parseInt(number, 10);
      if (!isNaN(parsedNum) && parsedNum >= 1) {
        task.number = parsedNum;
      }
    }

    if (description !== undefined) {
      task.description = description.trim();
    }

    if (priority !== undefined) {
      const lowerPriority = priority.toLowerCase();
      if (!['low', 'medium', 'high'].includes(lowerPriority)) {
        return res.status(400).json({
          success: false,
          message: 'Priority must be either low, medium, or high',
        });
      }
      task.priority = lowerPriority;
    }

    if (status !== undefined) {
      const lowerStatus = status.toLowerCase();
      if (!['pending', 'completed'].includes(lowerStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be either pending or completed',
        });
      }
      task.status = lowerStatus;
    }

    if (dueDate !== undefined) {
      task.dueDate = dueDate ? new Date(dueDate) : null;
    }

    await task.save();

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task,
    });
  } catch (error) {
    console.error('updateTask error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating task',
    });
  }
};

/**
 * @desc    Delete a task (ownership verified through TaskList)
 * @route   DELETE /api/tasks/:taskId
 * @access  Private
 */
export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const verification = await verifyTaskOwnership(taskId, req.user.id);
    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    await verification.task.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('deleteTask error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting task',
    });
  }
};

/**
 * @desc    Toggle or update task status (pending <-> completed)
 * @route   PATCH /api/tasks/:taskId/status
 * @access  Private
 */
export const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const verification = await verifyTaskOwnership(taskId, req.user.id);
    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const { task } = verification;

    if (status) {
      const lowerStatus = status.toLowerCase();
      if (!['pending', 'completed'].includes(lowerStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be either pending or completed',
        });
      }
      task.status = lowerStatus;
    } else {
      // Toggle if not explicitly specified
      task.status = task.status === 'pending' ? 'completed' : 'pending';
    }

    await task.save();

    return res.status(200).json({
      success: true,
      message: `Task marked as ${task.status}`,
      data: task,
    });
  } catch (error) {
    console.error('updateTaskStatus error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating task status',
    });
  }
};

/**
 * @desc    Get a random task from a specific task list using MongoDB $sample
 *          Prioritizes pending tasks over completed tasks
 * @route   GET /api/tasklists/:listId/random
 * @access  Private
 */
export const getRandomTask = async (req, res) => {
  try {
    const { listId } = req.params;
    const { exclude } = req.query;

    if (!mongoose.Types.ObjectId.isValid(listId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task list ID',
      });
    }

    // Verify task list ownership
    const taskList = await TaskList.findById(listId);
    if (!taskList || taskList.userId.toString() !== req.user.id.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Task list not found',
      });
    }

    const listObjectId = new mongoose.Types.ObjectId(listId);

    // Total tasks in list
    const totalCount = await Task.countDocuments({ taskListId: listObjectId });
    if (totalCount === 0) {
      return res.status(200).json({
        success: true,
        message: 'No tasks found in this task list',
        data: null,
      });
    }

    // Parse excluded task IDs (to enforce minimum 2-roll cooldown)
    let excludeObjectIds = [];
    if (exclude) {
      const rawIds = Array.isArray(exclude) ? exclude : String(exclude).split(',');
      excludeObjectIds = rawIds
        .map((id) => id.trim())
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
    }

    // Match filter: exclude recent tasks if enough tasks exist
    let matchFilter = { taskListId: listObjectId };
    if (excludeObjectIds.length > 0 && totalCount > 1) {
      // Ensure we leave at least 1 candidate task to pick from
      const maxToExclude = Math.min(excludeObjectIds.length, totalCount - 1);
      const effectiveExcludes = excludeObjectIds.slice(-maxToExclude);
      matchFilter._id = { $nin: effectiveExcludes };
    }

    // Pick a random task using MongoDB $sample
    let randomTasks = await Task.aggregate([
      { $match: matchFilter },
      { $sample: { size: 1 } },
    ]);

    // Fallback: If no task matched the exclusion filter, sample from all tasks
    if (!randomTasks || randomTasks.length === 0) {
      randomTasks = await Task.aggregate([
        { $match: { taskListId: listObjectId } },
        { $sample: { size: 1 } },
      ]);
    }

    if (randomTasks && randomTasks.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Random task selected successfully',
        data: randomTasks[0],
      });
    }

    return res.status(200).json({
      success: true,
      message: 'No tasks found in this task list',
      data: null,
    });
  } catch (error) {
    console.error('getRandomTask error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while selecting random task',
    });
  }
};

