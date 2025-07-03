interface User {
  _id: string;
  name: string;
  email: string;
  password?: string;
  user_type: string;
  role_id: string | null;
  phone_number?: string;
  job_title?: string;
  shift_time?: string;
  salary?: number;
  address?: string;
  created_by?: {
    id: string;
    name: string;
    email: string;
  };
  store_name?: string | null;
  logoUrl?: string | null;
  store_logo?: string | null;
}

interface Role {
  _id: string;
  name: string;
  permissions: { _id: string; key: string }[];
}

interface UsersTemplateProps {
  token: string | null;
  logout: () => void;
}

interface FormData {
  name: string;
  email: string;
  password?: string;
  user_type: string;
  role_id?: string | null;
  phone_number?: string;
  job_title?: string;
  shift_time?: string;
  salary?: number;
  address?: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  user_type?: string;
}

export type { User, Role, UsersTemplateProps, FormData, FormErrors };
