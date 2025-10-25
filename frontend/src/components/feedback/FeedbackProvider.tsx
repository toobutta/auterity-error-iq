import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { cn } from '../../design-system/utils/cn';
import { LoadingSpinner } from '../../design-system/components/Feedback/LoadingSpinner';
import { Toast } from '../../design-system/components/Feedback/Toast';

// Feedback types
export type FeedbackType = 'success' | 'error' | 'warning' | 'info';
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Feedback interfaces
export interface ToastMessage {
  id: string;
  type: FeedbackType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface LoadingItem {
  id: string;
  message?: string;
  progress?: number;
  cancellable?: boolean;
  onCancel?: () => void;
}

export interface ProgressItem {
  id: string;
  label: string;
  value: number;
  max: number;
  showPercentage?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
}

export interface FeedbackState {
  toasts: ToastMessage[];
  loading: LoadingItem[];
  progress: ProgressItem[];
  globalLoading: boolean;
  globalLoadingMessage?: string;
}

// Action types
type FeedbackAction =
  | { type: 'ADD_TOAST'; payload: Omit<ToastMessage, 'id'> }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'CLEAR_TOASTS' }
  | { type: 'ADD_LOADING'; payload: LoadingItem }
  | { type: 'UPDATE_LOADING'; payload: { id: string; updates: Partial<LoadingItem> } }
  | { type: 'REMOVE_LOADING'; payload: string }
  | { type: 'CLEAR_LOADING' }
  | { type: 'ADD_PROGRESS'; payload: ProgressItem }
  | { type: 'UPDATE_PROGRESS'; payload: { id: string; value: number } }
  | { type: 'REMOVE_PROGRESS'; payload: string }
  | { type: 'SET_GLOBAL_LOADING'; payload: { loading: boolean; message?: string } };

// Reducer
const feedbackReducer = (state: FeedbackState, action: FeedbackAction): FeedbackState => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [
          ...state.toasts,
          {
            ...action.payload,
            id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }
        ]
      };

    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.payload)
      };

    case 'CLEAR_TOASTS':
      return {
        ...state,
        toasts: []
      };

    case 'ADD_LOADING':
      return {
        ...state,
        loading: [...state.loading, action.payload]
      };

    case 'UPDATE_LOADING':
      return {
        ...state,
        loading: state.loading.map(item =>
          item.id === action.payload.id
            ? { ...item, ...action.payload.updates }
            : item
        )
      };

    case 'REMOVE_LOADING':
      return {
        ...state,
        loading: state.loading.filter(item => item.id !== action.payload)
      };

    case 'CLEAR_LOADING':
      return {
        ...state,
        loading: []
      };

    case 'ADD_PROGRESS':
      return {
        ...state,
        progress: [...state.progress, action.payload]
      };

    case 'UPDATE_PROGRESS':
      return {
        ...state,
        progress: state.progress.map(item =>
          item.id === action.payload.id
            ? { ...item, value: action.payload.value }
            : item
        )
      };

    case 'REMOVE_PROGRESS':
      return {
        ...state,
        progress: state.progress.filter(item => item.id !== action.payload)
      };

    case 'SET_GLOBAL_LOADING':
      return {
        ...state,
        globalLoading: action.payload.loading,
        globalLoadingMessage: action.payload.message
      };

    default:
      return state;
  }
};

// Context
const FeedbackContext = createContext<{
  state: FeedbackState;
  actions: {
    showToast: (toast: Omit<ToastMessage, 'id'>) => void;
    removeToast: (id: string) => void;
    clearToasts: () => void;
    startLoading: (item: LoadingItem) => void;
    updateLoading: (id: string, updates: Partial<LoadingItem>) => void;
    stopLoading: (id: string) => void;
    clearLoading: () => void;
    addProgress: (item: ProgressItem) => void;
    updateProgress: (id: string, value: number) => void;
    removeProgress: (id: string) => void;
    setGlobalLoading: (loading: boolean, message?: string) => void;
  };
} | null>(null);

// Provider component
export const FeedbackProvider: React.FC<{
  children: React.ReactNode;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  maxToasts?: number;
}> = ({
  children,
  position = 'top-right',
  maxToasts = 5
}) => {
  const [state, dispatch] = useReducer(feedbackReducer, {
    toasts: [],
    loading: [],
    progress: [],
    globalLoading: false
  });

  // Actions
  const actions = {
    showToast: useCallback((toast: Omit<ToastMessage, 'id'>) => {
      dispatch({ type: 'ADD_TOAST', payload: toast });
    }, []),

    removeToast: useCallback((id: string) => {
      dispatch({ type: 'REMOVE_TOAST', payload: id });
    }, []),

    clearToasts: useCallback(() => {
      dispatch({ type: 'CLEAR_TOASTS' });
    }, []),

    startLoading: useCallback((item: LoadingItem) => {
      dispatch({ type: 'ADD_LOADING', payload: item });
    }, []),

    updateLoading: useCallback((id: string, updates: Partial<LoadingItem>) => {
      dispatch({ type: 'UPDATE_LOADING', payload: { id, updates } });
    }, []),

    stopLoading: useCallback((id: string) => {
      dispatch({ type: 'REMOVE_LOADING', payload: id });
    }, []),

    clearLoading: useCallback(() => {
      dispatch({ type: 'CLEAR_LOADING' });
    }, []),

    addProgress: useCallback((item: ProgressItem) => {
      dispatch({ type: 'ADD_PROGRESS', payload: item });
    }, []),

    updateProgress: useCallback((id: string, value: number) => {
      dispatch({ type: 'UPDATE_PROGRESS', payload: { id, value } });
    }, []),

    removeProgress: useCallback((id: string) => {
      dispatch({ type: 'REMOVE_PROGRESS', payload: id });
    }, []),

    setGlobalLoading: useCallback((loading: boolean, message?: string) => {
      dispatch({ type: 'SET_GLOBAL_LOADING', payload: { loading, message } });
    }, [])
  };

  // Auto-remove toasts after duration
  useEffect(() => {
    state.toasts.forEach(toast => {
      if (toast.duration && toast.duration > 0) {
        const timer = setTimeout(() => {
          actions.removeToast(toast.id);
        }, toast.duration);

        return () => clearTimeout(timer);
      }
    });
  }, [state.toasts, actions]);

  // Limit number of toasts
  useEffect(() => {
    if (state.toasts.length > maxToasts) {
      const toastsToRemove = state.toasts.slice(0, state.toasts.length - maxToasts);
      toastsToRemove.forEach(toast => {
        actions.removeToast(toast.id);
      });
    }
  }, [state.toasts, maxToasts, actions]);

  return (
    <FeedbackContext.Provider value={{ state, actions }}>
      {children}

      {/* Global Loading Overlay */}
      {state.globalLoading && (
        <GlobalLoadingOverlay message={state.globalLoadingMessage} />
      )}

      {/* Toast Container */}
      <ToastContainer
        toasts={state.toasts}
        position={position}
        onRemove={actions.removeToast}
      />

      {/* Loading Container */}
      <LoadingContainer
        loading={state.loading}
        onCancel={actions.stopLoading}
      />

      {/* Progress Container */}
      <ProgressContainer progress={state.progress} />
    </FeedbackContext.Provider>
  );
};

// Global loading overlay component
const GlobalLoadingOverlay: React.FC<{ message?: string }> = ({ message }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm mx-4">
      <div className="flex items-center space-x-4">
        <LoadingSpinner size="lg" variant="primary" />
        <div>
          <h3 className="text-lg font-medium text-gray-900">Loading...</h3>
          {message && (
            <p className="text-sm text-gray-600 mt-1">{message}</p>
          )}
        </div>
      </div>
    </div>
  </div>
);

// Toast container component
const ToastContainer: React.FC<{
  toasts: ToastMessage[];
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  onRemove: (id: string) => void;
}> = ({ toasts, position, onRemove }) => {
  if (toasts.length === 0) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4'
  };

  return (
    <div
      className={cn(
        'fixed z-40 flex flex-col space-y-2 max-w-sm',
        positionClasses[position]
      )}
    >
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          description={toast.description}
          duration={toast.duration}
          action={toast.action}
          onClose={onRemove}
        />
      ))}
    </div>
  );
};

// Loading container component
const LoadingContainer: React.FC<{
  loading: LoadingItem[];
  onCancel: (id: string) => void;
}> = ({ loading, onCancel }) => {
  if (loading.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 space-y-2">
      {loading.map(item => (
        <div
          key={item.id}
          className="bg-white rounded-lg p-4 shadow-lg border border-gray-200 min-w-[250px]"
        >
          <div className="flex items-center space-x-3">
            <LoadingSpinner size="sm" variant="primary" />
            <div className="flex-1">
              {item.message && (
                <p className="text-sm font-medium text-gray-900">{item.message}</p>
              )}
              {item.progress !== undefined && (
                <div className="mt-2">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{item.progress}%</p>
                </div>
              )}
            </div>
            {item.cancellable && (
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                onClick={() => item.onCancel?.()}
                aria-label="Cancel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Progress container component
const ProgressContainer: React.FC<{
  progress: ProgressItem[];
}> = ({ progress }) => {
  if (progress.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 space-y-2">
      {progress.map(item => {
        const percentage = Math.round((item.value / item.max) * 100);
        const colorClasses = {
          primary: 'bg-blue-600',
          success: 'bg-green-600',
          warning: 'bg-yellow-600',
          error: 'bg-red-600'
        };

        return (
          <div
            key={item.id}
            className="bg-white rounded-lg p-4 shadow-lg border border-gray-200 min-w-[300px]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">{item.label}</span>
              {item.showPercentage && (
                <span className="text-sm text-gray-600">{percentage}%</span>
              )}
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className={cn('h-2 rounded-full transition-all duration-300', colorClasses[item.color || 'primary'])}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Hook for using feedback context
export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

// Helper hook for common feedback patterns
export const useFeedbackHelpers = () => {
  const { actions } = useFeedback();

  return {
    // Toast helpers
    success: (title: string, description?: string) =>
      actions.showToast({ type: 'success', title, description }),

    error: (title: string, description?: string) =>
      actions.showToast({ type: 'error', title, description }),

    warning: (title: string, description?: string) =>
      actions.showToast({ type: 'warning', title, description }),

    info: (title: string, description?: string) =>
      actions.showToast({ type: 'info', title, description }),

    // Loading helpers
    startLoading: (id: string, message?: string, cancellable = false) =>
      actions.startLoading({ id, message, cancellable }),

    updateLoading: (id: string, message?: string, progress?: number) =>
      actions.updateLoading(id, { message, progress }),

    stopLoading: (id: string) =>
      actions.stopLoading(id),

    // Progress helpers
    startProgress: (id: string, label: string, max: number, color?: 'primary' | 'success' | 'warning' | 'error') =>
      actions.addProgress({ id, label, value: 0, max, color }),

    updateProgress: (id: string, value: number) =>
      actions.updateProgress(id, value),

    completeProgress: (id: string) =>
      actions.removeProgress(id),

    // Global loading
    showGlobalLoading: (message?: string) =>
      actions.setGlobalLoading(true, message),

    hideGlobalLoading: () =>
      actions.setGlobalLoading(false)
  };
};
