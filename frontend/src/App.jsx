import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const EventDetail = lazy(() => import('./pages/EventDetail'));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Suspense fallback={null}><Home /></Suspense>} />
      <Route path="/events/:id" element={<Suspense fallback={null}><EventDetail /></Suspense>} />
    </Routes>
  );
}
