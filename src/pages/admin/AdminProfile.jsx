import { useEffect, useState } from 'react';
import { AtSign, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock, Save, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const AdminProfile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username || '');
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    setUsername(profile?.username || '');
  }, [profile?.username]);

  const saveUsername = async (event) => {
    event.preventDefault();
    setSavingUsername(true);
    setUsernameError('');
    setUsernameSuccess('');

    const { data, error: updateError } = await supabase.rpc('update_own_admin_username', {
      requested_username: username,
    });
    setSavingUsername(false);

    if (updateError) {
      setUsernameError(updateError.message || 'Unable to update your username.');
      return;
    }

    setUsername(data);
    await refreshProfile();
    setUsernameSuccess('Username updated. Use it the next time you sign in.');
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match. Please re-enter your new password.');
      return;
    }

    setSavingPassword(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Password successfully updated. You can use it the next time you sign in.');
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setSavingPassword(false);
    }
  };

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Administrator';

  return (
    <div className="admin-page admin-profile-page" style={{ maxWidth: '720px', margin: '0 auto' }}>
      <header className="page-header">
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Admin Profile</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your administrator identity, login username, and security settings.</p>
        </div>
      </header>

      <section className="admin-profile-card glass-card" style={{ marginBottom: '2rem' }}>
        <div className="admin-profile-identity">
          <span className="admin-profile-avatar"><ShieldCheck size={28} /></span>
          <div>
            <h2>{fullName}</h2>
            <p>{user?.email || 'Administrator account'}</p>
          </div>
        </div>

        {/* Username form */}
        <form onSubmit={saveUsername} className="admin-profile-form">
          <label htmlFor="admin-profile-username">Login username</label>
          <div className="admin-profile-input">
            <AtSign size={18} />
            <input
              id="admin-profile-username"
              required
              minLength="3"
              maxLength="30"
              pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,29}"
              title="Use 3–30 letters, numbers, dots, underscores, or hyphens."
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>
          <small>3–30 characters. Letters, numbers, dots, underscores, and hyphens are allowed.</small>

          {usernameError ? <p className="admin-action-error">{usernameError}</p> : null}
          {usernameSuccess ? <p className="admin-profile-success"><CheckCircle2 size={17} /> {usernameSuccess}</p> : null}

          <button
            type="submit"
            className="invite-create-btn"
            disabled={savingUsername || username.trim().toLowerCase() === profile?.username}
            style={{ width: 'fit-content' }}
          >
            {savingUsername ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
            {savingUsername ? 'Saving…' : 'Save username'}
          </button>
        </form>
      </section>

      {/* Security / Password section */}
      <section className="admin-profile-card glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(0, 242, 254, 0.1)',
            color: 'var(--accent-teal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <KeyRound size={20} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Security & Password</h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Update your account password with confirmation.
            </p>
          </div>
        </div>

        <form onSubmit={savePassword} className="admin-profile-form">
          {/* New password */}
          <label htmlFor="admin-new-password">New password</label>
          <div className="admin-profile-input" style={{ position: 'relative' }}>
            <Lock size={18} />
            <input
              id="admin-new-password"
              type={showNewPassword ? 'text' : 'password'}
              required
              minLength="8"
              maxLength="128"
              autoComplete="new-password"
              placeholder="Enter new password (min. 8 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ paddingRight: '2.8rem' }}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((shown) => !shown)}
              aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Confirm password */}
          <label htmlFor="admin-confirm-password" style={{ marginTop: '0.75rem' }}>Confirm new password</label>
          <div className="admin-profile-input" style={{ position: 'relative' }}>
            <Lock size={18} />
            <input
              id="admin-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              minLength="8"
              maxLength="128"
              autoComplete="new-password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ paddingRight: '2.8rem' }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((shown) => !shown)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <small>Must be at least 8 characters long and match above.</small>

          {passwordError ? <p className="admin-action-error">{passwordError}</p> : null}
          {passwordSuccess ? <p className="admin-profile-success"><CheckCircle2 size={17} /> {passwordSuccess}</p> : null}

          <button
            type="submit"
            className="invite-create-btn"
            disabled={savingPassword || !newPassword || !confirmPassword}
            style={{ width: 'fit-content', marginTop: '0.5rem' }}
          >
            {savingPassword ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
            {savingPassword ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>
    </div>
  );
};

export default AdminProfile;
