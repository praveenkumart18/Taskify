import mongoose from 'mongoose';
import TaskList from '../models/TaskList.js';

/**
 * @desc    Get all task lists for the logged-in user
 * @route   GET /api/tasklists
 * @access  Private
 */
export const getTaskLists = async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user.id);

    // Aggregate to fetch task lists for the current user and count tasks
    const taskLists = await TaskList.aggregate([
      {
        $match: {
          userId: userObjectId,
        },
      },
      {
        $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: 'taskListId',
          as: 'tasks',
        },
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          name: 1,
          description: 1,
          taskCount: { $size: '$tasks' },
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $sort: {
          updatedAt: -1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      count: taskLists.length,
      data: taskLists,
    });
  } catch (error) {
    console.error('getTaskLists error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving task lists',
    });
  }
};

/**
 * @desc    Create a new task list for the logged-in user
 * @route   POST /api/tasklists
 * @access  Private
 */
export const createTaskList = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate input
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Task list name is required',
      });
    }

    // Strictly enforce ownership: userId comes exclusively from req.user
    const taskList = await TaskList.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      userId: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: 'Task list created successfully',
      data: {
        _id: taskList._id,
        name: taskList.name,
        description: taskList.description,
        userId: taskList.userId,
        taskCount: 0,
        createdAt: taskList.createdAt,
        updatedAt: taskList.updatedAt,
      },
    });
  } catch (error) {
    console.error('createTaskList error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating task list',
    });
  }
};

/**
 * @desc    Get a single task list by ID (ownership verified)
 * @route   GET /api/tasklists/:id
 * @access  Private
 */
export const getTaskListById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task list ID',
      });
    }

    const taskList = await TaskList.findById(id);

    // If not found or belongs to another user, return 404 to avoid exposing existence
    if (!taskList || taskList.userId.toString() !== req.user.id.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Task list not found',
      });
    }

    // Count tasks belonging to this list
    let taskCount = 0;
    try {
      taskCount = await mongoose.connection
        .collection('tasks')
        .countDocuments({ taskListId: taskList._id });
    } catch {
      taskCount = 0;
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: taskList._id,
        name: taskList.name,
        description: taskList.description,
        userId: taskList.userId,
        taskCount,
        createdAt: taskList.createdAt,
        updatedAt: taskList.updatedAt,
      },
    });
  } catch (error) {
    console.error('getTaskListById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving task list',
    });
  }
};

/**
 * @desc    Update a task list (ownership verified)
 * @route   PUT /api/tasklists/:id
 * @access  Private
 */
export const updateTaskList = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task list ID',
      });
    }

    const taskList = await TaskList.findById(id);

    // Ownership check: must exist and belong to the logged-in user
    if (!taskList || taskList.userId.toString() !== req.user.id.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Task list not found',
      });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Task list name cannot be empty',
        });
      }
      taskList.name = name.trim();
    }

    if (description !== undefined) {
      taskList.description = description.trim();
    }

    await taskList.save();

    return res.status(200).json({
      success: true,
      message: 'Task list updated successfully',
      data: taskList,
    });
  } catch (error) {
    console.error('updateTaskList error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating task list',
    });
  }
};

/**
 * @desc    Delete a task list and cascade delete all its tasks
 * @route   DELETE /api/tasklists/:id
 * @access  Private
 */
export const deleteTaskList = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task list ID',
      });
    }

    const taskList = await TaskList.findById(id);

    // Ownership check
    if (!taskList || taskList.userId.toString() !== req.user.id.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Task list not found',
      });
    }

    // Cascade delete: delete all tasks associated with this taskListId
    try {
      await mongoose.connection
        .collection('tasks')
        .deleteMany({ taskListId: taskList._id });
    } catch (err) {
      console.warn('Note on cascade task deletion:', err.message);
    }

    // Delete the task list
    await taskList.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Task list and all associated tasks deleted successfully',
    });
  } catch (error) {
    console.error('deleteTaskList error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting task list',
    });
  }
};
