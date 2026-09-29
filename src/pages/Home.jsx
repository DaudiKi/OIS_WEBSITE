import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import TopBar from '../components/TopBar.jsx';
import Header from '../components/Header.jsx';
import Footer, { SCHEDULE_VISIT_URL } from '../components/Footer.jsx';
import { listUpcomingEvents } from '../lib/events.js';
import { useState } from 'react';

gsap.registerPlugin(ScrollTrigger);

const WHY_CHOOSE_US = [
  {
    title: 'Our Curriculum',
    text: 'OIS uses a holistic approach and biblically based Education Curriculum (ACE)',
    color: '#5BC7C7',
    iconPath:
      'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  },
  {
    title: 'Talent Acceleration',
    text: 'OIS integrates Sports, Music, Art and Drama Lessons in the ACE learning Curriculum',
    color: '#FFA500',
    iconPath:
      'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
  },
  {
    title: 'Co-Curricular Activities',
    text: "OIS co-curricular activities an enjoyable experience for your Child's Educational development",
    color: '#FFC0CB',
    iconPath: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
  {
    title: 'Professional Teachers',
    text: 'OIS Teachers are Qualified and well Trained Graduates who love their profession',
    color: '#90EE90',
    iconPath:
      'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  },
  {
    title: 'Learning Environment',
    text: 'OIS has the Best Environment and Class Facilities for Student Success and Growth',
    color: '#5BC7C7',
    iconPath:
      'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064',
  },
  {
    title: 'Our Classes',
    text: 'OIS Classes Include: Play Group(3yrs), Preschool(4-6yrs), High School(Grade 1-12)',
    color: '#DEB887',
    iconPath:
      'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
];

const TESTIMONIALS = [
  {
    quote:
      "The teachers at OrchardsWood have been incredible in nurturing our daughter's talents and helping her grow academically and socially. We couldn't be happier with our choice.",
    image: 'assets/images/parent-1.jpg',
    name: 'Sarah Nakimuli',
    role: 'Parent of Grade 1 Student',
  },
  {
    quote:
      'The facilities and learning environment at OrchardsWood are exceptional. Our twins have developed confidence and leadership skills we never imagined possible at this age.',
    image: 'assets/images/parent-3.jpg',
    name: 'Grace Namugwanya',
    role: 'Parent of Preschool Twins',
  },
  {
    quote:
      "OrchardsWood has provided our son with a safe and inspiring place to learn. The Christian values instilled here are truly reflected in the school's community.",
    image: 'assets/images/parent-2.jpg',
    name: 'Michael Kizito',
    role: 'Parent of Grade 9 Student',
  },
];

function Star() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 star-rating" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function WaveText({ text }) {
  return (
    <span className="wave-text">
      {Array.from(text).map((char, i) => (
        <span key={i}>{char === ' ' ? ' ' : char}</span>
      ))}
    </span>
  );
}

function useHomeAnimations(rootRef) {
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.from('.hero-text', { opacity: 0, y: 50, duration: 1, ease: 'power3.out' }).from(
        '.hero-description',
        { opacity: 0, y: 30, duration: 0.8, ease: 'power3.out' },
        '-=0.5'
      );

      gsap.to('.reveal-element', {
        scrollTrigger: { trigger: '.reveal-element', start: 'top 85%', toggleActions: 'play none none reverse' },
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: 'power4.out',
      });

      gsap.utils.toArray('.reveal-card').forEach((card, i) => {
        gsap
          .timeline({
            scrollTrigger: { trigger: card, start: 'top 85%', toggleActions: 'play none none reverse' },
          })
          .to(card, { opacity: 1, y: 0, duration: 1.2, ease: 'power4.out', delay: i * 0.15 });
      });

      gsap.to('.next-section-btn', { y: -10, duration: 1.5, repeat: -1, yoyo: true, ease: 'power1.inOut' });

      gsap.to('.cta-title', {
        scrollTrigger: { trigger: '.cta-title', start: 'top 80%', toggleActions: 'play none none reverse' },
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
      });
      gsap.to('.cta-text', {
        scrollTrigger: { trigger: '.cta-text', start: 'top 80%', toggleActions: 'play none none reverse' },
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.2,
        ease: 'power3.out',
      });
      gsap.to('.cta-buttons', {
        scrollTrigger: { trigger: '.cta-buttons', start: 'top 80%', toggleActions: 'play none none reverse' },
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.4,
        ease: 'power3.out',
      });

      gsap.to('.welcome-title', {
        scrollTrigger: {
          trigger: '.welcome-title',
          start: 'top 80%',
          toggleActions: 'play none none reverse',
          scrub: 1,
        },
        opacity: 1,
        x: 0,
        duration: 2.5,
        ease: 'power2.out',
      });
    }, rootRef);

    // Testimonials animation (IntersectionObserver, as in the original page)
    const testimonialObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            if (entry.target.classList.contains('testimonial-element')) {
              gsap.to(entry.target, { opacity: 1, y: 0, duration: 1, ease: 'back.out(1.7)' });
            } else {
              gsap.to(entry.target, {
                opacity: 1,
                scale: 1,
                duration: 0.8,
                delay: index * 0.2,
                ease: 'back.out(1.7)',
              });
            }
            testimonialObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    const root = rootRef.current;
    const titleEl = root?.querySelector('.testimonial-element');
    if (titleEl) testimonialObserver.observe(titleEl);
    root?.querySelectorAll('.testimonial-card').forEach((card) => testimonialObserver.observe(card));

    return () => {
      ctx.revert();
      testimonialObserver.disconnect();
    };
  }, [rootRef]);
}

const FALLBACK_EVENTS = [
  {
    day: '15',
    month: 'May',
    title: 'Parent-Teacher Conference',
    time: '9:00 AM - 3:00 PM',
    description: "Meet with teachers to discuss your child's academic progress and development.",
  },
  {
    day: '22',
    month: 'May',
    title: 'Cultural Day Celebration',
    time: '10:00 AM - 2:00 PM',
    description: 'Join us for a day of cultural performances, traditional foods, and activities.',
  },
  {
    day: '29',
    month: 'May',
    title: 'End of Term Exams',
    time: '8:00 AM - 12:00 PM',
    description: 'Final examinations for all classes begin. Detailed schedule available in the calendar.',
  },
  {
    day: '10',
    month: 'Jun',
    title: 'Graduation Ceremony',
    time: '2:00 PM - 5:00 PM',
    description: 'Celebrating our graduating students with a special ceremony and reception.',
  },
];

function UpcomingEvents() {
  const [events, setEvents] = useState(FALLBACK_EVENTS);

  useEffect(() => {
    let cancelled = false;
    listUpcomingEvents(4).then((upcoming) => {
      if (!cancelled && upcoming.length > 0) {
        setEvents(
          upcoming.map((event) => ({
            day: String(new Date(`${event.date}T00:00:00`).getDate()),
            month: new Date(`${event.date}T00:00:00`).toLocaleString('en-US', { month: 'short' }),
            title: event.title,
            time: event.time,
            description: event.description,
          }))
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="upcoming-events" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-ois-blue mb-12">Upcoming Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {events.map((event) => (
            <div
              key={`${event.month}-${event.day}-${event.title}`}
              className="flex items-start gap-4 p-6 bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex-shrink-0 bg-ois-red text-white rounded-lg p-3 text-center w-16">
                <span className="block text-xl font-bold">{event.day}</span>
                <span className="block text-sm">{event.month}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ois-blue mb-2">{event.title}</h3>
                <p className="text-gray-600 mb-2">{event.time}</p>
                <p className="text-gray-700">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <a
            href="calendar.html"
            className="inline-block px-6 py-3 bg-ois-blue text-white rounded-lg hover:bg-ois-light-blue transition-colors duration-200"
          >
            View Full Calendar
          </a>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const rootRef = useRef(null);
  useHomeAnimations(rootRef);

  const scrollToNextSection = () => {
    const currentSection = document.getElementById('why-choose-us');
    const nextSection = currentSection?.nextElementSibling;
    const btn = document.getElementById('nextSectionBtn');
    if (nextSection && btn) {
      gsap.to(btn, {
        scale: 0.9,
        duration: 0.1,
        onComplete: () => {
          gsap.to(btn, { scale: 1, duration: 0.1 });
          nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
      });
    }
  };

  return (
    <div ref={rootRef}>
      <TopBar />
      <Header active="home" />

      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] overflow-hidden">
        <picture>
          <source srcSet="assets/images/Home Background.webp" type="image/webp" />
          <img
            src="assets/images/Home Background.jpg"
            alt="OrchardsWood International School Campus"
            className="absolute inset-0 w-full h-full object-cover"
            fetchpriority="high"
            decoding="async"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-r from-ois-blue/80 to-black/50"></div>
        <div className="relative container mx-auto px-4 h-full flex flex-col items-center justify-center text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-8 leading-tight hero-text">
            Orchardswood
            <br />
            International School
          </h1>
          <p className="text-xl md:text-3xl mb-10 max-w-2xl hero-description motto-text">
            <WaveText text="Equipping For Life" />
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="apply.html"
              className="inline-block px-8 py-4 bg-ois-green text-white rounded-lg hover:bg-ois-green-dark transition-colors duration-300 shadow-lg transform hover:scale-105"
            >
              Apply Now
            </a>
            <a
              href={SCHEDULE_VISIT_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-block px-8 py-4 bg-white text-ois-blue rounded-lg hover:bg-gray-100 transition-colors duration-300 shadow-lg transform hover:scale-105"
            >
              Schedule a Visit
            </a>
          </div>
        </div>
      </section>

      {/* Welcome Section */}
      <section id="about" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2 overflow-hidden rounded-xl shadow-2xl">
              <picture>
                <source srcSet="assets/images/OIS welcome.webp" type="image/webp" />
                <img
                  src="assets/images/OIS welcome.jpg"
                  alt="About OrchardsWood"
                  className="w-full max-w-md mx-auto hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            </div>
            <div className="md:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-ois-blue welcome-title opacity-0 transform -translate-x-20">
                Welcome to Orchardswood International School
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-6 hover:text-ois-blue transition-all duration-500 hover:scale-[1.02] transform cursor-default hover:shadow-lg p-4 rounded-lg animated-paragraph">
                Step into a world of boundless possibilities at Orchardswood International School, where curiosity
                sparks discovery and every student's potential is nurtured with care and inspiration. Our vibrant,
                community is dedicated to fostering academic excellence, creativity, character, and global
                citizenship. With a goal driven curriculum, passionate educators, and a safe environment, we empower
                students to grow, explore, and shape their futures with confidence by building a strong foundation
                for life.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed mb-6 hover:text-ois-blue transition-all duration-500 hover:scale-[1.02] transform cursor-default hover:shadow-lg p-4 rounded-lg animated-paragraph">
                Join us on this exciting journey of learning and transformation — where every mind blossoms and every
                dream takes root. Welcome to Orchardswood, where the world is your classroom!
              </p>
              <a
                href="about.html"
                className="inline-block px-6 py-3 bg-ois-blue text-white rounded-lg hover:bg-ois-light-blue transition-colors duration-200"
              >
                Learn More →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="why-choose-us" className="py-16 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-ois-blue mb-12 reveal-element">Why OIS?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {WHY_CHOOSE_US.map((item) => (
              <div
                key={item.title}
                className="reveal-card bg-gray-50 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-t-4 border-ois-green hover:-translate-y-1"
              >
                <div className="text-4xl mb-4" style={{ color: item.color }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.iconPath} />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-ois-blue mb-4">{item.title}</h3>
                <p className="text-gray-700">{item.text}</p>
              </div>
            ))}
          </div>
          {/* Next Section Button */}
          <div className="flex justify-center mt-16">
            <button id="nextSectionBtn" className="next-section-btn group" onClick={scrollToNextSection} aria-label="Scroll to next section">
              <div className="relative w-16 h-16 rounded-full bg-ois-blue hover:bg-ois-green transition-colors duration-500 flex items-center justify-center overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transform hover:scale-110 transition-all">
                <div className="arrow-container">
                  <svg className="w-8 h-8 text-white transform transition-transform duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                  </svg>
                </div>
                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="w-8 h-8 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                  </svg>
                </span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 mesh-gradient-bg">
        <div className="container mx-auto px-4 mesh-content">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-16 testimonial-element font-righteous tracking-wider">
            What Our Parents Say!
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="testimonial-card glass-testimonial p-8 rounded-2xl relative group overflow-hidden">
                <div className="flex items-center mb-6">
                  <div className="flex space-x-1">
                    <Star />
                    <Star />
                    <Star />
                    <Star />
                    <Star />
                  </div>
                </div>
                <p className="text-gray-800 text-lg italic mb-8 leading-relaxed font-medium relative z-10">
                  "{t.quote}"
                </p>
                <div className="flex items-center relative z-10">
                  <div className="relative w-14 h-14 mr-4">
                    <img src={t.image} alt="Parent" className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
                  </div>
                  <div>
                    <p className="font-bold text-ois-blue text-lg">{t.name}</p>
                    <p className="text-sm text-gray-600 font-semibold uppercase tracking-wide">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <UpcomingEvents />

      {/* Call to Action Section */}
      <section className="py-20 bg-ois-blue text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 cta-title opacity-0 transform translate-y-10">
            Ready to Join Our School Family?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto cta-text opacity-0 transform translate-y-10">
            Applications for the next academic year are now open. Secure your child's future with a quality education
            at OrchardsWood.
          </p>
          <div className="flex flex-wrap justify-center gap-4 cta-buttons opacity-0 transform translate-y-10">
            <a
              href="apply.html"
              className="inline-block px-8 py-4 bg-ois-green text-white rounded-lg hover:bg-ois-green-dark transition-colors duration-300 shadow-lg transform hover:scale-105"
            >
              Apply Now
            </a>
            <a
              href={SCHEDULE_VISIT_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-block px-8 py-4 bg-white text-ois-blue rounded-lg hover:bg-gray-100 transition-colors duration-300 shadow-lg transform hover:scale-105"
            >
              Schedule a Visit
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
