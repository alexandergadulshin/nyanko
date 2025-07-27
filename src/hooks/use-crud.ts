import { useState, useCallback, useMemo } from "react";

export interface CrudItem {
  id: string | number;
  [key: string]: unknown;
}

export interface CrudOptions<T extends CrudItem> {
  endpoint: string;
  initialData?: T[];
  onSuccess?: (action: 'create' | 'update' | 'delete', item: T) => void;
  onError?: (action: 'create' | 'update' | 'delete', error: string) => void;
  optimisticUpdates?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface CrudState<T extends CrudItem> {
  items: T[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  updating: Set<string | number>;
  deleting: Set<string | number>;
}

export interface CrudActions<T extends CrudItem> {
  fetch: (params?: Record<string, unknown>) => Promise<void>;
  create: (data: Omit<T, 'id'>) => Promise<T | null>;
  update: (id: string | number, data: Partial<T>) => Promise<T | null>;
  delete: (id: string | number) => Promise<boolean>;
  refresh: () => Promise<void>;
  clear: () => void;
  setItems: (items: T[]) => void;
  addItem: (item: T) => void;
  updateItem: (id: string | number, updates: Partial<T>) => void;
  removeItem: (id: string | number) => void;
}

export interface UseCrudReturn<T extends CrudItem> extends CrudState<T> {
  actions: CrudActions<T>;
  isItemLoading: (id: string | number) => boolean;
  getItem: (id: string | number) => T | undefined;
  sortedItems: (sortFn?: (a: T, b: T) => number) => T[];
  filteredItems: (filterFn: (item: T) => boolean) => T[];
}

export function useCrud<T extends CrudItem>({
  endpoint,
  initialData = [],
  onSuccess,
  onError,
  optimisticUpdates = true,
  retryAttempts = 3,
  retryDelay = 1000
}: CrudOptions<T>): UseCrudReturn<T> {
  
  const [state, setState] = useState<CrudState<T>>({
    items: initialData,
    loading: false,
    error: null,
    creating: false,
    updating: new Set(),
    deleting: new Set()
  });

  // Helper function to handle API requests with retry logic
  const makeRequest = useCallback(async (
    url: string,
    options: RequestInit,
    attempts = 0
  ): Promise<Response> => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response;
    } catch (error) {
      if (attempts < retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempts + 1)));
        return makeRequest(url, options, attempts + 1);
      }
      throw error;
    }
  }, [retryAttempts, retryDelay]);

  // Fetch items
  const fetch = useCallback(async (params?: Record<string, any>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const url = new URL(endpoint, window.location.origin);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }

      const response = await makeRequest(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      const items = Array.isArray(data) ? data : data.items || data.data || [];

      setState(prev => ({
        ...prev,
        items,
        loading: false,
        error: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch items';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      onError?.('create', errorMessage);
    }
  }, [endpoint, makeRequest, onError]);

  // Create item
  const create = useCallback(async (data: Omit<T, 'id'>): Promise<T | null> => {
    setState(prev => ({ ...prev, creating: true, error: null }));

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticItem = { ...data, id: tempId } as T;
    
    if (optimisticUpdates) {
      setState(prev => ({
        ...prev,
        items: [...prev.items, optimisticItem]
      }));
    }

    try {
      const response = await makeRequest(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      const newItem = result.data || result.item || result;

      setState(prev => ({
        ...prev,
        items: optimisticUpdates
          ? prev.items.map(item => item.id === tempId ? newItem : item)
          : [...prev.items, newItem],
        creating: false,
        error: null
      }));

      onSuccess?.('create', newItem);
      return newItem;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create item';
      
      // Revert optimistic update
      if (optimisticUpdates) {
        setState(prev => ({
          ...prev,
          items: prev.items.filter(item => item.id !== tempId)
        }));
      }

      setState(prev => ({ ...prev, creating: false, error: errorMessage }));
      onError?.('create', errorMessage);
      return null;
    }
  }, [endpoint, makeRequest, optimisticUpdates, onSuccess, onError]);

  // Update item
  const update = useCallback(async (id: string | number, data: Partial<T>): Promise<T | null> => {
    setState(prev => ({
      ...prev,
      updating: new Set([...prev.updating, id]),
      error: null
    }));

    // Optimistic update
    const originalItem = state.items.find(item => item.id === id);
    const optimisticItem = originalItem ? { ...originalItem, ...data } : null;

    if (optimisticUpdates && optimisticItem) {
      setState(prev => ({
        ...prev,
        items: prev.items.map(item => item.id === id ? optimisticItem : item)
      }));
    }

    try {
      const response = await makeRequest(`${endpoint}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      const updatedItem = result.data || result.item || result;

      setState(prev => ({
        ...prev,
        items: prev.items.map(item => item.id === id ? updatedItem : item),
        updating: new Set([...prev.updating].filter(updateId => updateId !== id)),
        error: null
      }));

      onSuccess?.('update', updatedItem);
      return updatedItem;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update item';
      
      // Revert optimistic update
      if (optimisticUpdates && originalItem) {
        setState(prev => ({
          ...prev,
          items: prev.items.map(item => item.id === id ? originalItem : item)
        }));
      }

      setState(prev => ({
        ...prev,
        updating: new Set([...prev.updating].filter(updateId => updateId !== id)),
        error: errorMessage
      }));
      
      onError?.('update', errorMessage);
      return null;
    }
  }, [endpoint, makeRequest, state.items, optimisticUpdates, onSuccess, onError]);

  // Delete item
  const deleteItem = useCallback(async (id: string | number): Promise<boolean> => {
    setState(prev => ({
      ...prev,
      deleting: new Set([...prev.deleting, id]),
      error: null
    }));

    // Optimistic update
    const originalItems = state.items;
    if (optimisticUpdates) {
      setState(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id)
      }));
    }

    try {
      await makeRequest(`${endpoint}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      setState(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id),
        deleting: new Set([...prev.deleting].filter(deleteId => deleteId !== id)),
        error: null
      }));

      const deletedItem = originalItems.find(item => item.id === id);
      if (deletedItem) {
        onSuccess?.('delete', deletedItem);
      }
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete item';
      
      // Revert optimistic update
      if (optimisticUpdates) {
        setState(prev => ({ ...prev, items: originalItems }));
      }

      setState(prev => ({
        ...prev,
        deleting: new Set([...prev.deleting].filter(deleteId => deleteId !== id)),
        error: errorMessage
      }));
      
      onError?.('delete', errorMessage);
      return false;
    }
  }, [endpoint, makeRequest, state.items, optimisticUpdates, onSuccess, onError]);

  // Local state management actions
  const clear = useCallback(() => {
    setState(prev => ({ ...prev, items: [], error: null }));
  }, []);

  const setItems = useCallback((items: T[]) => {
    setState(prev => ({ ...prev, items }));
  }, []);

  const addItem = useCallback((item: T) => {
    setState(prev => ({ ...prev, items: [...prev.items, item] }));
  }, []);

  const updateItem = useCallback((id: string | number, updates: Partial<T>) => {
    setState(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    }));
  }, []);

  const removeItem = useCallback((id: string | number) => {
    setState(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  }, []);

  const refresh = useCallback(() => fetch(), [fetch]);

  // Helper functions
  const isItemLoading = useCallback((id: string | number) => {
    return state.updating.has(id) || state.deleting.has(id);
  }, [state.updating, state.deleting]);

  const getItem = useCallback((id: string | number) => {
    return state.items.find(item => item.id === id);
  }, [state.items]);

  const sortedItems = useCallback((sortFn?: (a: T, b: T) => number) => {
    if (!sortFn) return state.items;
    return [...state.items].sort(sortFn);
  }, [state.items]);

  const filteredItems = useCallback((filterFn: (item: T) => boolean) => {
    return state.items.filter(filterFn);
  }, [state.items]);

  const actions = useMemo(() => ({
    fetch,
    create,
    update,
    delete: deleteItem,
    refresh,
    clear,
    setItems,
    addItem,
    updateItem,
    removeItem
  }), [fetch, create, update, deleteItem, refresh, clear, setItems, addItem, updateItem, removeItem]);

  return {
    ...state,
    actions,
    isItemLoading,
    getItem,
    sortedItems,
    filteredItems
  };
}

// Specialized hooks for common use cases
export interface AnimeListItem extends CrudItem {
  animeId: number;
  animeTitle: string;
  animeImage?: string;
  status: "planning" | "watching" | "completed" | "dropped" | "paused";
  score?: number;
  episodesWatched: number;
  totalEpisodes?: number;
  notes?: string;
}

export function useAnimeList(userId?: string) {
  return useCrud<AnimeListItem>({
    endpoint: '/api/anime-list',
    optimisticUpdates: true,
    onSuccess: (action, item) => {
      console.log(`Anime list ${action}:`, item);
    },
    onError: (action, error) => {
      console.error(`Anime list ${action} error:`, error);
    }
  });
}

export interface FavoriteItem extends CrudItem {
  type: string;
  itemId: number;
  itemTitle: string;
  itemImage?: string;
  itemData?: any;
}

export function useFavorites() {
  return useCrud<FavoriteItem>({
    endpoint: '/api/favorites',
    optimisticUpdates: true,
    onSuccess: (action, item) => {
      console.log(`Favorites ${action}:`, item);
    },
    onError: (action, error) => {
      console.error(`Favorites ${action} error:`, error);
    }
  });
}

// Bulk operations helper
export interface BulkOperationOptions<T extends CrudItem> {
  items: T[];
  operation: 'create' | 'update' | 'delete';
  batchSize?: number;
  onProgress?: (completed: number, total: number) => void;
  onBatchComplete?: (batch: T[], batchIndex: number) => void;
}

export async function executeBulkOperation<T extends CrudItem>(
  crud: UseCrudReturn<T>,
  options: BulkOperationOptions<T>
): Promise<{ successful: T[]; failed: { item: T; error: string }[] }> {
  const { items, operation, batchSize = 10, onProgress, onBatchComplete } = options;
  const successful: T[] = [];
  const failed: { item: T; error: string }[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchPromises = batch.map(async (item) => {
      try {
        let result = null;
        switch (operation) {
          case 'create':
            result = await crud.actions.create(item);
            break;
          case 'update':
            result = await crud.actions.update(item.id, item);
            break;
          case 'delete':
            const success = await crud.actions.delete(item.id);
            result = success ? item : null;
            break;
        }
        
        if (result) {
          successful.push(result);
        } else {
          failed.push({ item, error: `${operation} operation failed` });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        failed.push({ item, error: errorMessage });
      }
    });

    await Promise.all(batchPromises);
    
    const completed = Math.min(i + batchSize, items.length);
    onProgress?.(completed, items.length);
    onBatchComplete?.(batch, Math.floor(i / batchSize));
  }

  return { successful, failed };
}