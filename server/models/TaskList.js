import mongoose from 'mongoose';

const taskListSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Task list name is required'],
      trim: true,
      maxlength: [100, 'Task list name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly fetch user's task lists ordered by order and updatedAt
taskListSchema.index({ userId: 1, order: 1, updatedAt: -1 });

const TaskList = mongoose.model('TaskList', taskListSchema);

export default TaskList;
