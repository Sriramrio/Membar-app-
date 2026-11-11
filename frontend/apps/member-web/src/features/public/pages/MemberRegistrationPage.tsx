import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Save, 
  ArrowRight, 
  ArrowLeft, 
  Building2, 
  UserCheck, 
  CreditCard, 
  ShieldCheck, 
  Sparkles, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/common/Input';
import { PublicCard, PublicShell } from '../components/PublicShell';
import { toast } from '@/components/ui/Toast';
import { localStorageService } from '@/services/storage/localStorage';
import { cn } from '@/utils/cn';
import { categoriesApi, type CategorySectorDto } from '@/services/api/categoriesApi';

const STORAGE_KEY = 'dbn_member_registration_draft_v1';

export const VALIDATION_RULES = {
  // Mobile: 10 digits starting with 6, 7, 8, 9
  cleanMobile: (val: string) => val.replace(/[\s\-()]/g, '').replace(/^(\+91|91|0)/, ''),
  isValidMobile: (val: string) => {
    const cleaned = val.replace(/[\s\-()]/g, '').replace(/^(\+91|91|0)/, '');
    return /^[6-9]\d{9}$/.test(cleaned);
  },

  // Email: RFC email pattern
  isValidEmail: (val: string) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val.trim());
  },

  // Indian PIN code: 6 digits starting with 1-9
  isValidPinCode: (val: string) => {
    return /^[1-9][0-9]{5}$/.test(val.trim());
  },

  // Date of Birth: Must be >= 18 years old and not in future
  isValidDob: (val: string) => {
    if (!val) return false;
    const dob = new Date(val);
    if (isNaN(dob.getTime())) return false;
    const today = new Date();
    if (dob > today) return false;
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 18 && age <= 100;
  },

  // GSTIN: 15 alphanumeric characters
  isValidGstin: (val: string) => {
    if (!val.trim()) return true;
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(val.trim());
  },

  // Year established
  isValidYear: (val: number | '' | string) => {
    if (!val) return true;
    const num = Number(val);
    const curYear = new Date().getFullYear();
    return num >= 1800 && num <= curYear;
  },

  // Website / LinkedIn URL
  isValidUrl: (val: string) => {
    if (!val.trim()) return true;
    return /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/i.test(val.trim());
  }
};

export interface DbnRegistrationFormState {
  // A. MEMBERSHIP & BASIC DETAILS
  applicantFullName: string;
  dateOfBirth: string;
  mobileNumber: string;
  email: string;
  residentialAddress: string;
  residentialCity: string;
  residentialPinCode: string;
  preferredChapter: string;

  // B. BUSINESS INFORMATION
  businessName: string;
  applicantDesignation: string;
  primaryBusinessCategory: string;
  sectorId: string;
  sectorName: string;
  segmentId: string;
  segmentName: string;
  specialisationId: string;
  specialisationName: string;
  productsServicesOffered: string;
  yearEstablished: number | '';
  employeeCountRange: string;
  businessAddress: string;
  businessCity: string;
  businessPinCode: string;
  gstin: string;
  websiteOrLinkedIn: string;
  connectionsCanGive: string[];
  connectionsOtherText: string;

  // C. PERSONAL & COMMUNITY DETAILS
  fatherName: string;
  gothram: string;
  hobbiesInterests: string;
  specialMention: string;

  // D. BUSINESS & NETWORKING PROFILE
  businessDescription: string;
  idealCustomer1: string;
  idealCustomer2: string;
  idealCustomer3: string;
  businessConnectionsSought: string;
  geographicMarketsServed: string[];
  geographicMarketOtherText: string;
  keyDifferentiator: string;
  businessContactEmail: string;

  // E. MEMBERSHIP DECLARATION & CONSENT
  agreeRules: boolean;
  accuracyConfirmed: boolean;
  useOfInfoConsent: boolean;
  birthdayGreetingConsent: boolean;
  voluntaryContributionConsent: boolean;
  declarationDate: string;
  electronicSignature: string;

  // F. PAYMENT DETAILS
  paymentMode: 'UPI' | 'NEFT' | 'Cheque';
  upiReference: string;
  neftReference: string;
  chequeNumber: string;
  chequeDate: string;
}

const defaultState: DbnRegistrationFormState = {
  applicantFullName: '',
  dateOfBirth: '',
  mobileNumber: '',
  email: '',
  residentialAddress: '',
  residentialCity: '',
  residentialPinCode: '',
  preferredChapter: 'Hosur Chapter',

  businessName: '',
  applicantDesignation: '',
  primaryBusinessCategory: '',
  sectorId: '',
  sectorName: '',
  segmentId: '',
  segmentName: '',
  specialisationId: '',
  specialisationName: '',
  productsServicesOffered: '',
  yearEstablished: '',
  employeeCountRange: '1–5',
  businessAddress: '',
  businessCity: '',
  businessPinCode: '',
  gstin: '',
  websiteOrLinkedIn: '',
  connectionsCanGive: [],
  connectionsOtherText: '',

  fatherName: '',
  gothram: '',
  hobbiesInterests: '',
  specialMention: '',

  businessDescription: '',
  idealCustomer1: '',
  idealCustomer2: '',
  idealCustomer3: '',
  businessConnectionsSought: '',
  geographicMarketsServed: [],
  geographicMarketOtherText: '',
  keyDifferentiator: '',
  businessContactEmail: '',

  agreeRules: false,
  accuracyConfirmed: false,
  useOfInfoConsent: false,
  birthdayGreetingConsent: true,
  voluntaryContributionConsent: false,
  declarationDate: new Date().toISOString().split('T')[0],
  electronicSignature: '',

  paymentMode: 'UPI',
  upiReference: '',
  neftReference: '',
  chequeNumber: '',
  chequeDate: ''
};

export default function MemberRegistrationPage() {
  const [form, setForm] = useState<DbnRegistrationFormState>(() => {
    try {
      const saved = localStorageService.get<DbnRegistrationFormState>(STORAGE_KEY);
      if (saved) return { ...defaultState, ...saved };
    } catch {
      // Ignore fallback
    }
    return defaultState;
  });

  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<{ id: string; fullName: string; chapter: string; date: string } | null>(null);
  const [chapters, setChapters] = useState<{ id: string; name: string }[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categoriesTree, setCategoriesTree] = useState<CategorySectorDto[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;
    async function fetchTaxonomy() {
      try {
        const data = await categoriesApi.getCategories(controller.signal);
        if (mounted && Array.isArray(data) && data.length > 0) {
          setCategoriesTree(data);
          return;
        }
      } catch {}
      try {
        const r1 = await fetch('/api/categories', { signal: controller.signal });
        if (r1.ok) {
          const d1 = await r1.json();
          if (mounted && Array.isArray(d1) && d1.length > 0) {
            setCategoriesTree(d1);
            return;
          }
        }
      } catch {}
      try {
        const r2 = await fetch('https://sethudbnapi.dharmicbusines.com', { signal: controller.signal });
        if (r2.ok) {
          const d2 = await r2.json();
          if (mounted && Array.isArray(d2)) {
            setCategoriesTree(d2);
          }
        }
      } catch {}
    }
    void fetchTaxonomy();
    return () => { mounted = false; controller.abort(); };
  }, []);

  const updateField = <K extends keyof DbnRegistrationFormState>(field: K, value: DbnRegistrationFormState[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateField = (field: string) => {
    let err = '';
    switch (field) {
      case 'applicantFullName':
        if (!form.applicantFullName.trim()) err = 'Applicant full name is required.';
        else if (form.applicantFullName.trim().length < 3) err = 'Full name must be at least 3 characters.';
        break;
      case 'dateOfBirth':
        if (!form.dateOfBirth) err = 'Date of birth is required.';
        else if (!VALIDATION_RULES.isValidDob(form.dateOfBirth)) {
          const dob = new Date(form.dateOfBirth);
          if (dob > new Date()) err = 'Date of birth cannot be in the future.';
          else err = 'Applicant must be at least 18 years old to join DBN.';
        }
        break;
      case 'mobileNumber':
        if (!form.mobileNumber.trim()) err = 'Mobile number is required.';
        else if (!VALIDATION_RULES.isValidMobile(form.mobileNumber)) {
          err = 'Enter a valid 10-digit mobile number (e.g. 9876543210).';
        }
        break;
      case 'email':
        if (!form.email.trim()) err = 'Email address is required.';
        else if (!VALIDATION_RULES.isValidEmail(form.email)) {
          err = 'Enter a valid email address (e.g. applicant@domain.com).';
        }
        break;
      case 'residentialAddress':
        if (!form.residentialAddress.trim()) err = 'Residential address is required.';
        else if (form.residentialAddress.trim().length < 5) err = 'Address must be at least 5 characters.';
        break;
      case 'residentialCity':
        if (!form.residentialCity.trim()) err = 'City / locality is required.';
        else if (form.residentialCity.trim().length < 2) err = 'City must be at least 2 characters.';
        break;
      case 'residentialPinCode':
        if (!form.residentialPinCode.trim()) err = 'PIN code is required.';
        else if (!VALIDATION_RULES.isValidPinCode(form.residentialPinCode)) {
          err = 'PIN code must be exactly 6 digits (e.g. 600001).';
        }
        break;
      case 'preferredChapter':
        if (!form.preferredChapter) err = 'Please select a chapter.';
        break;
      case 'businessName':
        if (!form.businessName.trim()) err = 'Business / Organisation name is required.';
        else if (form.businessName.trim().length < 2) err = 'Business name must be at least 2 characters.';
        break;
      case 'applicantDesignation':
        if (!form.applicantDesignation.trim()) err = 'Applicant designation is required.';
        break;
      case 'sectorId':
        if (!form.sectorId) err = 'Industry / Sector is required.';
        break;
      case 'segmentId':
        if (!form.segmentId) err = 'Business Group / Segment is required.';
        break;
      case 'specialisationId':
        if (!form.specialisationId) err = 'Business Category / Specialisation is required.';
        break;
      case 'primaryBusinessCategory':
        if (!form.specialisationId && !form.primaryBusinessCategory.trim()) err = 'Primary business category is required.';
        break;
      case 'yearEstablished':
        if (form.yearEstablished && !VALIDATION_RULES.isValidYear(form.yearEstablished)) {
          err = `Year established must be between 1800 and ${new Date().getFullYear()}.`;
        }
        break;
      case 'productsServicesOffered':
        if (!form.productsServicesOffered.trim()) err = 'Products/services description is required.';
        else if (form.productsServicesOffered.trim().length < 5) err = 'Please describe products/services in at least 5 characters.';
        break;
      case 'businessAddress':
        if (!form.businessAddress.trim()) err = 'Business address is required.';
        else if (form.businessAddress.trim().length < 5) err = 'Business address must be at least 5 characters.';
        break;
      case 'businessCity':
        if (!form.businessCity.trim()) err = 'City / locality is required.';
        else if (form.businessCity.trim().length < 2) err = 'City must be at least 2 characters.';
        break;
      case 'businessPinCode':
        if (!form.businessPinCode.trim()) err = 'Business PIN code is required.';
        else if (!VALIDATION_RULES.isValidPinCode(form.businessPinCode)) {
          err = 'PIN code must be exactly 6 digits (e.g. 600001).';
        }
        break;
      case 'gstin':
        if (form.gstin.trim() && !VALIDATION_RULES.isValidGstin(form.gstin)) {
          err = 'Invalid GSTIN format (15 characters, e.g. 33AAAAA0000A1Z5).';
        }
        break;
      case 'websiteOrLinkedIn':
        if (form.websiteOrLinkedIn.trim() && !VALIDATION_RULES.isValidUrl(form.websiteOrLinkedIn)) {
          err = 'Please enter a valid website or profile URL.';
        }
        break;
      case 'businessDescription':
        if (!form.businessDescription.trim()) err = 'Business description is required.';
        else if (form.businessDescription.trim().length < 20) {
          err = 'Please provide a more descriptive summary (at least 20 characters).';
        }
        break;
      case 'keyDifferentiator':
        if (!form.keyDifferentiator.trim()) err = 'Key differentiator (USP) is required.';
        else if (form.keyDifferentiator.trim().length < 5) err = 'Please explain your USP (at least 5 characters).';
        break;
      case 'businessContactEmail':
        if (form.businessContactEmail.trim() && !VALIDATION_RULES.isValidEmail(form.businessContactEmail)) {
          err = 'Enter a valid business email address.';
        }
        break;
      default:
        break;
    }

    setErrors(prev => {
      if (err) return { ...prev, [field]: err };
      const next = { ...prev };
      delete next[field];
      return next;
    });
    return !err;
  };

  useEffect(() => {
    let mounted = true;
    async function loadChapters() {
      setLoadingChapters(true);
      try {
        const res = await fetch('/api/chapters');
        if (res.ok) {
          const data = await res.json();
          if (mounted && Array.isArray(data) && data.length > 0) {
            setChapters(data.map((c: any) => ({ id: c.id, name: c.name })));
            if (!form.preferredChapter || !data.some((c: any) => c.name === form.preferredChapter)) {
              setForm(prev => ({ ...prev, preferredChapter: data[0].name }));
            }
          }
        }
      } catch (err) {
        console.error('Failed to load chapters for registration form', err);
      } finally {
        if (mounted) setLoadingChapters(false);
      }
    }
    loadChapters();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    try {
      localStorageService.set(STORAGE_KEY, form);
    } catch {
      // storage may fail in restricted sandboxes
    }
  }, [form]);

  const toggleConnection = (item: string) => {
    setForm(prev => {
      const exists = prev.connectionsCanGive.includes(item);
      return {
        ...prev,
        connectionsCanGive: exists
          ? prev.connectionsCanGive.filter(x => x !== item)
          : [...prev.connectionsCanGive, item]
      };
    });
  };

  const toggleMarket = (market: string) => {
    setForm(prev => {
      const exists = prev.geographicMarketsServed.includes(market);
      return {
        ...prev,
        geographicMarketsServed: exists
          ? prev.geographicMarketsServed.filter(x => x !== market)
          : [...prev.geographicMarketsServed, market]
      };
    });
  };

  const handleSaveDraft = () => {
    try {
      localStorageService.set(STORAGE_KEY, form);
      toast.success('Registration draft saved locally on this browser.');
    } catch {
      toast.error('Unable to save draft in this browser session.');
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!form.applicantFullName.trim()) {
      newErrors.applicantFullName = 'Applicant full name is required.';
    } else if (form.applicantFullName.trim().length < 3) {
      newErrors.applicantFullName = 'Full name must be at least 3 characters.';
    }

    if (!form.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required.';
    } else if (!VALIDATION_RULES.isValidDob(form.dateOfBirth)) {
      const dob = new Date(form.dateOfBirth);
      if (dob > new Date()) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future.';
      } else {
        newErrors.dateOfBirth = 'Applicant must be at least 18 years old to join DBN.';
      }
    }

    if (!form.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required.';
    } else if (!VALIDATION_RULES.isValidMobile(form.mobileNumber)) {
      newErrors.mobileNumber = 'Enter a valid 10-digit mobile number (e.g. 9876543210).';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!VALIDATION_RULES.isValidEmail(form.email)) {
      newErrors.email = 'Enter a valid email address (e.g. applicant@domain.com).';
    }

    if (!form.residentialAddress.trim()) {
      newErrors.residentialAddress = 'Residential address is required.';
    } else if (form.residentialAddress.trim().length < 5) {
      newErrors.residentialAddress = 'Address must be at least 5 characters.';
    }

    if (!form.residentialCity.trim()) {
      newErrors.residentialCity = 'City / locality is required.';
    } else if (form.residentialCity.trim().length < 2) {
      newErrors.residentialCity = 'City must be at least 2 characters.';
    }

    if (!form.residentialPinCode.trim()) {
      newErrors.residentialPinCode = 'PIN code is required.';
    } else if (!VALIDATION_RULES.isValidPinCode(form.residentialPinCode)) {
      newErrors.residentialPinCode = 'PIN code must be exactly 6 digits (e.g. 600001).';
    }

    if (!form.preferredChapter) {
      newErrors.preferredChapter = 'Please select a chapter.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!form.businessName.trim()) {
      newErrors.businessName = 'Business / Organisation name is required.';
    } else if (form.businessName.trim().length < 2) {
      newErrors.businessName = 'Business name must be at least 2 characters.';
    }

    if (!form.applicantDesignation.trim()) {
      newErrors.applicantDesignation = 'Applicant designation is required.';
    }

    if (!form.sectorId) {
      newErrors.sectorId = 'Industry / Sector is required.';
    }
    if (!form.segmentId) {
      newErrors.segmentId = 'Business Group / Segment is required.';
    }
    if (!form.specialisationId) {
      newErrors.specialisationId = 'Business Category / Specialisation slot is required.';
    }
    if (!form.primaryBusinessCategory.trim() && !form.specialisationId) {
      newErrors.primaryBusinessCategory = 'Primary business category is required.';
    }

    if (form.yearEstablished && !VALIDATION_RULES.isValidYear(form.yearEstablished)) {
      newErrors.yearEstablished = `Year established must be between 1800 and ${new Date().getFullYear()}.`;
    }

    if (!form.productsServicesOffered.trim()) {
      newErrors.productsServicesOffered = 'Products/services description is required.';
    } else if (form.productsServicesOffered.trim().length < 5) {
      newErrors.productsServicesOffered = 'Please describe products/services in at least 5 characters.';
    }

    if (!form.businessAddress.trim()) {
      newErrors.businessAddress = 'Business address is required.';
    } else if (form.businessAddress.trim().length < 5) {
      newErrors.businessAddress = 'Business address must be at least 5 characters.';
    }

    if (!form.businessCity.trim()) {
      newErrors.businessCity = 'City / locality is required.';
    } else if (form.businessCity.trim().length < 2) {
      newErrors.businessCity = 'City must be at least 2 characters.';
    }

    if (!form.businessPinCode.trim()) {
      newErrors.businessPinCode = 'Business PIN code is required.';
    } else if (!VALIDATION_RULES.isValidPinCode(form.businessPinCode)) {
      newErrors.businessPinCode = 'PIN code must be exactly 6 digits (e.g. 600001).';
    }

    if (form.gstin.trim() && !VALIDATION_RULES.isValidGstin(form.gstin)) {
      newErrors.gstin = 'Invalid GSTIN format (15 characters, e.g. 33AAAAA0000A1Z5).';
    }

    if (form.websiteOrLinkedIn.trim() && !VALIDATION_RULES.isValidUrl(form.websiteOrLinkedIn)) {
      newErrors.websiteOrLinkedIn = 'Please enter a valid website or profile URL.';
    }

    if (!form.businessDescription.trim()) {
      newErrors.businessDescription = 'Business description is required.';
    } else if (form.businessDescription.trim().length < 20) {
      newErrors.businessDescription = 'Please provide a more descriptive summary (at least 20 characters).';
    }

    if (!form.keyDifferentiator.trim()) {
      newErrors.keyDifferentiator = 'Key differentiator (USP) is required.';
    } else if (form.keyDifferentiator.trim().length < 5) {
      newErrors.keyDifferentiator = 'Please explain your USP (at least 5 characters).';
    }

    if (form.businessContactEmail.trim() && !VALIDATION_RULES.isValidEmail(form.businessContactEmail)) {
      newErrors.businessContactEmail = 'Enter a valid business email address.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateStep1()) {
      setStep(1);
      return;
    }

    if (!validateStep2()) {
      setStep(2);
      return;
    }

    setBusy(true);

    const payload = {
      applicantFullName: form.applicantFullName,
      dateOfBirth: form.dateOfBirth,
      mobileNumber: form.mobileNumber,
      email: form.email,
      residentialAddress: form.residentialAddress,
      residentialCity: form.residentialCity,
      residentialPinCode: form.residentialPinCode,

      businessName: form.businessName,
      applicantDesignation: form.applicantDesignation,
      primaryBusinessCategory: form.specialisationName || form.primaryBusinessCategory,
      sectorId: form.sectorId || null,
      sectorName: form.sectorName || null,
      segmentId: form.segmentId || null,
      segmentName: form.segmentName || null,
      specialisationId: form.specialisationId || null,
      specialisationName: form.specialisationName || null,
      productsServicesOffered: form.productsServicesOffered,
      yearEstablished: String(form.yearEstablished || 2024),
      employeeCountRange: form.employeeCountRange,
      businessAddress: form.businessAddress,
      businessCity: form.businessCity,
      businessPinCode: form.businessPinCode,
      gstin: form.gstin,
      websiteOrLinkedIn: form.websiteOrLinkedIn,
      connectionsCanGive: form.connectionsCanGive.concat(form.connectionsOtherText ? [form.connectionsOtherText] : []),
      connectionsCanGiveJson: JSON.stringify(form.connectionsCanGive.concat(form.connectionsOtherText ? [form.connectionsOtherText] : [])),

      fatherName: form.fatherName,
      gothram: form.gothram,
      hobbiesInterests: form.hobbiesInterests,
      specialMention: form.specialMention,

      businessDescription: form.businessDescription,
      idealCustomerProfiles: [form.idealCustomer1, form.idealCustomer2, form.idealCustomer3].filter(Boolean),
      idealCustomerProfilesJson: JSON.stringify([form.idealCustomer1, form.idealCustomer2, form.idealCustomer3].filter(Boolean)),
      businessConnectionsSought: form.businessConnectionsSought,
      geographicMarketsServed: form.geographicMarketsServed.concat(form.geographicMarketOtherText ? [form.geographicMarketOtherText] : []),
      geographicMarketsServedJson: JSON.stringify(form.geographicMarketsServed.concat(form.geographicMarketOtherText ? [form.geographicMarketOtherText] : [])),
      keyDifferentiator: form.keyDifferentiator,
      businessContactEmail: form.businessContactEmail || form.email,

      agreedToGuidelines: true,
      informationAccurate: true,
      dataUsageConsent: true,
      birthdayGreetingConsent: true,
      birthdayGreetingsConsent: true,
      voluntaryContributionAcknowledged: true,
      declarationDate: new Date().toISOString().split('T')[0],
      electronicSignature: form.applicantFullName,

      donationAmount: 0,
      paymentMode: 'Pending',
      neftReference: '',
      upiReference: '',
      chequeNumber: '',
      chequeDate: '',
      bankFavoring: 'Dharmic Business Network Trust',
      chapterName: form.preferredChapter
    };

    try {
      const randArr = new Uint32Array(1);
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(randArr);
      }
      const randNum = 100000 + (randArr[0] % 900000);
      let regId = `DBN-APP-${randNum}`;

      // Attempt live backend post if available
      try {
        let res = await fetch('/api/membership/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          res = await fetch('/api/membership/dbn-register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }
        if (res.ok) {
          const data = await res.json();
          if (data?.id) regId = data.id;
        }
      } catch (e) {
        void e;
      }

      // Also store in applications cache for organisation-web review
      try {
        const existing = localStorageService.get<any[]>('dbn_applications_db') || [];
        existing.unshift({
          id: regId,
          ...payload,
          stage: 'Submitted',
          createdAt: new Date().toISOString()
        });
        localStorageService.set('dbn_applications_db', existing);
      } catch (e) {
        void e;
      }

      localStorageService.remove(STORAGE_KEY);
      setSubmittedApp({
        id: regId,
        fullName: form.applicantFullName,
        chapter: form.preferredChapter,
        date: new Date().toLocaleDateString('en-GB')
      });
      toast.success('Registration submitted successfully!');
    } catch (e) {
      void e;
      toast.error('Submission failed. Please check your network connection.');
    } finally {
      setBusy(false);
    }
  };

  if (submittedApp) {
    return (
      <PublicShell compact>
        <div className="mx-auto max-w-3xl">
          <PublicCard>
            <div className="text-center py-6">
              <div className="inline-flex size-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-5 shadow-inner">
                <CheckCircle2 className="size-10" />
              </div>
              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                Application Submitted
              </span>
              <h1 className="text-3xl font-black text-slate-900">
                DHARMIC BUSINESS NETWORK (DBN)
              </h1>
              <p className="text-lg font-bold text-amber-700 mt-1">SRI MATRE CHAPTER</p>
              
              <div className="mt-6 p-5 bg-slate-50 border border-slate-200 rounded-2xl text-left">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold block">Application Reference</span>
                    <span className="font-mono font-bold text-slate-900 text-base">{submittedApp.id}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold block">Applicant Name</span>
                    <span className="font-bold text-slate-900 text-base">{submittedApp.fullName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold block">Parivar Assigned</span>
                    <span className="font-bold text-slate-900 text-base">{submittedApp.chapter}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold block">Submission Date</span>
                    <span className="font-bold text-slate-900 text-base">{submittedApp.date}</span>
                  </div>
                </div>
              </div>

              {/* Three-stage governance workflow tracker */}
              <div className="mt-8 text-left border-t border-slate-200 pt-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
                  Multi-Stage Verification & Approval Governance
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-blue-200 bg-blue-50/70">
                    <div className="size-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">1</div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Document Verification</div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Reviewed & verified by the <strong>Member Coordinator</strong>, <strong>President</strong>, or <strong>Secretary</strong> of {submittedApp.chapter}.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="size-7 rounded-full bg-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">2</div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Parivar Member Approval</div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Approval is strictly granted by the <strong>President</strong>, <strong>Secretary</strong>, or <strong>Vice President</strong>.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="size-7 rounded-full bg-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">3</div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Trust Payment Verification & Activation</div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        The donation of Rs 6,000/- is verified directly by <strong>Dharmic Business Network Trust</strong> (Tenant of the chapter). Upon verification, your official <strong>Member ID</strong> is issued.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-center gap-3">
                <Link to="/" className="btn px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors">
                  Return to Home
                </Link>
                <Link to="/login" className="btn px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors">
                  Member Portal Login
                </Link>
              </div>
            </div>
          </PublicCard>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <div className="mx-auto max-w-4xl">
        {/* Form Header */}
        <div className="mb-6 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
              <Sparkles className="size-3.5" /> Official Chapter Admission
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white">
              DHARMIC BUSINESS NETWORK (DBN) – SRI MATRE
            </h1>
            <p className="mt-1 text-base font-bold text-amber-400">
              BHANDHU REGISTRATION FORM
            </p>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Please provide concise details to help DBN bhandhu  understand your business and make relevant connections.
            </p>
          </div>

          {/* Stepper Navigation: 2 Steps (Step 3 Payment & Rules removed) */}
          <div className="mt-8 grid grid-cols-2 gap-2 sm:gap-4 border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`flex items-center gap-2 p-2.5 rounded-xl text-left transition-all ${
                step === 1 ? 'bg-amber-400 text-slate-950 font-bold shadow-md' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <UserCheck className="size-4 shrink-0" />
              <div className="truncate">
                <span className="block text-[10px] uppercase opacity-75">Step 1</span>
                <span className="text-xs font-bold truncate">A & C: Personal Info</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => { if (validateStep1()) setStep(2); }}
              className={`flex items-center gap-2 p-2.5 rounded-xl text-left transition-all ${
                step === 2 ? 'bg-amber-400 text-slate-950 font-bold shadow-md' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <Building2 className="size-4 shrink-0" />
              <div className="truncate">
                <span className="block text-[10px] uppercase opacity-75">Step 2</span>
                <span className="text-xs font-bold truncate">B & D: Business Info</span>
              </div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* STEP 1: A. MEMBERSHIP & BASIC DETAILS & C. PERSONAL & COMMUNITY DETAILS */}
          {step === 1 && (
            <div className="space-y-6">
              <PublicCard>
                <div className="border-b border-slate-200 pb-3 mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <span className="size-6 rounded-lg bg-blue-600 text-white text-xs flex items-center justify-center">A</span>
                      MEMBERSHIP & BASIC DETAILS
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Primary identification and residential coordinates</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-md text-slate-600">Page 1 of 2</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input 
                    label="Applicant’s Full Name *" 
                    required 
                    value={form.applicantFullName} 
                    onChange={e => updateField('applicantFullName', e.target.value)}
                    onBlur={() => validateField('applicantFullName')}
                    error={errors.applicantFullName}
                    placeholder="As per official identification" 
                  />

                  <Input 
                    label="Date of Birth (DD-MM-YYYY) *" 
                    required 
                    type="date"
                    value={form.dateOfBirth} 
                    onChange={e => updateField('dateOfBirth', e.target.value)} 
                    onBlur={() => validateField('dateOfBirth')}
                    error={errors.dateOfBirth}
                    max={new Date().toISOString().split('T')[0]}
                  />

                  <Input 
                    label="Mobile Number (+91) *" 
                    required 
                    type="tel"
                    value={form.mobileNumber} 
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                      updateField('mobileNumber', v);
                    }}
                    onBlur={() => validateField('mobileNumber')}
                    error={errors.mobileNumber}
                    placeholder="9876543210 (10 digits)" 
                    maxLength={10}
                  />

                  <Input 
                    label="Email Address *" 
                    required 
                    type="email"
                    value={form.email} 
                    onChange={e => updateField('email', e.target.value)}
                    onBlur={() => validateField('email')}
                    error={errors.email}
                    placeholder="applicant@domain.com" 
                  />

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Residential Address <span className="text-red-500 font-bold">*</span>
                    </label>
                    <textarea 
                      required 
                      rows={2}
                      className={cn(
                        'w-full rounded-xl border px-3 py-2 text-sm focus:outline-none transition',
                        errors.residentialAddress
                          ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-2 focus:ring-red-100'
                          : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                      )}
                      value={form.residentialAddress}
                      onChange={e => updateField('residentialAddress', e.target.value)}
                      onBlur={() => validateField('residentialAddress')}
                      placeholder="Door / Flat No., Street, Area"
                    />
                    {errors.residentialAddress && (
                      <span className="flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 mt-1">
                        <AlertCircle className="size-3.5 shrink-0 text-red-600" />
                        <span>{errors.residentialAddress}</span>
                      </span>
                    )}
                  </div>

                  <Input 
                    label="City / Locality *" 
                    required 
                    value={form.residentialCity} 
                    onChange={e => updateField('residentialCity', e.target.value)}
                    onBlur={() => validateField('residentialCity')}
                    error={errors.residentialCity}
                    placeholder="e.g. Chennai / Hosur" 
                  />

                  <Input 
                    label="PIN Code *" 
                    required 
                    value={form.residentialPinCode} 
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                      updateField('residentialPinCode', v);
                    }}
                    onBlur={() => validateField('residentialPinCode')}
                    error={errors.residentialPinCode}
                    placeholder="600001 (6 digits)" 
                    maxLength={6}
                  />

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Select Chapter <span className="text-red-500 font-bold">*</span>
                    </label>
                    <select 
                      className={cn(
                        'w-full rounded-xl border px-3 py-2 text-sm bg-white focus:outline-none min-h-[44px] transition',
                        errors.preferredChapter
                          ? 'border-red-500 bg-red-50/20 focus:border-red-600'
                          : 'border-slate-300 focus:border-blue-500'
                      )}
                      value={form.preferredChapter}
                      onChange={e => updateField('preferredChapter', e.target.value)}
                      onBlur={() => validateField('preferredChapter')}
                      disabled={loadingChapters}
                      required
                    >
                      {loadingChapters ? (
                        <option value="">Loading chapters...</option>
                      ) : chapters.length > 0 ? (
                        chapters.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))
                      ) : (
                        <>
                          <option value="Sri Matre Chapter">Sri Matre Parivar</option>
                          <option value="Hosur Chapter">Hosur Parivar</option>
                          <option value="Chennai Central Chapter">Chennai Central Parivar</option>
                          <option value="Coimbatore Chapter">Coimbatore Parivar</option>
                        </>
                      )}
                    </select>
                    {errors.preferredChapter && (
                      <span className="flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 mt-1">
                        <AlertCircle className="size-3.5 shrink-0 text-red-600" />
                        <span>{errors.preferredChapter}</span>
                      </span>
                    )}
                  </div>
                </div>
              </PublicCard>

              {/* Section C: Personal & Community Details */}
              <PublicCard>
                <div className="border-b border-slate-200 pb-3 mb-5">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span className="size-6 rounded-lg bg-indigo-600 text-white text-xs flex items-center justify-center">C</span>
                    PERSONAL & COMMUNITY DETAILS
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Cultural and community heritage details</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input 
                    label="Father’s Name" 
                    value={form.fatherName} 
                    onChange={e => setForm({ ...form, fatherName: e.target.value })} 
                  />

                  <Input 
                    label="Gothram" 
                    value={form.gothram} 
                    onChange={e => setForm({ ...form, gothram: e.target.value })} 
                  />

                  <div className="sm:col-span-2">
                    <Input 
                      label="Hobbies / Interests" 
                      value={form.hobbiesInterests} 
                      onChange={e => setForm({ ...form, hobbiesInterests: e.target.value })}
                      placeholder="e.g. Classical music, tennis, reading" 
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Special Mention / Other Information</label>
                    <textarea 
                      rows={2}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      value={form.specialMention}
                      onChange={e => setForm({ ...form, specialMention: e.target.value })}
                      placeholder="Any awards, public offices, community initiatives or honorary mentions"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-between items-center border-t border-slate-100 pt-4">
                  <Button type="button" variant="secondary" onClick={handleSaveDraft}>
                    <Save className="size-4" /> Save Draft
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => { if (validateStep1()) setStep(2); }}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Next: Business Details <ArrowRight className="size-4" />
                  </Button>
                </div>
              </PublicCard>
            </div>
          )}

          {/* STEP 2: B. BUSINESS INFORMATION & D. BUSINESS & NETWORKING PROFILE */}
          {step === 2 && (
            <div className="space-y-6">
              <PublicCard>
                <div className="border-b border-slate-200 pb-3 mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <span className="size-6 rounded-lg bg-emerald-600 text-white text-xs flex items-center justify-center">B</span>
                      BUSINESS INFORMATION
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Enterprise profile, classification and scale</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-md text-slate-600">Page 2 of 2</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input 
                    label="Business / Organisation Name *" 
                    required 
                    value={form.businessName} 
                    onChange={e => updateField('businessName', e.target.value)}
                    onBlur={() => validateField('businessName')}
                    error={errors.businessName}
                  />

                  <Input 
                    label="Applicant’s Designation *" 
                    required 
                    value={form.applicantDesignation} 
                    onChange={e => updateField('applicantDesignation', e.target.value)}
                    onBlur={() => validateField('applicantDesignation')}
                    error={errors.applicantDesignation}
                    placeholder="e.g. Managing Director / Partner" 
                  />

                  {/* Cascading Category Dropdown 1: Industry / Sector */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      1. Industry / Sector <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                      value={form.sectorId}
                      onChange={e => {
                        const sId = e.target.value;
                        const sec = categoriesTree.find(s => s.id === sId);
                        updateField('sectorId', sId);
                        updateField('sectorName', sec?.name || '');
                        updateField('segmentId', '');
                        updateField('segmentName', '');
                        updateField('specialisationId', '');
                        updateField('specialisationName', '');
                        updateField('primaryBusinessCategory', '');
                      }}
                      onBlur={() => validateField('sectorId')}
                    >
                      <option value="">{categoriesTree.length > 0 ? `Select Industry (${categoriesTree.length} available)` : "Loading Industries..."}</option>
                      {categoriesTree.map(sec => (
                        <option key={sec.id} value={sec.id}>{sec.name}</option>
                      ))}
                    </select>
                    {errors.sectorId && <p className="mt-1 text-xs text-red-600">{errors.sectorId}</p>}
                  </div>

                  {/* Cascading Category Dropdown 2: Business Group / Segment */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      2. Business Group <span className="text-red-500">*</span>
                    </label>
                    {(() => {
                      const curSec = categoriesTree.find(s => s.id === form.sectorId);
                      const curSegments = curSec?.segments || [];
                      return (
                        <>
                          <select
                            disabled={!form.sectorId}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:bg-slate-100 disabled:text-slate-400"
                            value={form.segmentId}
                            onChange={e => {
                              const segId = e.target.value;
                              const seg = curSegments.find(g => g.id === segId);
                              updateField('segmentId', segId);
                              updateField('segmentName', seg?.name || '');
                              updateField('specialisationId', '');
                              updateField('specialisationName', '');
                              updateField('primaryBusinessCategory', '');
                            }}
                            onBlur={() => validateField('segmentId')}
                          >
                            <option value="">{form.sectorId ? `Select Business Group (${curSegments.length} available)` : "Select Industry first"}</option>
                            {curSegments.map(seg => (
                              <option key={seg.id} value={seg.id}>{seg.name}</option>
                            ))}
                          </select>
                          {errors.segmentId && <p className="mt-1 text-xs text-red-600">{errors.segmentId}</p>}
                        </>
                      );
                    })()}
                  </div>

                  {/* Cascading Category Dropdown 3: Business Category / Specialisation */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      3. Business Category (Specialisation Slot) <span className="text-red-500">*</span>
                    </label>
                    {(() => {
                      const curSec = categoriesTree.find(s => s.id === form.sectorId);
                      const curSeg = curSec?.segments?.find(g => g.id === form.segmentId);
                      const curSpecs = curSeg?.specialisations || [];
                      return (
                        <>
                          <select
                            disabled={!form.segmentId}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:bg-slate-100 disabled:text-slate-400"
                            value={form.specialisationId}
                            onChange={e => {
                              const spId = e.target.value;
                              const sp = curSpecs.find(x => x.id === spId);
                              updateField('specialisationId', spId);
                              updateField('specialisationName', sp?.name || '');
                              updateField('primaryBusinessCategory', sp?.name || '');
                            }}
                            onBlur={() => validateField('specialisationId')}
                          >
                            <option value="">{form.segmentId ? `Select Category Slot (${curSpecs.length} available)` : "Select Business Group first"}</option>
                            {curSpecs.map(sp => (
                              <option key={sp.id} value={sp.id}>{sp.name}</option>
                            ))}
                          </select>
                          {errors.specialisationId && <p className="mt-1 text-xs text-red-600">{errors.specialisationId}</p>}
                          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                            <span className="font-semibold text-sky-700">Chapter Slot Exclusivity:</span>
                            <span>Each member receives an exclusive business slot within their chapter.</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <Input 
                    label="Year Business Established" 
                    type="number"
                    value={form.yearEstablished} 
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                      updateField('yearEstablished', v ? Number(v) : '');
                    }}
                    onBlur={() => validateField('yearEstablished')}
                    error={errors.yearEstablished}
                    placeholder="e.g. 2016" 
                  />

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Products / Services Offered <span className="text-red-500 font-bold">*</span>
                    </label>
                    <textarea 
                      required 
                      rows={2}
                      className={cn(
                        'w-full rounded-xl border px-3 py-2 text-sm focus:outline-none transition',
                        errors.productsServicesOffered
                          ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-2 focus:ring-red-100'
                          : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                      )}
                      value={form.productsServicesOffered}
                      onChange={e => updateField('productsServicesOffered', e.target.value)}
                      onBlur={() => validateField('productsServicesOffered')}
                      placeholder="Outline core products, services or turnkey solutions provided"
                    />
                    {errors.productsServicesOffered && (
                      <span className="flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 mt-1">
                        <AlertCircle className="size-3.5 shrink-0 text-red-600" />
                        <span>{errors.productsServicesOffered}</span>
                      </span>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Number of People Working in the Organisation <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                      {['1–5', '6–10', '11–25', '26–50', '51–100', '100+'].map(range => (
                        <label 
                          key={range}
                          className={`flex items-center justify-center p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                            form.employeeCountRange === range 
                              ? 'border-blue-600 bg-blue-50 text-blue-800' 
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="employeeCountRange" 
                            className="sr-only"
                            checked={form.employeeCountRange === range}
                            onChange={() => updateField('employeeCountRange', range)}
                          />
                          {range}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Business Address <span className="text-red-500 font-bold">*</span>
                    </label>
                    <textarea 
                      required 
                      rows={2}
                      className={cn(
                        'w-full rounded-xl border px-3 py-2 text-sm focus:outline-none transition',
                        errors.businessAddress
                          ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-2 focus:ring-red-100'
                          : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                      )}
                      value={form.businessAddress}
                      onChange={e => updateField('businessAddress', e.target.value)}
                      onBlur={() => validateField('businessAddress')}
                    />
                    {errors.businessAddress && (
                      <span className="flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 mt-1">
                        <AlertCircle className="size-3.5 shrink-0 text-red-600" />
                        <span>{errors.businessAddress}</span>
                      </span>
                    )}
                  </div>

                  <Input 
                    label="City / Locality *" 
                    required 
                    value={form.businessCity} 
                    onChange={e => updateField('businessCity', e.target.value)}
                    onBlur={() => validateField('businessCity')}
                    error={errors.businessCity}
                  />

                  <Input 
                    label="PIN Code *" 
                    required 
                    value={form.businessPinCode} 
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                      updateField('businessPinCode', v);
                    }}
                    onBlur={() => validateField('businessPinCode')}
                    error={errors.businessPinCode}
                    placeholder="600001 (6 digits)"
                    maxLength={6}
                  />

                  <Input 
                    label="GSTIN (if applicable)" 
                    value={form.gstin} 
                    onChange={e => {
                      const v = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15);
                      updateField('gstin', v);
                    }}
                    onBlur={() => validateField('gstin')}
                    error={errors.gstin}
                    placeholder="33AAAAA0000A1Z5" 
                    maxLength={15}
                  />

                  <Input 
                    label="Website / LinkedIn Page" 
                    value={form.websiteOrLinkedIn} 
                    onChange={e => updateField('websiteOrLinkedIn', e.target.value)}
                    onBlur={() => validateField('websiteOrLinkedIn')}
                    error={errors.websiteOrLinkedIn}
                    placeholder="https://..." 
                  />

                  {/* What Connections Can I give to Members? */}
                  <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                    <label className="block text-sm font-bold text-slate-800 mb-2">What Connections Can I give to Members?</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {[
                        'Corporates',
                        'Schools / Colleges',
                        'Hospitals',
                        'Manufacturers',
                        'IT Solution Organization'
                      ].map(conn => (
                        <label 
                          key={conn}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                            form.connectionsCanGive.includes(conn)
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            className="size-4 text-emerald-600 rounded"
                            checked={form.connectionsCanGive.includes(conn)}
                            onChange={() => toggleConnection(conn)}
                          />
                          <span>{conn}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-2.5">
                      <Input 
                        label="Others (Please Specify)" 
                        value={form.connectionsOtherText} 
                        onChange={e => setForm({ ...form, connectionsOtherText: e.target.value })}
                        placeholder="e.g. Government departments, Real Estate developers" 
                      />
                    </div>
                  </div>
                </div>
              </PublicCard>

              {/* Section D: Business & Networking Profile */}
              <PublicCard>
                <div className="border-b border-slate-200 pb-3 mb-5">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span className="size-6 rounded-lg bg-purple-600 text-white text-xs flex items-center justify-center">D</span>
                    BUSINESS & NETWORKING PROFILE
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Value proposition, referral criteria and geographical reach</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-bold text-slate-700">
                        Business Description (Briefly Describe your Business in 50 to 100 Words) <span className="text-red-500 font-bold">*</span>
                      </label>
                      <span className={cn(
                        'text-xs font-semibold px-2 py-0.5 rounded-full border transition-colors',
                        form.businessDescription.trim().split(/\s+/).filter(Boolean).length >= 50 && form.businessDescription.trim().split(/\s+/).filter(Boolean).length <= 100
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      )}>
                        {form.businessDescription.trim() ? form.businessDescription.trim().split(/\s+/).filter(Boolean).length : 0} / 100 words
                      </span>
                    </div>
                    <textarea 
                      required 
                      rows={3}
                      className={cn(
                        'w-full rounded-xl border px-3 py-2 text-sm focus:outline-none transition',
                        errors.businessDescription
                          ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-2 focus:ring-red-100'
                          : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                      )}
                      value={form.businessDescription}
                      onChange={e => updateField('businessDescription', e.target.value)}
                      onBlur={() => validateField('businessDescription')}
                      placeholder="Explain your core services, target industry, customer outcomes and track record."
                    />
                    {errors.businessDescription && (
                      <span className="flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 mt-1">
                        <AlertCircle className="size-3.5 shrink-0 text-red-600" />
                        <span>{errors.businessDescription}</span>
                      </span>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Ideal Customer Profile (Who are your Ideal Customers – Top 3)</label>
                    <div className="grid gap-2">
                      <Input 
                        label="1. Top Customer Segment" 
                        value={form.idealCustomer1} 
                        onChange={e => updateField('idealCustomer1', e.target.value)}
                        placeholder="e.g. Mid-sized auto-component manufacturers with 50+ staff" 
                      />
                      <Input 
                        label="2. Second Customer Segment" 
                        value={form.idealCustomer2} 
                        onChange={e => updateField('idealCustomer2', e.target.value)}
                        placeholder="e.g. Private hospital clinics seeking medical supplies" 
                      />
                      <Input 
                        label="3. Third Customer Segment" 
                        value={form.idealCustomer3} 
                        onChange={e => updateField('idealCustomer3', e.target.value)}
                        placeholder="e.g. Independent colleges and training institutes" 
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Business Connections Sought (What Referrals, Professionals or Business Partners are you looking for?)
                    </label>
                    <textarea 
                      rows={2}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      value={form.businessConnectionsSought}
                      onChange={e => updateField('businessConnectionsSought', e.target.value)}
                      placeholder="e.g. Introductions to purchase heads, commercial architects, exporters"
                    />
                  </div>

                  {/* Geographic Markets Served */}
                  <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                    <label className="block text-sm font-bold text-slate-800 mb-2">Geographic Markets Served</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        'Within the Locality',
                        'Chennai',
                        'Tamil Nadu',
                        'Pan-India'
                      ].map(market => (
                        <label 
                          key={market}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                            form.geographicMarketsServed.includes(market)
                              ? 'border-purple-600 bg-purple-50 text-purple-900'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            className="size-4 text-purple-600 rounded"
                            checked={form.geographicMarketsServed.includes(market)}
                            onChange={() => toggleMarket(market)}
                          />
                          <span>{market}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-2.5">
                      <Input 
                        label="International / Other (Please Specify)" 
                        value={form.geographicMarketOtherText} 
                        onChange={e => updateField('geographicMarketOtherText', e.target.value)}
                        placeholder="e.g. Middle East, Southeast Asia" 
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <Input 
                      label="Key Differentiator (What makes your Business / Offering distinctive – Your USP) *" 
                      required 
                      value={form.keyDifferentiator} 
                      onChange={e => updateField('keyDifferentiator', e.target.value)}
                      onBlur={() => validateField('keyDifferentiator')}
                      error={errors.keyDifferentiator}
                      placeholder="e.g. 24-hour turnaround, proprietary ISO-certified process, local warehouse" 
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Input 
                      label="Business Contact Email" 
                      type="email"
                      value={form.businessContactEmail} 
                      onChange={e => updateField('businessContactEmail', e.target.value)}
                      onBlur={() => validateField('businessContactEmail')}
                      error={errors.businessContactEmail}
                      placeholder="contact@company.com" 
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-between items-center border-t border-slate-100 pt-4">
                  <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                    <ArrowLeft className="size-4" /> Back to Step 1
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={busy}
                    className="bg-emerald-600 text-white hover:bg-emerald-700 px-6 py-2.5 font-bold shadow-md"
                  >
                    <CheckCircle2 className="size-4" /> {busy ? 'Submitting Application…' : 'Submit Bhandhu Registration'}
                  </Button>
                </div>
              </PublicCard>
            </div>
          )}
        </form>
      </div>
    </PublicShell>
  );
}
