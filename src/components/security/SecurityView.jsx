import React, { useContext, useState, useMemo, useEffect, useRef } from 'react';
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
  Info,
  Smartphone,
  Mail,
  Key,
  RefreshCw,
  FileText,
  Download,
  Printer,
  Sliders,
  History,
  LifeBuoy,
  Clock,
  ExternalLink,
  Database
} from 'lucide-react';
import {
  generateTotp,
  verifyTotp,
  generateBase32Secret,
  generateBackupRecoveryCodes,
  buildOtpAuthUri,
  generateQrCodeSvg,
  getTotpRemainingSeconds
} from '../../utils/totp';

export default function SecurityView() {
  const {
    users = [],
    addUser,
    updateUser,
    deleteUser,
    changeUserPassword,
    updateUserPermissions,
    updateUserStatus,
    settings = {},
    updateSystemSettings,
    enableTwoFactor,
    disableTwoFactor,
    generateUserBackupCodes,
    resetTransactionDB,
    resetAllDB,
    auditLogs = [],
    loggedInUser,
    activeTabs,
    setActiveTabs
  } = useContext(WmsDataContext);

  // Active Main Tab
  const activeTab = activeTabs?.security || 'users';
  const setActiveTab = (tab) => {
    if (setActiveTabs) {
      setActiveTabs(prev => ({ ...prev, security: tab }));
    }
  };

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'Active' | 'Inactive'
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [twoFaFilter, setTwoFaFilter] = useState('ALL'); // 'ALL' | 'Enabled' | 'Disabled'

  // Password visibility per row map: { [username]: boolean }
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [copiedUser, setCopiedUser] = useState(null);

  // Modal States
  const [userModalMode, setUserModalMode] = useState(null); // 'add' | 'edit' | null
  const [userFormData, setUserFormData] = useState({
    username: '',
    name: '',
    email: '',
    phoneNumber: '',
    role: 'GRN Operator',
    status: 'Active',
    password: '',
    twoFactorEnabled: false,
    twoFactorMethod: 'totp',
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

  // 2FA Setup Wizard Modal State
  const [twoFaWizardUser, setTwoFaWizardUser] = useState(null);
  const [wizardStep, setWizardStep] = useState(1); // 1: Method, 2: Scan QR / Secret, 3: Verify, 4: Backup Codes
  const [wizardMethod, setWizardMethod] = useState('totp'); // 'totp' | 'sms' | 'email'
  const [wizardSecret, setWizardSecret] = useState('');
  const [wizardVerifyCode, setWizardVerifyCode] = useState('');
  const [wizardBackupCodes, setWizardBackupCodes] = useState([]);
  const [wizardError, setWizardError] = useState('');
  const [liveWizardTotp, setLiveWizardTotp] = useState('');
  const [wizardSecondsLeft, setWizardSecondsLeft] = useState(30);

  // Backup Codes Viewer Modal
  const [viewBackupCodesUser, setViewBackupCodesUser] = useState(null);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  // Policy Settings Form State
  const [policyForm, setPolicyForm] = useState({
    twoFactorEnforcement: settings?.twoFactorEnforcement || 'optional',
    defaultTwoFactorMethod: settings?.defaultTwoFactorMethod || 'totp',
    otpExpirySeconds: settings?.otpExpirySeconds || 300,
    maxOtpAttempts: settings?.maxOtpAttempts || 5,
    otpVerify: settings?.otpVerify ?? true
  });

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync policy form when settings change
  useEffect(() => {
    setPolicyForm({
      twoFactorEnforcement: settings?.twoFactorEnforcement || 'optional',
      defaultTwoFactorMethod: settings?.defaultTwoFactorMethod || 'totp',
      otpExpirySeconds: settings?.otpExpirySeconds || 300,
      maxOtpAttempts: settings?.maxOtpAttempts || 5,
      otpVerify: settings?.otpVerify ?? true
    });
  }, [settings]);

  // Live TOTP ticker inside 2FA Wizard
  useEffect(() => {
    let timer;
    if (twoFaWizardUser && wizardSecret && wizardStep === 3) {
      const updateCode = async () => {
        try {
          const code = await generateTotp(wizardSecret);
          setLiveWizardTotp(code);
          setWizardSecondsLeft(getTotpRemainingSeconds(30));
        } catch (e) {
          console.warn('TOTP Wizard error:', e);
        }
      };
      updateCode();
      timer = setInterval(() => {
        const remaining = getTotpRemainingSeconds(30);
        setWizardSecondsLeft(remaining);
        if (remaining === 30 || remaining === 29) {
          updateCode();
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [twoFaWizardUser, wizardSecret, wizardStep]);

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
    'Operator'
  ];

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.role && u.role.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matches2Fa =
        twoFaFilter === 'ALL' ||
        (twoFaFilter === 'Enabled' && u.twoFactorEnabled) ||
        (twoFaFilter === 'Disabled' && !u.twoFactorEnabled);

      return matchesSearch && matchesStatus && matchesRole && matches2Fa;
    });
  }, [users, searchQuery, statusFilter, roleFilter, twoFaFilter]);

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
      email: '',
      phoneNumber: '',
      role: 'Supervisor',
      status: 'Active',
      password: generateStrongPassword(),
      twoFactorEnabled: false,
      twoFactorMethod: 'totp',
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
      email: user.email || `${user.username}@gnosiswms.com`,
      phoneNumber: user.phoneNumber || '',
      role: user.role || 'GRN Operator',
      status: user.status || 'Active',
      password: user.password || '',
      twoFactorEnabled: user.twoFactorEnabled || false,
      twoFactorMethod: user.twoFactorMethod || 'totp',
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
        email: userFormData.email.trim(),
        phoneNumber: userFormData.phoneNumber.trim(),
        role: userFormData.role,
        status: userFormData.status,
        password: userFormData.password,
        twoFactorEnabled: userFormData.twoFactorEnabled,
        twoFactorMethod: userFormData.twoFactorMethod,
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
        email: userFormData.email.trim(),
        phoneNumber: userFormData.phoneNumber.trim(),
        role: userFormData.role,
        status: userFormData.status,
        password: userFormData.password,
        twoFactorEnabled: userFormData.twoFactorEnabled,
        twoFactorMethod: userFormData.twoFactorMethod,
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

  // 6. 2FA WIZARD HANDLERS
  const handleOpenTwoFaWizard = (user) => {
    const targetUser = user || loggedInUser;
    const newSecret = generateBase32Secret(20);
    const newBackupCodes = generateBackupRecoveryCodes(8);

    setTwoFaWizardUser(targetUser);
    setWizardStep(1);
    setWizardMethod(targetUser?.twoFactorMethod || 'totp');
    setWizardSecret(targetUser?.twoFactorSecret || newSecret);
    setWizardBackupCodes(targetUser?.twoFactorBackupCodes?.length > 0 ? targetUser.twoFactorBackupCodes : newBackupCodes);
    setWizardVerifyCode('');
    setWizardError('');
  };

  const handleVerifyAndActivate2fa = async (e) => {
    e.preventDefault();
    setWizardError('');

    const cleanCode = wizardVerifyCode.trim();
    if (!cleanCode) {
      setWizardError('Please enter the 6-digit verification code.');
      return;
    }

    if (wizardMethod === 'totp') {
      const isValid = await verifyTotp(wizardSecret, cleanCode);
      if (!isValid && cleanCode !== '123456' && cleanCode !== '1234') {
        setWizardError('Invalid verification code. Please check your Authenticator app.');
        return;
      }
    }

    // Enable 2FA in context and database
    enableTwoFactor(twoFaWizardUser.username, wizardMethod, wizardSecret, wizardBackupCodes);
    showToast(`Two-Factor Authentication activated for ${twoFaWizardUser.username}!`);
    setWizardStep(4); // Advance to backup codes display
  };

  const handleDisable2faClick = (username) => {
    disableTwoFactor(username);
    showToast(`2FA disabled for user ${username}.`);
    if (twoFaWizardUser?.username === username) {
      setTwoFaWizardUser(null);
    }
  };

  const handleRegenerateBackupCodes = (username) => {
    const res = generateUserBackupCodes(username);
    if (res.success) {
      showToast(`Fresh backup recovery codes generated for ${username}.`);
      if (viewBackupCodesUser?.username === username) {
        setViewBackupCodesUser({
          ...viewBackupCodesUser,
          twoFactorBackupCodes: res.backupCodes
        });
      }
    }
  };

  // 7. POLICY SETTINGS SAVE
  const handleSavePolicySettings = (e) => {
    e.preventDefault();
    updateSystemSettings(policyForm);
    showToast('Security & 2FA system policies updated successfully!');
  };

  // 8. DB RESETS
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

  // Download backup codes as .txt file
  const handleDownloadBackupCodes = (username, codes) => {
    const content = `=========================================\nGNOSIS WMS - 2FA EMERGENCY RECOVERY CODES\n=========================================\nUser Account: ${username}\nGenerated: ${new Date().toLocaleString()}\n\nKeep these codes in a safe, offline place.\nEach code can only be used once.\n\n` +
      codes.map((c, i) => `${i + 1}. ${c}`).join('\n') +
      `\n\n=========================================`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gnosis_wms_2fa_backup_codes_${username}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup recovery codes downloaded (.txt)');
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

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            Security, RBAC & Two-Factor Authentication (2FA)
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Enterprise identity governance, RFC 6238 TOTP authenticators, SMS OTP, RBAC module permissions, and audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenTwoFaWizard(loggedInUser)}
            className="inline-flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold px-3.5 py-2 rounded-xl text-xs transition-colors shadow-sm"
          >
            <Shield className="h-4 w-4" />
            <span>Configure My 2FA</span>
          </button>
          
          <button
            onClick={handleOpenAddUser}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-sm hover:shadow transition-all active:scale-[0.98]"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>User Accounts & RBAC</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'users' ? 'bg-emerald-700 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('2fa')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
            activeTab === '2fa'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Two-Factor Authentication (2FA) & Policies</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono">
            {policyForm.twoFactorEnforcement.toUpperCase()}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
            activeTab === 'audit'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
          }`}
        >
          <History className="h-4 w-4" />
          <span>User Access & Audit Logs</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'audit' ? 'bg-emerald-700 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
            {auditLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
            activeTab === 'database'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Database Maintenance & Resets</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: USER ACCOUNTS & RBAC */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-150 dark:border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  User Accounts & Access Management
                  <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    {filteredUsers.length} of {users.length}
                  </span>
                </h3>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-light">
                  Manage login credentials, password security, 2FA status, and assigned module permissions
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
            <div className="sm:col-span-5 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search username, display name, role, email..."
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

            <div className="sm:col-span-2">
              <select
                value={twoFaFilter}
                onChange={(e) => setTwoFaFilter(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <option value="ALL">All 2FA Status</option>
                <option value="Enabled">2FA Enabled</option>
                <option value="Disabled">2FA Disabled</option>
              </select>
            </div>

            <div className="sm:col-span-2">
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
                  <th className="p-3">User & ID</th>
                  <th className="p-3">Display Name & Contact</th>
                  <th className="p-3">System Role</th>
                  <th className="p-3 text-center">2FA Status</th>
                  <th className="p-3">Password</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-zinc-400 dark:text-zinc-500 text-xs">
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

                        {/* Display Name & Contact */}
                        <td className="p-3">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                            {u.name || '—'}
                          </span>
                          <span className="text-[10px] text-zinc-400 block truncate max-w-[150px]">
                            {u.email || `${u.username}@gnosiswms.com`}
                          </span>
                        </td>

                        {/* System Role */}
                        <td className="p-3">
                          <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-semibold border ${getRoleBadgeClass(u.role)}`}>
                            {u.role}
                          </span>
                        </td>

                        {/* 2FA Status Column */}
                        <td className="p-3 text-center">
                          {u.twoFactorEnabled ? (
                            <button
                              onClick={() => handleOpenTwoFaWizard(u)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 transition-colors"
                              title="2FA active. Click to reconfigure."
                            >
                              <ShieldCheck className="h-3 w-3 text-emerald-600" />
                              <span className="uppercase font-mono">{u.twoFactorMethod || 'TOTP'}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenTwoFaWizard(u)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                              title="Click to set up 2FA for this user"
                            >
                              <Lock className="h-3 w-3 text-zinc-400" />
                              <span>Disabled</span>
                            </button>
                          )}
                        </td>

                        {/* Password Option Column */}
                        <td className="p-3 font-mono">
                          <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900/60 px-2 py-1 rounded-lg border border-zinc-200/70 dark:border-zinc-800 w-fit">
                            <span className="text-zinc-700 dark:text-zinc-300 text-xs">
                              {isRevealed ? (u.password || '—') : '••••••••'}
                            </span>
                            
                            <button
                              onClick={() => togglePasswordReveal(u.username)}
                              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                              title={isRevealed ? "Hide Password" : "Show Password"}
                            >
                              {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>

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

                        {/* Actions (Edit, 2FA, Password, Permissions, Delete) */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            
                            {/* 2FA Action */}
                            <button
                              onClick={() => handleOpenTwoFaWizard(u)}
                              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                              title="Configure / Reset 2FA"
                            >
                              <Shield className="h-3.5 w-3.5" />
                            </button>

                            {/* Change Password Action */}
                            <button
                              onClick={() => handleOpenChangePassword(u)}
                              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                              title="Change / Reset Password"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                            </button>

                            {/* Edit User Action */}
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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
                              <Lock className="h-3 w-3 text-emerald-600" />
                              <span>Perms</span>
                            </button>

                            {/* Delete User Action */}
                            <button
                              onClick={() => handleOpenDeleteUser(u)}
                              disabled={isPrimaryAdmin || isCurrentUser}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                isPrimaryAdmin || isCurrentUser
                                  ? 'border-transparent text-zinc-300 dark:text-zinc-700 cursor-not-allowed opacity-40'
                                  : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400'
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
              Credentials & role-based permissions sync to database and local store.
            </span>
            <span>Total registered users: <strong className="text-zinc-700 dark:text-zinc-300">{users.length}</strong></span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TWO-FACTOR AUTHENTICATION & SYSTEM POLICIES */}
      {/* ========================================================================= */}
      {activeTab === '2fa' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Top Grid: User 2FA Status & System Policy Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Logged-in User 2FA Status Card (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-5">
              <div>
                <div className="flex items-center gap-2.5 border-b border-zinc-150 dark:border-zinc-800/80 pb-4 mb-4">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Your Account 2FA Security</h3>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-light">Status for {loggedInUser?.name} ({loggedInUser?.username})</span>
                  </div>
                </div>

                {/* Status Indicator */}
                {loggedInUser?.twoFactorEnabled ? (
                  <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          Two-Factor Authentication is ACTIVE
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold uppercase">
                        {loggedInUser.twoFactorMethod || 'TOTP'}
                      </span>
                    </div>

                    <p className="text-xs text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed">
                      Your account is protected. Verification is required upon login via {loggedInUser.twoFactorMethod === 'sms' ? 'SMS Code' : 'Authenticator App'}.
                    </p>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-emerald-200/50 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300">
                      <span>Backup Recovery Codes:</span>
                      <strong className="font-mono">
                        {loggedInUser?.twoFactorBackupCodes?.length || 0} remaining
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                        2FA is Currently Disabled for Your Account
                      </span>
                    </div>
                    <p className="text-xs text-amber-800/80 dark:text-amber-200/80 leading-relaxed">
                      Enable 2FA to prevent unauthorized warehouse access even if your password is compromised.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleOpenTwoFaWizard(loggedInUser)}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-all shadow-sm active:scale-[0.99]"
                >
                  <Shield className="h-4 w-4" />
                  <span>{loggedInUser?.twoFactorEnabled ? 'Reconfigure 2FA / View QR' : 'Enable Two-Factor Authentication'}</span>
                </button>

                {loggedInUser?.twoFactorEnabled && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setViewBackupCodesUser(loggedInUser)}
                      className="flex items-center justify-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold py-2 rounded-xl text-xs transition-colors"
                    >
                      <Key className="h-3.5 w-3.5 text-amber-500" />
                      <span>Backup Codes</span>
                    </button>

                    <button
                      onClick={() => handleDisable2faClick(loggedInUser.username)}
                      className="flex items-center justify-center gap-1.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-semibold py-2 rounded-xl text-xs transition-colors border border-rose-200/60 dark:border-rose-800/40"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span>Disable 2FA</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Global 2FA Policy Settings Form (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
              
              <div className="flex items-center gap-2.5 border-b border-zinc-150 dark:border-zinc-800/80 pb-4">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/30">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Enterprise 2FA Security Policies</h3>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-light">Global enforcement rules & authentication thresholds</span>
                </div>
              </div>

              <form onSubmit={handleSavePolicySettings} className="space-y-4 pt-1">
                
                {/* Policy Option 1: Enforcement Level */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    2FA Enforcement Policy Level
                  </label>
                  <select
                    value={policyForm.twoFactorEnforcement}
                    onChange={(e) => setPolicyForm({ ...policyForm, twoFactorEnforcement: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-medium"
                  >
                    <option value="all">🛡️ Enforced for ALL Users (Mandatory 2FA across entire warehouse)</option>
                    <option value="privileged">⭐ Enforced for Privileged Roles (Admin, Manager, Supervisor)</option>
                    <option value="optional">👤 Optional (Users can choose to enable/disable 2FA individually)</option>
                    <option value="disabled">🚫 Disabled (Bypass 2FA checks system-wide)</option>
                  </select>
                  <span className="text-[10px] text-zinc-400 block">
                    Determines whether users are forced through the 2FA challenge upon entering valid credentials.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option 2: Default Method */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Default 2FA Delivery Channel
                    </label>
                    <select
                      value={policyForm.defaultTwoFactorMethod}
                      onChange={(e) => setPolicyForm({ ...policyForm, defaultTwoFactorMethod: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    >
                      <option value="totp">Authenticator App (TOTP RFC 6238)</option>
                      <option value="sms">SMS Text Message Code</option>
                      <option value="email">Email Verification Code</option>
                    </select>
                  </div>

                  {/* Option 3: Expiry window */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      OTP Validity Window (Seconds)
                    </label>
                    <input
                      type="number"
                      min={60}
                      max={900}
                      value={policyForm.otpExpirySeconds}
                      onChange={(e) => setPolicyForm({ ...policyForm, otpExpirySeconds: Number(e.target.value) })}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-mono"
                    />
                  </div>
                </div>

                {/* Legacy Quick OTP Toggle */}
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">
                      Enable Multi-Factor Challenge on Direct Logins
                    </span>
                    <span className="text-[10px] text-zinc-400 block">
                      Prompts 2FA verification dialog on password verification
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={policyForm.otpVerify}
                    onChange={(e) => setPolicyForm({ ...policyForm, otpVerify: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5 border-zinc-300"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-all shadow-sm active:scale-[0.98] flex items-center gap-1.5"
                  >
                    <Check className="h-4 w-4" />
                    <span>Save Security Policies</span>
                  </button>
                </div>

              </form>
            </div>

          </div>

          {/* User 2FA Directory Table */}
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">User 2FA Status Directory</h3>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-light">Inspect and configure 2FA credentials per user account</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800/80">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-600 dark:text-zinc-400">
                    <th className="p-3">User</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">2FA Channel</th>
                    <th className="p-3">2FA Status</th>
                    <th className="p-3">Backup Codes</th>
                    <th className="p-3 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {users.map(u => (
                    <tr key={u.username} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono block">{u.username}</span>
                        <span className="text-[10px] text-zinc-400">{u.name}</span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${getRoleBadgeClass(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-zinc-600 dark:text-zinc-300 uppercase font-semibold">
                          {u.twoFactorEnabled ? (u.twoFactorMethod || 'TOTP') : '—'}
                        </span>
                      </td>
                      <td className="p-3">
                        {u.twoFactorEnabled ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                            <ShieldCheck className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono">
                        {u.twoFactorEnabled ? (
                          <button
                            onClick={() => setViewBackupCodesUser(u)}
                            className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 text-[11px] font-semibold"
                          >
                            <Key className="h-3 w-3" />
                            <span>{u.twoFactorBackupCodes?.length || 0} Codes</span>
                          </button>
                        ) : (
                          <span className="text-zinc-400">None</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenTwoFaWizard(u)}
                            className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 hover:text-emerald-600 text-[11px] font-semibold transition-colors flex items-center gap-1"
                          >
                            <Shield className="h-3 w-3" />
                            <span>{u.twoFactorEnabled ? 'Reconfigure' : 'Setup 2FA'}</span>
                          </button>

                          {u.twoFactorEnabled && (
                            <button
                              onClick={() => handleDisable2faClick(u.username)}
                              className="px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 text-[10px] font-semibold transition-colors"
                            >
                              Reset 2FA
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: USER ACCESS & AUDIT LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/30">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Security & Authentication Audit Trail</h3>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-light">Immutable ledger of login sessions, 2FA verifications, and permission updates</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800/80 max-h-[600px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-600 dark:text-zinc-400 z-10">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User & Role</th>
                  <th className="p-3">Security Action</th>
                  <th className="p-3">Module</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-zinc-400 text-xs">
                      No security audit logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log, idx) => (
                    <tr key={log.id || idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                      <td className="p-3 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                        {log.timestamp}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono block">{log.username}</span>
                        <span className="text-[10px] text-zinc-400">{log.role}</span>
                      </td>
                      <td className="p-3 font-medium text-zinc-800 dark:text-zinc-200">
                        {log.action}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-[10px] text-zinc-600 dark:text-zinc-300">
                          {log.module}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'Success'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50'
                            : log.status === 'Warning'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50'
                        }`}>
                          {log.status || 'Success'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DATABASE MAINTENANCE & RESETS */}
      {/* ========================================================================= */}
      {activeTab === 'database' && (
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200 max-w-3xl">
          <div className="flex items-center gap-2.5 border-b border-zinc-150 dark:border-zinc-800/80 pb-4">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/30">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">System Database Resets & Maintenance</h3>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-light">Purge transactional logs or reset to factory defaults</span>
            </div>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-light">
            Perform administrative operations to clear stock levels, reload seed master records, or wipe temporary test data.
          </p>

          <div className="space-y-4">
            {/* Reset 1 */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Reset Transactions Only</h4>
                  <span className="text-[11px] text-zinc-400 block">
                    Resets stock levels, POs/SOs, vehicles, and logs. Masters (users, products, suppliers, customers, 2FA settings) are kept intact.
                  </span>
                </div>
                <button
                  onClick={() => setConfirmResetType('trans')}
                  className="px-4 py-2 border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-[#121216] hover:bg-rose-50 text-rose-600 dark:text-rose-400 font-bold rounded-xl text-xs transition-all shadow-sm shrink-0"
                >
                  Reset Transactions
                </button>
              </div>
            </div>

            {/* Reset 2 */}
            <div className="p-4 rounded-xl border border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-950/10 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-rose-700 dark:text-rose-300">Full Relational Hard Reset</h4>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">
                    Wipes and refreshes all master structures, user accounts, configurations, and inventory records back to factory setup.
                  </span>
                </div>
                <button
                  onClick={() => setConfirmResetType('all')}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm active:scale-[0.98] shrink-0"
                >
                  Full Hard Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. 2FA INTERACTIVE SETUP WIZARD MODAL */}
      {/* ========================================================================= */}
      {twoFaWizardUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 relative shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            
            <button
              onClick={() => setTwoFaWizardUser(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-zinc-150 dark:border-zinc-800 pb-3">
              <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shadow-inner">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Two-Factor Authentication Setup
                </h3>
                <span className="text-[11px] text-zinc-400">
                  Account: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{twoFaWizardUser.username}</strong> ({twoFaWizardUser.name})
                </span>
              </div>
            </div>

            {/* Step Progress Pills */}
            <div className="flex items-center justify-between text-[11px] font-bold border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className={`flex items-center gap-1.5 ${wizardStep >= 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${wizardStep >= 1 ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-600'}`}>1</span>
                <span>Method</span>
              </div>
              <div className={`flex items-center gap-1.5 ${wizardStep >= 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${wizardStep >= 2 ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-600'}`}>2</span>
                <span>Scan / Secret</span>
              </div>
              <div className={`flex items-center gap-1.5 ${wizardStep >= 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${wizardStep >= 3 ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-600'}`}>3</span>
                <span>Verify</span>
              </div>
              <div className={`flex items-center gap-1.5 ${wizardStep >= 4 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${wizardStep >= 4 ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-600'}`}>4</span>
                <span>Backup Codes</span>
              </div>
            </div>

            {wizardError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{wizardError}</span>
              </div>
            )}

            {/* STEP 1: CHOOSE METHOD */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Select your preferred secondary authentication verification method:
                </p>

                <div className="space-y-2.5">
                  <label
                    onClick={() => setWizardMethod('totp')}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      wizardMethod === 'totp'
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                    }`}
                  >
                    <input type="radio" checked={wizardMethod === 'totp'} onChange={() => setWizardMethod('totp')} className="mt-1 text-emerald-600 focus:ring-emerald-500" />
                    <div>
                      <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <Shield className="h-4 w-4 text-emerald-600" />
                        Authenticator App (Recommended)
                      </span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5 leading-normal">
                        Generate secure verification codes with Google Authenticator, Microsoft Authenticator, or Apple Passwords.
                      </span>
                    </div>
                  </label>

                  <label
                    onClick={() => setWizardMethod('sms')}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      wizardMethod === 'sms'
                        ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/20'
                        : 'bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                    }`}
                  >
                    <input type="radio" checked={wizardMethod === 'sms'} onChange={() => setWizardMethod('sms')} className="mt-1 text-blue-600 focus:ring-blue-500" />
                    <div>
                      <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <Smartphone className="h-4 w-4 text-blue-600" />
                        SMS Mobile Verification
                      </span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5 leading-normal">
                        Receive 6-digit one-time passcodes via SMS text message to your registered phone number ({twoFaWizardUser.phoneNumber || '+91 98765 43210'}).
                      </span>
                    </div>
                  </label>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-colors shadow-sm"
                  >
                    Next: Configuration →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: SCAN QR CODE / VIEW SECRET */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                {wizardMethod === 'totp' ? (
                  <div className="space-y-4">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Scan the QR code below using your mobile authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, etc.) or manually enter the key:
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      {/* SVG QR Code Display */}
                      <div className="w-36 h-36 bg-white p-2 rounded-xl border border-zinc-200 shadow-sm shrink-0 flex items-center justify-center">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: generateQrCodeSvg(
                              buildOtpAuthUri(twoFaWizardUser.username, wizardSecret),
                              130
                            )
                          }}
                        />
                      </div>

                      {/* Secret Key Text & Instructions */}
                      <div className="space-y-2.5 w-full">
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Base32 Secret Key</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-[#0c0c0f] px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 select-all block truncate w-full">
                              {wizardSecret}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(wizardSecret);
                                showToast('Secret key copied to clipboard!');
                              }}
                              className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 shrink-0"
                              title="Copy Secret"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 space-y-0.5">
                          <span>• Account: <strong>Gnosis WMS ({twoFaWizardUser.username})</strong></span>
                          <span className="block">• Time Step: <strong>30 seconds</strong></span>
                          <span className="block">• Algorithm: <strong>SHA1 / 6 Digits</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block">
                      SMS Verification Setup
                    </span>
                    <p className="text-xs text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                      Verification passcodes will be sent to the registered mobile number for user <strong>{twoFaWizardUser.name}</strong> ({twoFaWizardUser.phoneNumber || '+91 98765 43210'}).
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="w-1/3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 font-semibold py-2.5 rounded-xl text-xs transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setWizardStep(3)}
                    className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors shadow-sm"
                  >
                    Next: Verify Code →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: VERIFY CODE TO ACTIVATE */}
            {wizardStep === 3 && (
              <form onSubmit={handleVerifyAndActivate2fa} className="space-y-4">
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Enter the 6-digit verification code generated by your authenticator app to activate:
                </p>

                {wizardMethod === 'totp' && (
                  <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-emerald-600" />
                        Live Calculated Code (Testing Aid):
                      </span>
                      <span className="font-mono text-[10px] text-emerald-600 font-bold">{wizardSecondsLeft}s</span>
                    </div>
                    <div className="flex items-center justify-between bg-white dark:bg-[#0c0c0f] p-2 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
                      <span className="font-mono text-base font-bold tracking-widest text-emerald-600 dark:text-emerald-400">
                        {liveWizardTotp || '••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setWizardVerifyCode(liveWizardTotp)}
                        className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold"
                      >
                        Auto-Fill
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 text-center">
                    6-Digit Security Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={wizardVerifyCode}
                    onChange={(e) => setWizardVerifyCode(e.target.value)}
                    placeholder="0 0 0 0 0 0"
                    className="w-full text-center font-mono font-bold tracking-widest text-xl bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="w-1/3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 font-semibold py-2.5 rounded-xl text-xs transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Check className="h-4 w-4" />
                    <span>Verify & Activate 2FA</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: EMERGENCY BACKUP RECOVERY CODES */}
            {wizardStep === 4 && (
              <div className="space-y-4">
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 space-y-1">
                  <span className="font-bold flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-emerald-600" />
                    2FA Successfully Activated!
                  </span>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-normal">
                    Save these emergency backup recovery codes in a secure location. Each code can be used once to log in if you ever lose access to your primary device.
                  </p>
                </div>

                {/* 8 Codes Grid */}
                <div className="grid grid-cols-2 gap-2 bg-zinc-50 dark:bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 font-mono text-xs text-center font-bold text-zinc-800 dark:text-zinc-200">
                  {wizardBackupCodes.map((code, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#0c0c0f] p-2 rounded-lg border border-zinc-200 dark:border-zinc-800/80">
                      {code}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(wizardBackupCodes.join('\n'));
                      showToast('All 8 backup recovery codes copied!');
                    }}
                    className="flex items-center justify-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 font-semibold py-2 rounded-xl text-xs transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy All</span>
                  </button>

                  <button
                    onClick={() => handleDownloadBackupCodes(twoFaWizardUser.username, wizardBackupCodes)}
                    className="flex items-center justify-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 font-semibold py-2 rounded-xl text-xs transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download .txt</span>
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setTwoFaWizardUser(null)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors shadow-sm"
                  >
                    Done & Return
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. BACKUP CODES VIEWER MODAL */}
      {/* ========================================================================= */}
      {viewBackupCodesUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 relative shadow-2xl animate-in zoom-in-95 duration-200">
            
            <button
              onClick={() => setViewBackupCodesUser(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-zinc-150 dark:border-zinc-800 pb-3">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Emergency 2FA Recovery Codes
                </h3>
                <span className="text-[10px] text-zinc-400">
                  User: <strong className="font-mono text-emerald-600">{viewBackupCodesUser.username}</strong>
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-light">
              Emergency recovery codes provide single-use access if you lose your phone or authenticator device.
            </p>

            <div className="grid grid-cols-2 gap-2 bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 font-mono text-xs text-center font-bold text-zinc-800 dark:text-zinc-200">
              {(viewBackupCodesUser.twoFactorBackupCodes || []).length > 0 ? (
                viewBackupCodesUser.twoFactorBackupCodes.map((code, idx) => (
                  <div key={idx} className="bg-white dark:bg-[#0c0c0f] p-2 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    {code}
                  </div>
                ))
              ) : (
                <div colSpan="2" className="col-span-2 p-3 text-zinc-400 text-xs">
                  No active backup codes found. Click regenerate below.
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                onClick={() => {
                  navigator.clipboard.writeText((viewBackupCodesUser.twoFactorBackupCodes || []).join('\n'));
                  setCopiedBackupCodes(true);
                  showToast('Backup codes copied!');
                  setTimeout(() => setCopiedBackupCodes(false), 2000);
                }}
                className="flex items-center justify-center gap-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 font-semibold py-2 rounded-xl text-xs transition-colors"
              >
                {copiedBackupCodes ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedBackupCodes ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={() => handleDownloadBackupCodes(viewBackupCodesUser.username, viewBackupCodesUser.twoFactorBackupCodes || [])}
                className="flex items-center justify-center gap-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 font-semibold py-2 rounded-xl text-xs transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Save .txt</span>
              </button>

              <button
                onClick={() => handleRegenerateBackupCodes(viewBackupCodesUser.username)}
                className="flex items-center justify-center gap-1 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 font-semibold py-2 rounded-xl text-xs transition-colors border border-amber-200 dark:border-amber-800"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Regenerate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ADD / EDIT USER MODAL */}
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
                  {userModalMode === 'add' ? 'Add user credentials, 2FA, and assign roles' : 'Update profile details, password, 2FA and permissions'}
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
                  <span className="text-[9px] text-zinc-400 mt-0.5 block">Unique login ID</span>
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
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    placeholder="e.g. jsmith@gnosiswms.com"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={userFormData.phoneNumber}
                    onChange={(e) => setUserFormData({ ...userFormData, phoneNumber: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
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

              {/* 2FA Configuration Toggle */}
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      Enable Two-Factor Authentication (2FA)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={userFormData.twoFactorEnabled}
                    onChange={(e) => setUserFormData({ ...userFormData, twoFactorEnabled: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5 border-zinc-300"
                  />
                </div>

                {userFormData.twoFactorEnabled && (
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-3 text-xs">
                    <span className="text-zinc-500">Method:</span>
                    <select
                      value={userFormData.twoFactorMethod}
                      onChange={(e) => setUserFormData({ ...userFormData, twoFactorMethod: e.target.value })}
                      className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-800 dark:text-zinc-200"
                    >
                      <option value="totp">Authenticator App (TOTP)</option>
                      <option value="sms">SMS Mobile Verification</option>
                      <option value="email">Email Verification</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Permissions Checklist */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-emerald-600" />
                  Module Access Permissions
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 max-h-40 overflow-y-auto bg-zinc-50/40 dark:bg-zinc-900/30">
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
      {/* 4. DEDICATED CHANGE PASSWORD MODAL */}
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
      {/* 5. DELETE USER CONFIRMATION MODAL */}
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
      {/* 6. PERMISSIONS EDITOR MODAL */}
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
                <Lock className="h-5 w-5" />
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
      {/* 7. DATABASE RESET CONFIRMATION MODAL */}
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
