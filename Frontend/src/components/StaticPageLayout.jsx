import PublicHeader from './PublicHeader';
import Footer from './Footer';
import './StaticPageLayout.css';

function StaticPageLayout({ title, children }) {
  return (
    <div className="static-page">
      <PublicHeader />
      <main className="static-page__main">
        <h1 className="static-page__title">{title}</h1>
        <div className="static-page__body">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

export default StaticPageLayout;
