import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import AuthModal from '../components/AuthModal';
import usePageTitle from '../hooks/usePageTitle';

export default function Favorites() {
  usePageTitle('Mes favoris');
  const { user, favorites, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <button className="back-btn" onClick={() => navigate('/')}>← Retour</button>
          <div className="site-header__rule" />
          <span className="site-header__wordmark">Paris <span>Culture</span></span>
        </div>
      </header>

      <main className="container">
        <div className="favorites-header">
          <div>
            <h1 className="favorites-title">Mes favoris</h1>
            <p className="favorites-sub">{user?.email}</p>
          </div>
          <div style={{ display: 'flex', gap: '.75rem' }}>
            <button className="header-btn" onClick={() => navigate('/compte')}>Mon compte</button>
            <button className="logout-btn" onClick={() => { logout(); navigate('/'); }}>Déconnexion</button>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className="state-message">
            <p>Aucun favori pour l'instant.</p>
          </div>
        ) : (
          <div className="events-grid">
            {favorites.map((event, i) => (
              <EventCard
                key={event.id}
                event={event}
                style={{ animationDelay: `${i * 50}ms` }}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
