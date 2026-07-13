import { useEffect, useRef, useState } from 'react';
import { SOCIAL_LINKS } from './SocialIcons.jsx';

const SCHEDULE_VISIT_URL =
  "https://mail.google.com/mail/?view=cm&fs=1&to=info@ois.ug&su=Schedule%20a%20Visit%20to%20OrchardsWood&body=Dear%20OrchardsWood%20International%20School%2C%0A%0AI%20am%20writing%20to%20request%20a%20visit%20to%20your%20school.%20I%20am%20interested%20in%20learning%20more%20about%20your%20educational%20programs%20and%20facilities.%0A%0APreferred%20Visit%20Details%3A%0A-%20Preferred%20Date%3A%20%5BPlease%20specify%5D%0A-%20Preferred%20Time%3A%20%5BMorning%2FAfternoon%5D%0A-%20Number%20of%20Visitors%3A%20%5BPlease%20specify%5D%0A-%20Child%27s%20Grade%20Level%20of%20Interest%3A%20%5BPlease%20specify%5D%0A%0AParent%2FGuardian%20Contact%20Information%3A%0A-%20Name%3A%20%5BYour%20name%5D%0A-%20Phone%3A%20%5BYour%20phone%20number%5D%0A%0AI%20look%20forward%20to%20hearing%20from%20you%20and%20visiting%20your%20school.%0A%0ABest%20regards%2C%0A%5BYour%20name%5D";

export { SCHEDULE_VISIT_URL };

function useRevealOnScroll() {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    root.querySelectorAll('.footer-animate').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return ref;
}

export default function Footer() {
  const footerRef = useRevealOnScroll();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer ref={footerRef} className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="footer-animate">
            <div className="flex items-center space-x-3 mb-6">
              <img src="assets/icons/oisLogo.png" alt="OrchardsWood Logo" className="h-10 w-auto" />
            </div>
            <p className="text-gray-300 mb-4">
              Providing quality Christian education in a nurturing environment since 2017.
            </p>
            <div className="flex items-center space-x-6">
              {SOCIAL_LINKS.map(({ href, Icon, label }) => (
                <a key={label} href={href} aria-label={label} className="text-white social-icon-glow">
                  <Icon />
                </a>
              ))}
            </div>
          </div>
          <div className="footer-animate">
            <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="index.html" className="text-gray-300 footer-link inline-block">Home</a></li>
              <li><a href="about.html" className="text-gray-300 footer-link inline-block">About Us</a></li>
              <li><a href="apply.html" className="text-gray-300 footer-link inline-block">Admissions</a></li>
              <li><a href="gallery.html" className="text-gray-300 footer-link inline-block">Gallery</a></li>
              <li><a href="calendar.html" className="text-gray-300 footer-link inline-block">Calendar</a></li>
            </ul>
          </div>
          <div className="footer-animate">
            <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <img
                  src="assets/icons/location.png"
                  alt="Location"
                  className="w-6 h-6 object-contain brightness-0 invert icon-float icon-glow"
                />
                <div className="flex flex-col">
                  <span className="text-gray-200 text-sm font-semibold">Visit Us!</span>
                  <a
                    href="https://www.google.com/maps/dir/?api=1&destination=OrchardsWood+International+School+Buziga+Parish+Makindye+Division+Kampala+Uganda"
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-300 contact-link-group"
                  >
                    <span>Buziga Parish, Makindye Division, off Wavamuno Road, Mawanga</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <img
                  src="assets/icons/telephone.png"
                  alt="Phone"
                  className="w-6 h-6 object-contain brightness-0 invert icon-float icon-glow"
                />
                <div className="flex flex-col">
                  <span className="text-gray-200 text-sm font-semibold">Call Now!</span>
                  <span className="text-gray-300 contact-glow">+256706236688</span>
                  <span className="text-gray-300 contact-glow">+256780394344</span>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <img
                  src="assets/icons/sent.png"
                  alt="Email"
                  className="w-6 h-6 object-contain brightness-0 invert icon-float icon-glow"
                />
                <div className="flex flex-col">
                  <span className="text-gray-200 text-sm font-semibold">Email Now!</span>
                  <a
                    href="https://mail.google.com/mail/?view=cm&fs=1&to=info@ois.ug"
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-300 contact-link-group"
                  >
                    <span>info@ois.ug</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </a>
                </div>
              </li>
            </ul>
          </div>
          <div className="footer-animate">
            <h3 className="text-xl font-semibold mb-4">Newsletter</h3>
            <p className="text-gray-300 mb-4">
              Subscribe to our newsletter for updates on school events and activities.
            </p>
            {subscribed ? (
              <p className="text-ois-green font-semibold">Thank you for subscribing!</p>
            ) : (
              <form className="flex flex-col space-y-3" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="px-4 py-2 rounded-lg text-gray-900 focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-ois-green text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>
        <div className="border-t border-gray-700 pt-8 text-center footer-animate">
          <p className="text-gray-300">
            © 2025 OrchardsWood International School. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
