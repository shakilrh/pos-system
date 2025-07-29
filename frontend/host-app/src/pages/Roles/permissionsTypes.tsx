interface Role {
  _id: string;
  name: string;
  permissions: { _id: string; key: string }[];
}

interface Permission {
  _id: string;
  key: string;
  description?: string;
}

interface PermissionsTemplateProps {
  token: string | null;
  logout: () => void;
}

interface PermissionListProps {
  permissions: Permission[];
  setEditPermission: (permission: Permission | null) => void;
  handleDeletePermission: (permissionId: string) => Promise<void>;
  isLoading: { fetch: boolean; delete: string };
  setDeleteConfirm: (id: string | null) => void;
}

interface PermissionCrudProps {
  token: string | null;
  logout: () => void;
  permissions: Permission[];
  setPermissions: React.Dispatch<React.SetStateAction<Permission[]>>;
  editPermission: Permission | null;
  setEditPermission: (permission: Permission | null) => void;
  showCreateForm: boolean;
  setShowCreateForm: React.Dispatch<React.SetStateAction<boolean>>;
  setMessage: (msg: string | null) => void;
  setIsSuccess: (success: boolean) => void;
  isLoading: { create: boolean; update: boolean };
  setIsLoading: React.Dispatch<React.SetStateAction<{ create: boolean; update: boolean; fetch: boolean; delete: string; roleUpdate: boolean }>>;
}

interface RolePermissionsProps {
  token: string | null;
  logout: () => void;
  roles: Role[];
  permissions: Permission[];
  selectedRole: string | null;
  setSelectedRole: (roleId: string | null) => void;
  rolePermissions: string[];
  setRolePermissions: React.Dispatch<React.SetStateAction<string[]>>;
  setMessage: (msg: string | null) => void;
  setIsSuccess: (success: boolean) => void;
  isLoading: { roleUpdate: boolean };
  setIsLoading: React.Dispatch<React.SetStateAction<{ create: boolean; update: boolean; fetch: boolean; delete: string; roleUpdate: boolean }>>;
}

interface FormData {
  key: string;
  description: string;
}

interface FormErrors {
  key?: string;
  description?: string;
}

export type {
  Role,
  Permission,
  PermissionsTemplateProps,
  PermissionListProps,
  PermissionCrudProps,
  RolePermissionsProps,
  FormData,
  FormErrors,
};
