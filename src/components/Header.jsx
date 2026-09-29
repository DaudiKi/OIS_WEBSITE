import { useState } from 'react';

const NAV_ITEMS = [
  { href: 'index.html', label: 'Home', key: 'home' },
  { href: 'about.html', label: 'About', key: 'about' },
  { href: 'apply.html', label: 'Apply', key: 'apply' },
  { href: 'gallery.html', label: 'Gallery', key: 'gallery' },
  { href: 'calendar.html', label: 'Calendar', key: 'calendar' },
];

export const AMS_URL = 'ams.html';

export default function Header({ active, sticky = false }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={`bg-white shadow-lg${sticky ? ' sticky top-0 z-50' : ''}`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-center flex-1 max-w-[300px]">
            <a href="index.html">
              <picture>
                <source srcSet="assets/icons/oisLogo.webp" type="image/webp" />
                <img
                  src="assets/icons/oisLogo.png"
                  alt="OrchardsWood International School Logo"
                  className="h-16 w-auto"
                  width="200"
                  height="64"
                />
              </picture>
            </a>
          </div>
          <nav className="hidden md:flex flex-1 justify-center space-x-8">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className={`nav-link hover:text-ois-light-blue transition-colors duration-200 font-medium${
                  active === item.key ? ' text-ois-blue font-bold' : ''
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center justify-center pl-8 w-[200px]">
            <a
              href={AMS_URL}
              className="ams-login-btn text-white px-6 py-2.5 rounded-lg font-medium flex items-center space-x-2"
            >
              <span>AMS Login</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-ois-light-blue"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div>
        {/* Mobile menu */}
        <div className={`${menuOpen ? '' : 'hidden '}md:hidden mt-4 pb-4 mobile-menu`}>
          <div className="flex flex-col space-y-3">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className={`px-4 py-2 rounded${active === item.key ? ' font-bold text-ois-blue' : ''}`}
              >
                {item.label}
              </a>
            ))}
            <a href={AMS_URL} className="ams-login-btn text-white px-4 py-2 rounded mt-2">
              AMS Login
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
