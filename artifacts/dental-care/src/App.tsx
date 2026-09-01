import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { z } from 'zod';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useHealthCheck,
} from '@workspace/api-client-react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleCheck,
  Clock3,
  Filter,
  HeartPulse,
  Menu,
  MessageCircle,
  Navigation,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  X,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();
const clinicPhoneDisplay = '+91 81697 66396';
const clinicPhoneHref = 'tel:+918169766396';
const whatsappNumber = '918169766396';
const whatsappMessage = 'Hello Dental Care, I would like to enquire about a dental appointment.';
const publicEnv = import.meta.env as Record<string, string | undefined>;
const getWhatsAppHref = (message = whatsappMessage) =>
  `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

const clinicConfig = {
  name: 'Dental Care',
  city: 'Mumbai',
  location: 'Kurla East, Mumbai - 400024',
  addressLines: [
    'Shop No: 01,',
    'Bldg No: 84,',
    'Navchaitanya CHS,',
    'Police Colony,',
    'Nehru Nagar,',
    'Kurla East - 400024',
  ],
  address:
    'Shop No: 01, Bldg No: 84, Navchaitanya CHS, Police Colony, Nehru Nagar, Kurla East - 400024',
  phone: clinicPhoneDisplay,
  email: '',
  whatsapp: getWhatsAppHref(),
  mapUrl: publicEnv.VITE_CLINIC_MAP_URL || '',
  doctors: [] as Array<{ name: string; role: string; focus: string }>,
  testimonials: [] as Array<{ quote: string; name: string; detail: string }>,
};

type PriceType = 'fixed' | 'starting_from' | 'range' | 'custom';

type Treatment = {
  id: string;
  name: string;
  category: string;
  shortDescription: string;
  description: string;
  duration: string;
  price: string | null;
  priceType: PriceType;
  available: boolean;
  featured: boolean;
  icon: typeof ShieldCheck;
  faqs: string[];
  priceLabel?: string;
};

type TreatmentSeed = Pick<
  Treatment,
  'id' | 'name' | 'category' | 'shortDescription' | 'description' | 'price' | 'priceType' | 'icon'
> &
  Partial<Pick<Treatment, 'duration' | 'available' | 'featured' | 'faqs'>>;

const makeTreatment = (seed: TreatmentSeed): Treatment => ({
  duration: 'As advised',
  available: true,
  featured: false,
  faqs: ['The dentist will explain suitability, steps, and the final cost at your visit.'],
  ...seed,
});

const treatmentConfig: Treatment[] = [
  makeTreatment({ id: 'case-paper', name: 'Case Paper', category: 'diagnostics', shortDescription: 'Clinic case documentation for your visit.', description: 'Case documentation as listed on the Dental Care rate sheet.', price: '₹50', priceType: 'fixed', icon: Stethoscope }),
  makeTreatment({ id: 'x-ray', name: 'X-Ray', category: 'diagnostics', shortDescription: 'Dental imaging as advised by the dentist.', description: 'X-ray service as listed on the Dental Care rate sheet.', price: '₹100', priceType: 'fixed', icon: Stethoscope }),
  makeTreatment({ id: 'simple-extraction', name: 'Simple Extraction / Mobile Tooth Extraction', category: 'extraction', shortDescription: 'Extraction service for a mobile or straightforward tooth.', description: 'The approach depends on the tooth and the clinical findings discussed with you.', price: '₹150–₹250', priceType: 'range', icon: ShieldCheck }),
  makeTreatment({ id: 'complicated-extraction', name: 'Complicated / Root Pieces Extraction', category: 'extraction', shortDescription: 'Extraction service for a complicated tooth or root pieces.', description: 'The dentist will explain the expected steps after assessing the tooth.', price: '₹350', priceType: 'fixed', icon: ShieldCheck }),
  makeTreatment({ id: 'wisdom-tooth-extraction', name: 'Wisdom Tooth Extraction', category: 'extraction', shortDescription: 'Care for a wisdom tooth when extraction is advised.', description: 'Wisdom tooth extraction as listed on the Dental Care rate sheet.', price: '₹550', priceType: 'fixed', icon: ShieldCheck }),
  makeTreatment({ id: 'surgical-extraction-sutures', name: 'Surgical Extraction (with sutures)', category: 'extraction', shortDescription: 'Surgical extraction with sutures, as listed.', description: 'The dentist will discuss the procedure and aftercare before treatment.', price: '₹600–₹700', priceType: 'range', icon: ShieldCheck }),
  makeTreatment({ id: 'surgical-extraction-oral-surgeon', name: 'Surgical Extraction (by Oral Surgeon)', category: 'extraction', shortDescription: 'Surgical extraction by an oral surgeon, as listed.', description: 'A referral or oral surgeon appointment can be discussed when appropriate.', price: '₹800–₹1800', priceType: 'range', icon: ShieldCheck }),
  makeTreatment({ id: 'scaling-first-sitting', name: 'Cleaning/Scaling & Polishing (1st sitting)', category: 'cleaning', shortDescription: 'Cleaning, scaling and polishing for the first sitting.', description: 'Cleaning, scaling and polishing service as listed on the rate sheet.', price: '₹250', priceType: 'fixed', icon: Sparkles }),
  makeTreatment({ id: 'scaling-additional-sitting', name: 'Cleaning/Scaling (additional sitting)', category: 'cleaning', shortDescription: 'Cleaning and scaling for an additional sitting.', description: 'Additional cleaning and scaling service as listed on the rate sheet.', price: '₹200', priceType: 'fixed', icon: Sparkles }),
  makeTreatment({ id: 'polishing', name: 'Polishing', category: 'cleaning', shortDescription: 'Polishing service as listed on the rate sheet.', description: 'Polishing service with the final approach discussed at the visit.', price: '₹150', priceType: 'fixed', icon: Sparkles }),
  makeTreatment({ id: 'filling-zinc-oxide', name: 'Filling - Zinc Oxide', category: 'fillings', shortDescription: 'Zinc oxide filling option.', description: 'A filling material option listed on the Dental Care rate sheet.', price: '₹100', priceType: 'fixed', icon: ShieldCheck }),
  makeTreatment({ id: 'filling-dycal', name: 'Filling - Dycal', category: 'fillings', shortDescription: 'Dycal filling option.', description: 'A filling material option listed on the Dental Care rate sheet.', price: '₹150', priceType: 'fixed', icon: ShieldCheck }),
  makeTreatment({ id: 'filling-silver-gic', name: 'Filling - Silver / GIC', category: 'fillings', shortDescription: 'Silver or GIC filling option.', description: 'A filling material option listed on the Dental Care rate sheet.', price: '₹350', priceType: 'fixed', icon: ShieldCheck }),
  makeTreatment({ id: 'filling-silver-gic-miracle', name: 'Filling - Silver + GIC (Miracle)', category: 'fillings', shortDescription: 'Silver and GIC combination filling option.', description: 'A filling material option listed on the Dental Care rate sheet.', price: '₹450', priceType: 'fixed', icon: ShieldCheck }),
  makeTreatment({ id: 'filling-sandwich', name: 'Filling - Sandwich Filling (GIC+Composite)', category: 'fillings', shortDescription: 'GIC and composite sandwich filling option.', description: 'A filling material option listed on the Dental Care rate sheet.', price: '₹650', priceType: 'fixed', icon: ShieldCheck }),
  makeTreatment({ id: 'filling-composite', name: 'Filling - Composite', category: 'fillings', shortDescription: 'Composite filling option.', description: 'A filling material option listed on the Dental Care rate sheet.', price: '₹600', priceType: 'fixed', icon: ShieldCheck }),
  makeTreatment({ id: 'calplus', name: 'Calplus', category: 'root-canal', shortDescription: 'Calplus service as listed on the rate sheet.', description: 'Calplus service as listed on the Dental Care rate sheet.', price: '₹150', priceType: 'fixed', icon: HeartPulse }),
  makeTreatment({ id: 'pulp-devitaliser', name: 'Pulp Devitaliser', category: 'root-canal', shortDescription: 'Pulp devitaliser service as listed.', description: 'Pulp devitaliser service as listed on the Dental Care rate sheet.', price: '₹100', priceType: 'fixed', icon: HeartPulse }),
  makeTreatment({ id: 'rct-hand-files', name: 'RCT using Hand Files', category: 'root-canal', shortDescription: 'Includes 2 x-ray + GIC/MM/Composite.', description: 'Root canal treatment using hand files, including 2 x-ray + GIC/MM/Composite as listed on the rate sheet.', price: '₹1200 / ₹1300 / ₹1400', priceType: 'fixed', icon: HeartPulse }),
  makeTreatment({ id: 'rct-hand-protapers', name: 'RCT using Hand ProTapers', category: 'root-canal', shortDescription: 'Includes 2 x-ray + GIC/MM/Composite.', description: 'Root canal treatment using hand ProTapers, including 2 x-ray + GIC/MM/Composite as listed on the rate sheet.', price: '₹1500 / ₹1700 / ₹1850', priceType: 'fixed', icon: HeartPulse }),
  makeTreatment({ id: 'rct-rotary-files', name: 'RCT using Rotary Files', category: 'root-canal', shortDescription: 'Includes 2 x-ray + GIC/MM/Composite.', description: 'Root canal treatment using rotary files, including 2 x-ray + GIC/MM/Composite as listed on the rate sheet.', price: '₹1700 / ₹1900 / ₹2000', priceType: 'fixed', icon: HeartPulse }),
  makeTreatment({ id: 'rerct-hand-files', name: 'RE-RCT using Hand Files', category: 'root-canal', shortDescription: 'Includes 2 x-ray + GIC/MM/Composite.', description: 'Re-root canal treatment using hand files, including 2 x-ray + GIC/MM/Composite as listed on the rate sheet.', price: '₹1400 / ₹1600 / ₹1700', priceType: 'fixed', icon: HeartPulse }),
  makeTreatment({ id: 'rerct-hand-protapers', name: 'RE-RCT using Hand ProTapers', category: 'root-canal', shortDescription: 'Includes 2 x-ray + GIC/MM/Composite.', description: 'Re-root canal treatment using hand ProTapers, including 2 x-ray + GIC/MM/Composite as listed on the rate sheet.', price: '₹1700 / ₹1900 / ₹2000', priceType: 'fixed', icon: HeartPulse }),
  makeTreatment({ id: 'rerct-rotary-files', name: 'RE-RCT using Rotary Files', category: 'root-canal', shortDescription: 'Includes 2 x-ray + GIC/MM/Composite.', description: 'Re-root canal treatment using rotary files, including 2 x-ray + GIC/MM/Composite as listed on the rate sheet.', price: '₹1900 / ₹2100 / ₹2200', priceType: 'fixed', icon: HeartPulse }),
  makeTreatment({ id: 'kids-rct', name: 'Kids RCT (Protaper/Rotary)', category: 'root-canal', shortDescription: 'Kids root canal service using Protaper/Rotary.', description: 'Kids root canal service as listed on the Dental Care rate sheet.', price: '₹1200', priceType: 'fixed', icon: HeartPulse }),
  makeTreatment({ id: 'crown-metal', name: 'Crown - Metal', category: 'crowns', shortDescription: 'Metal crown option.', description: 'Metal crown option as listed on the Dental Care rate sheet.', price: '₹1100', priceType: 'fixed', icon: CircleCheck }),
  makeTreatment({ id: 'crown-half-ceramic', name: 'Crown - Half Ceramic', category: 'crowns', shortDescription: 'Half ceramic crown option.', description: 'Half ceramic crown option as listed on the Dental Care rate sheet.', price: '₹1600', priceType: 'fixed', icon: CircleCheck }),
  makeTreatment({ id: 'crown-full-ceramic-pfm', name: 'Crown - Full Ceramic (PFM)', category: 'crowns', shortDescription: 'Full ceramic PFM crown option.', description: 'Full ceramic PFM crown option as listed on the Dental Care rate sheet.', price: '₹1900', priceType: 'fixed', icon: CircleCheck }),
  makeTreatment({ id: 'crown-mls-cad-cam', name: 'Crown - MLS CAD CAM (10 yrs warranty)', category: 'crowns', shortDescription: 'MLS CAD CAM crown with 10 yrs warranty, as listed.', description: 'MLS CAD CAM crown option with the rate-sheet warranty qualifier.', price: '₹3700', priceType: 'fixed', icon: CircleCheck }),
  makeTreatment({ id: 'crown-zirconia', name: 'Crown - Zirconia (10 yrs warranty)', category: 'crowns', shortDescription: 'Zirconia crown with 10 yrs warranty, as listed.', description: 'Zirconia crown option with the rate-sheet warranty qualifier.', price: '₹4900', priceType: 'fixed', icon: CircleCheck }),
  makeTreatment({ id: 'crown-acrylic', name: 'Crown - Acrylic', category: 'crowns', shortDescription: 'Acrylic crown option.', description: 'Acrylic crown option as listed on the Dental Care rate sheet.', price: '₹850', priceType: 'fixed', icon: CircleCheck }),
  makeTreatment({ id: 'crown-metal-acrylic-facing', name: 'Crown - Metal Acrylic facing', category: 'crowns', shortDescription: 'Metal crown with acrylic facing option.', description: 'Metal acrylic facing crown option as listed on the rate sheet.', price: '₹1200', priceType: 'fixed', icon: CircleCheck }),
  makeTreatment({ id: 'crown-refixing', name: 'Single Crown Refixing', category: 'crowns', shortDescription: 'Refixing service for a single crown.', description: 'Single crown refixing service as listed on the Dental Care rate sheet.', price: '₹150', priceType: 'fixed', icon: CircleCheck }),
  makeTreatment({ id: 'crown-removal-crown-remover', name: 'Single Crown Removal using crown remover', category: 'crowns', shortDescription: 'Single crown removal using a crown remover.', description: 'Single crown removal service as listed on the Dental Care rate sheet.', price: '₹150', priceType: 'fixed', icon: CircleCheck }),
  makeTreatment({ id: 'crown-removal-regular-bur', name: 'Single Crown Removal (using regular bur)', category: 'crowns', shortDescription: 'Single crown removal using a regular bur.', description: 'Single crown removal service as listed on the Dental Care rate sheet.', price: '₹200', priceType: 'fixed', icon: CircleCheck }),
  makeTreatment({ id: 'crown-removal-metal-cutting-bur', name: 'Single Crown Removal (using metal cutting bur)', category: 'crowns', shortDescription: 'Single crown removal using a metal cutting bur.', description: 'Single crown removal service as listed on the Dental Care rate sheet.', price: '₹450', priceType: 'fixed', icon: CircleCheck }),
  makeTreatment({ id: 'denture-lucitone-ordinary', name: 'Denture - Lucitone (with Ordinary Teeth) - Per Arch', category: 'dentures-rpd', shortDescription: 'Lucitone denture with ordinary teeth · Per Arch.', description: 'Lucitone denture with ordinary teeth, priced per arch as listed on the rate sheet.', price: '₹3200 / Per Arch', priceType: 'fixed', icon: CircleCheck }),
  makeTreatment({ id: 'denture-lucitone-imported', name: 'Denture - Lucitone (with Imported Teeth) - Per Arch', category: 'dentures-rpd', shortDescription: 'Lucitone denture with imported teeth · Per Arch.', description: 'Lucitone denture with imported teeth, priced per arch as listed on the rate sheet.', price: '₹4200 / Per Arch', priceType: 'fixed', icon: CircleCheck }),
  makeTreatment({ id: 'denture-lucitone-metal-meshwork', name: 'Denture - Lucitone Metal Meshwork (with Ordinary Teeth) - Per Arch', category: 'dentures-rpd', shortDescription: 'Lucitone metal meshwork with ordinary teeth · Per Arch.', description: 'Lucitone metal meshwork denture with ordinary teeth, priced per arch as listed on the rate sheet.', price: '₹5600 / Per Arch', priceType: 'fixed', icon: CircleCheck }),
  makeTreatment({ id: 'rpd-lucitone', name: 'RPD (incl. 1 tooth) - Lucitone (upto 8 teeth RPD)', category: 'dentures-rpd', shortDescription: 'Lucitone RPD including 1 tooth · upto 8 teeth RPD.', description: 'Lucitone RPD including 1 tooth, upto 8 teeth RPD, as listed on the rate sheet.', price: '₹1100', priceType: 'fixed', icon: CircleCheck }),
  makeTreatment({ id: 'additional-per-tooth', name: 'Additional Per Tooth', category: 'dentures-rpd', shortDescription: 'Additional per tooth service.', description: 'Additional per tooth charge as listed on the Dental Care rate sheet.', price: '₹150', priceType: 'fixed', icon: CircleCheck }),
  makeTreatment({ id: 'rpd-metal-meshwork', name: 'RPD (incl. 1 ordinary tooth) - Metal Meshwork (upto 8 teeth RPD)', category: 'dentures-rpd', shortDescription: 'Metal meshwork RPD including 1 ordinary tooth · upto 8 teeth RPD.', description: 'Metal meshwork RPD including 1 ordinary tooth, upto 8 teeth RPD, as listed on the rate sheet.', price: '₹2400', priceType: 'fixed', icon: CircleCheck }),
  makeTreatment({ id: 'additional-per-tooth-ordinary', name: 'Additional Per Tooth (ordinary)', category: 'dentures-rpd', shortDescription: 'Additional ordinary tooth service.', description: 'Additional ordinary tooth charge as listed on the Dental Care rate sheet.', price: '₹150', priceType: 'fixed', icon: CircleCheck }),
  makeTreatment({ id: 'additional-per-tooth-elsewhere', name: 'Additional Per Tooth in RPD (made from elsewhere)', category: 'dentures-rpd', shortDescription: 'Additional per tooth in an RPD made from elsewhere.', description: 'Additional per tooth in an RPD made from elsewhere, as listed on the rate sheet.', price: '₹350', priceType: 'fixed', icon: CircleCheck }),
  makeTreatment({ id: 'one-clasp', name: 'One Clasp', category: 'dentures-rpd', shortDescription: 'One clasp service.', description: 'One clasp charge as listed on the Dental Care rate sheet.', price: '₹50', priceType: 'fixed', icon: CircleCheck }),
  makeTreatment({ id: 'denture-repairing', name: 'Denture Repairing', category: 'dentures-rpd', shortDescription: 'Denture repairing service.', description: 'Denture repairing service as listed on the Dental Care rate sheet.', price: '₹400', priceType: 'fixed', icon: CircleCheck }),
];

const categories = [
  ['all', 'All'],
  ['diagnostics', 'Diagnostics'],
  ['extraction', 'Extraction'],
  ['cleaning', 'Cleaning'],
  ['fillings', 'Fillings'],
  ['root-canal', 'Root canal'],
  ['crowns', 'Crowns'],
  ['dentures-rpd', 'Dentures & RPD'],
];

const bookingConfig = {
  availableDays: [1, 2, 3, 4, 5, 6],
  timeSlots: ['10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '4:00 PM', '4:30 PM', '5:00 PM'],
};

const bookingSchema = z.object({
  patientName: z.string().min(2, 'Please enter your name.'),
  phone: z
    .string()
    .regex(/^(?:\+91[\s-]?)?[6-9]\d{9}$/, 'Please enter a valid Indian phone number.'),
  email: z.union([z.literal(''), z.string().email('Please check your email address.')]),
  reason: z.string().max(1000, 'Please keep your note under 1000 characters.'),
});

type BookingDraft = {
  treatmentId: string;
  date: string;
  time: string;
  patientName: string;
  phone: string;
  email: string;
  reason: string;
};

const initialDraft: BookingDraft = {
  treatmentId: '',
  date: '',
  time: '',
  patientName: '',
  phone: '',
  email: '',
  reason: '',
};

function formatPrice(treatment: Treatment) {
  if (!treatment.price) return treatment.priceLabel || 'Price to be updated';
  if (treatment.priceType === 'custom') return treatment.priceLabel || 'Contact clinic for pricing';
  if (treatment.priceType === 'starting_from') return `Starting from ${treatment.price}`;
  return treatment.price;
}

function formatLongDate(value: string) {
  if (!value) return 'Not selected';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`));
}

function buildWhatsAppAppointmentMessage(draft: BookingDraft, treatment: Treatment) {
  return [
    'Hello Dental Care,',
    '',
    'I would like to book an appointment.',
    '',
    `Patient Name: ${draft.patientName.trim()}`,
    `Phone: ${draft.phone.trim()}`,
    ...(draft.email.trim() ? [`Email: ${draft.email.trim()}`] : []),
    `Treatment: ${treatment.name}`,
    `Price: ${formatPrice(treatment)}`,
    `Preferred Date: ${formatLongDate(draft.date)}`,
    `Preferred Time: ${draft.time}`,
    ...(draft.reason.trim() ? ['', `Reason for Visit: ${draft.reason.trim()}`] : []),
    '',
    'Please confirm the appointment.',
    '',
    'Thank you.',
  ].join('\n');
}

function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function getCalendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const leading = Array.from({ length: first.getDay() }, () => null as Date | null);
  const days = Array.from({ length: last.getDate() }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1));
  return [...leading, ...days] as Array<Date | null>;
}

function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3" data-testid="brand-clinic">
      <div className={`brand-mark ${light ? 'brand-mark-light' : ''}`}>
        <span className="font-display text-[1.7rem] leading-none">d</span>
        <span className="absolute bottom-[7px] right-[8px] size-1.5 rounded-full bg-[hsl(var(--accent))]" />
      </div>
      <div className="leading-none">
        <div className={`font-semibold tracking-[-0.03em] ${light ? 'text-white' : 'text-[hsl(var(--foreground))]'}`}>Dental Care</div>
        <div className={`mt-1 text-[0.6rem] font-mono-ui uppercase tracking-[0.16em] ${light ? 'text-white/55' : 'text-[hsl(var(--muted-foreground))]'}`}>Kurla East · Mumbai</div>
      </div>
    </div>
  );
}

function Header({ onBook }: { onBook: (treatmentId?: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    ['Home', '#top'],
    ['Treatments', '#treatments'],
    ['Pricing', '#pricing'],
    ['About', '#about'],
    ['Why us', '#why-us'],
    ['FAQ', '#faq'],
    ['Contact', '#contact'],
  ];
  const go = () => setMenuOpen(false);
  return (
    <header className="site-header">
      <div className="container-clinic flex h-[78px] items-center justify-between">
        <a href="#top" onClick={go} data-testid="link-home"><BrandMark /></a>
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary navigation">
          {links.map(([label, href]) => (
            <a key={href} href={href} className="nav-link" onClick={go} data-testid={`link-${label.toLowerCase().replaceAll(' ', '-')}`}>{label}</a>
          ))}
        </nav>
        <div className="hidden items-center gap-4 lg:flex">
          <a href={clinicPhoneHref} className="header-phone" data-testid="header-phone"><Phone size={14} /> Call clinic</a>
          <button onClick={() => onBook()} className="button-primary flex items-center gap-2 px-5 py-3 text-sm" data-testid="button-header-book">
            Book appointment <ArrowUpRight size={16} />
          </button>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="menu-button lg:hidden" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} data-testid="button-mobile-menu">
          {menuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>
      {menuOpen && (
        <div className="container-clinic lg:hidden">
          <nav className="mobile-nav" aria-label="Mobile navigation">
            {links.map(([label, href]) => <a key={href} href={href} onClick={go} className="mobile-nav-link" data-testid={`mobile-link-${label.toLowerCase().replaceAll(' ', '-')}`}>{label}</a>)}
            <button onClick={() => { go(); onBook(); }} className="button-primary mt-2 flex w-full items-center justify-between px-5 py-3.5" data-testid="button-mobile-book">Book appointment <ArrowUpRight size={16} /></button>
          </nav>
        </div>
      )}
    </header>
  );
}

function SectionLabel({ children, light = false }: { children: string; light?: boolean }) {
  return <div className={`eyebrow flex items-center gap-3 ${light ? 'text-[hsl(var(--accent-light))]' : 'text-[hsl(var(--primary))]'}`}><span className="h-px w-8 bg-current" />{children}</div>;
}

function QuickActions({ onBook }: { onBook: () => void }) {
  const actions = [
    { label: 'Book appointment', icon: CalendarDays, action: onBook },
    { label: 'View treatments', icon: Stethoscope, href: '#treatments' },
    { label: 'View pricing', icon: Filter, href: '#pricing' },
    { label: 'Get directions', icon: Navigation, href: clinicConfig.mapUrl || undefined },
    { label: 'WhatsApp clinic', icon: MessageCircle, href: getWhatsAppHref() },
    { label: 'Call clinic', icon: Phone, href: clinicPhoneHref },
  ];
  return (
    <section className="quick-actions" aria-label="Quick actions">
      <div className="container-clinic grid grid-cols-2 md:grid-cols-6">
        {actions.map(({ label, icon: Icon, href, action }) => href ? (
          <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className={`quick-action ${!href ? 'quick-action-disabled' : ''}`} data-testid={`quick-${label.toLowerCase().replaceAll(' ', '-')}`}>
            <Icon size={17} /><span>{label}</span><ArrowUpRight size={14} className="ml-auto opacity-60" />
          </a>
        ) : action ? (
          <button key={label} onClick={action} className="quick-action text-left" data-testid={`quick-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={17} /><span>{label}</span><ArrowUpRight size={14} className="ml-auto opacity-60" /></button>
        ) : (
          <span key={label} className="quick-action quick-action-disabled"><Icon size={17} /><span>{label}</span></span>
        ))}
      </div>
    </section>
  );
}

function TreatmentCard({ treatment, onDetails, onBook }: { treatment: Treatment; onDetails: () => void; onBook: () => void }) {
  const Icon = treatment.icon;
  const whatsappHref = getWhatsAppHref(`Hello Dental Care, I would like to enquire about ${treatment.name} (${formatPrice(treatment)}).`);
  return (
    <article className="treatment-card" data-testid={`card-treatment-${treatment.id}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="icon-bubble"><Icon size={18} /></span>
        <span className="treatment-category">{treatment.category.replace('-', ' ')}</span>
      </div>
      <div className="mt-5">
        <h3 className="treatment-name">{treatment.name}</h3>
        <p className="treatment-description">{treatment.shortDescription}</p>
      </div>
      <div className="treatment-card-info">
        <div><span className="price-caption">Price</span><strong className="treatment-price">{formatPrice(treatment)}</strong></div>
        <div><span className="price-caption">Duration</span><strong className="treatment-duration"><Clock3 size={13} />{treatment.duration}</strong></div>
      </div>
      <div className="treatment-card-actions">
        <button onClick={onDetails} className="text-xs font-bold uppercase tracking-[0.12em] text-[hsl(var(--primary))] hover:underline" data-testid={`button-details-${treatment.id}`}>View details</button>
        <a href={whatsappHref} target="_blank" rel="noreferrer" className="treatment-whatsapp" aria-label={`WhatsApp about ${treatment.name}`} data-testid={`button-whatsapp-${treatment.id}`}><MessageCircle size={15} /></a>
        <button onClick={onBook} className="button-small ml-auto" data-testid={`button-book-${treatment.id}`}>Book <ArrowUpRight size={14} /></button>
      </div>
    </article>
  );
}

function TreatmentDetail({ treatment, onClose, onBook }: { treatment: Treatment; onClose: () => void; onBook: () => void }) {
  const Icon = treatment.icon;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="detail-dialog" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <button onClick={onClose} className="dialog-close" aria-label="Close treatment details"><X size={19} /></button>
        <div className="icon-bubble size-12"><Icon size={20} /></div>
        <div className="eyebrow mt-7 text-[hsl(var(--primary))]">{treatment.category.replace('-', ' ')} · {treatment.duration}</div>
        <h2 id="detail-title" className="mt-3 max-w-lg font-display text-5xl leading-[0.9] tracking-[-0.04em]">{treatment.name}</h2>
        <p className="mt-6 max-w-xl text-base leading-7 text-[hsl(var(--muted-foreground))]">{treatment.description}</p>
        <div className="mt-8 grid gap-4 border-y border-[hsl(var(--border))] py-5 sm:grid-cols-2">
          <div><span className="price-caption">Price</span><p className="mt-1 font-semibold">{formatPrice(treatment)}</p></div>
          <div><span className="price-caption">Appointment length</span><p className="mt-1 font-semibold">{treatment.duration}</p></div>
        </div>
        <div className="mt-7">
          <p className="price-caption">Questions this visit can help answer</p>
          <ul className="mt-3 space-y-2 text-sm text-[hsl(var(--muted-foreground))]">{treatment.faqs.map((faq) => <li key={faq} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-[hsl(var(--primary))]" />{faq}</li>)}</ul>
        </div>
        <button onClick={onBook} className="button-primary mt-8 inline-flex items-center gap-2 px-6 py-3.5">Book this treatment <ArrowUpRight size={16} /></button>
      </div>
    </div>
  );
}

function BookingFlow({ initialTreatmentId, onClose }: { initialTreatmentId?: string; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<BookingDraft>({ ...initialDraft, treatmentId: initialTreatmentId || '' });
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [error, setError] = useState('');
  const [openingWhatsApp, setOpeningWhatsApp] = useState(false);
  const selectedTreatment = treatmentConfig.find((item) => item.id === draft.treatmentId);
  const calendarDays = useMemo(() => getCalendarDays(month), [month]);

  const update = <K extends keyof BookingDraft>(key: K, value: BookingDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError('');
  };

  const validateStep = () => {
    if (step === 1 && !draft.treatmentId) return 'Please select a treatment.';
    if (step === 2 && !draft.date) return 'Please choose a date.';
    if (step === 3 && !draft.time) return 'Please select a time slot.';
    if (step === 4) {
      const parsed = bookingSchema.safeParse({
        patientName: draft.patientName,
        phone: draft.phone,
        email: draft.email,
        reason: draft.reason,
      });
      if (!parsed.success) return parsed.error.issues[0]?.message || 'Please check your details.';
    }
    return '';
  };

  const next = () => {
    const validation = validateStep();
    if (validation || !selectedTreatment) {
      setError(validation || 'Please select a treatment.');
      return;
    }
    setError('');
    setStep((current) => Math.min(current + 1, 5));
  };

  const bookViaWhatsApp = () => {
    if (openingWhatsApp) return;
    if (!selectedTreatment) {
      setError('Please select a treatment.');
      return;
    }

    const detailsValidation = bookingSchema.safeParse({
      patientName: draft.patientName,
      phone: draft.phone,
      email: draft.email,
      reason: draft.reason,
    });
    const validation = !draft.date
      ? 'Please choose a date.'
      : !draft.time
        ? 'Please select a time slot.'
        : !detailsValidation.success
          ? detailsValidation.error.issues[0]?.message || 'Please check your details.'
          : '';

    if (validation) {
      setError(validation);
      return;
    }

    const whatsappHref = getWhatsAppHref(buildWhatsAppAppointmentMessage(draft, selectedTreatment));
    setError('');
    setOpeningWhatsApp(true);
    window.setTimeout(() => {
      const whatsappWindow = window.open(whatsappHref, '_blank', 'noopener,noreferrer');
      if (!whatsappWindow) window.location.assign(whatsappHref);
      setOpeningWhatsApp(false);
    }, 250);
  };

  const progress = ['Treatment', 'Date', 'Time', 'Details', 'Review'];

  return (
    <div className="dialog-backdrop booking-backdrop">
      <div className="booking-dialog" role="dialog" aria-modal="true" aria-labelledby="booking-title">
        <div className="booking-topbar">
          <div><div className="eyebrow text-[hsl(var(--primary))]">Dental Care · booking</div><h2 id="booking-title" className="mt-2 font-display text-4xl leading-none">Book your visit.</h2></div>
          <button onClick={onClose} className="dialog-close static" aria-label="Close booking"><X size={19} /></button>
        </div>
        <div className="booking-progress" aria-label="Booking progress">
          {progress.map((label, index) => <div key={label} className={`progress-step ${step >= index + 1 ? 'progress-step-active' : ''}`}><span>{String(index + 1).padStart(2, '0')}</span><small>{label}</small></div>)}
        </div>

        {step === 1 && (
          <div className="booking-section">
            <SectionLabel>Step 01 · choose treatment</SectionLabel>
            <h3 className="mt-4 font-display text-4xl leading-[0.93]">What would you like help with?</h3>
            <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Choose the closest fit. Your selected treatment and price will be included in your WhatsApp message.</p>
            <div className="booking-treatment-list">
              {treatmentConfig.filter((treatment) => treatment.available).map((treatment) => (
                <button key={treatment.id} onClick={() => update('treatmentId', treatment.id)} className={`booking-treatment ${draft.treatmentId === treatment.id ? 'booking-treatment-selected' : ''}`} data-testid={`booking-treatment-${treatment.id}`}>
                  <span><strong>{treatment.name}</strong><small>{treatment.duration} · {formatPrice(treatment)}</small></span>
                  {draft.treatmentId === treatment.id ? <CircleCheck size={20} /> : <span className="select-mark">Select</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="booking-section">
            <SectionLabel>Step 02 · choose date</SectionLabel>
            <div className="booking-heading-row"><div><h3 className="mt-4 font-display text-4xl leading-[0.93]">When feels right?</h3><p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">Available dates are configurable and subject to confirmation.</p></div></div>
            <div className="calendar-wrap">
              <div className="calendar-head"><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="calendar-arrow" aria-label="Previous month"><ArrowLeft size={16} /></button><strong>{new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(month)}</strong><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="calendar-arrow" aria-label="Next month"><ArrowRight size={16} /></button></div>
              <div className="calendar-grid calendar-weekdays">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}</div>
              <div className="calendar-grid">{calendarDays.map((day, index) => {
                if (!day) return <span key={`empty-${index}`} />;
                const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                const isUnavailable = key < todayKey() || !bookingConfig.availableDays.includes(day.getDay());
                return <button key={key} disabled={isUnavailable} onClick={() => update('date', key)} className={`calendar-day ${draft.date === key ? 'calendar-day-selected' : ''} ${key === todayKey() ? 'calendar-day-today' : ''}`} aria-label={formatLongDate(key)}>{day.getDate()}</button>;
              })}</div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="booking-section">
            <SectionLabel>Step 03 · choose time</SectionLabel>
            <h3 className="mt-4 font-display text-4xl leading-[0.93]">Find a good time.</h3>
            <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Preferred slots are requests; the clinic team will confirm availability with you on WhatsApp.</p>
            <div className="selected-date-chip"><CalendarDays size={16} /> {formatLongDate(draft.date)}</div>
            <div className="time-grid">{bookingConfig.timeSlots.map((slot) => <button key={slot} onClick={() => update('time', slot)} className={`time-slot ${draft.time === slot ? 'time-slot-selected' : ''}`}>{draft.time === slot && <Check size={15} />}{slot}</button>)}</div>
          </div>
        )}

        {step === 4 && (
          <div className="booking-section">
            <SectionLabel>Step 04 · patient details</SectionLabel>
            <h3 className="mt-4 font-display text-4xl leading-[0.93]">A few details, please.</h3>
            <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Just enough for the clinic team to reach you. No unnecessary medical information.</p>
            <div className="detail-form">
              <label>Full name *<input value={draft.patientName} onChange={(event) => update('patientName', event.target.value)} placeholder="How should we address you?" autoComplete="name" data-testid="input-patient-name" /></label>
              <label>Phone number *<input value={draft.phone} onChange={(event) => update('phone', event.target.value)} placeholder="+91 98765 43210" inputMode="tel" autoComplete="tel" data-testid="input-patient-phone" /></label>
              <label>Email <span className="optional">(optional)</span><input value={draft.email} onChange={(event) => update('email', event.target.value)} placeholder="you@example.com" type="email" autoComplete="email" data-testid="input-patient-email" /></label>
              <label className="sm:col-span-2">Reason for visit <span className="optional">(optional)</span><textarea value={draft.reason} onChange={(event) => update('reason', event.target.value)} placeholder="A concern, question, or anything useful to know." data-testid="input-visit-reason" /></label>
            </div>
          </div>
        )}

        {step === 5 && selectedTreatment && (
          <div className="booking-section">
            <SectionLabel>Step 05 · review</SectionLabel>
            <h3 className="mt-4 font-display text-4xl leading-[0.93]">Does this look right?</h3>
            <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Review your details, then send this request directly to Dental Care on WhatsApp for confirmation.</p>
            <div className="review-card">
              <div className="review-card-heading"><span className="price-caption">Your appointment</span><CalendarDays size={19} className="text-[hsl(var(--primary))]" /></div>
              <div className="review-grid">
                <div><span className="price-caption">Treatment</span><strong>{selectedTreatment.name}</strong></div>
                <div><span className="price-caption">Price</span><strong>{formatPrice(selectedTreatment)}</strong></div>
                <div><span className="price-caption">Duration</span><strong>{selectedTreatment.duration}</strong></div>
                <div><span className="price-caption">Date & time</span><strong>{formatLongDate(draft.date)} · {draft.time}</strong></div>
                <div><span className="price-caption">Patient</span><strong>{draft.patientName}</strong></div>
                <div><span className="price-caption">Phone</span><strong>{draft.phone}</strong></div>
              </div>
              <div className="review-address"><span className="price-caption">Clinic</span>{clinicConfig.addressLines.map((line) => <span key={line}>{line}</span>)}</div>
            </div>
             <div className="booking-whatsapp-note">
               <MessageCircle size={16} />
               <span>WhatsApp will open with these details pre-filled. The clinic will confirm your appointment there.</span>
             </div>
          </div>
        )}

        {error && <div className="booking-error" role="alert">{error}</div>}
        <div className="booking-footer">
          <button onClick={() => step === 1 ? onClose() : setStep((current) => current - 1)} className="button-ghost">{step === 1 ? 'Cancel' : <><ArrowLeft size={15} /> Back</>}</button>
          {step < 5 ? <button onClick={next} className="button-primary inline-flex items-center gap-2 px-6 py-3.5">Continue <ArrowRight size={16} /></button> : <button onClick={bookViaWhatsApp} disabled={openingWhatsApp} className="button-primary inline-flex items-center gap-2 px-6 py-3.5 disabled:opacity-60">{openingWhatsApp ? 'Opening WhatsApp…' : 'BOOK VIA WHATSAPP'}<MessageCircle size={16} /></button>}
        </div>
      </div>
    </div>
  );
}

function ContactDetails() {
  const hasContact = clinicConfig.phone || clinicConfig.email || clinicConfig.whatsapp;
  return (
    <div className="contact-list" data-testid="contact-details">
      <a href={clinicPhoneHref}><Phone size={16} /> <span><small>Phone</small>{clinicConfig.phone}</span></a>
      {clinicConfig.email ? <a href={`mailto:${clinicConfig.email}`}><MessageCircle size={16} /> <span><small>Email</small>{clinicConfig.email}</span></a> : null}
      <a href={getWhatsAppHref()} target="_blank" rel="noreferrer"><MessageCircle size={16} /> <span><small>WhatsApp</small>Message the clinic</span></a>
      {!hasContact && <p className="text-sm leading-6 text-white/65">Phone, email, and WhatsApp details will appear here once configured by the clinic.</p>}
      {clinicConfig.mapUrl ? <a href={clinicConfig.mapUrl} target="_blank" rel="noreferrer"><Navigation size={16} /> <span><small>Location</small>Get directions</span><ArrowUpRight size={14} className="ml-auto" /></a> : <p className="flex items-center gap-2 text-xs text-white/55"><Navigation size={15} /> Map link to be added</p>}
    </div>
  );
}

type AssistantAction = {
  label: string;
  kind: 'book' | 'whatsapp' | 'call' | 'treatments';
  treatmentId?: string;
};

type AssistantMessage = {
  id: number;
  role: 'assistant' | 'user';
  text: string;
  actions?: AssistantAction[];
};

function findTreatmentForAssistant(query: string) {
  const normalized = query.toLowerCase();
  const exact = treatmentConfig.find((treatment) => normalized.includes(treatment.name.toLowerCase()));
  if (exact) return exact;
  return treatmentConfig.find((treatment) => {
    const keywords = treatment.name.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 3);
    return keywords.length > 0 && keywords.every((word) => normalized.includes(word));
  });
}

function buildAssistantResponse(query: string): Omit<AssistantMessage, 'id' | 'role'> {
  const normalized = query.toLowerCase();
  const treatment = findTreatmentForAssistant(query);
  const contactActions: AssistantAction[] = [
    { label: 'Call clinic', kind: 'call' },
    { label: 'WhatsApp', kind: 'whatsapp' },
  ];

  if (/(diagnos|medicine|medication|prescri|what do i have|is this serious|pain|swelling|bleed)/.test(normalized)) {
    return {
      text: 'I can share clinic information and help you request a visit, but a dentist needs to evaluate individual symptoms. Please contact Dental Care directly if you need clinical guidance.',
      actions: contactActions,
    };
  }

  if (/(where|located|address|direction|find the clinic|location)/.test(normalized)) {
    return {
      text: `Dental Care is at:\n${clinicConfig.addressLines.join('\n')}`,
      actions: contactActions,
    };
  }

  if (/(whatsapp|message the clinic)/.test(normalized)) {
    return {
      text: 'You can message Dental Care on WhatsApp with a pre-filled enquiry.',
      actions: [{ label: 'Open WhatsApp', kind: 'whatsapp' }],
    };
  }

  if (/(call|phone|speak to someone)/.test(normalized)) {
    return {
      text: `You can call Dental Care on ${clinicPhoneDisplay}.`,
      actions: [{ label: 'Call clinic', kind: 'call' }],
    };
  }

  if (/(root canal|rct|re-rct)/.test(normalized) && /(price|rate|cost|how much)/.test(normalized)) {
    const rootCanalTreatments = treatmentConfig.filter((item) => item.category === 'root-canal' && /(rct|re-rct|kids)/i.test(item.name));
    return {
      text: `These Root Canal rate-sheet options are listed:\n${rootCanalTreatments.map((item) => `${item.name}: ${formatPrice(item)}`).join('\n')}`,
      actions: rootCanalTreatments.slice(0, 3).map((item) => ({ label: `Book ${item.name}`, kind: 'book' as const, treatmentId: item.id })),
    };
  }

  if (/(price|rate|cost|how much)/.test(normalized)) {
    if (treatment) {
      return {
        text: `${treatment.name} is listed at ${formatPrice(treatment)} in the current Dental Care rate sheet.\n\nWould you like to book an appointment?`,
        actions: [
          { label: `Book ${treatment.name}`, kind: 'book', treatmentId: treatment.id },
          { label: 'WhatsApp', kind: 'whatsapp', treatmentId: treatment.id },
        ],
      };
    }
    const category = normalized.includes('crown') ? 'crowns' : normalized.includes('fill') ? 'fillings' : normalized.includes('clean') ? 'cleaning' : '';
    if (category) {
      const items = treatmentConfig.filter((item) => item.category === category);
      return {
        text: `${categories.find(([value]) => value === category)?.[1] || 'Treatment'} rates:\n${items.map((item) => `${item.name}: ${formatPrice(item)}`).join('\n')}`,
        actions: [{ label: 'View all treatments', kind: 'treatments' }],
      };
    }
  }

  if (treatment && /(book|appointment|schedule|visit|want)/.test(normalized)) {
    return {
      text: `I found ${treatment.name}. I can open the structured booking flow with it already selected.`,
      actions: [{ label: `Book ${treatment.name}`, kind: 'book', treatmentId: treatment.id }],
    };
  }

  if (/(book|appointment|schedule|request a visit)/.test(normalized)) {
    return {
      text: 'I can open the structured appointment flow. You will choose a treatment, date, time, and share only the details the clinic needs to follow up.',
      actions: [{ label: 'Book appointment', kind: 'book' }],
    };
  }

  if (/(faq|after i submit|what happens|process|how does booking work)/.test(normalized)) {
    return {
      text: 'Choose a treatment, preferred date and time, then share your name and phone number. I will prepare the details in WhatsApp for Dental Care, where the clinic team will confirm availability. Sending a message does not confirm an appointment.',
      actions: [{ label: 'Book appointment', kind: 'book' }, ...contactActions],
    };
  }

  if (/(treatment|service|category|available care|what do you offer)/.test(normalized)) {
    return {
      text: `There are ${treatmentConfig.length} treatments in the current rate sheet across Diagnostics, Extraction, Cleaning, Fillings, Root Canal, Crowns, and Dentures & RPD.`,
      actions: [{ label: 'View treatments & prices', kind: 'treatments' }],
    };
  }

  return {
    text: "I don't have that information yet. You can contact Dental Care directly.",
    actions: contactActions,
  };
}

function Assistant({ onBook }: { onBook: (treatmentId?: string) => void }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 1,
      role: 'assistant',
      text: 'Hello. I can help you find treatments, check rate-sheet prices, or start a WhatsApp appointment request.',
    },
  ]);

  useEffect(() => {
    if (!pendingQuery) return;
    const timer = window.setTimeout(() => {
      const response = buildAssistantResponse(pendingQuery);
      setMessages((current) => [...current, { id: Date.now(), role: 'assistant', ...response }]);
      setPendingQuery(null);
    }, 380);
    return () => window.clearTimeout(timer);
  }, [pendingQuery]);

  const send = (value = input) => {
    const trimmed = value.trim();
    if (!trimmed || pendingQuery) return;
    setMessages((current) => [...current, { id: Date.now(), role: 'user', text: trimmed }]);
    setInput('');
    setPendingQuery(trimmed);
  };

  const executeAction = (action: AssistantAction) => {
    if (action.kind === 'book') {
      onBook(action.treatmentId);
      setOpen(false);
    } else if (action.kind === 'whatsapp') {
      const treatment = action.treatmentId ? treatmentConfig.find((item) => item.id === action.treatmentId) : undefined;
      const message = treatment
        ? `Hello Dental Care, I would like to enquire about ${treatment.name} (${formatPrice(treatment)}).`
        : whatsappMessage;
      window.open(getWhatsAppHref(message), '_blank', 'noopener,noreferrer');
    } else if (action.kind === 'call') {
      window.location.href = clinicPhoneHref;
    } else {
      document.getElementById('treatments')?.scrollIntoView({ behavior: 'smooth' });
      setOpen(false);
    }
  };

  const quickActions = [
    ['Treatments & prices', 'Show me treatments and prices'],
    ['Book appointment', 'I want to book an appointment'],
    ['Clinic location', 'Where is the clinic located?'],
    ['FAQs', 'What happens after I book through WhatsApp?'],
  ];

  return (
    <>
      {open && (
        <section className="assistant-panel" role="dialog" aria-modal="true" aria-labelledby="assistant-title">
          <div className="assistant-header">
            <div className="assistant-avatar"><Sparkles size={17} /></div>
            <div className="assistant-header-copy"><strong id="assistant-title">Dental Care Assistant</strong><span>How can I help you today?</span></div>
            <button className="assistant-close" onClick={() => setOpen(false)} aria-label="Close Dental Care Assistant"><X size={17} /></button>
          </div>
          <div className="assistant-messages" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={`assistant-message ${message.role === 'assistant' ? 'assistant-message-assistant' : 'assistant-message-user'}`}>
                {message.text}
                {message.actions && <div className="assistant-actions">{message.actions.map((action) => <button key={`${message.id}-${action.label}`} className="assistant-action" onClick={() => executeAction(action)}>{action.label}</button>)}</div>}
              </div>
            ))}
            {pendingQuery && <div className="assistant-message assistant-message-assistant assistant-typing" aria-label="Assistant is typing"><span /><span /><span /></div>}
          </div>
          <div className="assistant-quick-actions" aria-label="Assistant quick actions">
            {quickActions.map(([label, value]) => <button key={label} className="assistant-quick-action" onClick={() => send(value)}>{label}</button>)}
            <button className="assistant-quick-action" onClick={() => executeAction({ label: 'WhatsApp', kind: 'whatsapp' })}>WhatsApp</button>
            <button className="assistant-quick-action" onClick={() => executeAction({ label: 'Call clinic', kind: 'call' })}>Call clinic</button>
          </div>
          <form className="assistant-input-row" onSubmit={(event) => { event.preventDefault(); send(); }}>
            <input className="assistant-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about treatments, prices or appointments..." aria-label="Ask Dental Care Assistant" autoFocus />
            <button className="assistant-send" type="submit" disabled={!input.trim() || Boolean(pendingQuery)} aria-label="Send message"><ArrowUpRight size={17} /></button>
          </form>
        </section>
      )}
      {!open && <button className="assistant-launcher" onClick={() => setOpen(true)} aria-label="Open Dental Care Assistant" data-testid="button-assistant"><span className="assistant-pulse" /><MessageCircle size={22} /></button>}
    </>
  );
}

function Home() {
  const [faq, setFaq] = useState<number | null>(0);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [detailTreatment, setDetailTreatment] = useState<Treatment | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingTreatmentId, setBookingTreatmentId] = useState<string | undefined>();
  const health = useHealthCheck();
  const visibleTreatments = useMemo(() => treatmentConfig.filter((treatment) => {
    const matchesCategory = category === 'all' || treatment.category === category;
    const searchable = `${treatment.name} ${treatment.shortDescription} ${treatment.description}`.toLowerCase();
    return matchesCategory && searchable.includes(query.toLowerCase());
  }), [category, query]);
  const openBooking = (treatmentId?: string) => {
    setDetailTreatment(null);
    setBookingTreatmentId(treatmentId);
    setBookingOpen(true);
  };
  const faqItems = [
    ['How do I book an appointment?', 'Choose a treatment, preferred date, time, and share your contact details. Your request is sent to the clinic team for follow-up.'],
    ['Where is Dental Care located?', clinicConfig.address],
    ['How do treatment prices work?', 'The displayed rates come from the current Dental Care rate sheet. Some services have ranges or multiple rates; the dentist will discuss the final cost based on your requirements.'],
    ['Can I choose my preferred time?', 'Yes. Choose from the configured preferred slots. The clinic team will contact you to confirm availability.'],
    ['What happens after I book through WhatsApp?', 'Your booking details open in a pre-filled WhatsApp message to Dental Care. Send it to the clinic team, who will confirm availability with you. Sending the message does not confirm a visit.'],
    ['Can I contact the clinic through WhatsApp?', clinicConfig.whatsapp ? 'Yes. Use the WhatsApp link in the Contact section.' : 'WhatsApp details will be added here once configured by the clinic.'],
  ];
  return (
    <div id="top" className="noise min-h-[100dvh] overflow-hidden bg-[hsl(var(--background))]">
      <Header onBook={openBooking} />
      <main>
        <section className="hero-section">
          <div className="hero-orb hero-orb-one" /><div className="hero-orb hero-orb-two" />
          <div className="container-clinic relative z-10 grid items-center gap-10 py-28 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 lg:py-32">
            <div className="max-w-xl">
              <SectionLabel light>Dental Care · Kurla East, Mumbai</SectionLabel>
              <h1 className="mt-6 max-w-[710px] font-display text-[4.25rem] leading-[0.86] tracking-[-0.05em] text-white sm:text-[6.5rem] lg:text-[7.35rem]">Confident<br /><span className="text-[hsl(var(--accent-light))]">smiles</span> start here.</h1>
              <p className="mt-7 max-w-lg text-base leading-7 text-white/70 sm:text-lg">Modern dental care designed around your comfort, health, and smile.</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button onClick={() => openBooking()} className="button-light inline-flex items-center gap-2 px-6 py-3.5" data-testid="button-hero-book">Book an appointment <ArrowUpRight size={16} /></button>
                <a href="#treatments" className="button-outline-light inline-flex items-center gap-2 px-5 py-3.5" data-testid="link-hero-treatments">View treatments & prices <ArrowRight size={16} /></a>
              </div>
              <div className="mt-9 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-white/60"><span className="status-dot" /><span>{health.isLoading ? 'Preparing WhatsApp booking' : 'WhatsApp booking ready'}</span><span className="text-white/25">/</span><span>Kurla East, Mumbai</span></div>
            </div>
            <div className="hero-visual">
              <img src="/clinic-atrium.png" alt="Sunlit modern interior at Dental Care clinic" className="hero-image" />
              <div className="hero-image-wash" />
              <div className="hero-note"><Sparkles size={16} /><span>Care that starts<br />with a conversation.</span></div>
              <div className="hero-stat"><span className="price-caption text-white/50">At a glance</span><strong>Clear care.<br />No pressure.</strong></div>
            </div>
          </div>
        </section>
        <QuickActions onBook={() => openBooking()} />

        <section id="treatments" className="container-clinic scroll-mt-20 py-20 md:py-28">
           <div className="section-heading-row"><div><SectionLabel>Treatments & pricing</SectionLabel><h2 className="treatments-heading">Dental Treatments &amp; Prices</h2></div><div className="treatment-section-intro"><strong>{treatmentConfig.length} treatments</strong><p>Explore our dental treatments and view the applicable rates.</p></div></div>
          <div className="catalogue-toolbar">
            <label className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search treatments..." aria-label="Search treatments" data-testid="input-treatment-search" /></label>
            <div className="category-scroll" aria-label="Treatment categories">{categories.map(([value, label]) => <button key={value} onClick={() => setCategory(value)} className={`category-pill ${category === value ? 'category-pill-active' : ''}`} data-testid={`filter-${value}`}>{label}</button>)}</div>
          </div>
          <div className="treatment-grid">{visibleTreatments.map((treatment) => <TreatmentCard key={treatment.id} treatment={treatment} onDetails={() => setDetailTreatment(treatment)} onBook={() => openBooking(treatment.id)} />)}</div>
          {!visibleTreatments.length && <div className="empty-catalogue">No treatments match that search. Try a different word or category.</div>}
           <p className="catalogue-disclaimer">Rates are shown as provided on the Dental Care rate sheet. Final treatment recommendations and costs are discussed with the dentist.</p>
        </section>

        <section id="pricing" className="pricing-section scroll-mt-20">
          <div className="container-clinic">
             <div className="section-heading-row section-heading-light"><div><SectionLabel light>Transparent treatment pricing</SectionLabel><h2 className="mt-5 max-w-2xl font-display text-5xl leading-[0.9] tracking-[-0.04em] text-white sm:text-6xl">Know what to<br /><em className="text-[hsl(var(--accent-light))]">expect next.</em></h2></div><p className="max-w-sm text-sm leading-6 text-white/65">Browse the current Dental Care rate sheet in one clear, searchable view. Ranges and multiple rates are preserved as listed.</p></div>
            <div className="pricing-table" role="table" aria-label="Treatment pricing">
              <div className="pricing-row pricing-head" role="row"><span>Treatment</span><span>Duration</span><span>Price</span><span /></div>
              {treatmentConfig.map((treatment) => <div className="pricing-row" role="row" key={treatment.id}><strong>{treatment.name}</strong><span>{treatment.duration}</span><span>{formatPrice(treatment)}</span><button onClick={() => openBooking(treatment.id)} className="table-book" data-testid={`pricing-book-${treatment.id}`}>Book <ArrowUpRight size={14} /></button></div>)}
            </div>
            <p className="pricing-disclaimer">Prices shown are indicative and may vary depending on treatment requirements. Final treatment cost will be discussed with the dentist.</p>
          </div>
        </section>

        <section id="about" className="container-clinic scroll-mt-20 py-20 md:py-28">
          <div className="split-section"><div><SectionLabel>About Dental Care</SectionLabel><h2 className="mt-5 max-w-xl font-display text-5xl leading-[0.9] tracking-[-0.04em] sm:text-6xl">Thoughtful care.<br /><em className="text-[hsl(var(--primary))]">Confident smiles.</em></h2></div><div><p className="max-w-xl text-lg leading-8 text-[hsl(var(--muted-foreground))]">Dental Care is built around a simple idea: when people feel heard, they make better decisions for their health. We make space for the first conversation, explain the why, and help you understand what comes next.</p><div className="mini-values mt-10"><div><strong>01</strong><span>Listen first</span></div><div><strong>02</strong><span>Explain clearly</span></div><div><strong>03</strong><span>Plan together</span></div></div></div></div>
        </section>

        <section id="why-us" className="blue-feature-section scroll-mt-20">
          <div className="container-clinic"><SectionLabel light>Why choose Dental Care</SectionLabel><div className="mt-6 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]"><h2 className="max-w-xl font-display text-5xl leading-[0.9] tracking-[-0.04em] text-white sm:text-6xl">A better feeling<br />from the <em className="text-[hsl(var(--accent-light))]">start.</em></h2><div className="feature-grid">{['Patient-centered care', 'Comfortable experience', 'Clear treatment guidance', 'Modern clinical approach', 'Personalized care', 'Convenient local address'].map((item, index) => <div key={item} className="feature-item"><span>0{index + 1}</span><strong>{item}</strong><Check size={16} /></div>)}</div></div></div>
        </section>

        <section className="container-clinic py-20 md:py-28">
          <div className="split-section"><div><SectionLabel>What to expect</SectionLabel><h2 className="mt-5 max-w-md font-display text-5xl leading-[0.9] tracking-[-0.04em] sm:text-6xl">No surprises.<br /><em className="text-[hsl(var(--primary))]">Just next steps.</em></h2></div><div className="journey-list">{[['Choose your care', 'Start with a treatment or simply describe what is on your mind.'], ['Choose your moment', 'Share a preferred date and time that works with your life.'], ['Leave with clarity', 'The clinic follows up, confirms availability, and explains the next step.']].map(([title, body], index) => <div className="journey-item" key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{body}</p></div></div>)}</div></div>
        </section>

        {clinicConfig.doctors.length > 0 && <section className="container-clinic py-20"><SectionLabel>Meet the team</SectionLabel></section>}
        {clinicConfig.testimonials.length > 0 && <section className="container-clinic py-20"><SectionLabel>Patient stories</SectionLabel></section>}

        <section id="faq" className="faq-section scroll-mt-20">
          <div className="container-clinic split-section"><div><SectionLabel>Questions, answered</SectionLabel><h2 className="mt-5 max-w-md font-display text-5xl leading-[0.9] tracking-[-0.04em] sm:text-6xl">A little more<br /><em className="text-[hsl(var(--primary))]">clarity.</em></h2></div><div className="faq-list">{faqItems.map(([question, answer], index) => <div className="faq-item" key={question}><button onClick={() => setFaq(faq === index ? null : index)} aria-expanded={faq === index} className="faq-trigger" data-testid={`button-faq-${index}`}><span>{question}</span><ChevronDown size={18} className={faq === index ? 'rotate-180' : ''} /></button>{faq === index && <p className="faq-answer" data-testid={`text-faq-answer-${index}`}>{answer}</p>}</div>)}</div></div>
        </section>

        <section id="contact" className="container-clinic scroll-mt-20 pb-20 md:pb-28">
          <div className="location-card"><div className="location-copy"><SectionLabel>Visit Dental Care</SectionLabel><h2 className="mt-5 max-w-xl font-display text-5xl leading-[0.9] tracking-[-0.04em] sm:text-6xl">A familiar address<br />for better <em className="text-[hsl(var(--primary))]">care.</em></h2><div className="address-block"><Navigation size={19} className="mt-1 shrink-0 text-[hsl(var(--primary))]" /><p data-testid="text-clinic-address">{clinicConfig.addressLines.map((line) => <span key={line}>{line}</span>)}</p></div><div className="flex flex-wrap gap-3"><button onClick={() => openBooking()} className="button-primary inline-flex items-center gap-2 px-5 py-3.5">Book appointment <ArrowUpRight size={16} /></button>{clinicConfig.mapUrl ? <a href={clinicConfig.mapUrl} target="_blank" rel="noreferrer" className="button-secondary inline-flex items-center gap-2 px-5 py-3.5">Get directions <Navigation size={16} /></a> : <span className="button-secondary inline-flex items-center gap-2 px-5 py-3.5 text-[hsl(var(--muted-foreground))]">Map link to be added <Navigation size={16} /></span>}</div></div><div className="location-contact"><div><div className="eyebrow text-[hsl(var(--accent-light))]">Contact system</div><h3 className="mt-5 font-display text-4xl leading-[0.9] text-white">Make a beginning<br />that feels easy.</h3></div><ContactDetails /></div></div>
        </section>

        <section className="final-cta"><div className="container-clinic flex flex-col items-start justify-between gap-8 md:flex-row md:items-end"><div><SectionLabel light>Ready when you are</SectionLabel><h2 className="mt-5 max-w-3xl font-display text-5xl leading-[0.9] tracking-[-0.04em] text-white sm:text-7xl">Ready to book<br />your <em className="text-[hsl(var(--accent-light))]">visit?</em></h2><p className="mt-5 max-w-md text-sm leading-6 text-white/65">Choose your treatment, preferred date, and time in a few simple steps.</p></div><button onClick={() => openBooking()} className="button-light inline-flex items-center gap-2 px-6 py-3.5">Book an appointment <ArrowUpRight size={16} /></button></div></section>
      </main>
       <footer className="site-footer"><div className="container-clinic grid gap-10 py-10 md:grid-cols-[1fr_1fr_1fr]"><div><BrandMark light /><p className="mt-5 max-w-xs text-sm leading-6 text-white/55">Modern dental care designed around your comfort, health, and smile.</p></div><div><span className="price-caption text-white/45">Explore</span><div className="footer-links mt-4"><a href="#treatments">Treatments</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a><a href="#contact">Contact</a></div></div><div><span className="price-caption text-white/45">Contact</span><div className="footer-links mt-4"><a href={clinicPhoneHref}><Phone size={14} /> {clinicConfig.phone}</a><a href={getWhatsAppHref()} target="_blank" rel="noreferrer"><MessageCircle size={14} /> WhatsApp</a><p className="text-sm leading-6 text-white/65" data-testid="text-footer-address">{clinicConfig.addressLines.map((line) => <span key={line} className="block">{line}</span>)}</p></div></div></div><div className="container-clinic flex flex-col gap-2 border-t border-white/10 py-5 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} Dental Care</span><a href="#top" className="text-[hsl(var(--accent-light))]">Back to top ↑</a></div></footer>
       <div className="mobile-action-bar"><a href={clinicPhoneHref} aria-label={`Call Dental Care at ${clinicConfig.phone}`}><Phone size={16} /> Call</a><a href={getWhatsAppHref()} target="_blank" rel="noreferrer" aria-label="WhatsApp Dental Care"><MessageCircle size={16} /> WhatsApp</a><button onClick={() => openBooking()}><CalendarDays size={16} /> Book</button></div>
       <Assistant onBook={openBooking} />
      {detailTreatment && <TreatmentDetail treatment={detailTreatment} onClose={() => setDetailTreatment(null)} onBook={() => openBooking(detailTreatment.id)} />}
      {bookingOpen && <BookingFlow initialTreatmentId={bookingTreatmentId} onClose={() => setBookingOpen(false)} />}
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;