import React, { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser, getRoles, createRole, updateRole, deleteRole, assignRole, getPermissions, assignPermissions } from '../utils/api';
import Sidebar from './Sidebar';

const RoleManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [pages] = useState(['dashboard', 'inventory', 'listOrders', 'checkout', 'settings', 'subscription', 'roleManagement']);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes, permsRes] = await Promise.all([
        getUsers(),
        getRoles(),
        getPermissions()
      ]);
      setUsers(usersRes.data.users);
      setRoles(rolesRes.data.roles);
      setPermissions(permsRes.data.permissions);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch data!');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    const form = e.target;
    const username = form.username.value;
    const password = form.password.value;
    try {
      await createUser({ username, password, isAdmin: false });
      setMessage('User added successfully!');
      fetchData();
      form.reset();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add user!');
    }
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();
    const form = e.target;
    const userId = form.userId.value;
    const roleId = form.roleId.value;
    try {
      await assignRole({ userId, roleId });
      setMessage('Role assigned successfully!');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign role!');
    }
  };

  const handleAddRole = async (e) => {
    e.preventDefault();
    const form = e.target;
    const roleName = form.roleName.value;
    try {
      await createRole({ roleName });
      setMessage('Role added successfully!');
      fetchData();
      form.reset();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add role!');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    const form = e.target;
    const userId = parseInt(form.userId.value, 10);
    const username = form.username.value;
    const password = form.password.value;
    const roles = Array.from(form.querySelectorAll('input[name="roles"]:checked'))
      .map(cb => parseInt(cb.value, 10)) // Parse role IDs to integers
      .filter(roleId => !isNaN(roleId) && roleId > 0); // Ensure valid role IDs

    try {
      if (isNaN(userId)) throw new Error('Invalid user ID!');
      await updateUser(userId, { username, password, roles });
      setMessage('User updated successfully!');
      fetchData();
      document.querySelector('#editUserModal .btn-close').click();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user!');
    }
  };

  const handleEditRole = async (e) => {
    e.preventDefault();
    const form = e.target;
    const id = form.id.value;
    const roleName = form.roleName.value;
    try {
      await updateRole(id, { roleName });
      setMessage('Role updated successfully!');
      fetchData();
      document.querySelector('#editRoleModal .btn-close').click();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update role!');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId);
      setMessage('User deleted successfully!');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user!');
    }
  };

  const handleDeleteRole = async (roleId) => {
    try {
      await deleteRole(roleId);
      setMessage('Role deleted successfully!');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete role!');
    }
  };

  const handleAssignPermission = async (e) => {
    e.preventDefault();
    const form = e.target;
    const roleId = form.roleId.value;
    const pagesData = pages.map(page => ({
      pageName: page,
      canView: form[`canView_${page}`].checked,
      canEdit: form[`canEdit_${page}`].checked,
      canDelete: form[`canDelete_${page}`].checked,
    }));
    try {
      await assignPermissions({ roleId, pages: pagesData });
      setMessage('Permissions assigned successfully!');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign permissions!');
    }
  };

  useEffect(() => {
    const handleEditUserClick = (e) => {
      const btn = e.target.closest('.edit-user-btn');
      if (btn) {
        const id = btn.dataset.id;
        const username = btn.dataset.username;
        const roleIds = btn.dataset.roles ? btn.dataset.roles.split(',') : [];

        document.getElementById('editUserId').value = id;
        document.getElementById('editUsername').value = username;
        document.getElementById('editPassword').value = '';
        document.querySelectorAll('.role-checkbox').forEach(cb => {
          cb.checked = roleIds.includes(cb.value);
        });
      }
    };

    const handleDeleteUserClick = (e) => {
      const btn = e.target.closest('.delete-user-btn');
      if (btn) {
        document.getElementById('deleteUserId').value = btn.dataset.id;
      }
    };

    const handleEditRoleClick = (e) => {
      const btn = e.target.closest('.edit-role-btn');
      if (btn) {
        document.getElementById('editRoleId').value = btn.dataset.roleId;
        document.getElementById('editRoleName').value = btn.dataset.roleName;
      }
    };

    const handleDeleteRoleClick = (e) => {
      const btn = e.target.closest('.delete-role-btn');
      if (btn) {
        document.getElementById('deleteRoleId').value = btn.dataset.roleId;
      }
    };

    document.addEventListener('click', handleEditUserClick);
    document.addEventListener('click', handleDeleteUserClick);
    document.addEventListener('click', handleEditRoleClick);
    document.addEventListener('click', handleDeleteRoleClick);

    return () => {
      document.removeEventListener('click', handleEditUserClick);
      document.removeEventListener('click', handleDeleteUserClick);
      document.removeEventListener('click', handleEditRoleClick);
      document.removeEventListener('click', handleDeleteRoleClick);
    };
  }, []);

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <div className="role-management-container">
          <div className="header">
            <h1><i className="fas fa-users-cog fa-2x me-3 text-gradient"></i> Role Management</h1>
          </div>
          {message && <div className="alert alert-success alert-dismissible fade show" role="alert">{message}<button type="button" className="btn-close" onClick={() => setMessage('')} aria-label="Close"></button></div>}
          {error && <div className="alert alert-danger alert-dismissible fade show" role="alert">{error}<button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close"></button></div>}

          <ul className="nav nav-tabs" id="roleTabs">
            <li className="nav-item">
              <a className="nav-link active" data-bs-toggle="tab" href="#users">Users</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" data-bs-toggle="tab" href="#roles">Roles</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" data-bs-toggle="tab" href="#permissions">Permissions</a>
            </li>
          </ul>

          <div className="tab-content">
            <div className="tab-pane fade show active" id="users">
              <h4>Add User</h4>
              <form id="addUserForm" onSubmit={handleAddUser} className="mb-4">
                <div className="row align-items-end">
                  <div className="col-md-4 mb-3">
                    <input type="text" name="username" className="form-control" placeholder="Username" required />
                  </div>
                  <div className="col-md-4 mb-3">
                    <input type="password" name="password" className="form-control" placeholder="Password" required />
                  </div>
                  <div className="col-md-2 mb-3">
                    <button type="submit" className="btn btn-success">Add User</button>
                  </div>
                </div>
              </form>

              <h4>Assign Role to User</h4>
              <form onSubmit={handleAssignRole}>
                <div className="row align-items-end">
                  <div className="col-md-5 mb-3">
                    <select name="userId" className="form-select" required>
                      <option value="">Select User</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.username}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-5 mb-3">
                    <select name="roleId" className="form-select" required>
                      <option value="">Select Role</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.roleName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2 mb-3">
                    <button type="submit" className="btn btn-primary">Assign</button>
                  </div>
                </div>
              </form>

              <h4 className="mt-4">User List</h4>
              <table className="table table-bordered">
                <thead>
                <tr>
                  <th>Username</th>
                  <th>Role(s)</th>
                  <th>Edit</th>
                  <th>Delete</th>
                </tr>
                </thead>
                <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>
                      {user.assignRole?.map(role => (
                        <span key={role.id} className="badge bg-secondary me-1">{role.roleName}</span>
                      ))}
                    </td>
                    <td>
                      {!user.assignRole?.some(r => r.roleName === 'ADMIN') && (
                        <button
                          className="btn btn-warning btn-sm edit-user-btn"
                          data-bs-toggle="modal"
                          data-bs-target="#editUserModal"
                          data-id={user.id}
                          data-username={user.username}
                          data-roles={user.assignRole?.map(r => r.id).join(',')}
                        >
                          ✏️ Edit
                        </button>
                      )}
                    </td>
                    <td>
                      {!user.assignRole?.some(r => r.roleName === 'ADMIN') && (
                        <button
                          className="btn btn-danger btn-sm delete-user-btn"
                          data-bs-toggle="modal"
                          data-bs-target="#deleteUserModal"
                          data-id={user.id}
                        >
                          ❌ Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>

            <div className="tab-pane fade" id="roles">
              <h4>Add Role</h4>
              <form id="addRoleForm" onSubmit={handleAddRole} className="mb-4">
                <div className="row align-items-end">
                  <div className="col-md-8 mb-3">
                    <input type="text" name="roleName" className="form-control" placeholder="Role Name" required />
                  </div>
                  <div className="col-md-4 mb-3">
                    <button type="submit" className="btn btn-success">Add Role</button>
                  </div>
                </div>
              </form>

              <h4>Existing Roles</h4>
              <table className="table table-bordered">
                <thead>
                <tr>
                  <th>Role Name</th>
                  <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {roles.map(role => (
                  <tr key={role.id}>
                    <td>{role.roleName}</td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm edit-role-btn"
                        data-bs-toggle="modal"
                        data-bs-target="#editRoleModal"
                        data-role-id={role.id}
                        data-role-name={role.roleName}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm delete-role-btn"
                        data-bs-toggle="modal"
                        data-bs-target="#deleteRoleModal"
                        data-role-id={role.id}
                      >
                        ❌ Delete
                      </button>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>

            <div className="tab-pane fade" id="permissions">
              <h4>Assign Permissions to Role</h4>
              <form onSubmit={handleAssignPermission}>
                <div className="row align-items-end">
                  <div className="col-md-6 mb-3">
                    <select
                      name="roleId"
                      id="roleDropdown"
                      className="form-select"
                      value={selectedRoleId}
                      onChange={(e) => setSelectedRoleId(e.target.value)}
                      required
                    >
                      <option value="">-- Select Role --</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.roleName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3 text-end">
                    <button type="submit" className="btn btn-primary">Save Permissions</button>
                  </div>
                </div>

                <table className="table table-bordered mt-3">
                  <thead>
                  <tr>
                    <th>Page</th>
                    <th>View</th>
                    <th>Edit</th>
                    <th>Delete</th>
                  </tr>
                  </thead>
                  <tbody>
                  {pages.map(page => (
                    <tr key={page}>
                      <td>
                        <input type="hidden" name="pages" value={page} /> {page}
                      </td>
                      <td><input type="checkbox" name={`canView_${page}`} className="form-check-input" /></td>
                      <td><input type="checkbox" name={`canEdit_${page}`} className="form-check-input" /></td>
                      <td><input type="checkbox" name={`canDelete_${page}`} className="form-check-input" /></td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </form>

              <div className="accordion mt-4" id="permissionsAccordion">
                {Object.entries(permissions.reduce((acc, perm) => {
                  acc[perm.assignRole.roleName] = [...(acc[perm.assignRole.roleName] || []), perm];
                  return acc;
                }, {})).map(([roleName, perms], index) => (
                  <div className="accordion-item" key={roleName}>
                    <h2 className="accordion-header" id={`heading${index}`}>
                      <button
                        className={`accordion-button ${index === 0 ? '' : 'collapsed'}`}
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target={`#collapse${index}`}
                        aria-expanded={index === 0 ? 'true' : 'false'}
                        aria-controls={`collapse${index}`}
                      >
                        {roleName}
                      </button>
                    </h2>
                    <div
                      id={`collapse${index}`}
                      className={`accordion-collapse collapse ${index === 0 ? 'show' : ''}`}
                      aria-labelledby={`heading${index}`}
                      data-bs-parent="#permissionsAccordion"
                    >
                      <div className="accordion-body">
                        <table className="table table-bordered">
                          <thead>
                          <tr>
                            <th>Page</th>
                            <th>View</th>
                            <th>Edit</th>
                            <th>Delete</th>
                          </tr>
                          </thead>
                          <tbody>
                          {perms.map(perm => (
                            <tr key={perm.id}>
                              <td>{perm.pageName}</td>
                              <td>{perm.canView ? '✅' : '❌'}</td>
                              <td>{perm.canEdit ? '✅' : '❌'}</td>
                              <td>{perm.canDelete ? '✅' : '❌'}</td>
                            </tr>
                          ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal fade" id="editUserModal" tabIndex="-1" aria-labelledby="editUserModalLabel" aria-hidden="true">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="editUserModalLabel">Edit User</h5>
                  <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div className="modal-body">
                  <form id="editUserForm" onSubmit={handleEditUser}>
                    <input type="hidden" id="editUserId" name="userId" />
                    <div className="mb-3">
                      <label htmlFor="editUsername" className="form-label">Username</label>
                      <input type="text" className="form-control" id="editUsername" name="username" required />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="editRole" className="form-label">Roles</label>
                      <div id="editRoles">
                        {roles.map(role => (
                          <div key={role.id} className="form-check">
                            <input
                              className="form-check-input role-checkbox"
                              type="checkbox"
                              name="roles"
                              value={role.id}
                              id={`role_${role.id}`}
                            />
                            <label className="form-check-label" htmlFor={`role_${role.id}`}>{role.roleName}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="editPassword" className="form-label">Password (Optional)</label>
                      <input type="password" className="form-control" id="editPassword" name="password" />
                      <div className="form-text">Leave blank to keep the current password</div>
                    </div>
                    <button type="submit" className="btn btn-primary">Save Changes</button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          <div className="modal fade" id="editRoleModal" tabIndex="-1" aria-labelledby="editRoleModalLabel" aria-hidden="true">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="editRoleModalLabel">Edit Role</h5>
                  <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div className="modal-body">
                  <form id="editRoleForm" onSubmit={handleEditRole}>
                    <input type="hidden" id="editRoleId" name="id" />
                    <div className="mb-3">
                      <label htmlFor="editRoleName" className="form-label">Role Name</label>
                      <input type="text" className="form-control" id="editRoleName" name="roleName" required />
                    </div>
                    <button type="submit" className="btn btn-primary">Save Changes</button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          <div className="modal fade" id="deleteUserModal" tabIndex="-1" aria-labelledby="deleteUserModalLabel" aria-hidden="true">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="deleteUserModalLabel">Confirm Delete User</h5>
                  <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div className="modal-body">
                  Are you sure you want to delete this user?
                </div>
                <div className="modal-footer">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    handleDeleteUser(document.getElementById('deleteUserId').value);
                    document.querySelector('#deleteUserModal .btn-close').click();
                  }}>
                    <input type="hidden" id="deleteUserId" />
                    <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" className="btn btn-danger">Delete</button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          <div className="modal fade" id="deleteRoleModal" tabIndex="-1" aria-labelledby="deleteRoleModalLabel" aria-hidden="true">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="deleteRoleModalLabel">Delete Role</h5>
                  <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    handleDeleteRole(document.getElementById('deleteRoleId').value);
                    document.querySelector('#deleteRoleModal .btn-close').click();
                  }}>
                    <input type="hidden" id="deleteRoleId" />
                    <p>Are you sure you want to delete this role?</p>
                    <div className="d-flex justify-content-end gap-2">
                      <button type="submit" className="btn btn-danger">Yes, Delete</button>
                      <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;
