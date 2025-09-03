import toast from 'react-hot-toast';

interface Floor {
  _id: string;
  name: string;
  description?: string;
  created_by: string;
  createdAt?: string;
  updatedAt?: string;
  __v: number;
}

export interface Table {
  _id: string;
  number: string;
  capacity?: number;
  status?: 'occupied' | 'available' | 'reserved';
  floor_id: { _id: string; name: string; description?: string };
  created_by: string;
  createdAt?: string;
  updatedAt?: string;
  __v: number;
}

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  success: boolean;
  type: number;
  data: { data: T } | T;
  error?: string | null;
  details?: any;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.18.37:3000';

const handleApiError = async (response: Response, logout: () => void): Promise<string> => {
  if (response.status === 401) {
    logout();
    window.location.href = '/pos-system/login';
    return 'Unauthorized';
  }

  try {
    const errorData: ApiResponse<any> = await response.json();
    return errorData.message || `HTTP error! status: ${response.status}`;
  } catch (jsonError) {
    return `HTTP error! status: ${response.status}`;
  }
};

export const fetchFloors = async (token: string, logout: () => void): Promise<Floor[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/floortable/api/v1/floors/list`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorMessage = await handleApiError(response, logout);
      throw new Error(errorMessage);
    }

    const data: ApiResponse<Floor[]> = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch floors');
    }

    if (data.type !== 1 || !data.data) {
      throw new Error('Invalid response format');
    }

    return 'data' in data.data ? data.data.data : data.data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch floors';
    throw new Error(message);
  }
};

export const fetchTables = async (token: string, logout: () => void, floorId?: string): Promise<Table[]> => {
  try {
    const url = floorId
      ? `${API_BASE_URL}/floortable/api/v1/tables/list?floor_id=${floorId}`
      : `${API_BASE_URL}/floortable/api/v1/tables/list`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorMessage = await handleApiError(response, logout);
      throw new Error(errorMessage);
    }

    const data: ApiResponse<Table[]> = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch tables');
    }

    if (data.type !== 1 || !data.data) {
      throw new Error('Invalid response format');
    }

    return 'data' in data.data ? data.data.data : data.data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch tables';
    throw new Error(message);
  }
};

export const fetchFreeTables = async (token: string, logout: () => void): Promise<Table[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/floortable/api/v1/tables/free`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorMessage = await handleApiError(response, logout);
      throw new Error(errorMessage);
    }

    const data: ApiResponse<Table[]> = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch free tables');
    }

    if (data.type !== 1 || !data.data) {
      throw new Error('Invalid response format');
    }

    return 'data' in data.data ? data.data.data : data.data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch free tables';
    throw new Error(message);
  }
};

export const createFloor = async (token: string, logout: () => void, floorData: { name: string; description?: string }): Promise<Floor> => {
  try {
    const response = await fetch(`${API_BASE_URL}/floortable/api/v1/floors/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(floorData),
    });

    if (!response.ok) {
      const errorMessage = await handleApiError(response, logout);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.success || data.type !== 1 || !data.data?.data) {
      throw new Error(data.message || 'Invalid response format');
    }

    return data.data.data as Floor;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create floor';
    throw new Error(message);
  }
};

export const updateFloor = async (token: string, logout: () => void, floorData: { floor_id: string; name: string; description?: string }): Promise<Floor> => {
  try {
    const response = await fetch(`${API_BASE_URL}/floortable/api/v1/floors/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(floorData),
    });

    if (!response.ok) {
      const errorMessage = await handleApiError(response, logout);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.success || data.type !== 1 || !data.data?.data) {
      throw new Error(data.message || 'Invalid response format');
    }

    return data.data.data as Floor;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update floor';
    throw new Error(message);
  }
};

export const deleteFloor = async (token: string, logout: () => void, floorId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/floortable/api/v1/floors/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ floor_id: floorId }),
    });

    if (!response.ok) {
      const errorMessage = await handleApiError(response, logout);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.success || data.type !== 1) {
      throw new Error(data.message || 'Failed to delete floor');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete floor';
    throw new Error(message);
  }
};

export const createTable = async (token: string, logout: () => void, tableData: { number: number; floor_id: string; capacity?: number }): Promise<Table> => {
  try {
    const response = await fetch(`${API_BASE_URL}/floortable/api/v1/tables/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(tableData),
    });

    if (!response.ok) {
      const errorMessage = await handleApiError(response, logout);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.success || data.type !== 1 || !data.data?.data) {
      throw new Error(data.message || 'Invalid response format');
    }

    return data.data.data as Table;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create table';
    throw new Error(message);
  }
};

export const updateTable = async (token: string, logout: () => void, tableData: { table_id: string; number: number; floor_id: string; capacity?: number }): Promise<Table> => {
  try {
    const response = await fetch(`${API_BASE_URL}/floortable/api/v1/tables/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(tableData),
    });

    if (!response.ok) {
      const errorMessage = await handleApiError(response, logout);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.success || data.type !== 1 || !data.data?.data) {
      throw new Error(data.message || 'Invalid response format');
    }

    return data.data.data as Table;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update table';
    throw new Error(message);
  }
};

export const deleteTable = async (token: string, logout: () => void, tableId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/floortable/api/v1/tables/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ table_id: tableId }),
    });

    if (!response.ok) {
      const errorMessage = await handleApiError(response, logout);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.success || data.type !== 1) {
      throw new Error(data.message || 'Failed to delete table');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete table';
    throw new Error(message);
  }
};
