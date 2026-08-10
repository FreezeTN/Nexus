import { useEffect, useState } from 'react';
import { EventType, EventPayloadMap, EventCallback, LoggedEvent } from './types';

class EventBus {
  private listeners: Map<EventType, Set<EventCallback<any>>> = new Map();
  private history: LoggedEvent[] = [];
  private maxHistoryLength = 100;

  private globalListeners: Set<(log: LoggedEvent) => void> = new Set();

  public on<K extends EventType>(type: K, callback: EventCallback<K>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    const set = this.listeners.get(type)!;
    set.add(callback);

    return () => {
      set.delete(callback);
    };
  }

  public subscribeAll(callback: (log: LoggedEvent) => void): () => void {
    this.globalListeners.add(callback);
    return () => {
      this.globalListeners.delete(callback);
    };
  }

  public off<K extends EventType>(type: K, callback: EventCallback<K>): void {
    const set = this.listeners.get(type);
    if (set) {
      set.delete(callback);
    }
  }

  public emit<K extends EventType>(type: K, payload: EventPayloadMap[K]): LoggedEvent<K> {
    const log: LoggedEvent<K> = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      timestamp: new Date(),
      payload
    };

    this.history.unshift(log);
    if (this.history.length > this.maxHistoryLength) {
      this.history.pop();
    }

    const set = this.listeners.get(type);
    if (set) {
      set.forEach(cb => {
        try {
          cb(payload, log);
        } catch (err) {
          console.error(`Error in event listener for ${type}:`, err);
        }
      });
    }

    this.globalListeners.forEach(cb => {
      try {
        cb(log);
      } catch (err) {
        console.error('Error in global event listener:', err);
      }
    });

    return log;
  }

  public getHistory(): LoggedEvent[] {
    return [...this.history];
  }

  public clearHistory(): void {
    this.history = [];
    this.globalListeners.forEach(cb => {
      try {
        cb({
          id: `clear-${Date.now()}`,
          type: 'WorldChanged',
          timestamp: new Date(),
          payload: { worldId: 'cleared', worldName: 'Cleared' }
        });
      } catch (e) {}
    });
  }
}

export const eventBus = new EventBus();

export function useEventListener<K extends EventType>(type: K, callback: EventCallback<K>): void {
  useEffect(() => {
    const unsubscribe = eventBus.on(type, callback);
    return () => unsubscribe();
  }, [type, callback]);
}

export function useEventHistory(): LoggedEvent[] {
  const [history, setHistory] = useState<LoggedEvent[]>(() => eventBus.getHistory());

  useEffect(() => {
    const unsubscribe = eventBus.subscribeAll(() => {
      setHistory(eventBus.getHistory());
    });
    return () => unsubscribe();
  }, []);

  return history;
}
