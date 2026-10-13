import { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './Layout';
import { HomePage } from '@/pages/HomePage';
import { AboutPage, ContactPage, MerchandisePage, NotFoundPage } from '@/pages/InfoPages';
import { ScopeGuidePage } from '@/pages/ScopeGuidePage';
import { AccountPage } from '@/pages/AccountPage';

const HelmetBuilderPage = lazy(() => import('@/features/helmet/HelmetBuilderPage'));
const SharePage = lazy(() => import('@/features/helmet/SharePage'));
const SavedDesignsPage = lazy(() => import('@/features/helmet/SavedDesignsPage'));
const StickerKitsPage = lazy(() => import('@/features/kart/StickerKitsPage'));
const KartSharePage = lazy(() => import('@/features/kart/KartSharePage'));
const PartsPage = lazy(() => import('@/features/shop/PartsPage'));
const ProductPage = lazy(() => import('@/features/shop/ProductPage'));
const BasketPage = lazy(() => import('@/features/shop/BasketPage'));
const OrdersPage = lazy(() => import('@/features/workflow/OrdersPage'));
const AdminPage = lazy(() => import('@/features/workflow/AdminPage'));
const ProductionPage = lazy(() => import('@/features/workflow/ProductionPage'));

const Loading = () => <div className="wrap page"><div className="muted">Loading…</div></div>;

export function App() {
  return (
    <HashRouter>
      <Layout>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/helmet-builder" element={<HelmetBuilderPage />} />
            <Route path="/share/:id" element={<SharePage />} />
            <Route path="/saved" element={<SavedDesignsPage />} />
            <Route path="/stickers" element={<StickerKitsPage />} />
            <Route path="/stickers/build" element={<StickerKitsPage builder />} />
            <Route path="/kart-share/:id" element={<KartSharePage />} />
            <Route path="/parts" element={<PartsPage />} />
            <Route path="/parts/:id" element={<ProductPage />} />
            <Route path="/basket" element={<BasketPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:kind/:id" element={<OrdersPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/production" element={<ProductionPage />} />
            <Route path="/production/:kind/:id" element={<ProductionPage />} />
            <Route path="/merchandise" element={<MerchandisePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/scope" element={<ScopeGuidePage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </HashRouter>
  );
}
