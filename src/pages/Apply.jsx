import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import TopBar from '../components/TopBar.jsx';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { submitApplication } from '../ams/data/api.js';

gsap.registerPlugin(ScrollTrigger);

const GOOGLE_FORM_ACTION =
  'https://docs.google.com/forms/d/e/1FAIpQLSc6zPN-vjd1LEnZ0VOQMTqAMzZ3DX5Se3WIi52iE_KNe5KiKw/formResponse';

// Google Form entry IDs, kept identical to the original static form so
// submissions keep flowing into the same Google Form.
const ENTRY_IDS = {
  firstName: 'entry.815919982',
  lastName: 'entry.912546999',
  dob: 'entry.1821717898',
  gender: 'entry.871581122',
  parentName: 'entry.175758084',
  relationship: 'entry.2091123842',
  email: 'entry.815035143',
  phone: 'entry.1465615832',
  address: 'entry.456194374',
  previousSchool: 'entry.1088922330',
  gradeApplying: 'entry.895971051',
  specialNeeds: 'entry.2110072755',
  referralSource: 'entry.2110072755',
  comments: 'entry.1939134806',
};

const GRADES = [
  'Play Group',
  'Pre-School',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
  'Grade 13',
];

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  dob: '',
  gender: '',
  parentName: '',
  relationship: '',
  email: '',
  phone: '',
  address: '',
  previousSchool: '',
  gradeApplying: '',
  specialNeeds: '',
  referralSource: '',
  comments: '',
};

const VALIDATION_RULES = {
  firstName: {
    pattern: /^[a-zA-Z\s'-]{2,50}$/,
    message: 'Please enter a valid first name (2-50 characters, letters only)',
  },
  lastName: {
    pattern: /^[a-zA-Z\s'-]{2,50}$/,
    message: 'Please enter a valid last name (2-50 characters, letters only)',
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  },
  phone: {
    pattern: /^\+?[0-9\s-]{10,15}$/,
    message: 'Please enter a valid phone number (10-15 digits)',
  },
  dob: {
    validate: (value) => {
      const date = new Date(value);
      const now = new Date();
      const minDate = new Date();
      minDate.setFullYear(now.getFullYear() - 20);
      const maxDate = new Date();
      maxDate.setFullYear(now.getFullYear() - 2);
      return date >= minDate && date <= maxDate;
    },
    message: 'Please enter a valid date of birth (age between 2-20 years)',
  },
};

const SECTIONS = [
  {
    title: 'Personal Information',
    fields: ['firstName', 'lastName', 'dob', 'gender'],
  },
  {
    title: 'Parent/Guardian Information',
    fields: ['parentName', 'relationship', 'email', 'phone', 'address'],
  },
  {
    title: 'Academic Information',
    fields: ['previousSchool', 'gradeApplying', 'specialNeeds'],
  },
  {
    title: 'Additional Information',
    fields: ['referralSource', 'comments'],
  },
];

const REQUIRED_FIELDS = new Set([
  'firstName',
  'lastName',
  'dob',
  'gender',
  'parentName',
  'relationship',
  'email',
  'phone',
  'address',
  'gradeApplying',
]);

function Field({ id, label, required, error, children }) {
  return (
    <div className={`form-group${id === 'address' || id === 'specialNeeds' ? ' md:col-span-2' : ''}`}>
      <label htmlFor={id} className="form-label">
        {label} {required && <span className="required-star">*</span>}
      </label>
      {children}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default function Apply() {
  const rootRef = useRef(null);
  const formRef = useRef(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState(null); // 'success' | 'error' | null

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.nav-link', { opacity: 0, y: -20, duration: 0.5, stagger: 0.1, ease: 'power2.out' });
      gsap.from('footer .grid > div', {
        scrollTrigger: { trigger: 'footer', start: 'top 80%', toggleActions: 'play none none reverse' },
        opacity: 0,
        y: 30,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power2.out',
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const progress = useMemo(() => ((step + 1) / SECTIONS.length) * 100, [step]);

  const validateField = (name, value) => {
    const trimmed = (value ?? '').trim();
    if (REQUIRED_FIELDS.has(name) && !trimmed) {
      return name === 'gender' || name === 'relationship' || name === 'gradeApplying'
        ? 'Please select an option'
        : 'This field is required';
    }
    const rule = VALIDATION_RULES[name];
    if (rule && trimmed) {
      if (rule.pattern && !rule.pattern.test(trimmed)) return rule.message;
      if (rule.validate && !rule.validate(trimmed)) return rule.message;
    }
    return null;
  };

  const validateSection = (sectionIndex) => {
    const sectionErrors = {};
    SECTIONS[sectionIndex].fields.forEach((name) => {
      const error = validateField(name, form[name]);
      if (error) sectionErrors[name] = error;
    });
    setErrors((prev) => {
      const next = { ...prev };
      SECTIONS[sectionIndex].fields.forEach((name) => delete next[name]);
      return { ...next, ...sectionErrors };
    });
    return Object.keys(sectionErrors).length === 0;
  };

  const handleChange = (name) => (e) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      const error = validateField(name, value);
      if (error) next[name] = error;
      else delete next[name];
      return next;
    });
  };

  const goPrev = () => setStep((s) => Math.max(0, s - 1));
  const goNext = () => {
    if (validateSection(step) && step < SECTIONS.length - 1) {
      setStep(step + 1);
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allValid = SECTIONS.map((_, i) => validateSection(i)).every(Boolean);
    if (!allValid) return;

    setSubmitting(true);
    try {
      const params = new URLSearchParams();
      Object.entries(form).forEach(([name, value]) => {
        params.append(ENTRY_IDS[name], value);
      });
      // Google Forms does not send CORS headers; an opaque no-cors POST is the
      // standard way to submit from another site without leaving the page.
      await fetch(GOOGLE_FORM_ACTION, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      // Also record the application in the AMS so staff can review it there.
      try {
        await submitApplication({ ...form });
      } catch {
        // The Google Form submission is the source of truth; ignore AMS errors.
      }

      setModal('success');
    } catch {
      setModal('error');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    if (modal === 'success') {
      setForm(INITIAL_FORM);
      setErrors({});
      setStep(0);
    }
    setModal(null);
  };

  const inputProps = (name) => ({
    id: name,
    value: form[name],
    onChange: handleChange(name),
    onBlur: handleChange(name),
    className: `input-field${errors[name] ? ' error' : ''}`,
  });

  const section = SECTIONS[step];

  return (
    <div ref={rootRef}>
      <TopBar />
      <Header active="apply" />

      <main className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 hero-text" style={{ textShadow: '3px 3px 6px rgba(0, 0, 0, 0.2)' }}>
              <span className="gradient-text">Apply to OrchardsWood</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto fade-in">
              Take the first step towards providing your child with quality Christian education. Fill out the form
              below to begin your application process.
            </p>
          </div>

          <div className="application-container">
            <form ref={formRef} className="form-card" onSubmit={handleSubmit} noValidate>
              <div className="progress-bar" style={{ '--progress': `${progress}%` }}></div>

              <div className="form-section">
                <h2 className="section-title">
                  {section.title}
                  <span className="number">{step + 1}</span>
                </h2>

                {step === 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field id="firstName" label="First Name" required error={errors.firstName}>
                      <input type="text" {...inputProps('firstName')} placeholder="Enter student's first name" />
                    </Field>
                    <Field id="lastName" label="Last Name" required error={errors.lastName}>
                      <input type="text" {...inputProps('lastName')} placeholder="Enter student's last name" />
                    </Field>
                    <Field id="dob" label="Date of Birth" required error={errors.dob}>
                      <input type="date" {...inputProps('dob')} />
                    </Field>
                    <Field id="gender" label="Gender" required error={errors.gender}>
                      <select {...inputProps('gender')}>
                        <option value="">Select student's gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </Field>
                  </div>
                )}

                {step === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field id="parentName" label="Parent/Guardian Name" required error={errors.parentName}>
                      <input type="text" {...inputProps('parentName')} placeholder="Enter parent/guardian's full name" />
                    </Field>
                    <Field id="relationship" label="Relationship to Student" required error={errors.relationship}>
                      <select {...inputProps('relationship')}>
                        <option value="">Select your relationship to the student</option>
                        <option value="Mother">Mother</option>
                        <option value="Father">Father</option>
                        <option value="Legal Guardian">Legal Guardian</option>
                        <option value="Other">Other</option>
                      </select>
                    </Field>
                    <Field id="email" label="Email Address" required error={errors.email}>
                      <input type="email" {...inputProps('email')} placeholder="e.g., parent@example.com" />
                    </Field>
                    <Field id="phone" label="Phone Number" required error={errors.phone}>
                      <input type="tel" {...inputProps('phone')} placeholder="e.g., +256 700 000000" />
                    </Field>
                    <Field id="address" label="Physical Address" required error={errors.address}>
                      <textarea
                        {...inputProps('address')}
                        placeholder="Enter your complete residential address including district and city"
                      />
                    </Field>
                  </div>
                )}

                {step === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field id="previousSchool" label="Current/Previous School" error={errors.previousSchool}>
                      <input type="text" {...inputProps('previousSchool')} placeholder="Enter name of current or previous school" />
                    </Field>
                    <Field id="gradeApplying" label="Grade Applying For" required error={errors.gradeApplying}>
                      <select {...inputProps('gradeApplying')}>
                        <option value="">Select the grade you're applying for</option>
                        {GRADES.map((grade) => (
                          <option key={grade} value={grade}>
                            {grade === 'Play Group' ? 'Play Group (Ages 2-3)' : grade === 'Pre-School' ? 'Pre-School (Ages 3-5)' : grade}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field id="specialNeeds" label="Any Special Educational Needs or Requirements?" error={errors.specialNeeds}>
                      <textarea
                        {...inputProps('specialNeeds')}
                        rows="3"
                        placeholder="Please describe any special educational needs, medical conditions, or specific requirements"
                      />
                    </Field>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <Field id="referralSource" label="How did you hear about OrchardsWood International School?" error={errors.referralSource}>
                      <select {...inputProps('referralSource')}>
                        <option value="">Select how you heard about us</option>
                        <option value="School Website">School Website</option>
                        <option value="Social Media">Social Media</option>
                        <option value="Friend/Family">Friend/Family</option>
                        <option value="Advertisement">Advertisement</option>
                        <option value="Other">Other</option>
                      </select>
                    </Field>
                    <Field id="comments" label="Any Additional Comments or Questions?" error={errors.comments}>
                      <textarea
                        {...inputProps('comments')}
                        rows="4"
                        placeholder="Share any additional information, questions, or specific concerns you may have"
                      />
                    </Field>
                  </div>
                )}
              </div>

              <div className="button-container">
                <button
                  type="button"
                  onClick={goPrev}
                  className="bg-ois-blue text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200"
                  style={{ display: step === 0 ? 'none' : 'block' }}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="bg-ois-blue text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200"
                  style={{ display: step === SECTIONS.length - 1 ? 'none' : 'block' }}
                >
                  Next
                </button>
                {step === SECTIONS.length - 1 && (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-ois-blue text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200"
                  >
                    {submitting ? (
                      <>
                        <span className="spinner"></span> Submitting...
                      </>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>

      {modal === 'success' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md mx-4">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Application Submitted!</h3>
            <p className="text-gray-600 mb-6">
              Thank you for applying to OrchardsWood International School. We will review your application and contact
              you soon.
            </p>
            <button
              onClick={closeModal}
              className="bg-[#2c64ac] text-white px-6 py-2 rounded-lg hover:bg-[#63b647] transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {modal === 'error' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md mx-4">
            <h3 className="text-2xl font-bold text-red-600 mb-4">Submission Error</h3>
            <p className="text-gray-600 mb-6">
              There was an error submitting your application. Please try again later or contact us directly.
            </p>
            <button onClick={closeModal} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200">
              Close
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
