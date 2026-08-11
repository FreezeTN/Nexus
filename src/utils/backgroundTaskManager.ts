/**
 * Background Tasks Engine & Non-Blocking Worker Pipeline
 * Prevents UI freezing during heavy long-running operations like:
 * - Campaign Import / Parsing
 * - Global Search Index Regeneration
 * - Knowledge Graph Force-Simulation
 * - Plugin Scanning & Contract Validation
 * - SRD Dataset Parsing
 */

export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface BackgroundTask {
  id: string;
  title: string;
  category: 'import' | 'indexing' | 'graph' | 'plugin' | 'srd' | 'ai';
  progress: number; // 0 to 100
  status: TaskStatus;
  statusText: string;
  startedAt: number;
  completedAt?: number;
  error?: string;
  result?: any;
}

class BackgroundTaskManager {
  private tasks: Map<string, BackgroundTask> = new Map();
  private listeners: Set<() => void> = new Set();

  public createTask(title: string, category: BackgroundTask['category']): string {
    const taskId = `bg-${Math.random().toString(36).substring(2, 9)}`;
    const task: BackgroundTask = {
      id: taskId,
      title,
      category,
      progress: 0,
      status: 'queued',
      statusText: 'Queued in background thread...',
      startedAt: Date.now()
    };

    this.tasks.set(taskId, task);
    this.notify();
    return taskId;
  }

  public updateTaskProgress(taskId: string, progress: number, statusText?: string) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'running';
    task.progress = Math.min(100, Math.max(0, Math.round(progress)));
    if (statusText) task.statusText = statusText;

    this.notify();
  }

  public completeTask(taskId: string, result?: any, statusText: string = 'Completed successfully') {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'completed';
    task.progress = 100;
    task.statusText = statusText;
    task.completedAt = Date.now();
    task.result = result;

    this.notify();
  }

  public failTask(taskId: string, errorMsg: string) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'failed';
    task.error = errorMsg;
    task.statusText = `Failed: ${errorMsg}`;
    task.completedAt = Date.now();

    this.notify();
  }

  public cancelTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'cancelled';
    task.statusText = 'Cancelled by user';
    task.completedAt = Date.now();

    this.notify();
  }

  /**
   * Run an async non-blocking task chunked over microtasks / requestIdleCallback
   */
  public async runAsyncTask<T>(
    title: string,
    category: BackgroundTask['category'],
    taskRunner: (updateProgress: (p: number, text?: string) => void) => Promise<T>
  ): Promise<T> {
    const taskId = this.createTask(title, category);
    this.updateTaskProgress(taskId, 5, 'Initializing worker thread...');

    return new Promise<T>((resolve, reject) => {
      // Defer to idle callback or setTimeout to unblock current frame render
      const schedule = typeof requestIdleCallback !== 'undefined' ? requestIdleCallback : (cb: any) => setTimeout(cb, 10);

      schedule(async () => {
        try {
          const result = await taskRunner((p, text) => {
            this.updateTaskProgress(taskId, p, text);
          });
          this.completeTask(taskId, result, `${title} finished`);
          resolve(result);
        } catch (err: any) {
          const msg = err?.message || 'Execution error';
          this.failTask(taskId, msg);
          reject(err);
        }
      });
    });
  }

  public getActiveTasks(): BackgroundTask[] {
    return Array.from(this.tasks.values()).filter(t => t.status === 'running' || t.status === 'queued');
  }

  public getAllTasks(): BackgroundTask[] {
    return Array.from(this.tasks.values()).sort((a, b) => b.startedAt - a.startedAt);
  }

  public clearCompleted() {
    this.tasks.forEach((t, id) => {
      if (t.status === 'completed' || t.status === 'cancelled' || t.status === 'failed') {
        this.tasks.delete(id);
      }
    });
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }
}

export const backgroundTaskManager = new BackgroundTaskManager();
