export interface Floor {
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
  number: number;
  capacity?: number;
  status?: 'occupied' | 'available' | 'reserved';
  floor_id: {
    _id: string;
    name: string;
    description?: string;
  };
  created_by: string;
  createdAt?: string;
  updatedAt?: string;
  __v: number;
}
