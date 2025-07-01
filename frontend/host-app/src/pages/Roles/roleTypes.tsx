interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions?: { _id: string; key: string }[];
}

interface RolesTemplateProps {
  token: string | null;
  logout: () => void;
}

interface RoleListProps {
  roles: Role[];
  setEditRole: (role: Role | null) => void;
  handleDeleteRole: (roleId: string) => Promise<void>;
  isLoading: { fetch: boolean; delete: string };
  setDeleteConfirm: (id: string | null) => void;
}

interface RoleCrudProps {
  token: string | null;
  logout: () => void;
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  editRole: Role | null;
  setEditRole: (role: Role | null) => void;
  showCreateForm: boolean;
  setShowCreateForm: React.Dispatch<React.SetStateAction<boolean>>;
  setMessage: (msg: string | null) => void;
  setIsSuccess: (success: boolean) => void;
  isLoading: { create: boolean; update: boolean };
  setIsLoading: React.Dispatch<React.SetStateAction<{ create: boolean; update: boolean; fetch: boolean; delete: string }>>;
}

interface FormData {
  name: string;
  description: string;
}

interface FormErrors {
  name?: string;
  description?: string;
}

export type { Role, RolesTemplateProps, RoleListProps, RoleCrudProps, FormData, FormErrors };
