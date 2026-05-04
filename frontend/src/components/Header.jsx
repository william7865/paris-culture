import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AuthModal from './AuthModal';

export default function Header({ backBtn = false }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          {backBtn && (
            <button className="back-btn" onClick={() => navigate(-1)}>← Retour</button>
          )}
          <Link to="/" className="site-header__wordmark">
            Paris <span>Culture</span>
          </Link>
          <div className="site-header__rule" />
          {!backBtn && <span className="site-header__date">{today}</span>}
          <nav className="site-header__nav">
            {user ? (
              <>
                <Link to="/favoris" className="header-btn">♡ Favoris</Link>
                <Link to="/compte" className="header-btn">Mon compte</Link>
              </>
            ) : (
              <button className="header-btn" onClick={() => setShowAuth(true)}>Connexion</button>
            )}
          </nav>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
          >
            {theme === 'dark' ? '☾ Clair' : '☀ Sombre'}
          </button>
        </div>
      </header>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
