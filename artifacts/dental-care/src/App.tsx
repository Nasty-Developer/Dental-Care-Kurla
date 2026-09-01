import { useState, type ReactNode } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useCreateAppointmentRequest, useHealthCheck, type AppointmentRequest, type AppointmentRequestInput } from '@workspace/api-client-react';
import { ArrowUpRight, CalendarDays, Check, ChevronDown, CircleCheck, Clock3, MapPin, Menu, MessageCircle, Navigation, Phone, Send, ShieldCheck, Sparkles, Stethoscope, X } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

const clinicConfig = {
  city: 'Mumbai',
  location: 'Kurla East, Mumbai - 400024',
  address: 'Shop No: 01, Bldg No: 84, Navchaitanya CHS, Police Colony, Nehru Nagar, Kurla East - 400024',
  phone: '',
  email: '',
  whatsapp: '',
  mapUrl: '',
  doctors: [] as Array<{ name: string; role: string; focus: string }>,
  testimonials: [] as Array<{ quote: string; name: string; detail: string }>,
};

const serviceOptions = [
  { name: 'General dentistry', note: 'Everyday care, made unrushed.', icon: ShieldCheck },
  { name: 'Preventive care', note: 'Keep small concerns small.', icon: Sparkles },
  { name: 'Cosmetic dentistry', note: 'Subtle changes, considered well.', icon: CircleCheck },
  { name: 'Restorative dentistry', note: 'Strong, natural-feeling solutions.', icon: Stethoscope },
  { name: 'Children’s dentistry', note: 'A gentle first relationship with care.', icon: Check },
];

const bookingSchema = z.object({
  name: z.string().min(2, 'Please enter your name.'),
  phone: z.string().min(10, 'Please enter a reachable phone number.'),
  email: z.string().min(3, 'Please enter your email address.').email('Please check your email address.'),
  service: z.string().min(1, 'Please choose what you would like help with.'),
  preferredDate: z.string().min(1, 'Please choose a preferred date.'),
  preferredTime: z.string().min(1, 'Please choose a preferred time.'),
  message: z.string().max(1000, 'Please keep your note under 1000 characters.').optional(),
});

type BookingValues = z.infer<typeof bookingSchema>;

function BrandMark() {
  return (
    <div className="flex items-center gap-3" data-testid="brand-clinic">
      <div className="relative flex size-10 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
        <span className="font-display text-[1.7rem] leading-none">d</span>
        <span className="absolute bottom-[7px] right-[8px] size-1.5 rounded-full bg-[hsl(var(--accent))]" />
      </div>
      <div className="leading-none">
        <div className="font-semibold tracking-[-0.03em] text-[hsl(var(--foreground))]">Dental Care</div>
        <div className="mt-1 text-[0.62rem] font-mono-ui uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">Kurla East · Mumbai</div>
      </div>
    </div>
  );
}

function Header({ onBook }: { onBook: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [['Our approach', '#approach'], ['Care options', '#care'], ['What to expect', '#expect']];
  const go = () => setMenuOpen(false);
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="container-clinic flex h-[88px] items-center justify-between">
        <a href="#top" onClick={go} data-testid="link-home"><BrandMark /></a>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
          {links.map(([label, href]) => <a key={href} href={href} className="text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]" data-testid={`link-${label.toLowerCase().replaceAll(' ', '-')}`}>{label}</a>)}
        </nav>
        <button onClick={onBook} className="hidden items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-5 py-3 text-sm font-semibold text-[hsl(var(--primary-foreground))] transition-transform hover:-translate-y-0.5 md:flex" data-testid="button-header-book">
          Request a visit <ArrowUpRight size={16} />
        </button>
        <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-full border border-[hsl(var(--border))] p-2.5 md:hidden" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} data-testid="button-mobile-menu">
          {menuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>
      {menuOpen && (
        <div className="container-clinic md:hidden">
          <nav className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 shadow-[var(--shadow-md)]" aria-label="Mobile navigation">
            {links.map(([label, href]) => <a key={href} href={href} onClick={go} className="block rounded-xl px-4 py-3 text-sm hover:bg-[hsl(var(--muted))]" data-testid={`mobile-link-${label.toLowerCase().replaceAll(' ', '-')}`}>{label}</a>)}
            <button onClick={() => { go(); onBook(); }} className="mt-1 flex w-full items-center justify-between rounded-xl bg-[hsl(var(--primary))] px-4 py-3 text-sm font-semibold text-[hsl(var(--primary-foreground))]" data-testid="button-mobile-book">Request a visit <ArrowUpRight size={16} /></button>
          </nav>
        </div>
      )}
    </header>
  );
}

function SectionLabel({ children, light = false }: { children: string; light?: boolean }) {
  return <div className={`eyebrow flex items-center gap-3 ${light ? 'text-[hsl(var(--sidebar-primary))]' : 'text-[hsl(var(--primary))]'}`}><span className="h-px w-8 bg-current" />{children}</div>;
}

function BookingForm() {
  const [result, setResult] = useState<AppointmentRequest | null>(null);
  const createRequest = useCreateAppointmentRequest();
  const form = useForm<BookingValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { name: '', phone: '', email: '', service: '', preferredDate: '', preferredTime: '', message: '' },
  });

  const onSubmit = (values: BookingValues) => {
    const payload: AppointmentRequestInput = { ...values, message: values.message?.trim() || undefined };
    createRequest.mutate({ data: payload }, { onSuccess: (response) => { setResult(response); form.reset(); } });
  };

  if (result) {
    return (
      <div className="rounded-[2rem] border border-[hsl(var(--sidebar-primary)/0.28)] bg-[hsl(var(--sidebar-accent))] p-7 md:p-10" data-testid="status-request-received">
        <div className="flex size-14 items-center justify-center rounded-full bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]"><CircleCheck size={27} /></div>
        <div className="mt-8 max-w-lg">
          <div className="eyebrow text-[hsl(var(--sidebar-primary))]">Request received</div>
          <h3 className="mt-3 font-display text-4xl leading-[0.95] text-[hsl(var(--sidebar-foreground))] md:text-5xl">Thank you for reaching out.</h3>
          <p className="mt-5 text-base leading-7 text-[hsl(var(--sidebar-foreground)/0.72)]">Our clinic team has received your request. We will follow up to understand what you need and find a suitable time. This is a request, not an appointment confirmation.</p>
          <div className="mt-8 grid gap-3 border-t border-[hsl(var(--sidebar-primary)/0.2)] pt-5 text-sm text-[hsl(var(--sidebar-foreground)/0.72)] sm:grid-cols-2">
            <div><span className="block font-mono-ui text-[0.62rem] uppercase tracking-[0.14em] text-[hsl(var(--sidebar-primary))]">Reference</span><span className="mt-1 block text-[hsl(var(--sidebar-foreground))]" data-testid="text-appointment-reference">{result.appointmentId}</span></div>
            <div><span className="block font-mono-ui text-[0.62rem] uppercase tracking-[0.14em] text-[hsl(var(--sidebar-primary))]">Received</span><span className="mt-1 block text-[hsl(var(--sidebar-foreground))]" data-testid="text-request-status">Request received</span></div>
          </div>
          <button className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[hsl(var(--sidebar-primary))] underline-offset-4 hover:underline" onClick={() => setResult(null)} data-testid="button-new-request">Send another request <ArrowUpRight size={15} /></button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-[2rem] bg-[hsl(var(--card))] p-6 text-[hsl(var(--foreground))] shadow-[var(--shadow-md)] md:p-9" data-testid="form-appointment-request">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div><div className="eyebrow text-[hsl(var(--primary))]">01 / Start here</div><h3 className="mt-3 font-display text-4xl leading-none md:text-5xl">Tell us what you need.</h3></div>
          <div className="hidden rounded-full bg-[hsl(var(--secondary))] p-3 text-[hsl(var(--primary))] sm:block"><CalendarDays size={21} /></div>
        </div>
        <div className="grid gap-x-5 gap-y-5 md:grid-cols-2">
          <FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel className="text-xs font-semibold">Your name</FormLabel><FormControl><Input {...field} placeholder="How should we address you?" className="mt-1 h-12 rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4" data-testid="input-name" /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="phone" render={({ field }) => <FormItem><FormLabel className="text-xs font-semibold">Phone number</FormLabel><FormControl><Input {...field} type="tel" placeholder="A number we can reach you on" className="mt-1 h-12 rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4" data-testid="input-phone" /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="email" render={({ field }) => <FormItem><FormLabel className="text-xs font-semibold">Email address</FormLabel><FormControl><Input {...field} type="email" placeholder="you@example.com" className="mt-1 h-12 rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4" data-testid="input-email" /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="service" render={({ field }) => <FormItem><FormLabel className="text-xs font-semibold">I’m looking for</FormLabel><FormControl><select {...field} className="mt-1 h-12 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" data-testid="select-service"><option value="">Choose a care option</option>{serviceOptions.map((service) => <option key={service.name} value={service.name}>{service.name}</option>)}</select></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="preferredDate" render={({ field }) => <FormItem><FormLabel className="text-xs font-semibold">Preferred date</FormLabel><FormControl><Input {...field} type="date" className="mt-1 h-12 rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4" data-testid="input-date" /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="preferredTime" render={({ field }) => <FormItem><FormLabel className="text-xs font-semibold">Preferred time</FormLabel><FormControl><select {...field} className="mt-1 h-12 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" data-testid="select-time"><option value="">Choose a time window</option><option value="Morning">Morning</option><option value="Afternoon">Afternoon</option><option value="Evening">Evening</option></select></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="message" render={({ field }) => <FormItem className="md:col-span-2"><FormLabel className="text-xs font-semibold">A little more, if useful <span className="font-normal text-[hsl(var(--muted-foreground))]">(optional)</span></FormLabel><FormControl><Textarea {...field} placeholder="Tell us about a concern, sensitivity, or question." className="mt-1 min-h-[104px] resize-none rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3" data-testid="input-message" /></FormControl><FormMessage /></FormItem>} />
        </div>
        {createRequest.isError && <p className="mt-5 rounded-xl bg-[hsl(var(--destructive)/0.09)] px-4 py-3 text-sm text-[hsl(var(--destructive))]" data-testid="status-request-error">We could not send that request just now. Please try again.</p>}
        <div className="mt-7 flex flex-col gap-4 border-t border-[hsl(var(--border))] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xs text-xs leading-5 text-[hsl(var(--muted-foreground))]">We’ll contact you to discuss availability. Your visit is only confirmed once our team speaks with you.</p>
          <button type="submit" disabled={createRequest.isPending} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[hsl(var(--primary))] px-6 text-sm font-semibold text-[hsl(var(--primary-foreground))] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60" data-testid="button-submit-request">{createRequest.isPending ? 'Sending request…' : 'Send request'}<Send size={15} /></button>
        </div>
      </form>
    </Form>
  );
}

function ContactDetails() {
  const items = [
    clinicConfig.phone ? { icon: Phone, label: 'Phone', value: clinicConfig.phone, href: `tel:${clinicConfig.phone}` } : null,
    clinicConfig.email ? { icon: Send, label: 'Email', value: clinicConfig.email, href: `mailto:${clinicConfig.email}` } : null,
    clinicConfig.whatsapp ? { icon: MessageCircle, label: 'WhatsApp', value: clinicConfig.whatsapp, href: clinicConfig.whatsapp } : null,
  ].filter(Boolean) as Array<{ icon: typeof Phone; label: string; value: string; href: string }>;
  return (
    <div className="space-y-5" data-testid="contact-details">
      {items.length ? items.map(({ icon: Icon, label, value, href }) => <a key={label} href={href} className="flex items-center gap-3 text-sm hover:text-[hsl(var(--primary))]" data-testid={`link-${label.toLowerCase()}`}><span className="flex size-9 items-center justify-center rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><Icon size={16} /></span><span><span className="block font-mono-ui text-[0.6rem] uppercase tracking-[0.13em] text-[hsl(var(--muted-foreground))]">{label}</span><span className="mt-0.5 block">{value}</span></span></a>) : <p className="max-w-xs text-sm leading-6 text-[hsl(var(--muted-foreground))]">Phone, email and WhatsApp details are available from the clinic team.</p>}
      {clinicConfig.mapUrl ? <a href={clinicConfig.mapUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm hover:text-[hsl(var(--primary))]" data-testid="link-map"><span className="flex size-9 items-center justify-center rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><Navigation size={16} /></span><span>Open map</span><ArrowUpRight size={14} /></a> : <p className="flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]"><MapPin size={16} className="text-[hsl(var(--primary))]" /> Map link to be added</p>}
    </div>
  );
}

function Home() {
  const [faq, setFaq] = useState<number | null>(0);
  const health = useHealthCheck();
  const scrollToBooking = (service?: string) => {
    if (service) {
      const select = document.querySelector<HTMLSelectElement>('[data-testid="select-service"]');
      if (select) { select.value = service; select.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
  };
  const faqItems = [
    ['What happens after I send a request?', 'Your request goes to the clinic team for follow-up. We will speak with you about your concern and availability before anything is confirmed.'],
    ['Can I request care for a child?', 'Yes. Choose Children’s dentistry in the request form and share anything that would help us make the first conversation comfortable.'],
    ['Where is Dental Care located?', clinicConfig.address],
    ['Do I need to know exactly what treatment I need?', 'Not at all. A concern, a question, or a wish to get back on track is enough to begin.'],
  ];
  return (
    <div id="top" className="noise min-h-[100dvh] overflow-hidden bg-[hsl(var(--background))]">
      <Header onBook={() => scrollToBooking()} />
      <main>
        <section className="relative pb-20 pt-32 md:pb-28 md:pt-44">
          <div className="container-clinic grid items-center gap-14 lg:grid-cols-[0.88fr_1.12fr] lg:gap-20">
            <div className="reveal relative z-10">
              <SectionLabel>Dental care, made human</SectionLabel>
              <h1 className="text-balance mt-7 max-w-[650px] font-display text-[4.3rem] leading-[0.87] tracking-[-0.04em] text-[hsl(var(--foreground))] sm:text-[6.3rem] lg:text-[7.45rem]">A calmer way to care for your <em className="text-[hsl(var(--primary))]">smile.</em></h1>
              <p className="reveal reveal-delay-1 mt-8 max-w-[430px] text-[1.05rem] leading-7 text-[hsl(var(--muted-foreground))]">Thoughtful dentistry for real life, right here in Kurla East. Clear explanations, modern care, and time to feel looked after.</p>
              <div className="reveal reveal-delay-2 mt-9 flex flex-wrap items-center gap-4">
                <button onClick={() => scrollToBooking()} className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-6 py-3.5 text-sm font-semibold text-[hsl(var(--primary-foreground))] transition-transform hover:-translate-y-0.5" data-testid="button-hero-book">Request a visit <ArrowUpRight size={16} /></button>
                <a href="#approach" className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] px-5 py-3.5 text-sm font-semibold text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]" data-testid="link-hero-approach">How we work <span className="text-[hsl(var(--primary))]">↓</span></a>
              </div>
              <div className="reveal reveal-delay-3 mt-12 flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]"><span className={`size-2 rounded-full ${health.isError ? 'bg-[hsl(var(--accent))]' : 'bg-[hsl(var(--primary))]'}`} /><span data-testid="status-clinic-availability">{health.isLoading ? 'Checking request desk' : health.isError ? 'Request desk available' : 'Request desk online'}</span><span className="text-[hsl(var(--border))]">/</span><span>{clinicConfig.location}</span></div>
            </div>
            <div className="reveal reveal-delay-1 relative min-h-[480px] lg:min-h-[625px]">
              <div className="absolute -right-16 -top-12 size-64 rounded-full bg-[hsl(var(--secondary)/0.55)] blur-3xl" />
              <div className="relative h-full overflow-hidden rounded-[2.2rem] bg-[hsl(var(--secondary))]">
                <img src="/clinic-atrium.png" alt="Sunlit interior at Dental Care clinic" className="h-full min-h-[480px] w-full object-cover object-center mix-blend-multiply opacity-90 lg:min-h-[625px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--foreground)/0.58)] via-transparent to-transparent" />
                <div className="absolute left-5 top-5 rounded-full border border-[hsl(var(--card)/0.6)] bg-[hsl(var(--card)/0.78)] px-4 py-2 text-[0.68rem] font-semibold backdrop-blur-md md:left-7 md:top-7" data-testid="text-clinic-welcome">A neighborhood clinic, considered well.</div>
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4 text-[hsl(var(--card))] md:bottom-8 md:left-8 md:right-8"><div><div className="eyebrow text-[hsl(var(--card)/0.7)]">At a glance</div><div className="mt-2 text-sm">Care that starts with a conversation.</div></div><div className="flex size-12 items-center justify-center rounded-full border border-[hsl(var(--card)/0.55)]"><ArrowUpRight size={19} /></div></div>
              </div>
              <div className="absolute -bottom-8 -left-5 hidden w-44 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-[var(--shadow-sm)] sm:block md:-left-12" data-testid="card-clinic-hours"><div className="flex items-center justify-between"><Clock3 size={17} className="text-[hsl(var(--primary))]" /><span className="font-mono-ui text-[0.6rem] uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Good to know</span></div><div className="mt-7 font-display text-2xl">Take your time.</div><p className="mt-1 text-xs leading-5 text-[hsl(var(--muted-foreground))]">We leave room for questions.</p></div>
            </div>
          </div>
        </section>

        <section className="border-y border-[hsl(var(--border))] bg-[hsl(var(--card)/0.5)]" aria-label="Clinic principles">
          <div className="container-clinic grid gap-0 md:grid-cols-3">
            {['Clear, kind explanations', 'Modern clinical thinking', 'A familiar local address'].map((item, index) => <div key={item} className={`flex items-center gap-4 py-5 text-sm ${index !== 0 ? 'border-t border-[hsl(var(--border))] md:border-l md:border-t-0 md:pl-8' : ''}`} data-testid={`text-principle-${index}`}><span className="font-mono-ui text-xs text-[hsl(var(--primary))]">0{index + 1}</span>{item}</div>)}
          </div>
        </section>

        <section id="approach" className="container-clinic scroll-mt-10 py-28 md:py-40">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
            <div><SectionLabel>Our approach</SectionLabel><p className="mt-8 max-w-xs text-sm leading-6 text-[hsl(var(--muted-foreground))]">Good care is not only what happens during treatment. It is the feeling of understanding what comes next.</p></div>
            <div><h2 className="text-balance max-w-3xl font-display text-[3.3rem] leading-[0.92] tracking-[-0.03em] sm:text-[5.5rem]">Good dentistry starts <span className="text-[hsl(var(--primary))]">before</span> the chair.</h2><p className="mt-9 max-w-xl text-lg leading-8 text-[hsl(var(--muted-foreground))]">We built Dental Care around a simple idea: when people feel heard, they make better decisions for their health. So we slow down the first conversation, explain the why, and plan care that fits.</p><div className="mt-12 grid gap-8 border-t border-[hsl(var(--border))] pt-8 sm:grid-cols-3">{[['Listen first', 'Your concerns set the direction.'], ['Explain clearly', 'No jargon. No pressure.'], ['Plan together', 'Care that respects your life.']].map(([title, body], index) => <div key={title} data-testid={`card-approach-${index}`}><div className="font-mono-ui text-xs text-[hsl(var(--primary))]">0{index + 1}</div><h3 className="mt-4 text-base font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{body}</p></div>)}</div></div>
          </div>
        </section>

        <section id="care" className="bg-[hsl(var(--secondary)/0.45)] py-28 md:py-36">
          <div className="container-clinic">
            <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end"><div><SectionLabel>Care options</SectionLabel><h2 className="mt-6 max-w-xl font-display text-5xl leading-[0.9] tracking-[-0.03em] sm:text-6xl">The right care,<br /><em className="text-[hsl(var(--primary))]">at the right pace.</em></h2></div><p className="max-w-xs text-sm leading-6 text-[hsl(var(--muted-foreground))]">Start with what is on your mind. We will help you understand the rest.</p></div>
            <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
              {serviceOptions.map((service, index) => { const Icon = service.icon; return <button key={service.name} onClick={() => scrollToBooking(service.name)} className={`group relative flex min-h-[210px] flex-col justify-between rounded-[1.5rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-left transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)] ${index === 0 ? 'lg:row-span-2 lg:min-h-[435px] lg:p-8' : ''}`} data-testid={`button-care-${index}`}><div className="flex items-start justify-between"><span className="flex size-11 items-center justify-center rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><Icon size={19} /></span><ArrowUpRight size={18} className="text-[hsl(var(--muted-foreground))] transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" /></div><div><div className="font-mono-ui text-[0.62rem] uppercase tracking-[0.14em] text-[hsl(var(--primary))]">0{index + 1} / Care</div><h3 className={`mt-2 font-display text-3xl leading-none ${index === 0 ? 'lg:text-5xl' : ''}`}>{service.name}</h3><p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">{service.note}</p></div></button>; })}
            </div>
          </div>
        </section>

        <section id="expect" className="container-clinic scroll-mt-10 py-28 md:py-40">
          <div className="grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-24"><div><SectionLabel>What to expect</SectionLabel><h2 className="mt-7 max-w-md font-display text-5xl leading-[0.92] tracking-[-0.03em] sm:text-6xl">No surprises.<br /><span className="text-[hsl(var(--primary))]">Just next steps.</span></h2><p className="mt-7 max-w-sm text-base leading-7 text-[hsl(var(--muted-foreground))]">From your first note to your first visit, we keep the process light, clear, and yours.</p></div><div className="space-y-0 border-t border-[hsl(var(--border))]">{[['Send a request', 'Share a little about what brings you in. It takes a minute.'], ['Have a conversation', 'Our team follows up and finds a suitable time with you.'], ['Leave with a plan', 'Understand your options and decide what feels right.']].map(([title, body], index) => <div key={title} className="grid gap-4 border-b border-[hsl(var(--border))] py-7 sm:grid-cols-[60px_1fr] sm:gap-7" data-testid={`step-expect-${index}`}><div className="font-mono-ui text-sm text-[hsl(var(--primary))]">0{index + 1}</div><div><h3 className="text-xl font-semibold tracking-[-0.02em]">{title}</h3><p className="mt-2 max-w-md text-sm leading-6 text-[hsl(var(--muted-foreground))]">{body}</p></div></div>)}</div></div>
        </section>

        <section id="booking" className="scroll-mt-4 bg-[hsl(var(--sidebar))] py-20 text-[hsl(var(--sidebar-foreground))] md:py-28">
          <div className="container-clinic grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20"><div className="pt-2"><SectionLabel light>02 / Request a visit</SectionLabel><h2 className="mt-7 max-w-md font-display text-5xl leading-[0.9] tracking-[-0.03em] md:text-7xl">A small step<br />towards feeling <em className="text-[hsl(var(--sidebar-primary))]">better.</em></h2><p className="mt-8 max-w-sm text-base leading-7 text-[hsl(var(--sidebar-foreground)/0.68)]">Tell us what is on your mind. We’ll take it from there, one clear conversation at a time.</p><div className="mt-12 hidden border-t border-[hsl(var(--sidebar-border))] pt-6 lg:block"><div className="eyebrow text-[hsl(var(--sidebar-primary))]">Visit us</div><p className="mt-3 max-w-xs text-sm leading-6 text-[hsl(var(--sidebar-foreground)/0.72)]" data-testid="text-address-booking">{clinicConfig.address}</p></div></div><BookingForm /></div>
        </section>

        <section className="container-clinic py-28 md:py-36">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24"><div><SectionLabel>Questions, answered</SectionLabel><h2 className="mt-7 font-display text-5xl leading-[0.9] sm:text-6xl">A little more<br /><em className="text-[hsl(var(--primary))]">clarity.</em></h2></div><div className="border-t border-[hsl(var(--border))]">{faqItems.map(([question, answer], index) => <div key={question} className="border-b border-[hsl(var(--border))]"><button onClick={() => setFaq(faq === index ? null : index)} className="flex w-full items-center justify-between gap-6 py-6 text-left text-base font-semibold" aria-expanded={faq === index} data-testid={`button-faq-${index}`}><span>{question}</span><ChevronDown size={18} className={`shrink-0 text-[hsl(var(--primary))] transition-transform ${faq === index ? 'rotate-180' : ''}`} /></button>{faq === index && <p className="max-w-2xl pb-7 pr-10 text-sm leading-7 text-[hsl(var(--muted-foreground))]" data-testid={`text-faq-answer-${index}`}>{answer}</p>}</div>)}</div></div>
        </section>

        <section className="container-clinic pb-24">
          <div className="grid overflow-hidden rounded-[2rem] bg-[hsl(var(--secondary))] lg:grid-cols-[1.1fr_0.9fr]"><div className="bg-paper-grid p-8 md:p-12"><SectionLabel>Find your way here</SectionLabel><h2 className="mt-7 max-w-lg font-display text-5xl leading-[0.9] sm:text-6xl">A familiar address<br />for better <em className="text-[hsl(var(--primary))]">care.</em></h2><div className="mt-12 flex items-start gap-4"><MapPin className="mt-1 shrink-0 text-[hsl(var(--primary))]" size={19} /><p className="max-w-sm text-sm leading-6" data-testid="text-clinic-address">{clinicConfig.address}</p></div></div><div className="flex min-h-[310px] flex-col justify-between bg-[hsl(var(--primary))] p-8 text-[hsl(var(--primary-foreground))] md:p-12"><div><div className="eyebrow opacity-70">Contact details</div><h3 className="mt-5 font-display text-4xl leading-none">Make a beginning<br />that feels easy.</h3></div><ContactDetails /></div></div>
        </section>
      </main>
      <footer className="border-t border-[hsl(var(--border))] py-8"><div className="container-clinic flex flex-col gap-6 text-xs text-[hsl(var(--muted-foreground))] sm:flex-row sm:items-center sm:justify-between"><BrandMark /><div className="flex flex-wrap gap-x-5 gap-y-2"><span data-testid="text-footer-city">{clinicConfig.city}</span><span>•</span><span>{clinicConfig.location}</span><a href="#top" className="font-semibold text-[hsl(var(--primary))]" data-testid="link-back-top">Back to top ↑</a></div></div></footer>
      <button onClick={() => scrollToBooking()} className="fixed bottom-5 right-5 z-20 flex items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-5 py-3 text-sm font-semibold text-[hsl(var(--primary-foreground))] shadow-[var(--shadow-md)] transition-transform hover:-translate-y-1 md:hidden" data-testid="button-floating-book"><CalendarDays size={16} /> Request a visit</button>
    </div>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
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
