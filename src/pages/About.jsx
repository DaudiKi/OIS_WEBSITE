import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import TopBar from '../components/TopBar.jsx';
import Header from '../components/Header.jsx';
import Footer, { SCHEDULE_VISIT_URL } from '../components/Footer.jsx';

gsap.registerPlugin(ScrollTrigger);

const CORE_VALUES = [
  {
    number: '01',
    title: 'Excellence',
    text: 'Striving for the highest standards in education and character development.',
    pin: 'from-yellow-400 to-yellow-600',
    pinInner: 'from-yellow-300 to-yellow-500',
    rotate: 'hover:-rotate-1',
  },
  {
    number: '02',
    title: 'Discipline',
    text: 'Building character through structured guidance and accountability.',
    pin: 'from-green-400 to-green-600',
    pinInner: 'from-green-300 to-green-500',
    rotate: 'hover:rotate-1',
  },
  {
    number: '03',
    title: 'Holistic Approach',
    text: 'Developing the whole child - mind, body, and spirit.',
    pin: 'from-blue-400 to-blue-600',
    pinInner: 'from-blue-300 to-blue-500',
    rotate: 'hover:-rotate-1',
  },
];

const CERTIFICATES = [
  { name: 'Achievement', detail: 'For children with learning disabilities' },
  { name: 'Vocational', detail: 'Career-focused certification' },
  { name: 'General', detail: 'O-Level equivalent' },
  { name: 'Intermediate', detail: 'Advanced preparation' },
  { name: 'Advanced', detail: 'A-Level equivalent' },
  { name: 'Advanced Plus', detail: 'Higher qualification' },
];

const ACADEMIC_LEVELS = [
  {
    title: 'Play Group',
    text: 'Early childhood development focused on play-based learning and social skills.',
    ages: 'Ages 2-3 years',
    color: '#FF6B6B',
    iconPath: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'Pre-School',
    text: 'Foundation learning with focus on basic literacy, numeracy, and creative development.',
    ages: 'Ages 3-5 years',
    color: '#4ECDC4',
    iconPath:
      'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    title: 'Elementary (Grade 1-8)',
    text: 'Comprehensive primary education with ACE curriculum integration.',
    ages: 'Ages 6-13 years',
    color: '#FFD93D',
    iconPath:
      'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  },
  {
    title: 'High School (Grade 9-13)',
    text: 'Advanced studies preparing students for university and career success.',
    ages: 'Ages 14-18 years',
    color: '#6C5CE7',
    iconPath:
      'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
];

const CURRICULUM_CARDS = [
  {
    title: 'ACE (Accelerated Christian Education)',
    logo: 'assets/images/ACE.png',
    checkColor: '#63b647',
    items: ['Biblical Integration', 'Character Development', 'Self-Paced Learning', 'Core Academic Subjects'],
  },
  {
    title: 'Skillspro Computer Course',
    logo: 'assets/images/Skillspro.png',
    checkColor: '#2c64ac',
    items: ['Practical Computer Skills', 'Digital Literacy', 'Software Applications', 'Technology Integration'],
  },
];

const CURRICULUM_BLOCKS = [
  {
    hover: 'hover:bg-blue-50',
    textHover: 'group-hover:text-blue-600',
    image: { src: 'assets/images/ACE.png', alt: 'ACE Logo', className: 'h-24 w-auto transform hover:scale-105 transition-transform duration-300 rounded-lg shadow-md' },
    paragraphs: [
      "OIS uses a Biblically Based Education curriculum. The Accelerated Christian Education Curriculum (ACE) has been in existence for more than 40 years and is internationally recognized. It is a unique teaching system with an individualized learning methodology; which is Progress motivated individualized Programmed Learning, that meets each child's educational needs at their level of performance/potential.",
      'This allows students to learn at their own Pace which ensures mastery of the subject material. With the learner-centered approach, many learner differences can be taken into account, learners can work at their own pace at the time most convenient to them; different learning styles can be accommodated; learners are more in control of how and what they learn and learning is active and not passive.',
    ],
  },
  {
    title: 'Self-Paced Learning',
    hover: 'hover:bg-green-50',
    titleHover: 'group-hover:text-green-700',
    textHover: 'group-hover:text-green-600',
    image: { src: 'assets/images/Goal Card.webp', alt: 'Goal Card', className: 'h-24 w-auto transform hover:scale-105 transition-transform duration-300 rounded-lg shadow-md' },
    paragraphsJsx: [
      <>
        At OIS, the curriculum is Self-Paced, with each student progressing through the Paces at their own rate.{' '}
        <span className="group-hover:text-red-600 font-medium">
          They set their own goals daily, detailing how much they can complete in each of their subjects.
        </span>{' '}
        In addition, students do self-assessment, which is tied to personal goals.
      </>,
    ],
  },
  {
    title: 'Core Subjects & Biblical Integration',
    hover: 'hover:bg-blue-50',
    titleHover: 'group-hover:text-blue-700',
    textHover: 'group-hover:text-blue-600',
    image: { src: "assets/images/PACE's.png", alt: 'ACE Paces', className: 'max-h-40 max-w-full object-contain transform hover:scale-105 transition-transform duration-300 rounded-lg' },
    paragraphs: [
      'Students benefit from the inbuilt training in Godliness and individual accountability; from the Word of God and the Biblical principles inculcated into the system that develops character in the individual. Students work in core subjects which include Mathematics, English, Literature, Word Building, Social studies(which includes World History, World Geography or European History for higher classes), Science(which include Biology, chemistry, and physics), and other subjects like Computer studies and Art etc.',
      'The children work with the help of professional, Spirit filled, dedicated, caring and experienced teachers; who work as Supervisors and Monitors in the Learning Centers and skill classes.',
    ],
  },
  {
    title: 'Christian Point of View',
    hover: 'hover:bg-green-50',
    titleHover: 'group-hover:text-green-700',
    textHover: 'group-hover:text-green-600',
    image: { src: 'assets/images/Bible.png', alt: 'Bible', className: 'h-24 w-auto transform hover:scale-105 transition-transform duration-300 rounded-lg' },
    paragraphs: [
      "All learning at OIS takes place from a Christian point of view, with a holistic approach. Teaching is based on character (60 character traits of Jesus), morals and traditional values that underpin all aspects of a student's learning and life in general.",
    ],
  },
  {
    title: 'Life Skills Development',
    hover: 'hover:bg-blue-50',
    titleHover: 'group-hover:text-blue-700',
    textHover: 'group-hover:text-blue-600',
    image: { src: 'assets/images/Life Skills.png', alt: 'Life Skills', className: 'h-32 w-auto transform hover:scale-105 transition-transform duration-300 rounded-lg' },
    paragraphs: [
      'In addition to the above; OIS emphasizes training the students with both hard/practical and soft skills. This ensures that when the learner leaves OIS they will be prepared for life; ready to take on the world of work, community and ministry.',
    ],
  },
];

function CheckIcon({ color }) {
  return (
    <svg className="w-5 h-5 mr-2" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function About() {
  const rootRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.nav-link', { opacity: 0, y: -20, duration: 0.5, stagger: 0.1, ease: 'power2.out' });
      gsap
        .timeline()
        .from('.hero-description', { opacity: 0, y: 30, duration: 0.8, ease: 'power3.out' }, '+=0.4');
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef}>
      <TopBar />
      <Header active="about" />

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-[#2c64ac]/10 to-[#63b647]/10">
        <div className="container mx-auto px-4 relative">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 hero-text" style={{ textShadow: '3px 3px 6px rgba(0, 0, 0, 0.2)' }}>
              <span className="gradient-text">About Us</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto hero-description">
              Providing quality Christian education in a nurturing environment since 2017
            </p>
          </div>
        </div>
      </section>

      <main>
        {/* Director's Message Section */}
        <section className="relative py-12 bg-gradient-to-br from-[#f5f7fa] to-[#e3ecfa]">
          <div className="relative container mx-auto px-4">
            <div className="absolute left-0 top-0 h-full w-6 md:w-12 bg-gradient-to-b from-[#63b647] to-[#2c64ac] rounded-l-3xl opacity-60"></div>
            <div className="absolute right-0 top-0 h-full w-6 md:w-12 bg-gradient-to-t from-[#2c64ac] to-[#63b647] rounded-r-3xl opacity-60"></div>
            <div className="relative z-10 rounded-3xl border border-[#e3ecfa] bg-white/80 shadow-xl p-4 md:p-8 flex flex-col md:flex-row items-center justify-center backdrop-blur-md">
              <div className="md:w-1/2 mb-6 md:mb-0 flex justify-center">
                <div className="relative flex justify-center items-center">
                  <div className="absolute w-64 h-64 bg-gradient-to-br from-[#63b64733] to-[#2c64ac33] rounded-full blur-2xl opacity-60 -z-10"></div>
                  <picture>
                    <source srcSet="assets/images/Director.webp" type="image/webp" />
                    <img
                      src="assets/images/Director.jpg"
                      alt="Director's Message"
                      className="w-64 h-auto mx-auto shadow-2xl rounded-2xl border-4 border-white object-cover transition-transform duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(44,100,172,0.25)]"
                      loading="lazy"
                    />
                  </picture>
                </div>
              </div>
              <div className="md:w-1/2 md:pl-6">
                <div className="bg-white/80 rounded-2xl shadow-lg p-6 backdrop-blur-md group">
                  <h3
                    className="text-xl font-semibold text-gray-800 mb-3 fade-in-title fade-in-delay-1 transition-all duration-500 ease-in-out group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#2c64ac] group-hover:to-[#63b647] group-hover:scale-105"
                    style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.08)' }}
                  >
                    Our Director's Message
                  </h3>
                  <p className="text-gray-600 mt-2 text-base leading-relaxed transition-all duration-500 ease-in-out group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#2c64ac] group-hover:to-[#63b647] group-hover:scale-105">
                    At OrchardsWood International School, our principles are rooted in fostering a Christ-centered
                    environment that nurtures academic excellence, spiritual growth, and moral integrity. We are
                    committed to guiding our students to become compassionate, responsible, and purpose-driven
                    individuals who impact the world positively.
                  </p>
                  <div className="text-right mt-4 pr-2">
                    <p className="text-gray-800 font-semibold">Yours in Christ's Service,</p>
                    <p className="text-gray-800 font-bold italic">Mrs. Herriet Makumbi</p>
                    <p className="text-gray-600">Director, OrchardsWood International School</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="bg-gray-100 py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center animated-border">
              <div className="md:w-1/2 md:pr-8 relative z-10">
                <h3
                  className="text-2xl font-semibold text-gray-800 hover:text-[#2c64ac] transition-colors duration-300 fade-in-title fade-in-delay-2"
                  style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)' }}
                >
                  Our Vision
                </h3>
                <p className="text-gray-600 mt-4 hover:text-[#63b647] transition-colors duration-300 hover:shadow-lg p-4 rounded-lg bg-white relative z-20">
                  "To be a leading Christian educational institution that develops godly leaders who excel
                  academically, morally, and spiritually, equipped to transform their communities and impact the world
                  for Christ."
                </p>
              </div>
              <div className="md:w-1/2 mb-8 md:mb-0 order-first md:order-last flex justify-center relative z-20">
                <picture>
                  <source srcSet="assets/images/Vision.webp" type="image/webp" />
                  <img
                    src="assets/images/Vision.jpg"
                    alt="Our Vision"
                    className="w-4/5 max-w-md rounded-lg shadow-lg transition-all duration-500 hover:scale-110 hover:shadow-2xl hover:rotate-3 hover:brightness-110 cursor-pointer relative z-30"
                    loading="lazy"
                  />
                </picture>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="bg-gray-100 py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center animated-border">
              <div className="md:w-1/2 mb-8 md:mb-0 flex justify-center relative z-20">
                <picture>
                  <source srcSet="assets/images/Mission.webp" type="image/webp" />
                  <img
                    src="assets/images/Mission.jpg"
                    alt="Our Mission"
                    className="w-4/5 max-w-md rounded-lg shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:rotate-1 relative z-30"
                    loading="lazy"
                  />
                </picture>
              </div>
              <div className="md:w-1/2 md:pl-8 relative z-10">
                <h3
                  className="text-2xl font-semibold text-gray-800 hover:text-[#2c64ac] transition-colors duration-300 fade-in-title fade-in-delay-3"
                  style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)' }}
                >
                  Our Mission
                </h3>
                <p className="text-gray-600 mt-4 hover:text-[#63b647] transition-colors duration-300 hover:shadow-lg p-4 rounded-lg bg-white relative z-20">
                  "Equipping children for life and eternity with Christian education"
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <div className="bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)' }}>
            Our Core Values
          </h2>
          <p className="text-lg text-gray-600 mb-10">The principles that guide everything we do</p>
          <div className="relative flex flex-wrap justify-center gap-8">
            <svg
              className="absolute w-full h-full top-0 left-0"
              viewBox="0 0 1200 300"
              preserveAspectRatio="xMidYMid meet"
              style={{ pointerEvents: 'none' }}
            >
              <path d="M 300 150 Q 450 50 600 150" fill="none" stroke="#2c64ac" strokeWidth="6" strokeDasharray="12,12" className="opacity-100">
                <animate attributeName="stroke-dashoffset" from="0" to="48" dur="2s" repeatCount="indefinite" />
              </path>
              <polygon points="590,140 610,150 590,160" fill="#2c64ac" transform="rotate(-30 600 150)" className="opacity-100" />
              <path d="M 650 150 Q 800 250 950 150" fill="none" stroke="#2c64ac" strokeWidth="6" strokeDasharray="12,12" className="opacity-100">
                <animate attributeName="stroke-dashoffset" from="0" to="48" dur="2s" repeatCount="indefinite" />
              </path>
              <polygon points="940,140 960,150 940,160" fill="#2c64ac" transform="rotate(30 950 150)" className="opacity-100" />
            </svg>

            {CORE_VALUES.map((value) => (
              <div
                key={value.number}
                className={`relative bg-white rounded-lg shadow-lg w-64 p-6 text-left z-10 transform ${value.rotate} transition-transform duration-300`}
                style={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)' }}
              >
                <div className="absolute -top-4 -left-4 bg-[#FF0000] text-white font-bold text-lg w-10 h-10 flex items-center justify-center rounded-full shadow-md">
                  {value.number}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                  {value.title}
                  <span
                    className={`ml-2 w-8 h-8 rounded-full bg-gradient-to-br ${value.pin} shadow-lg transform hover:scale-110 transition-transform duration-300 relative inline-block`}
                    style={{ boxShadow: '0 3px 6px rgba(0,0,0,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)' }}
                  >
                    <span className={`absolute inset-1 rounded-full bg-gradient-to-br ${value.pinInner} opacity-50`}></span>
                  </span>
                </h3>
                <p className="text-gray-600 leading-relaxed">{value.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Guiding Scripture Section */}
        <section className="bg-gray-100 py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)' }}>
              Our Guiding Scriptures
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div className="bg-white p-6 rounded-lg shadow-lg scripture-card">
                <blockquote className="text-gray-600 italic">
                  <p className="text-lg scripture-text">
                    "Blessed is the man that walketh not in the counsel of the ungodly, nor standeth in the way of
                    sinners, nor sitteth in the seat of the scornful. But his delight is in the law of the Lord; and
                    in his law doth he meditate day and night. And he shall be like a tree planted by the rivers of
                    water, that bringeth forth his fruit in his season; his leaf also shall not wither; and whatsoever
                    he doeth shall prosper."
                  </p>
                  <footer className="mt-4 text-gray-800 font-semibold">
                    <span className="scripture-reference">- Psalm 1:1-3 KJV</span>
                  </footer>
                </blockquote>
              </div>

              <div className="flex justify-center items-center">
                <picture>
                  <source srcSet="assets/images/Tree of Life.webp" type="image/webp" />
                  <img
                    src="assets/images/Tree of Life.jpg"
                    alt="Tree of Life"
                    className="w-full max-w-[300px] h-auto rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </picture>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-lg scripture-card">
                <blockquote className="text-gray-600 italic">
                  <p className="text-lg scripture-text">
                    "Blessed is the man that trusts in the LORD, and whose hope is in the Lord is. He shall be like a
                    tree planted by the waters, and that spreads out its roots by the river, and shall not fear when
                    the heat comes, but its leaf shall be green, and shall not be anxious in the year of drought,
                    neither shall cease from yielding fruit."
                  </p>
                  <footer className="mt-4 text-gray-800 font-semibold">
                    <span className="scripture-reference">- Jeremiah 17:7-8 NKJV</span>
                  </footer>
                </blockquote>
              </div>
            </div>
          </div>
        </section>

        {/* Accreditation Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)' }}>
              Our Accreditation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              <div className="md:col-span-3 bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-[#2c64ac] hover:bg-green-50 group">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="md:w-2/3 space-y-4">
                    <h3 className="text-2xl font-semibold text-[#2c64ac] mb-6 text-center md:text-left group-hover:text-green-700">
                      International Recognition
                    </h3>
                    <div className="text-gray-600 leading-relaxed group-hover:text-green-600">
                      <p>
                        Orchardswood International School certificates are accredited by the International Christian
                        Certificate of Education Limited (ICCEL), whose offices are in the UK.
                      </p>
                      <p>
                        ICCEL offers certificates at different levels, recognized by the Universities and Colleges
                        Admission Services in the UK and internationally.
                      </p>
                    </div>
                  </div>
                  <div className="md:w-1/3 flex justify-center items-center min-h-[200px]">
                    <picture>
                      <source srcSet="assets/images/ICCE ROA.webp" type="image/webp" />
                      <img
                        src="assets/images/ICCE ROA.png"
                        alt="ICCE Record of Achievement"
                        className="max-w-full h-auto max-h-48 object-contain transform hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </picture>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-[#63b647] hover:bg-blue-50 group">
                <h3 className="text-2xl font-semibold text-[#63b647] mb-6 text-center group-hover:text-blue-700">Academic Standards</h3>
                <div className="space-y-4 text-gray-600 leading-relaxed group-hover:text-blue-600">
                  <p>
                    A recent benchmarking study by UK NARIC confirmed that the International Certificate of Christian
                    Education (ICCEL) General and Advanced Certificates can be considered to be comparable to the
                    overall Cambridge International O and A Level standard respectively.
                  </p>
                </div>
              </div>

              <div className="md:col-span-2 bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-t-4 border-[#2c64ac]">
                <h3 className="text-2xl font-semibold text-[#2c64ac] mb-6 text-center">Available Certificates</h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {CERTIFICATES.map((cert) => (
                    <div key={cert.name} className="p-4 bg-gray-50 rounded-lg hover:bg-red-50 transition-colors duration-300 group">
                      <span className="block text-[#2c64ac] font-semibold text-center group-hover:text-red-600">{cert.name}</span>
                      <span className="text-sm text-gray-600 block text-center group-hover:text-red-500">{cert.detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-3 bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-[#2c64ac] hover:bg-green-50 group">
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="md:w-2/3 space-y-4">
                    <h3 className="text-2xl font-semibold text-[#2c64ac] mb-6 text-center md:text-left group-hover:text-green-700">
                      University Admission
                    </h3>
                    <div className="text-gray-600 leading-relaxed group-hover:text-green-600">
                      <p>
                        With the certificate from ICCE, students' results can be converted by UNEB to enable them to
                        attend universities in Uganda as well as around the world, in various courses.
                      </p>
                    </div>
                  </div>
                  <div className="md:w-1/3 flex justify-center mt-6 md:mt-0">
                    <img
                      src="assets/images/ICCE.jpg"
                      alt="ICCE Logo"
                      className="h-16 w-auto transform hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Curriculum Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Our Curriculum</h2>

            <div className="max-w-4xl mx-auto mb-16 space-y-8">
              {CURRICULUM_BLOCKS.map((block, index) => (
                <div
                  key={block.title || index}
                  className={`bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ${block.hover} group`}
                >
                  <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="md:w-3/4 space-y-4">
                      {block.title && (
                        <h3 className={`text-xl font-semibold text-[#2c64ac] mb-4 ${block.titleHover || ''}`}>{block.title}</h3>
                      )}
                      {(block.paragraphs || []).map((text) => (
                        <p key={text.slice(0, 40)} className={`text-gray-600 leading-relaxed mb-6 ${block.textHover}`}>
                          {text}
                        </p>
                      ))}
                      {(block.paragraphsJsx || []).map((jsx, i) => (
                        <p key={i} className={`text-gray-600 leading-relaxed ${block.textHover}`}>
                          {jsx}
                        </p>
                      ))}
                    </div>
                    <div className="md:w-1/4 flex justify-center mt-6 md:mt-0">
                      <img src={block.image.src} alt={block.image.alt} className={block.image.className} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {CURRICULUM_CARDS.map((card) => (
                <div key={card.title} className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mb-6 mx-auto overflow-hidden">
                    <img src={card.logo} alt={`${card.title} Logo`} className="h-full w-full object-contain" />
                  </div>
                  <h3 className="text-xl font-semibold text-center text-gray-800 mb-4">{card.title}</h3>
                  <ul className="space-y-3 text-gray-600">
                    {card.items.map((item) => (
                      <li key={item} className="flex items-center">
                        <CheckIcon color={card.checkColor} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Academic Levels Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Our Academic Levels</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {ACADEMIC_LEVELS.map((level) => (
                <div
                  key={level.title}
                  className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-t-4"
                  style={{ borderTopColor: level.color }}
                >
                  <div className="h-16 w-16 rounded-full flex items-center justify-center mb-6 mx-auto" style={{ backgroundColor: level.color }}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={level.iconPath} />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-center text-gray-800 mb-4">{level.title}</h3>
                  <p className="text-gray-600 text-center">{level.text}</p>
                  <div className="mt-4 text-center">
                    <span className="text-sm font-medium" style={{ color: level.color }}>
                      {level.ages}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Principal's Message */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)' }}>
              Principal's Message
            </h2>
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#2c64ac] to-[#63b647]"></div>
                <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-[#63b647] to-[#2c64ac]"></div>

                <div className="flex flex-col md:flex-row items-center mb-8">
                  <div className="md:w-1/3 mb-6 md:mb-0">
                    <img
                      src="assets/images/Principle.jpg"
                      alt="Principal's Message"
                      className="w-48 h-48 rounded-full mx-auto shadow-lg border-4 border-white"
                      style={{ objectFit: 'cover' }}
                    />
                    <h3 className="text-xl font-semibold text-center mt-4">Mr. Joshua Kisitu</h3>
                    <p className="text-gray-600 text-center">School Principal</p>
                  </div>

                  <div className="md:w-2/3 md:pl-8">
                    <div className="relative">
                      <svg
                        className="absolute top-0 left-0 transform -translate-x-6 -translate-y-6 w-12 h-12 text-gray-200"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                      </svg>
                      <div className="text-gray-600 leading-relaxed pl-8">
                        <p className="mb-4">Dear Parents, Students, and Visitors,</p>
                        <p className="mb-4">
                          Welcome to OrchardsWood International School, where we are committed to providing excellence
                          in Christian education. Our mission is to equip children for life and eternity, fostering an
                          environment where academic achievement goes hand in hand with spiritual growth and character
                          development.
                        </p>
                        <p className="mb-4">
                          At OIS, we believe in nurturing each student's unique God-given talents while maintaining
                          high academic standards through our ACE curriculum. Our approach combines Biblical
                          principles with modern educational practices, preparing students not just for academic
                          success, but for life's greater purpose.
                        </p>
                        <p>
                          We invite you to join our community where faith, learning, and excellence converge to shape
                          tomorrow's leaders.
                        </p>
                      </div>
                      <svg
                        className="absolute bottom-0 right-0 transform translate-x-6 translate-y-6 w-12 h-12 text-gray-200"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.57-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="text-right mt-6 pr-8">
                  <p className="text-gray-800 font-semibold">Yours in Christ's Service,</p>
                  <p className="text-gray-800 font-bold italic">Mr. Joshua Kisitu</p>
                  <p className="text-gray-600">Principal, OrchardsWood International School</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)' }}>
              Ready to Join Our Family?
            </h2>
            <p className="text-center text-gray-600 mb-12">
              Contact us to secure your child's admission and be part of our nurturing Christian education community.
            </p>
            <div className="flex justify-center space-x-4">
              <a href="apply.html" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                Apply Now
              </a>
              <a
                href={SCHEDULE_VISIT_URL}
                target="_blank"
                rel="noreferrer"
                className="bg-white text-ois-blue px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-300 shadow-lg transform hover:scale-105"
              >
                Schedule Visit
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
