import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    taskListId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaskList',
      required: [true, 'Task list ID is required'],
      index: true,
    },
    number: {
      type: Number,
      required: [true, 'Task number is required'],
      min: [1, 'Task number must be at least 1'],
    },
    name: {
      type: String,
      required: [true, 'Task name is required'],
      trim: true,
      maxlength: [200, 'Task name cannot exceed 200 characters'],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Task title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: 'Priority must be either low, medium, or high',
      },
      default: 'medium',
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'completed'],
        message: 'Status must be either pending or completed',
      },
      default: 'pending',
    },
    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validation hook: auto-assign number if missing, and sync name & title
taskSchema.pre('validate', async function () {
  // Sync name and title
  if (!this.name && this.title) {
    this.name = this.title;
  }
  if (!this.title && this.name) {
    this.title = this.name;
  }

  // Auto-calculate sequential task number if not provided
  if ((this.number === undefined || this.number === null) && this.taskListId) {
    try {
      const lastTask = await mongoose
        .model('Task')
        .findOne({ taskListId: this.taskListId })
        .sort({ number: -1 });

      this.number =
        lastTask && typeof lastTask.number === 'number' ? lastTask.number + 1 : 1;
    } catch {
      this.number = 1;
    }
  }
});

// Compound indexes for scalable performance on 100+ tasks per list
taskSchema.index({ taskListId: 1, number: 1 });
taskSchema.index({ taskListId: 1, createdAt: -1 });
taskSchema.index({ taskListId: 1, status: 1 });
taskSchema.index({ taskListId: 1, priority: 1 });

const Task = mongoose.model('Task', taskSchema);

export default Task;
