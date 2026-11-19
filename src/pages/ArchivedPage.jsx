import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Archive, LogOut, Mail } from 'lucide-react';

const ArchivedPage = () => {
  const { signOut, user } = useAuth();

  const firstName = user?.user_metadata?.first_name;
  const lastName = user?.user_metadata?.last_name;
  const displayName = firstName
    ? `${firstName} ${lastName || ''}`
    : user?.user_metadata?.username || 'Student';

  return (
    <div className="auth-page">
      <div className="glass-card" style={{ maxWidth: '500px', textAlign: 'center', padding: '3rem' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: '2rem' }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            background: 'rgba(251, 191, 36, 0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            color: '#f59e0b'
          }}>
            <Archive size={40} />
          </div>
        </motion.div>

        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Account Archived</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
          Hello, <strong style={{ color: 'var(--text-primary)' }}>{displayName}</strong>.<br />
          Your account has been archived by an administrator. You cannot access the platform while your account is archived.
        </p>

        <div className="glass-card" style={{ background: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.15)', padding: '1.5rem', marginBottom: '2rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Mail style={{ color: '#f59e0b' }} size={24} />
            <div>
              <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Need Help?</h4>
              <p style={{ margin: '0 0 0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Contact your administrator to restore your&nbsp;account.</p>
              <a
                href="mailto:skillmatchph76@gmail.com?subject=SkillMatchPH%20Archived%20Account%20Inquiry"
                style={{ color: '#f59e0b', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none', overflowWrap: 'anywhere' }}
              >
                skillmatchph76@gmail.com
              </a>
            </div>
          </div>
        </div>

        <button
          onClick={signOut}
          className="signout-btn"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <LogOut size={20} />
          Sign Out & Return Home
        </button>
      </div>
    </div>
  );
};

export default ArchivedPage;
