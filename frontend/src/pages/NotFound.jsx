import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import usePageTitle from '../hooks/usePageTitle';

export default function NotFound() {
  usePageTitle('Page introuvable');
  const navigate = useNavigate();
  return (
    <>
      <Header backBtn />
      <div className="state-message" style={{ minHeight: '60vh' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '5rem', opacity: .15, fontWeight: 700 }}>404</span>
        <p>Cette page n'existe pas.</p>
        <button onClick={() => navigate('/')}>Retour à l'accueil</button>
      </div>
      <Footer />
    </>
  );
}
