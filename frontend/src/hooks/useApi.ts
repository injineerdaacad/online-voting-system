import { useState, useEffect, useCallback } from 'react';
import { HttpError } from '../utils/controllerHelpers';

export const useApi = <T = any>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<HttpError | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof HttpError ? err : new HttpError(500, 'An error occurred');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
};

export const usePaginatedApi = <T = any>(
  apiCall: (params: any) => Promise<{ data: T[]; pagination: any }>,
  initialParams: any = {}
) => {
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<HttpError | null>(null);
  const [params, setParams] = useState(initialParams);

  const fetchData = useCallback(async (newParams = params) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall(newParams);
      setData(result.data);
      setPagination(result.pagination);
      return result;
    } catch (err) {
      const error = err instanceof HttpError ? err : new HttpError(500, 'An error occurred');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiCall, params]);

  const updateParams = useCallback((newParams: any) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  const nextPage = useCallback(() => {
    if (pagination.page < pagination.pages) {
      updateParams({ page: pagination.page + 1 });
    }
  }, [pagination.page, pagination.pages, updateParams]);

  const prevPage = useCallback(() => {
    if (pagination.page > 1) {
      updateParams({ page: pagination.page - 1 });
    }
  }, [pagination.page, updateParams]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.pages) {
      updateParams({ page });
    }
  }, [pagination.pages, updateParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    pagination,
    loading,
    error,
    params,
    updateParams,
    nextPage,
    prevPage,
    goToPage,
    refetch: () => fetchData()
  };
};

export const useCrud = <T = any>(
  service: {
    getAll: (params?: any) => Promise<any>;
    getById: (id: string) => Promise<T>;
    create: (data: any) => Promise<T>;
    update: (id: string, data: any) => Promise<T>;
    delete: (id: string) => Promise<any>;
  }
) => {
  const [items, setItems] = useState<T[]>([]);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<HttpError | null>(null);

  const fetchAll = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await service.getAll(params);
      setItems(result.data || result);
      return result;
    } catch (err) {
      const error = err instanceof HttpError ? err : new HttpError(500, 'Failed to fetch items');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const fetchById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await service.getById(id);
      setSelectedItem(result);
      return result;
    } catch (err) {
      const error = err instanceof HttpError ? err : new HttpError(500, 'Failed to fetch item');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const createItem = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await service.create(data);
      setItems(prev => [...prev, result]);
      return result;
    } catch (err) {
      const error = err instanceof HttpError ? err : new HttpError(500, 'Failed to create item');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const updateItem = useCallback(async (id: string, data: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await service.update(id, data);
      setItems(prev => prev.map(item => 
        (item as any).id === id ? result : item
      ));
      if (selectedItem && (selectedItem as any).id === id) {
        setSelectedItem(result);
      }
      return result;
    } catch (err) {
      const error = err instanceof HttpError ? err : new HttpError(500, 'Failed to update item');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [service, selectedItem]);

  const deleteItem = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await service.delete(id);
      setItems(prev => prev.filter(item => (item as any).id !== id));
      if (selectedItem && (selectedItem as any).id === id) {
        setSelectedItem(null);
      }
    } catch (err) {
      const error = err instanceof HttpError ? err : new HttpError(500, 'Failed to delete item');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [service, selectedItem]);

  return {
    items,
    selectedItem,
    loading,
    error,
    fetchAll,
    fetchById,
    createItem,
    updateItem,
    deleteItem,
    setSelectedItem
  };
};

export const useFormSubmission = <T = any>(
  submitFn: (data: any) => Promise<T>,
  onSuccess?: (data: T) => void,
  onError?: (error: HttpError) => void
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<HttpError | null>(null);

  const submit = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await submitFn(data);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof HttpError ? err : new HttpError(500, 'Submission failed');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [submitFn, onSuccess, onError]);

  return { submit, loading, error };
};

export const useSearch = <T = any>(
  searchFn: (query: string, params?: any) => Promise<T[]>,
  debounceMs: number = 300
) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<HttpError | null>(null);

  const search = useCallback(async (searchQuery: string, params?: any) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await searchFn(searchQuery, params);
      setResults(result);
    } catch (err) {
      const error = err instanceof HttpError ? err : new HttpError(500, 'Search failed');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [searchFn]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(query);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, search, debounceMs]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    search: (q: string, params?: any) => {
      setQuery(q);
      return search(q, params);
    }
  };
};

export default {
  useApi,
  usePaginatedApi,
  useCrud,
  useFormSubmission,
  useSearch
};