// Default gallery content, ported from gallery.html. Items managed in the
// AMS gallery module are merged with these on the public gallery page.

export const DEFAULT_GALLERY_ITEMS = [
  {
    id: 'gal-academic-1',
    category: 'academic',
    image: 'assets/gallery/academic.png',
    webp: 'assets/gallery/academic.webp',
    alt: 'Science Lab',
    lightboxTitle: 'Empowering Minds through Science',
    title: 'Science Exploration',
    description: 'Discovering the wonders of chemistry in our modern lab.',
    showPlus: true,
  },
  {
    id: 'gal-sports-1',
    category: 'sports',
    image: 'assets/gallery/sports.png',
    webp: 'assets/gallery/sports.webp',
    alt: 'Basketball',
    lightboxTitle: 'Sports and Teamwork',
    title: 'Action on Court',
    description: 'Building resilience and sportsmanship through competition.',
  },
  {
    id: 'gal-events-1',
    category: 'events',
    image: 'assets/gallery/graduation.png',
    webp: 'assets/gallery/graduation.webp',
    alt: 'Graduation',
    lightboxTitle: 'Celebrating Achievement',
    title: 'Class of 2025',
    description: 'The culmination of hard work and dedication.',
  },
  {
    id: 'gal-facilities-1',
    category: 'facilities',
    image: 'assets/gallery/library.png',
    webp: 'assets/gallery/library.webp',
    alt: 'Library',
    lightboxTitle: 'Our Modern Library',
    title: 'Knowledge Hub',
    description: 'A peaceful space for research, reading, and innovation.',
  },
  {
    id: 'gal-academic-2',
    category: 'academic',
    image: 'assets/gallery/academic.png',
    alt: 'Classroom',
    lightboxTitle: 'In-depth Learning',
    title: 'Holistic Education',
    description: '',
  },
  {
    id: 'gal-facilities-2',
    category: 'facilities',
    image: 'assets/gallery/library.png',
    alt: 'Study',
    lightboxTitle: 'Study Spaces',
    title: 'Quiet Study',
    description: '',
  },
];

export const GALLERY_CATEGORIES = [
  { value: '*', label: 'All Moments' },
  { value: 'academic', label: 'Academic' },
  { value: 'sports', label: 'Sports' },
  { value: 'events', label: 'Events' },
  { value: 'facilities', label: 'Facilities' },
];
