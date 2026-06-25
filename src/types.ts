export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  fontHeading: string;
  fontBody: string;
}

export interface LogoConfig {
  light: string;
  dark: string;
  alt: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface SiteConfig {
  name: string;
  legalName: string;
  tagline: string;
  description: string;
  baseUrl: string;
  defaultLocale: string;
  currency: string;
  timezone: string;
  theme: ThemeConfig;
  logo: LogoConfig;
  favicon: string;
  socialLinks: SocialLink[];
}

export interface AddressConfig {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  mapUrl: string;
  latitude: number;
  longitude: number;
}

export interface OpeningHour {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface ServiceOptions {
  dineIn: boolean;
  takeaway: boolean;
  delivery: boolean;
  catering: boolean;
  privateEvents: boolean;
}

export interface BusinessConfig {
  phone: string;
  email: string;
  reservationEmail: string;
  address: AddressConfig;
  openingHours: OpeningHour[];
  serviceOptions: ServiceOptions;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface NavigationConfig {
  header: NavLink[];
  footer: NavLink[];
  cta: NavLink;
}

export interface RobotsConfig {
  index: boolean;
  follow: boolean;
}

export interface GlobalSeo {
  titleTemplate: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultKeywords: string[];
  defaultOgImage: string;
  twitterCard: string;
  robots: RobotsConfig;
}

export interface ImageAsset {
  src: string;
  alt: string;
}

export interface ButtonConfig {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary' | string;
}

export interface HeroSection {
  eyebrow?: string;
  title: string;
  subtitle: string;
  backgroundImage?: ImageAsset;
  image?: ImageAsset;
  buttons?: ButtonConfig[];
}

export interface FeaturedMenuSection {
  title: string;
  subtitle: string;
  menuItemIds: string[];
}

export interface AboutPreviewSection {
  title: string;
  content: string;
  image: ImageAsset;
  button: ButtonConfig;
}

export interface ReservationBannerSection {
  title: string;
  subtitle: string;
  button: ButtonConfig;
}

export interface PageSection {
  hero?: HeroSection;
  featuredMenu?: FeaturedMenuSection;
  aboutPreview?: AboutPreviewSection;
  reservationBanner?: ReservationBannerSection;
  showFilters?: boolean;
  showDietaryBadges?: boolean;
  story?: {
    title: string;
    content: string[];
  };
  values?: Array<{
    title: string;
    description: string;
  }>;
  form?: {
    fields: string[];
    successMessage: string;
    submitLabel: string;
  };
  reservationPolicy?: {
    title: string;
    content: string;
  };
  content?: {
    title: string;
    lastUpdated: string;
    body: string[];
  };
}

export interface PageConfig {
  id: string;
  route: string;
  template: string;
  seo: {
    title: string;
    description: string;
    canonical: string;
    ogImage: string;
    robots?: RobotsConfig;
  };
  sections: PageSection;
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string;
  displayOrder: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: ImageAsset;
  badges: string[];
  allergens: string[];
  isFeatured: boolean;
  isAvailable: boolean;
}

export interface MenuConfig {
  categories: MenuCategory[];
  items: MenuItem[];
}

export interface GalleryItem {
  id: string;
  category: string;
  src: string;
  alt: string;
  caption: string;
}

export interface Testimonial {
  id: string;
  name: string;
  rating: number;
  text: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  image: ImageAsset;
  button: ButtonConfig;
  isActive: boolean;
}

export interface RestaurantEvent {
  id: string;
  title: string;
  description: string;
  image: ImageAsset;
  button: ButtonConfig;
}

export interface FormConfig {
  endpoint: string;
  method: string;
  requiredFields: string[];
}

export interface FormsConfig {
  reservation: FormConfig;
  contact: FormConfig;
}

export interface SchemaOrgConfig {
  type: string;
  servesCuisine: string[];
  priceRange: string;
  acceptsReservations: boolean;
  hasMenu: string;
}

export interface RestaurantData {
  site: SiteConfig;
  business: BusinessConfig;
  navigation: NavigationConfig;
  globalSeo: GlobalSeo;
  pages: PageConfig[];
  menu: MenuConfig;
  gallery: GalleryItem[];
  testimonials: Testimonial[];
  promotions: Promotion[];
  events: RestaurantEvent[];
  forms: FormsConfig;
  schemaOrg: SchemaOrgConfig;
}

// Simple structures to store user submissions
export interface UserReservation {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  occasion?: string;
  message?: string;
  createdAt: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
}

export interface UserContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  createdAt: string;
}
