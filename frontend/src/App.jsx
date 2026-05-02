import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';

const Home        = lazy(() => import('./pages/Home'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const Favorites   = lazy(() => import('./pages/Favorites'));
const Account     = lazy(() => import('./pages/Account'));
const NotFound    = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/"           element={<Suspense fallback={null}><Home /></Suspense>} />
        <Route path="/events/:id" element={<Suspense fallback={null}><EventDetail /></Suspense>} />
        <Route path="/favoris"    element={<Suspense fallback={null}><Favorites /></Suspense>} />
        <Route path="/compte"     element={<Suspense fallback={null}><Account /></Suspense>} />
        <Route path="*"           element={<Suspense fallback={null}><NotFound /></Suspense>} />
      </Routes>
    </>
  );
}
