import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMe, updateEmail, updatePassword, deleteAccount } from '../api/account';
import usePageTitle from '../hooks/usePageTitle';

const SectionTitle = ({ children }) => <h2 className="account-section__title">{children}</h2>;

const Field = ({ label, type = 'text', value, onChange, placeholder, autoComplete }) => (
  <div className="modal__field">
    <label>{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} autoComplete={autoComplete} />
  </div>
);

const StatusMsg = ({ msg }) => {
  if (!msg) return null;
  const isError = msg.type === 'error';
  return <p className={`account-status ${isError ? 'account-status--error' : 'account-status--ok'}`}>{msg.text}</p>;
};

export default function Account() {
  const { token, user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);

  const [newEmail, setNewEmail]           = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailMsg, setEmailMsg]           = useState(null);
  const [emailLoading, setEmailLoading]   = useState(false);

  const [currentPwd, setCurrentPwd]   = useState('');
  const [newPwd, setNewPwd]           = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');
  const [pwdMsg, setPwdMsg]           = useState(null);
  const [pwdLoading, setPwdLoading]   = useState(false);

  const [deletePwd, setDeletePwd]         = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteMsg, setDeleteMsg]         = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteZone, setShowDeleteZone] = useState(false);

  usePageTitle('Mon compte');
  useEffect(() => {
    if (!token) { navigate('/'); return; }
    getMe(token).then(setProfile).catch(() => logout());
  }, [token, navigate, logout]);

  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    setEmailMsg(null);
    setEmailLoading(true);
    try {
      await updateEmail(token, newEmail, emailPassword);
      login({ ...user, email: newEmail }, token);
      setProfile(p => ({ ...p, email: newEmail }));
      setNewEmail(''); setEmailPassword('');
      setEmailMsg({ type: 'ok', text: 'Email mis à jour avec succès.' });
    } catch (err) {
      setEmailMsg({ type: 'error', text: err.message });
    } finally { setEmailLoading(false); }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPwdMsg(null);
    if (newPwd !== confirmPwd) {
      return setPwdMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
    }
    setPwdLoading(true);
    try {
      await updatePassword(token, currentPwd, newPwd);
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setPwdMsg({ type: 'ok', text: 'Mot de passe mis à jour avec succès.' });
    } catch (err) {
      setPwdMsg({ type: 'error', text: err.message });
    } finally { setPwdLoading(false); }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (deleteConfirm !== 'SUPPRIMER') {
      return setDeleteMsg({ type: 'error', text: 'Tapez exactement SUPPRIMER pour confirmer.' });
    }
    setDeleteMsg(null);
    setDeleteLoading(true);
    try {
      await deleteAccount(token, deletePwd);
      logout();
      navigate('/');
    } catch (err) {
      setDeleteMsg({ type: 'error', text: err.message });
      setDeleteLoading(false);
    }
  };

  const initials = profile?.email?.[0]?.toUpperCase() ?? '?';
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <button className="back-btn" onClick={() => navigate(-1)}>← Retour</button>
          <div className="site-header__rule" />
          <span className="site-header__wordmark">Paris <span>Culture</span></span>
        </div>
      </header>

      <main className="container container--detail">

        {/* ── Profil résumé ── */}
        <div className="account-hero">
          <div className="account-avatar">{initials}</div>
          <div className="account-hero__info">
            <h1 className="account-hero__email">{profile?.email}</h1>
            <p className="account-hero__meta">Membre depuis le {memberSince}</p>
            <div className="account-hero__stats">
              <Link to="/favoris" className="account-stat">
                <span className="account-stat__value">{profile?.favorites_count ?? 0}</span>
                <span className="account-stat__label">Favoris</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Modifier l'email ── */}
        <section className="account-section">
          <SectionTitle>Modifier l'email</SectionTitle>
          <p className="account-section__current">Actuel : <strong>{profile?.email}</strong></p>
          <form className="account-form" onSubmit={handleEmailUpdate}>
            <Field label="Nouvel email" type="email" value={newEmail} onChange={setNewEmail}
              placeholder="nouveau@exemple.fr" autoComplete="email" />
            <Field label="Mot de passe actuel" type="password" value={emailPassword}
              onChange={setEmailPassword} placeholder="Confirmez votre identité" autoComplete="current-password" />
            <StatusMsg msg={emailMsg} />
            <button type="submit" className="account-btn" disabled={emailLoading || !newEmail || !emailPassword}>
              {emailLoading ? 'Mise à jour…' : 'Mettre à jour l\'email'}
            </button>
          </form>
        </section>

        {/* ── Modifier le mot de passe ── */}
        <section className="account-section">
          <SectionTitle>Modifier le mot de passe</SectionTitle>
          <form className="account-form" onSubmit={handlePasswordUpdate}>
            <Field label="Mot de passe actuel" type="password" value={currentPwd}
              onChange={setCurrentPwd} placeholder="Votre mot de passe actuel" autoComplete="current-password" />
            <Field label="Nouveau mot de passe" type="password" value={newPwd}
              onChange={setNewPwd} placeholder="8 caractères minimum" autoComplete="new-password" />
            <Field label="Confirmer le nouveau mot de passe" type="password" value={confirmPwd}
              onChange={setConfirmPwd} placeholder="Répétez le nouveau mot de passe" autoComplete="new-password" />
            <StatusMsg msg={pwdMsg} />
            <button type="submit" className="account-btn"
              disabled={pwdLoading || !currentPwd || !newPwd || !confirmPwd}>
              {pwdLoading ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
            </button>
          </form>
        </section>

        {/* ── Déconnexion ── */}
        <section className="account-section">
          <SectionTitle>Session</SectionTitle>
          <p className="account-section__desc">Déconnectez-vous de votre compte sur cet appareil.</p>
          <button className="account-btn account-btn--secondary" onClick={() => { logout(); navigate('/'); }}>
            Se déconnecter
          </button>
        </section>

        {/* ── Zone danger ── */}
        <section className="account-section account-section--danger">
          <SectionTitle>Zone de danger</SectionTitle>
          <p className="account-section__desc">
            La suppression est définitive. Toutes vos données (compte, favoris) seront effacées.
          </p>
          {!showDeleteZone ? (
            <button className="account-btn account-btn--danger" onClick={() => setShowDeleteZone(true)}>
              Supprimer mon compte
            </button>
          ) : (
            <form className="account-form account-form--danger" onSubmit={handleDelete}>
              <Field label="Mot de passe" type="password" value={deletePwd}
                onChange={setDeletePwd} placeholder="Confirmez votre identité" autoComplete="current-password" />
              <div className="modal__field">
                <label>Tapez <strong>SUPPRIMER</strong> pour confirmer</label>
                <input type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder="SUPPRIMER" />
              </div>
              <StatusMsg msg={deleteMsg} />
              <div className="account-form__row">
                <button type="button" className="account-btn account-btn--secondary"
                  onClick={() => { setShowDeleteZone(false); setDeleteMsg(null); setDeletePwd(''); setDeleteConfirm(''); }}>
                  Annuler
                </button>
                <button type="submit" className="account-btn account-btn--danger"
                  disabled={deleteLoading || !deletePwd || deleteConfirm !== 'SUPPRIMER'}>
                  {deleteLoading ? 'Suppression…' : 'Confirmer la suppression'}
                </button>
              </div>
            </form>
          )}
        </section>

      </main>
    </>
  );
}
