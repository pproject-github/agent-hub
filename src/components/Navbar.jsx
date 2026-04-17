import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/AuthContext.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';

export default function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();

  const navItems = [
    { path: '/', label: t('nav.home') },
    ...(user ? [
      { path: '/publish', label: t('nav.publish') },
      { path: '/me', label: t('nav.profile') },
    ] : []),
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-outline-variant/10">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 md:py-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/logo-64.png"
            alt="AgentFlow Hub"
            className="w-10 h-10 md:w-12 md:h-12 rounded-xl group-hover:scale-105 transition-transform"
          />
          <div className="hidden sm:block text-xl md:text-2xl font-black tracking-tighter font-headline text-on-surface">
            AgentFlow<span className="text-gradient ml-1">Hub</span>
          </div>
        </Link>

        <div className="hidden md:flex gap-8 md:gap-12">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'text-primary' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <LanguageSwitcher />
          <a
            href="https://github.com/pproject-github/agentflow"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors font-headline font-medium"
          >
            <span className="material-symbols-outlined text-xl">code</span>
          </a>
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/me" className="flex items-center gap-2">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <span className="material-symbols-outlined text-primary">account_circle</span>
                )}
              </Link>
              <button onClick={signOut} className="nav-link text-sm">
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary btn-sm">
              {t('nav.login')}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
