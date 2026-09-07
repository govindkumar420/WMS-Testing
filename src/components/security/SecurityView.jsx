import React, { useContext, useState, useMemo } from 'react';
import { WmsDataContext } from '../../context/WmsDataContext';
import {
  Users,
  ShieldCheck,
  RotateCcw,
  Lock,
  X,
  Check,
  AlertTriangle,
  KeyRound,
  Pencil,
  Trash2,
  UserPlus,
  Eye,
  EyeOff,
  Search,
  Copy,
  CheckCheck,
  Shield,
  Sparkles,
  Info
} from 'lucide-react';

export default function SecurityView() {
  const {
    users = [],
    addUser,
    updateUser,
    deleteUser,
    changeUserPassword,
    updateUserPermissions,
    updateUserStatus,
    resetTransactionDB,
    resetAllDB,
    loggedInUser
  } = useContext(WmsDataContext);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'Active' | 'Inactive'
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Password visibility per row map: { [username]: boolean }
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [copiedUser, setCopiedUser] = useState(null);

  // Modal States
  const [userModalMode, setUserModalMode] = useState(null); // 'add' | 'edit' | null
  const [userFormData, setUserFormData] = useState({
    username: '',
    name: '',
    role: 'GRN Operator',
    status: 'Active',
    password: '',
    permissions: ['dashboard', 'inbound']
  });
  const [userFormError, setUserFormError] = useState('');
  const [userFormShowPassword, setUserFormShowPassword] = useState(false);

  // Dedicated Password Modal State
  const [passwordModalUser, setPasswordModalUser] = useState(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [passwordModalShow, setPasswordModalShow] = useState(false);
  const [passwordModalError, setPasswordModalError] = useState('');

  // Permissions Modal State
  const [selectedUserForPerms, setSelectedUserForPerms] = useState(null);
  const [userPerms, setUserPerms] = useState([]);

  // Delete User Confirmation Modal State
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  // System DB Reset confirmation state
  const [confirmResetType, setConfirmResetType] = useState(null); // 'trans' or 'all'

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const allAvailablePermissions = [
    { id: 'dashboard', label: 'Dashboard & Metrics' },
    { id: 'masters', label: 'Master Modules & Registry' },
    { id: 'inbound', label: 'Inbound / GRN / QC' },
    { id: 'inventory', label: 'Store & Inventory Management' },
    { id: 'outbound', label: 'Outbound / SO / Picking / Dispatch' },
    { id: 'coldchain', label: 'Cold Chain Control' },
    { id: 'reports', label: 'Reports & Analytics / MIS' },
    { id: 'security', label: 'Security & RBAC Controls' }
  ];

  const availableRoles = [
    'Admin',
    'Warehouse Manager',
    'Supervisor',
    'GRN Operator',
    'Quality Control',
    'Picker/Packer',
    'Dispatch',
    'Auditor'
  ];

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.role && u.role.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, searchQuery, statusFilter, roleFilter]);

  // Unique roles for filter dropdown
  const uniqueRoles = useMemo(() => {
    const rolesSet = new Set(users.map(u => u.role).filter(Boolean));
    return Array.from(rolesSet);
  }, [users]);

  // Password Generator Helper
  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Password Strength Calculator
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: 'Empty', color: 'bg-zinc-200 dark:bg-zinc-700' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pass)) score += 1;

    if (score <= 2) return { score, text: 'Weak', color: 'bg-rose-500', barWidth: 'w-1/3' };
    if (score <= 3) return { score, text: 'Medium', color: 'bg-amber-500', barWidth: 'w-2/3' };
    return { score, text: 'Strong', color: 'bg-emerald-500', barWidth: 'w-full' };
  };

  // Toggle revealed password for row
  const togglePasswordReveal = (username) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [username]: !prev[username]
    }));
  };

  // Copy password to clipboard
  const handleCopyPassword = (username, pass) => {
    if (!pass) return;
    navigator.clipboard.writeText(pass).then(() => {
      setCopiedUser(username);
      showToast(`Password copied for ${username}`);
      setTimeout(() => setCopiedUser(null), 2000);
    });
  };

  // 1. ADD / EDIT USER HANDLERS
  const handleOpenAddUser = () => {
    setUserFormError('');
    setUserFormShowPassword(false);
    setUserFormData({
      username: '',
      name: '',
      role: 'Supervisor',
      status: 'Active',
      password: generateStrongPassword(),
      permissions: ['dashboard', 'inbound', 'inventory']
    });
    setUserModalMode('add');
  };

  const handleOpenEditUser = (user) => {
    setUserFormError('');
    setUserFormShowPassword(false);
    setUserFormData({
      username: user.username,
      name: user.name || '',
      role: user.role || 'GRN Operator',
      status: user.status || 'Active',
      password: user.password || '',
      permissions: user.permissions || ['dashboard']
    });
    setUserModalMode('edit');
  };

  const handleSaveUserForm = (e) => {
    e.preventDefault();
    setUserFormError('');

    if (!userFormData.username.trim()) {
      setUserFormError('Username is required.');
      return;
    }
    if (!userFormData.name.trim()) {
      setUserFormError('Display Name is required.');
      return;
    }
    if (!userFormData.password || userFormData.password.length < 4) {
      setUserFormError('Password must be at least 4 characters.');
      return;
    }

    if (userModalMode === 'add') {
      const res = addUser({
        username: userFormData.username.trim().toLowerCase(),
        name: userFormData.name.trim(),
        role: userFormData.role,
        status: userFormData.status,
        password: userFormData.password,
        permissions: userFormData.permissions
      });

      if (res.success) {
        showToast(`User account "${userFormData.username}" created successfully!`);
        setUserModalMode(null);
      } else {
        setUserFormError(res.message || 'Failed to create user account.');
      }
    } else if (userModalMode === 'edit') {
      const res = updateUser(userFormData.username, {
        name: userFormData.name.trim(),
        role: userFormData.role,
        status: userFormData.status,
        password: userFormData.password,
        permissions: userFormData.permissions
      });

      if (res.success) {
        showToast(`User "${userFormData.username}" updated successfully!`);
        setUserModalMode(null);
      } else {
        setUserFormError(res.message || 'Failed to update user account.');
      }
    }
  };

  const handleToggleFormPermission = (permId) => {
    setUserFormData(prev => {
      const current = prev.permissions || [];
      const updated = current.includes(permId)
        ? current.filter(p => p !== permId)
        : [...current, permId];
      return { ...prev, permissions: updated };
    });
  };

  // 2. DEDICATED CHANGE PASSWORD HANDLERS
  const handleOpenChangePassword = (user) => {
    setPasswordModalUser(user);
    setNewPasswordVal(generateStrongPassword());
    setPasswordModalShow(true);
    setPasswordModalError('');
  };

  const handleSaveNewPassword = (e) => {
    e.preventDefault();
    if (!newPasswordVal || newPasswordVal.trim().length < 4) {
      setPasswordModalError('Password must be at least 4 characters long.');
      return;
    }

    const res = changeUserPassword(passwordModalUser.username, newPasswordVal.trim());
    if (res.success) {
      showToast(`Password changed for user ${passwordModalUser.username}!`);
      setPasswordModalShow(false);
      setPasswordModalUser(null);
    } else {
      setPasswordModalError(res.message || 'Failed to update password.');
    }
  };

  // 3. DELETE USER HANDLERS
  const handleOpenDeleteUser = (user) => {
    setDeleteError('');
    if (user.username === 'admin') {
      showToast('Primary Administrator account (admin) cannot be deleted.', 'error');
      return;
    }
    if (loggedInUser && loggedInUser.username === user.username) {
      showToast('You cannot delete your own logged in account.', 'error');
      return;
    }
    setUserToDelete(user);
  };

  const handleConfirmDeleteUser = () => {
    if (!userToDelete) return;
    const res = deleteUser(userToDelete.username);
    if (res.success) {
      showToast(`User account "${userToDelete.username}" deleted.`, 'success');
      setUserToDelete(null);
    } else {
      setDeleteError(res.message || 'Could not delete user account.');
    }
  };

  // 4. PERMISSIONS MODAL HANDLERS
  const handleEditPermissions = (user) => {
    setSelectedUserForPerms(user);
    setUserPerms(user.permissions || []);
  };

  const handleTogglePermission = (permId) => {
    if (userPerms.includes(permId)) {
      setUserPerms(userPerms.filter(p => p !== permId));
    } else {
      setUserPerms([...userPerms, permId]);
    }
  };

  const handleSavePermissions = () => {
    updateUserPermissions(selectedUserForPerms.username, userPerms);
    showToast(`Updated permissions for ${selectedUserForPerms.username}!`);
    setSelectedUserForPerms(null);
  };

  // 5. STATUS TOGGLE
  const handleToggleUserStatus = (username, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    updateUserStatus(username, nextStatus);
    showToast(`User ${username} is now ${nextStatus}.`);
  };

  // 6. DB RESETS
  const executeReset = () => {
    if (confirmResetType === 'trans') {
      resetTransactionDB();
      showToast('Transactional database successfully cleared to defaults.');
    } else if (confirmResetType === 'all') {
      resetAllDB();
      showToast('Database fully reset to default factory values.');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
    setConfirmResetType(null);
  };

  // Helper Role Badge styling
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40';
      case 'Warehouse Manager':
        return 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40';
      case 'Supervisor':
        return 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40';
      case 'Quality Control':
        return 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/40';
      case 'GRN Operator':
        return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40';
      case 'Picker/Packer':
        return 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40';
      case 'Dispatch':
        return 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/40';
      default:
        return 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700';
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6 animate-in fade-in-50 duration-200">
      
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold animate-in slide-in-from-bottom-5 duration-200 ${
          toastMessage.type === 'error'
            ? 'bg-rose-50 dark:bg-rose-950/90 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
            : 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
        }`}>
          {toastMessage.type === 'error' ? (
            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
          ) : (
            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            Security & User Access Control
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Manage user accounts, password credentials, role-based module permissions, and database maintenance.
          </p>
        </div>

        <button
          onClick={handleOpenAddUser}
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-sm hover:shadow transition-all active:scale-[0.98]"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Grid: Users management table (8 cols) and Database resets (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: User Accounts Management */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-150 dark:border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  User Accounts Management
                  <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    {filteredUsers.length} of {users.length}
                  </span>
                </h3>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-light">
                  Manage login credentials, password security, and active statuses
                </span>
              </div>
            </div>

            <button
              onClick={handleOpenAddUser}
              className="sm:hidden flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Add User</span>
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
            <div className="sm:col-span-6 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search username, display name, role..."
                className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="sm:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active only</option>
                <option value="Inactive">Inactive only</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <option value="ALL">All Roles</option>
                {uniqueRoles.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800/80">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-600 dark:text-zinc-400">
                  <th className="p-3">Username</th>
                  <th className="p-3">Display Name</th>
                  <th className="p-3">System Role</th>
                  <th className="p-3">Password</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-zinc-400 dark:text-zinc-500 text-xs">
                      No matching user accounts found. Try clearing your search filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(u => {
                    const isRevealed = revealedPasswords[u.username];
                    const isCurrentUser = loggedInUser?.username === u.username;
                    const isPrimaryAdmin = u.username === 'admin';

                    return (
                      <tr
                        key={u.username}
                        className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors group"
                      >
                        {/* Username */}
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase shrink-0 border border-zinc-200 dark:border-zinc-700">
                              {u.username.substring(0, 2)}
                            </div>
                            <div>
                              <span className="font-mono font-bold text-zinc-900 dark:text-white block">
                                {u.username}
                              </span>
                              {isCurrentUser && (
                                <span className="inline-block text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200/60 dark:border-emerald-800/40">
                                  You (Current)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Display Name */}
                        <td className="p-3 font-semibold text-zinc-850 dark:text-zinc-200">
                          {u.name || '—'}
                        </td>

                        {/* System Role */}
                        <td className="p-3">
                          <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-semibold border ${getRoleBadgeClass(u.role)}`}>
                            {u.role}
                          </span>
                        </td>

                        {/* Password Option Column */}
                        <td className="p-3 font-mono">
                          <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900/60 px-2 py-1 rounded-lg border border-zinc-200/70 dark:border-zinc-800 w-fit">
                            <span className="text-zinc-700 dark:text-zinc-300 text-xs">
                              {isRevealed ? (u.password || '—') : '••••••••'}
                            </span>
                            
                            {/* Toggle Reveal */}
                            <button
                              onClick={() => togglePasswordReveal(u.username)}
                              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                              title={isRevealed ? "Hide Password" : "Show Password"}
                            >
                              {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>

                            {/* Copy Password */}
                            <button
                              onClick={() => handleCopyPassword(u.username, u.password)}
                              className="p-1 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                              title="Copy Password"
                            >
                              {copiedUser === u.username ? (
                                <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleToggleUserStatus(u.username, u.status)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                              u.status === 'Active'
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                                : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/30'
                            }`}
                            title="Click to toggle status"
                          >
                            {u.status}
                          </button>
                        </td>

                        {/* Actions (Edit, Password, Permissions, Delete) */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            
                            {/* Change Password Action */}
                            <button
                              onClick={() => handleOpenChangePassword(u)}
                              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-200 dark:hover:border-amber-800/50 transition-colors"
                              title="Change / Reset Password"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                            </button>

                            {/* Edit User Action */}
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800/50 transition-colors"
                              title="Edit User Details"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>

                            {/* Edit Permissions Action */}
                            <button
                              onClick={() => handleEditPermissions(u)}
                              className="text-[10px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold px-2 py-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors inline-flex items-center gap-1"
                              title="Configure Module Permissions"
                            >
                              <Shield className="h-3 w-3 text-emerald-600" />
                              <span>Edit Permissions</span>
                            </button>

                            {/* Delete User Action */}
                            <button
                              onClick={() => handleOpenDeleteUser(u)}
                              disabled={isPrimaryAdmin || isCurrentUser}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                isPrimaryAdmin || isCurrentUser
                                  ? 'border-transparent text-zinc-300 dark:text-zinc-700 cursor-not-allowed opacity-40'
                                  : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-800/50'
                              }`}
                              title={
                                isPrimaryAdmin
                                  ? "Primary admin cannot be deleted"
                                  : isCurrentUser
                                  ? "Cannot delete current logged-in user"
                                  : "Delete user account"
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>

                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
            <span className="flex items-center gap-1">
              <Info className="h-3.5 w-3.5" />
              User credentials and role access persist in local system storage.
            </span>
            <span>Total registered users: <strong className="text-zinc-700 dark:text-zinc-300">{users.length}</strong></span>
          </div>
        </div>

        {/* Right: Database Reset Console */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-auto space-y-6">
          <div>
            <div className="flex items-center gap-2.5 border-b border-zinc-150 dark:border-zinc-800/80 pb-4 mb-4">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/30">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">System Database Resets</h3>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-light">Maintenance & data wipe operations</span>
              </div>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-light mb-6">
              Perform administrative operations to purge logs and reload the WMS mock transactional databases or reset master seed records.
            </p>

            <div className="space-y-4">
              {/* Reset 1 */}
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-2">
                <button
                  onClick={() => setConfirmResetType('trans')}
                  className="w-full flex items-center justify-center gap-1.5 border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-[#121216] hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-bold py-2 rounded-xl text-xs transition-all shadow-sm"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset Transactions Only</span>
                </button>
                <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal">
                  Resets stock levels, POs/SOs, vehicles, and logs. Masters (users, products, suppliers, customers) are kept intact.
                </span>
              </div>

              {/* Reset 2 */}
              <div className="p-3.5 rounded-xl border border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-950/10 space-y-2">
                <button
                  onClick={() => setConfirmResetType('all')}
                  className="w-full flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl text-xs transition-all shadow-sm active:scale-[0.98]"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Full Relational Hard Reset</span>
                </button>
                <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal">
                  Wipes and refreshes all master structures, user accounts, configurations, and inventory records back to factory setup.
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 space-y-1">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300 block">Security Best Practices:</span>
            <span>• Enforce distinct user accounts for warehouse operations</span>
            <span>• Rotate default passwords regularly</span>
            <span>• Assign minimum necessary module permissions</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 1. ADD / EDIT USER MODAL */}
      {/* ========================================================================= */}
      {userModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 relative shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setUserModalMode(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-zinc-150 dark:border-zinc-800 pb-3">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30">
                {userModalMode === 'add' ? <UserPlus className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  {userModalMode === 'add' ? 'Create New User Account' : `Edit User Account: ${userFormData.username}`}
                </h3>
                <span className="text-[10px] text-zinc-400">
                  {userModalMode === 'add' ? 'Add user credentials and assign roles' : 'Update profile details, password and permissions'}
                </span>
              </div>
            </div>

            {userFormError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{userFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUserForm} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={userModalMode === 'edit'}
                    value={userFormData.username}
                    onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    placeholder="e.g. jsmith_operator"
                    className={`w-full bg-zinc-50 dark:bg-zinc-900 border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                      userModalMode === 'edit'
                        ? 'border-zinc-200 dark:border-zinc-800 opacity-70 cursor-not-allowed text-zinc-500'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'
                    }`}
                  />
                  <span className="text-[9px] text-zinc-400 mt-0.5 block">Unique system login ID</span>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Display Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                    placeholder="e.g. John Smith"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                  <span className="text-[9px] text-zinc-400 mt-0.5 block">Full person or station name</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* System Role */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    System Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    {availableRoles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Account Status */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Account Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={userFormData.status}
                    onChange={(e) => setUserFormData({ ...userFormData, status: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    <option value="Active">Active (Can Login)</option>
                    <option value="Inactive">Inactive (Suspended)</option>
                  </select>
                </div>
              </div>

              {/* Password Option Field */}
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-amber-500" />
                    Account Password <span className="text-rose-500">*</span>
                  </label>
                  
                  <button
                    type="button"
                    onClick={() => setUserFormData({ ...userFormData, password: generateStrongPassword() })}
                    className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    Generate Strong
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={userFormShowPassword ? "text" : "password"}
                    required
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    placeholder="Enter account password"
                    className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                  <button
                    type="button"
                    onClick={() => setUserFormShowPassword(!userFormShowPassword)}
                    className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {userFormShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {userFormData.password && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span>Strength: <strong className="text-zinc-600 dark:text-zinc-300">{getPasswordStrength(userFormData.password).text}</strong></span>
                      <span>Min 4 characters</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full ${getPasswordStrength(userFormData.password).color} ${getPasswordStrength(userFormData.password).barWidth} transition-all duration-300 rounded-full`} />
                    </div>
                  </div>
                )}
              </div>

              {/* Permissions Checklist */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-emerald-600" />
                  Module Access Permissions
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 max-h-44 overflow-y-auto bg-zinc-50/40 dark:bg-zinc-900/30">
                  {allAvailablePermissions.map(perm => {
                    const isChecked = (userFormData.permissions || []).includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors border ${
                          isChecked
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 font-semibold'
                            : 'bg-white dark:bg-[#0c0c0f] border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        <span className="text-[11px]">{perm.label}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleFormPermission(perm.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 border-zinc-300 ml-2"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setUserModalMode(null)}
                  className="w-1/3 text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl py-2.5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl py-2.5 transition-colors shadow-sm active:scale-[0.98]"
                >
                  {userModalMode === 'add' ? 'Create User Account' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DEDICATED CHANGE PASSWORD MODAL */}
      {/* ========================================================================= */}
      {passwordModalShow && passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-5 relative shadow-2xl animate-in zoom-in-95 duration-200">
            
            <button
              onClick={() => {
                setPasswordModalShow(false);
                setPasswordModalUser(null);
              }}
              className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-zinc-150 dark:border-zinc-800 pb-3">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Change Password
                </h3>
                <span className="text-[10px] text-zinc-400">
                  Target user: <strong className="font-mono text-emerald-600">{passwordModalUser.username}</strong> ({passwordModalUser.name})
                </span>
              </div>
            </div>

            {passwordModalError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{passwordModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNewPassword} className="space-y-4">
              
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-400">User Account:</span>
                  <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{passwordModalUser.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Current Role:</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">{passwordModalUser.role}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    New Secure Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPasswordVal(generateStrongPassword())}
                    className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    Auto-Generate
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newPasswordVal}
                    onChange={(e) => setNewPasswordVal(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                {newPasswordVal && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span>Password Strength: <strong className="text-zinc-600 dark:text-zinc-300">{getPasswordStrength(newPasswordVal).text}</strong></span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full ${getPasswordStrength(newPasswordVal).color} ${getPasswordStrength(newPasswordVal).barWidth} transition-all duration-300 rounded-full`} />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordModalShow(false);
                    setPasswordModalUser(null);
                  }}
                  className="w-1/3 text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl py-2.5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl py-2.5 transition-colors shadow-sm active:scale-[0.98]"
                >
                  Save New Password
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DELETE USER CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0c0c0f] border-rose-200 dark:border-rose-900/60 border max-w-md w-full p-6 space-y-4 relative shadow-2xl rounded-2xl animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                <Trash2 className="h-6 w-6 shrink-0" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider">Confirm User Account Deletion</h3>
                <span className="text-[10px] text-zinc-400">Irreversible user removal</span>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400">
                {deleteError}
              </div>
            )}

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-light">
              Are you sure you want to permanently delete the user account for <strong className="font-mono text-zinc-900 dark:text-white font-bold">{userToDelete.name}</strong> (<span className="font-mono text-rose-600 dark:text-rose-400">{userToDelete.username}</span>)?
              This user will no longer be able to log in to the WMS system.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="w-1/2 text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl py-2.5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteUser}
                className="w-1/2 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl py-2.5 transition-colors shadow-sm active:scale-[0.98]"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PERMISSIONS EDITOR MODAL */}
      {/* ========================================================================= */}
      {selectedUserForPerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-5 relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedUserForPerms(null)}
              className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-zinc-150 dark:border-zinc-800 pb-3">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Edit Permissions Checklist</h3>
                <span className="text-[10px] text-zinc-400">
                  User: <span className="font-mono font-bold text-emerald-600">{selectedUserForPerms.username}</span> ({selectedUserForPerms.role})
                </span>
              </div>
            </div>

            {/* Checkboxes List */}
            <div className="space-y-2 border-y border-zinc-150 dark:border-zinc-800 py-3 max-h-64 overflow-y-auto">
              {allAvailablePermissions.map(perm => {
                const isChecked = userPerms.includes(perm.id);
                return (
                  <label
                    key={perm.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors border text-xs ${
                      isChecked
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-zinc-900 dark:text-zinc-100 font-semibold'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50 border-transparent text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <span>{perm.label}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleTogglePermission(perm.id)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5 border-zinc-300"
                    />
                  </label>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedUserForPerms(null)}
                className="w-1/3 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl py-2.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePermissions}
                className="w-2/3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl py-2.5 transition-colors shadow-sm active:scale-[0.98]"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DATABASE RESET CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {confirmResetType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0c0c0f] border-rose-200 dark:border-rose-900 border max-w-sm w-full p-6 space-y-4 relative shadow-2xl rounded-2xl animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Confirm Irreversible Purge</h3>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-light">
              You are about to purge and reload database records. This operation cannot be undone. Are you sure you wish to proceed?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmResetType(null)}
                className="w-1/2 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl py-2.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                No, Abort
              </button>
              <button
                onClick={executeReset}
                className="w-1/2 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl py-2.5 transition-colors shadow-sm active:scale-[0.98]"
              >
                Yes, Purge Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
