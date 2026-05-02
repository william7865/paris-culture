import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';

export default function Favorites() {
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
          <button className="logout-btn" onClick={() => { logout(); navigate('/'); }}>
            Déconnexion
          </button>
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
