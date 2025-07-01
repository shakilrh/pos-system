interface User {
  _id: string;
  name: string;
  email: string;
  password?: string;
  user_type: 'worker';
  role_id: string | null;
  phone_number?: string;
  job_title?: string;
  shift_time?: string;
  salary?: number;
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
  user_type: 'worker';
  role_id?: string;
  phone_number?: string;
  job_title?: string;
  shift_time?: string;
  salary?: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  phone_number?: string;
  job_title?: string;
  shift_time?: string;
  salary?: string;
}

export type { User, Role, UsersTemplateProps, FormData, FormErrors };
