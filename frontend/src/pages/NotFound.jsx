import { useNavigate } from 'react-router-dom';

export default function NotFound() {
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
      <div className="state-message" style={{ minHeight: '70vh' }}>
        <span style={{ fontSize: '4rem', opacity: .3 }}>404</span>
        <p>Cette page n'existe pas.</p>
        <button onClick={() => navigate('/')}>Retour à l'accueil</button>
      </div>
    </>
  );
}
