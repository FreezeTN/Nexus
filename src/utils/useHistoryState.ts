import { useState, useCallback, useEffect } from 'react';

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useHistoryState<T>(initialPresent: T, maxHistoryLength = 30) {
  const [state, setState] = useState<HistoryState<T>>({
    past: [],
    present: initialPresent,
    future: []
  });

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const undo = useCallback(() => {
    setState((currentState) => {
      if (currentState.past.length === 0) return currentState;

      const previous = currentState.past[currentState.past.length - 1];
      const newPast = currentState.past.slice(0, currentState.past.length - 1);

      return {
        past: newPast,
        present: previous,
        future: [currentState.present, ...currentState.future]
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((currentState) => {
      if (currentState.future.length === 0) return currentState;

      const next = currentState.future[0];
      const newFuture = currentState.future.slice(1);

      return {
        past: [...currentState.past, currentState.present],
        present: next,
        future: newFuture
      };
    });
  }, []);

  const setPresent = useCallback((newPresent: T | ((prev: T) => T)) => {
    setState((currentState) => {
      const resolvedPresent = typeof newPresent === 'function' 
        ? (newPresent as (prev: T) => T)(currentState.present)
        : newPresent;

      // Don't push duplicate identical states
      if (JSON.stringify(resolvedPresent) === JSON.stringify(currentState.present)) {
        return currentState;
      }

      const updatedPast = [...currentState.past, currentState.present];
      if (updatedPast.length > maxHistoryLength) {
        updatedPast.shift();
      }

      return {
        past: updatedPast,
        present: resolvedPresent,
        future: []
      };
    });
  }, [maxHistoryLength]);

  const resetPresent = useCallback((newPresent: T) => {
    setState({
      past: [],
      present: newPresent,
      future: []
    });
  }, []);

  // Keyboard shortcut listener for Ctrl+Z / Ctrl+Y / Cmd+Shift+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keybindings inside editable text inputs
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          if (canRedo) {
            e.preventDefault();
            redo();
          }
        } else {
          if (canUndo) {
            e.preventDefault();
            undo();
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        if (canRedo) {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  return {
    state: state.present,
    setPresent,
    resetPresent,
    undo,
    redo,
    canUndo,
    canRedo,
    historyDepth: state.past.length
  };
}
