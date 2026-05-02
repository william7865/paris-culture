export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <span className="site-footer__wordmark">Paris <span>Culture</span></span>
          <p className="site-footer__tagline">L'agenda culturel parisien — événements officiels de la Ville de Paris.</p>
        </div>
        <div className="site-footer__links">
          <div className="site-footer__col">
            <span className="site-footer__col-title">Navigation</span>
            <a href="/">Accueil</a>
            <a href="/favoris">Mes favoris</a>
            <a href="/compte">Mon compte</a>
          </div>
          <div className="site-footer__col">
            <span className="site-footer__col-title">Données</span>
            <a href="https://opendata.paris.fr" target="_blank" rel="noopener noreferrer">Open Data Paris</a>
            <a href="https://opendata.paris.fr/explore/dataset/que-faire-a-paris-" target="_blank" rel="noopener noreferrer">API Que Faire à Paris</a>
          </div>
        </div>
      </div>
      <div className="site-footer__bottom">
        <span>© {year} Paris Culture — Données fournies par la Ville de Paris</span>
      </div>
    </footer>
  );
}
