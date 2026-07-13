import { SOCIAL_LINKS } from './SocialIcons.jsx';

export default function TopBar() {
  return (
    <div className="relative h-12">
      <div className="absolute inset-y-0 left-0 w-[40%] bg-[#63b647] z-0"></div>
      <div className="absolute inset-y-0 right-0 w-[60%] bg-[#2c64ac] z-0"></div>
      <div className="absolute inset-y-0 left-[35%] w-[10%] bg-gradient-to-r from-[#63b647] to-[#2c64ac] z-0"></div>

      <div className="relative z-10 max-w-7xl mx-auto h-full">
        <div className="flex justify-between items-center h-full">
          {/* Left side - Social Links */}
          <div className="flex items-center justify-center px-6 text-white w-[40%]">
            <span className="text-white font-semibold mr-4 animated-text">
              <span>F</span>
              <span>o</span>
              <span>l</span>
              <span>l</span>
              <span>o</span>
              <span>w</span>
              <span>&nbsp;</span>
              <span>U</span>
              <span>s</span>
            </span>
            <div className="flex items-center space-x-6">
              {SOCIAL_LINKS.map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="text-white hover:opacity-80 transition-all duration-300 transform hover:scale-125 hover:-translate-y-1 social-icon-glow"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Right side - Contact Info */}
          <div className="flex items-center justify-end space-x-8 px-6 text-white w-[60%]">
            <div className="flex items-center space-x-2">
              <img
                src="assets/icons/telephone.png"
                alt="Phone"
                className="w-5 h-5 object-contain brightness-0 invert icon-float icon-glow"
              />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-200">Call Now!</span>
                <span className="text-sm font-semibold contact-glow">
                  +256706236688 | +256780394344
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <img
                src="assets/icons/sent.png"
                alt="Email"
                className="w-5 h-5 object-contain brightness-0 invert icon-float icon-glow"
              />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-200">Email Now!</span>
                <span className="text-sm font-semibold contact-glow">info@ois.ug</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
