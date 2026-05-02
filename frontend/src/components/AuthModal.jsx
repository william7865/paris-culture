import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin, register as apiRegister } from '../api/auth';

export default function AuthModal({ onClose }) {
  const { login } = useAuth();
  const [mode, setMode]     = useState('login');
  const [email, setEmail]   = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fn = mode === 'login' ? apiLogin : apiRegister;
      const data = await fn(email, password);
      login(data.user, data.token);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose} aria-label="Fermer">×</button>

        <h2 className="modal__title">
          {mode === 'login' ? 'Connexion' : 'Créer un compte'}
        </h2>

        <form className="modal__form" onSubmit={handleSubmit}>
          <div className="modal__field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="vous@exemple.fr"
              required
              autoFocus
            />
          </div>
          <div className="modal__field">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'register' ? '8 caractères minimum' : ''}
              required
            />
          </div>
          {error && <p className="modal__error">{error}</p>}
          <button type="submit" className="modal__submit" disabled={loading}>
            {loading ? 'Chargement…' : mode === 'login' ? 'Se connecter' : 'S\'inscrire'}
          </button>
        </form>

        <p className="modal__switch">
          {mode === 'login' ? 'Pas encore de compte ?' : 'Déjà inscrit ?'}
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? 'S\'inscrire' : 'Se connecter'}
          </button>
        </p>
      </div>
    </div>
  );
}
