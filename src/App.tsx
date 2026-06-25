import React, { useState, useEffect } from "react";
import { 
  Utensils, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Calendar, 
  Users, 
  MessageSquare, 
  Heart, 
  Award, 
  Sparkles, 
  ChevronRight, 
  ArrowRight, 
  Check, 
  X, 
  Filter, 
  Search, 
  Sliders, 
  Settings, 
  Eye, 
  FileText, 
  Save, 
  Plus, 
  Trash2, 
  ClipboardList, 
  Menu as MenuIcon,
  BookOpen
} from "lucide-react";
import { getImgUrl } from "./utils/imageMap";
import { RestaurantData, MenuItem, UserReservation, UserContactMessage } from "./types";
import restaurantData from "./restaurant-data.json";

const CONFIG_STORAGE_KEY = "restaurant_config_override";
const RESERVATIONS_STORAGE_KEY = "restaurant_reservations";
const CONTACTS_STORAGE_KEY = "restaurant_contact_messages";

export default function App() {
  const [data, setData] = useState<RestaurantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Router: active route managed purely client-side
  const [activeRoute, setActiveRoute] = useState<string>("/");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Multilingual State Control (persist choice to LocalStorage)
  const [locale, setLocale] = useState<"en" | "fr">(() => {
    return (localStorage.getItem("active_locale") as "en" | "fr") || "en";
  });

  useEffect(() => {
    localStorage.setItem("active_locale", locale);
  }, [locale]);

  // Translate helper supporting both inline dynamic objects and standard translating dictionaries
  const t = (field: any): string => {
    if (field === null || field === undefined) return "";
    
    // If it is a translation dictionary
    if (typeof field === "object") {
      if (Array.isArray(field)) {
        return field.map(item => t(item)).join(", ");
      }
      if ("en" in field || "fr" in field) {
        return field[locale] !== undefined ? field[locale] : (field["en"] !== undefined ? field["en"] : "");
      }
    }
    
    if (typeof field === "string") {
      const uiDict = data?.uiTranslations || {};
      if (uiDict[field] && uiDict[field][locale] !== undefined) {
        return uiDict[field][locale];
      }
    }
    
    return String(field);
  };

  // Admin Dashboard States
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<'quick' | 'raw' | 'reservations' | 'messages'>('quick');
  const [rawJson, setRawJson] = useState("");
  const [jsonValidationError, setJsonValidationError] = useState<string | null>(null);
  const [adminSuccessMsg, setAdminSuccessMsg] = useState<string | null>(null);

  // Reservation List & Contact Messages (from Server database)
  const [reservations, setReservations] = useState<UserReservation[]>([]);
  const [contacts, setContacts] = useState<UserContactMessage[]>([]);

  // Menu Search & Filters
  const [menuSearch, setMenuSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [filterVege, setFilterVege] = useState(false);
  const [filterGF, setFilterGF] = useState(false);

  // Interactive Reservation Form state
  const [resForm, setResForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "18:00",
    guests: 2,
    occasion: "Dinner",
    message: ""
  });
  const [resSuccess, setResSuccess] = useState<string | null>(null);
  const [resLoading, setResLoading] = useState(false);

  // Interactive Contact Form state
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  const [contactLoading, setContactLoading] = useState(false);

  // Image lightbox
  const [lightboxImg, setLightboxImg] = useState<{ src: string; caption: string } | null>(null);

  const applyRestaurantData = (jsonData: RestaurantData) => {
    setData(jsonData);
    setRawJson(JSON.stringify(jsonData, null, 2));

    // Preset color variables dynamically
    if (jsonData.site?.theme) {
      document.documentElement.style.setProperty("--primary", jsonData.site.theme.primaryColor);
      document.documentElement.style.setProperty("--secondary", jsonData.site.theme.secondaryColor);
      document.documentElement.style.setProperty("--accent", jsonData.site.theme.accentColor);
      document.documentElement.style.setProperty("--text", jsonData.site.theme.textColor);
      document.documentElement.style.setProperty("--bg", jsonData.site.theme.backgroundColor);
    }
  };

  const createLocalId = (prefix: string) => {
    const randomPart = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    return `${prefix}-${randomPart}`;
  };

  const readStoredList = <T,>(key: string): T[] => {
    try {
      const storedValue = localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : [];
    } catch {
      return [];
    }
  };

  const saveStoredList = <T,>(key: string, list: T[]) => {
    localStorage.setItem(key, JSON.stringify(list));
  };

  const readJsonResponse = async (response: Response) => {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error("The hosted API returned a non-JSON page instead of a form response.");
    }
    return response.json();
  };

  // Load configuration and interactive lists from back-end server
  const loadConfig = async () => {
    try {
      setLoading(true);
      let jsonData: RestaurantData;

      try {
        const res = await fetch("/api/config");
        if (!res.ok) throw new Error("Could not load restaurant database configuration");
        jsonData = await res.json();
      } catch {
        const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
        jsonData = savedConfig ? JSON.parse(savedConfig) : restaurantData as RestaurantData;
      }

      applyRestaurantData(jsonData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadReservations = async () => {
    try {
      const res = await fetch("/api/reservations");
      if (res.ok) {
        const history = await readJsonResponse(res);
        setReservations(history);
        return;
      }
    } catch (err) {
      console.error("Failed to load reservations", err);
    }
    setReservations(readStoredList<UserReservation>(RESERVATIONS_STORAGE_KEY));
  };

  const loadContactMessages = async () => {
    try {
      const res = await fetch("/api/contact");
      if (res.ok) {
        const history = await readJsonResponse(res);
        setContacts(history);
        return;
      }
    } catch (err) {
      console.error("Failed to load contact messages", err);
    }
    setContacts(readStoredList<UserContactMessage>(CONTACTS_STORAGE_KEY));
  };

  useEffect(() => {
    loadConfig();
    loadReservations();
    loadContactMessages();

    // Listen to hash changes for standard micro-routing support
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        setActiveRoute(hash);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    // Parse current hash on load
    if (window.location.hash) {
      setActiveRoute(window.location.hash.substring(1));
    }

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Sync route and window hashtag
  const navigateTo = (route: string) => {
    setActiveRoute(route);
    setMobileMenuOpen(false);
    window.location.hash = route;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Submit revised live configuration to backend
  const saveConfig = async (updatedData: RestaurantData) => {
    try {
      let confirmedConfig = updatedData;

      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        throw new Error("Unable to save changed details back to JSON database");
      }

      const confirmed = await response.json();
      confirmedConfig = confirmed.config;
      localStorage.removeItem(CONFIG_STORAGE_KEY);
      applyRestaurantData(confirmedConfig);

      setAdminSuccessMsg("JSON configuration saved & applied successfully! Website updated.");
      setTimeout(() => setAdminSuccessMsg(null), 5000);
    } catch (err: any) {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updatedData));
      applyRestaurantData(updatedData);
      setAdminSuccessMsg("JSON configuration saved in this browser. Vercel cannot write back to src/restaurant-data.json without a database/API.");
      setTimeout(() => setAdminSuccessMsg(null), 7000);
    }
  };

  // Raw JSON validator and saver
  const handleRawJsonSubmit = () => {
    try {
      const parsed = JSON.parse(rawJson);
      if (!parsed.site || !parsed.business || !parsed.menu || !parsed.pages) {
        throw new Error("Invalid structure. Must contain basic restaurant fields (site, business, menu, pages)");
      }
      setJsonValidationError(null);
      saveConfig(parsed);
    } catch (e: any) {
      setJsonValidationError(e.message);
    }
  };

  // Quick edit single fields in JSON
  const handleQuickEdit = (pathChain: string[], val: any) => {
    if (!data) return;
    const cloned = JSON.parse(JSON.stringify(data));
    let pointer = cloned;
    for (let i = 0; i < pathChain.length - 1; i++) {
      pointer = pointer[pathChain[i]];
    }
    pointer[pathChain[pathChain.length - 1]] = val;
    setData(cloned);
    setRawJson(JSON.stringify(cloned, null, 2));
    saveConfig(cloned);
  };

  // Update reservation booking status (Confirm, Cancel)
  const handleUpdateReservationStatus = async (id: string, nextStatus: 'Confirmed' | 'Cancelled') => {
    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!response.ok) throw new Error("Could not update reservation status");
      loadReservations();
    } catch (error: any) {
      const updatedReservations = reservations.map((reservation) =>
        reservation.id === id ? { ...reservation, status: nextStatus } : reservation
      );
      setReservations(updatedReservations);
      saveStoredList(RESERVATIONS_STORAGE_KEY, updatedReservations);
    }
  };

  // Book request submission
  const handleReservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResLoading(true);
    setResSuccess(null);
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resForm)
      });
      const resData = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(resData.error || "Fail to request reservation");
      }
      setResSuccess(resData.message || "Thank you! Reservation has been requested.");
      setResForm({
        name: "",
        email: "",
        phone: "",
        date: "",
        time: "18:00",
        guests: 2,
        occasion: "Dinner",
        message: ""
      });
      loadReservations();
    } catch (err: any) {
      const newReservation: UserReservation = {
        id: createLocalId("res"),
        ...resForm,
        guests: Number(resForm.guests),
        createdAt: new Date().toISOString(),
        status: "Pending"
      };
      const updatedReservations = [...reservations, newReservation];
      setReservations(updatedReservations);
      saveStoredList(RESERVATIONS_STORAGE_KEY, updatedReservations);
      setResSuccess("Thank you! Reservation has been saved in this browser.");
      setResForm({
        name: "",
        email: "",
        phone: "",
        date: "",
        time: "18:00",
        guests: 2,
        occasion: "Dinner",
        message: ""
      });
    } finally {
      setResLoading(false);
    }
  };

  // Contact request submission
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    setContactSuccess(null);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm)
      });
      const resData = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(resData.error || "Fail to submit query");
      }
      setContactSuccess(resData.message || "Thanks for reaching out.");
      setContactForm({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
      });
      loadContactMessages();
    } catch (err: any) {
      const newMessage: UserContactMessage = {
        id: createLocalId("msg"),
        ...contactForm,
        createdAt: new Date().toISOString()
      };
      const updatedMessages = [...contacts, newMessage];
      setContacts(updatedMessages);
      saveStoredList(CONTACTS_STORAGE_KEY, updatedMessages);
      setContactSuccess("Thanks for reaching out. Your message has been saved in this browser.");
      setContactForm({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
      });
    } finally {
      setContactLoading(false);
    }
  };

  if (loading) {
    return (
      <div id="loader-screen" className="min-h-screen bg-[#F5E8D8] flex flex-col justify-center items-center py-12 px-4 transition-all duration-300">
        <div className="text-center">
          <Utensils className="animate-bounce w-12 h-12 mx-auto text-[#8B2E20] mb-4" />
          <h2 className="text-2xl font-bold text-[#222222] font-serif mb-2">The Urban Fork</h2>
          <p className="text-sm text-stone-600 animate-pulse">Initializing modern culinary design configuration...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col justify-center items-center p-8">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full border-t-4 border-red-600">
          <X className="w-12 h-12 text-red-600 mb-4" />
          <h3 className="text-xl font-bold text-stone-800 mb-2">Startup Failure</h3>
          <p className="text-stone-600 mb-4 text-sm">{error || "No dynamic configuration config loadable."}</p>
          <button 
            onClick={loadConfig}
            className="w-full bg-[#8B2E20] text-stone-100 font-medium py-2 rounded shadow hover:bg-opacity-90 cursor-pointer"
          >
            Retry Loading Configuration
          </button>
        </div>
      </div>
    );
  }

  // Local helper variables loaded straight from JSON
  const siteTheme = data.site.theme;
  const siteColors = {
    primary: siteTheme.primaryColor || "#8B2E20",
    secondary: siteTheme.secondaryColor || "#F5E8D8",
    accent: siteTheme.accentColor || "#D99A3D",
    text: siteTheme.textColor || "#222222",
    background: siteTheme.backgroundColor || "#FFFFFF"
  };

  const headerLinks = data.navigation.header;
  const footerLinks = data.navigation.footer;
  const ctaButton = data.navigation.cta;

  // Render Section Template Dispatcher
  const renderPageContent = () => {
    const page = data.pages.find(p => p.route === activeRoute || (p.route === "/" && activeRoute === ""));
    if (!page) {
      return (
        <div id="404-page" className="py-24 text-center max-w-md mx-auto px-4">
          <Utensils className="w-16 h-16 mx-auto text-stone-300 mb-4" />
          <h2 className="text-4xl font-serif font-bold mb-2">Page Not Found</h2>
          <p className="text-stone-600 mb-6 font-sans">The custom page route defined by raw JSON database could not be retrieved.</p>
          <button 
            onClick={() => navigateTo("/")}
            className="px-6 py-3 font-semibold text-stone-100 rounded-md shadow"
            style={{ backgroundColor: siteColors.primary }}
          >
            Return to Front Desk
          </button>
        </div>
      );
    }

    const sections = page.sections;

    switch (page.template) {
      case "HomePage":
        return (
          <div id="home-template" className="space-y-16 md:space-y-24">
            {/* HERO SECTION */}
            {sections.hero && (
              <section id="hero-sec" className="relative min-h-[85vh] flex items-center bg-stone-900 overflow-hidden">
                <div className="absolute inset-0 z-0">
                  <img 
                    src={getImgUrl(sections.hero.backgroundImage?.src || "")} 
                    alt={t(sections.hero.backgroundImage?.alt) || "Elegant Table"} 
                    className="w-full h-full object-cover opacity-35 transform scale-105 transition-transform duration-[12000ms] hover:scale-100" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/60 to-transparent" />
                </div>

                <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-stone-100">
                  <div className="max-w-3xl space-y-6">
                    {sections.hero.eyebrow && (
                      <span className="inline-flex items-center text-xs md:text-sm tracking-widest uppercase font-semibold text-[var(--accent)] bg-[var(--primary)]/30 border border-[var(--primary)]/20 px-3 py-1 rounded-full">
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" /> {t(sections.hero.eyebrow)}
                      </span>
                    )}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight font-serif text-stone-100 drop-shadow-sm">
                      {t(sections.hero.title)}
                    </h1>
                    <p className="text-lg md:text-xl text-stone-200/95 font-body leading-relaxed font-light max-w-2xl">
                      {t(sections.hero.subtitle)}
                    </p>
                    <div className="flex flex-wrap gap-4 pt-4">
                      {sections.hero.buttons?.map((btn, idx) => (
                        <button
                           key={idx}
                           id={`hero-btn-${idx}`}
                           onClick={() => navigateTo(btn.href)}
                           className={`px-8 py-3.5 rounded-lg font-semibold tracking-wide transition-all duration-300 transform active:scale-95 shadow-md flex items-center gap-2 cursor-pointer ${
                            btn.variant === "primary"
                              ? "bg-[var(--primary)] hover:bg-opacity-95 text-[#F5E8D8] text-stone-100"
                              : "bg-[#F5E8D8] text-[#222222] border-2 border-stone-200/50 hover:bg-white hover:border-transparent"
                          }`}
                        >
                          {t(btn.label)}
                          {btn.variant === "primary" ? <ArrowRight className="w-4 h-4 ml-1" /> : null}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Ambient Bottom Wave decoration */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[var(--bg-color)] to-transparent pointer-events-none" />
              </section>
            )}

            {/* FEATURED MENU PREVIEW */}
            {sections.featuredMenu && (
              <section id="featured-menu-sec" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <span className="text-xs uppercase font-semibold tracking-widest text-[var(--accent)]">{t("OUR SPECIALTIES")}</span>
                  <h2 className="text-3xl md:text-4xl font-serif font-bold mt-1 text-[var(--text-color)]">{t(sections.featuredMenu.title)}</h2>
                  <div className="w-16 h-0.5 bg-[var(--primary)] mx-auto my-4" />
                  <p className="text-stone-600 text-sm md:text-base">{t(sections.featuredMenu.subtitle)}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {data.menu.items
                    .filter(item => sections.featuredMenu?.menuItemIds.includes(item.id))
                    .map(item => (
                      <div key={item.id} id={`fav-${item.id}`} className="bg-stone-50 rounded-xl overflow-hidden shadow-xs hover:shadow-md border border-stone-100/80 transition-all duration-300 group">
                        <div className="relative h-48 overflow-hidden bg-stone-200">
                          <img 
                            src={getImgUrl(item.image.src)} 
                            alt={t(item.image.alt)} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                          {item.badges.length > 0 && (
                            <span className="absolute top-3 left-3 bg-[#D99A3D] text-[#FFFFFF] text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded shadow">
                              {t(item.badges[0])}
                            </span>
                          )}
                          <span className="absolute bottom-3 right-3 bg-[var(--primary)] text-stone-100 text-sm font-semibold px-2.5 py-1 rounded shadow-md">
                            ${item.price}
                          </span>
                        </div>
                        <div className="p-5 space-y-2">
                          <h4 className="text-lg font-serif font-semibold text-stone-900">{t(item.name)}</h4>
                          <p className="text-xs text-stone-500 line-clamp-2 min-h-[2rem]">{t(item.description)}</p>
                          <div className="flex gap-2 flex-wrap pt-2">
                            {item.allergens.map((alg, i) => (
                              <span key={i} className="text-[10px] bg-stone-200/80 text-stone-700 px-1.5 py-0.5 rounded font-mono uppercase">
                                {t(alg)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="text-center mt-10">
                  <button 
                    onClick={() => navigateTo("/menu")}
                    className="inline-flex items-center gap-2 font-medium border-b-2 border-[var(--primary)] pb-1 px-1 hover:text-[var(--accent)] transition-colors text-[var(--primary)]"
                  >
                    {t("View All Dishes")} ({data.menu.items.length}) <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </section>
            )}

            {/* ABOUT PREVIEW CARD */}
            {sections.aboutPreview && (
              <section id="about-preview-sec" className="bg-[var(--secondary)]/40 py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-7 space-y-6">
                      <span className="text-xs uppercase font-semibold tracking-widest text-[var(--accent)]">{t("OUR CULINARY ETHOS")}</span>
                      <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 leading-tight">
                        {t(sections.aboutPreview.title)}
                      </h2>
                      <div className="w-16 h-0.5 bg-[var(--primary)]" />
                      <p className="text-stone-700 font-body leading-relaxed md:text-lg">
                        {t(sections.aboutPreview.content)}
                      </p>
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                            <Award className="w-4 h-4" />
                          </div>
                          <span className="text-stone-800 text-sm font-semibold">{t("House-made Sauces & Natural Reductions")}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                            <Heart className="w-4 h-4" />
                          </div>
                          <span className="text-stone-800 text-sm font-semibold">{t("Sustainably sourced, fresh local ingredients")}</span>
                        </div>
                      </div>
                      <div className="pt-4">
                        <button
                          onClick={() => navigateTo(sections.aboutPreview?.button.href || "/about")}
                          className="px-6 py-3 bg-[var(--primary)] rounded-lg font-semibold text-stone-100 hover:bg-opacity-95 shadow-md transition-all cursor-pointer"
                        >
                          {t(sections.aboutPreview.button.label)}
                        </button>
                      </div>
                    </div>
                    <div className="lg:col-span-5">
                      <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-4/3 group">
                        <img 
                          src={getImgUrl(sections.aboutPreview.image.src)} 
                          alt={t(sections.aboutPreview.image.alt)} 
                          className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-102" 
                        />
                        <div className="absolute inset-0 border-8 border-white/20 m-4 rounded-xl pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* TESTIMONIALS SLIDER SECTION */}
            {data.testimonials && data.testimonials.length > 0 && (
              <section id="testimonials-sec" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <span className="text-xs uppercase font-semibold tracking-widest text-[var(--accent)]">{t("REVIEWS")}</span>
                  <h2 className="text-3xl font-serif font-bold text-stone-900 mt-1">{t("What Guests Love")}</h2>
                  <div className="w-12 h-0.5 bg-[var(--primary)] mx-auto mt-4" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {data.testimonials.map((tItem) => (
                    <div key={tItem.id} id={`review-${tItem.id}`} className="bg-stone-50/50 p-8 rounded-2xl border border-stone-200/50 shadow-xs relative">
                      <div className="text-yellow-500 text-lg mb-4 flex gap-1">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <span key={idx}>{idx < tItem.rating ? "★" : "☆"}</span>
                        ))}
                      </div>
                      <p className="text-stone-700 italic text-sm md:text-base mb-6 leading-relaxed">
                        "{t(tItem.text)}"
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-serif font-bold text-sm flex items-center justify-center">
                          {t(tItem.name)[0]}
                        </div>
                        <div>
                          <h4 className="font-semibold text-stone-900 text-sm">{t(tItem.name)}</h4>
                          <span className="text-xs text-stone-500">{t("Verified Diner")}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* RESERVATION QUICK BANNER */}
            {sections.reservationBanner && (
              <section id="res-banner-sec" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <div className="relative rounded-3xl overflow-hidden bg-stone-950 text-stone-100 p-8 md:p-16 shadow-xl">
                  {/* Subtle background illustration overlay */}
                  <div className="absolute inset-0 bg-cover bg-center brightness-15" style={{ backgroundImage: `url(${getImgUrl('/images/menu/menu-hero.jpg')})` }} />
                  <div className="relative z-10 max-w-3xl space-y-4">
                    <span className="inline-block text-xs uppercase tracking-widest text-[var(--accent)] font-semibold">{t("SECURE YOUR SPOT TODAY")}</span>
                    <h2 className="text-3xl md:text-5xl font-serif font-bold">{t(sections.reservationBanner.title)}</h2>
                    <p className="text-stone-300 text-sm md:text-lg max-w-xl">
                      {t(sections.reservationBanner.subtitle)}
                    </p>
                    <div className="pt-4">
                      <button
                        onClick={() => navigateTo(sections.reservationBanner?.button.href || "/reservations")}
                        className="px-8 py-3.5 bg-[var(--accent)] text-stone-950 font-bold tracking-wide rounded-lg shadow-lg hover:bg-opacity-90 transform hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                      >
                        {t(sections.reservationBanner.button.label)}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        );

      case "MenuPage":
        // Group menu items by category safely
        const filteredItems = data.menu.items.filter(item => {
          if (activeCategory !== "all" && item.categoryId !== activeCategory) return false;
          
          // Filter matching translated or native arrays properly
          const itemBadgesTranslated = item.badges.map(b => t(b).toLowerCase());
          const isVegSelected = filterVege && itemBadgesTranslated.includes(t("Vegetarian").toLowerCase());
          const isGFSelected = filterGF && itemBadgesTranslated.includes(t("Gluten Free").toLowerCase());
          
          if (filterVege && !isVegSelected) return false;
          if (filterGF && !isGFSelected) return false;
          
          const titleMatch = t(item.name).toLowerCase().includes(menuSearch.toLowerCase());
          const descMatch = t(item.description).toLowerCase().includes(menuSearch.toLowerCase());
          if (menuSearch && !titleMatch && !descMatch) return false;
          return true;
        });

        return (
          <div id="menu-template" className="space-y-16 pb-16">
            {/* HERO HERO HERO */}
            {sections.hero && (
              <section id="menu-hero-sec" className="relative py-20 bg-stone-900 overflow-hidden text-center">
                <div className="absolute inset-0">
                  <img 
                    src={getImgUrl(sections.hero.backgroundImage?.src || "")} 
                    alt={t(sections.hero.backgroundImage?.alt) || "Our Menu Banner"} 
                    className="w-full h-full object-cover opacity-25" 
                  />
                  <div className="absolute inset-0 bg-stone-950/65" />
                </div>
                <div className="relative z-10 max-w-4xl mx-auto px-4 text-stone-100 space-y-4">
                  <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight">{t(sections.hero.title)}</h1>
                  <p className="text-stone-300 font-light max-w-lg mx-auto">{t(sections.hero.subtitle)}</p>
                </div>
              </section>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* FILTERS PANEL */}
              <div id="filters-desktop" className="bg-stone-50 rounded-2xl p-6 border border-stone-200/60 shadow-xs mb-10 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Category Selection */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveCategory("all")}
                      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                        activeCategory === "all"
                          ? "bg-[var(--primary)] text-stone-100 shadow-xs"
                          : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      {t("All Menu")} ({data.menu.items.length})
                    </button>
                    {data.menu.categories
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map(cat => (
                        <button
                          key={cat.id}
                          id={`cat-${cat.id}`}
                          onClick={() => setActiveCategory(cat.id)}
                          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                            activeCategory === cat.id
                              ? "bg-[var(--primary)] text-stone-100 shadow-xs"
                              : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
                          }`}
                        >
                          {t(cat.name)}
                        </button>
                      ))}
                  </div>

                  {/* Real-time search query box */}
                  <div className="relative w-full md:w-72">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input 
                      type="text" 
                      placeholder={t("Search dishes...")}
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      className="w-full bg-white border border-stone-200 pl-9 pr-4 py-2 rounded-lg text-sm text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[var(--primary)]"
                    />
                    {menuSearch && (
                      <button onClick={() => setMenuSearch("")} className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Dietary badging checkbox togglers */}
                <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-stone-200/50 text-sm">
                  <span className="text-stone-500 font-medium flex items-center gap-2">
                    <Filter className="w-4 h-4 text-stone-400" /> {t("Dietary filters:")}
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-700">
                    <input 
                      type="checkbox" 
                      checked={filterVege}
                      onChange={(e) => setFilterVege(e.target.checked)}
                      className="rounded border-stone-300 text-[var(--primary)] focus:ring-[var(--primary)] w-4 h-4 cursor-pointer"
                    />
                    🌱 {t("Vegetarian")}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-700">
                    <input 
                      type="checkbox" 
                      checked={filterGF}
                      onChange={(e) => setFilterGF(e.target.checked)}
                      className="rounded border-stone-300 text-[var(--primary)] focus:ring-[var(--primary)] w-4 h-4 cursor-pointer"
                    />
                    🌾 {t("Gluten Free")}
                  </label>
                </div>
              </div>

              {/* DISHES LIST GRID */}
              {filteredItems.length === 0 ? (
                <div className="text-center py-16 bg-stone-50 rounded-2xl border border-dashed border-stone-300/60">
                  <Utensils className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-500 font-medium">{t("No dishes match your active search terms or filters.")}</p>
                  <button 
                    onClick={() => {
                      setFilterVege(false);
                      setFilterGF(false);
                      setMenuSearch("");
                      setActiveCategory("all");
                    }} 
                    className="mt-4 px-4 py-2 text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer"
                  >
                    {t("Clear All Active Selection filters")}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {filteredItems.map(item => (
                    <div 
                      key={item.id} 
                      id={`menu-item-${item.id}`}
                      className="bg-white rounded-xl border border-stone-200/60 p-4 md:p-5 flex flex-col sm:flex-row gap-5 hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      <div className="w-full sm:w-36 h-36 rounded-lg overflow-hidden shrink-0 bg-stone-100 flex items-center justify-center">
                        <img 
                          src={getImgUrl(item.image.src)} 
                          alt={t(item.image.alt)}
                          className="w-full h-full object-cover hover:scale-105 duration-300 transition-transform" 
                        />
                      </div>
                      <div className="flex-1 space-y-2 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-lg font-serif font-black text-stone-900">{t(item.name)}</h3>
                            <span className="text-lg font-mono font-bold text-[var(--primary)] shrink-0">
                              ${item.price}
                            </span>
                          </div>
                          <p className="text-stone-600 text-xs md:text-sm mt-1">{t(item.description)}</p>
                        </div>

                        {/* Dietary flags / allergies */}
                        <div className="space-y-2 pt-2 border-t border-stone-100">
                          {item.badges.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {item.badges.map((badge, bIdx) => (
                                <span key={bIdx} className="text-[10px] uppercase font-bold tracking-wider bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded-full">
                                  {t(badge)}
                                </span>
                              ))}
                            </div>
                          )}
                          {item.allergens.length > 0 && (
                            <div className="text-[11px] text-stone-500">
                              <span className="font-semibold text-stone-700">{t("Allergens:")}</span> {item.allergens.map(a => t(a)).join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case "AboutPage":
        return (
          <div id="about-template" className="space-y-16 pb-16">
            {/* HERO STORY */}
            {sections.hero && (
              <section id="about-hero-sec" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-5">
                    <span className="text-xs uppercase font-semibold tracking-widest text-[var(--accent)]">{t("THE URBAN FORK BRAND")}</span>
                    <h1 className="text-4xl md:text-5xl font-serif font-extrabold text-stone-950 leading-tight">
                      {t(sections.hero.title)}
                    </h1>
                    <div className="w-16 h-0.5 bg-[var(--primary)]" />
                    <p className="text-stone-700 font-light text-lg md:text-xl">
                      {t(sections.hero.subtitle)}
                    </p>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-16/10">
                    <img 
                      src={getImgUrl(sections.hero.image?.src || "")} 
                      alt={t(sections.hero.image?.alt) || "Our team staff"} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                </div>
              </section>
            )}

            {/* FULL STORY STORY */}
            {sections.story && (
              <section id="detailed-story-sec" className="bg-stone-50 py-16">
                <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
                  <h2 className="text-3xl font-serif font-black text-stone-900">{t(sections.story.title)}</h2>
                  <div className="w-10 h-0.5 bg-[var(--accent)] mx-auto" />
                  {sections.story.content.map((paragraph, pIdx) => (
                    <p key={pIdx} className="text-stone-700 text-sm md:text-base leading-relaxed text-left max-w-2xl mx-auto font-body">
                      {t(paragraph)}
                    </p>
                  ))}
                </div>
              </section>
            )}

            {/* CORE VALUE BLOCKS */}
            {sections.values && (
              <section id="values-sec" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-10">
                  <span className="text-xs uppercase font-semibold tracking-wide text-stone-500">{t("OUR FOUNDATION")}</span>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">{t("Why Dine with Us")}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {sections.values.map((v, idx) => (
                    <div key={idx} id={`value-${idx}`} className="bg-white p-7 rounded-xl border border-stone-200/50 hover:border-[var(--primary)]/70 transition-colors shadow-xs">
                      <div className="text-2xl text-[var(--primary)] mb-4 font-mono font-bold">
                        {String(idx + 1).padStart(2, "0")}.
                      </div>
                      <h3 className="text-xl font-serif font-semibold text-stone-900 mb-2">{t(v.title)}</h3>
                      <p className="text-stone-600 text-sm">{t(v.description)}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        );

      case "GalleryPage":
        return (
          <div id="gallery-template" className="space-y-12 pb-16">
            {sections.hero && (
              <section className="text-center py-12 max-w-3xl mx-auto px-4 space-y-4">
                <h1 className="text-4xl font-serif font-bold text-stone-950">{t(sections.hero.title)}</h1>
                <p className="text-stone-600 font-light text-sm md:text-base">{t(sections.hero.subtitle)}</p>
              </section>
            )}

            {/* GALLERIES INTERACTIVE MASONRY */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {data.gallery.map(img => (
                  <div 
                    key={img.id} 
                    id={`gallery-${img.id}`}
                    onClick={() => setLightboxImg({ src: getImgUrl(img.src), caption: t(img.caption) })}
                    className="group relative h-72 rounded-2xl overflow-hidden cursor-pointer shadow-xs hover:shadow-lg transition-all border border-stone-100"
                  >
                    <img 
                      src={getImgUrl(img.src)} 
                      alt={t(img.alt)} 
                      className="w-full h-full object-cover group-hover:scale-105 duration-550 transition-transform" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5" />
                    
                    {/* Caption rail */}
                    <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-xs p-3.5 rounded-xl shadow-md border border-stone-100/50 transform translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-350">
                      <span className="text-[9px] uppercase tracking-wider bg-[var(--primary)] text-stone-100 px-2 py-0.5 rounded font-semibold inline-block mb-1">
                        {t(img.category)}
                      </span>
                      <h4 className="font-serif text-stone-900 font-bold text-sm leading-tight line-clamp-1">{t(img.caption)}</h4>
                      <p className="text-stone-500 text-[10px] font-sans">{t("Click to inspect view")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "ReservationsPage":
        return (
          <div id="reservations-template" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 pb-16">
            {sections.hero && (
              <div className="text-center max-w-2xl mx-auto space-y-3">
                <span className="text-xs uppercase font-semibold text-[var(--accent)] tracking-widest">{t("TABLE BOOKINGS")}</span>
                <h1 className="text-4xl font-serif font-black text-stone-950">{t(sections.hero.title)}</h1>
                <p className="text-stone-600 font-light">{t(sections.hero.subtitle)}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-5xl mx-auto items-start">
              {/* RESERVATION INPUT FORM CLIENT CARRIER */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200/70 p-6 md:p-8 shadow-sm">
                {resSuccess ? (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <Check className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-stone-900">{t("Success! Spot requested")}</h3>
                    <p className="text-stone-600 max-w-sm mx-auto text-sm leading-relaxed">
                      {t(resSuccess)}
                    </p>
                    <button 
                      onClick={() => setResSuccess(null)}
                      className="px-5 py-2 text-xs font-semibold uppercase bg-stone-100 rounded text-stone-700 hover:bg-stone-200 cursor-pointer"
                    >
                      {t("Request Another Table Booking")}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleReservationSubmit} className="space-y-5">
                    <h3 className="text-xl font-serif font-bold text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[var(--primary)]" /> {t("Online Reservation Desk")}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Guest name */}
                      <div>
                        <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">{t("* Your Full Name")}</label>
                        <input 
                          type="text" 
                          required
                          value={resForm.name}
                          onChange={(e) => setResForm({ ...resForm, name: e.target.value })}
                          placeholder="John Doe"
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-[var(--primary)] text-stone-800"
                        />
                      </div>

                      {/* Contact email */}
                      <div>
                        <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">{t("* Email Address")}</label>
                        <input 
                          type="email" 
                          required
                          value={resForm.email}
                          onChange={(e) => setResForm({ ...resForm, email: e.target.value })}
                          placeholder="john@example.com"
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-[var(--primary)] text-stone-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Phone connection */}
                      <div>
                        <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">{t("* Phone Number")}</label>
                        <input 
                          type="tel" 
                          required
                          value={resForm.phone}
                          onChange={(e) => setResForm({ ...resForm, phone: e.target.value })}
                          placeholder="+1 555-123-4567"
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-[var(--primary)] text-stone-800"
                        />
                      </div>

                      {/* Party size headcount */}
                      <div>
                        <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">{t("* Number of Guests")}</label>
                        <input 
                          type="number" 
                          required
                          min="1"
                          max="20"
                          value={resForm.guests}
                          onChange={(e) => setResForm({ ...resForm, guests: Number(e.target.value) })}
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-[var(--primary)] text-stone-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Date selection picker */}
                      <div>
                        <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">{t("* Target Date")}</label>
                        <input 
                          type="date" 
                          required
                          value={resForm.date}
                          onChange={(e) => setResForm({ ...resForm, date: e.target.value })}
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-[var(--primary)] text-stone-800"
                        />
                      </div>

                      {/* Time selection slot */}
                      <div>
                        <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">{t("* Target Time Slot")}</label>
                        <select 
                          value={resForm.time}
                          onChange={(e) => setResForm({ ...resForm, time: e.target.value })}
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-[var(--primary)] text-stone-800"
                        >
                          <option value="11:30">11:30 AM (Lunch)</option>
                          <option value="12:00">12:00 PM (Lunch)</option>
                          <option value="13:00">01:00 PM (Lunch)</option>
                          <option value="17:00">05:00 PM (Dinner)</option>
                          <option value="18:00">06:00 PM (Dinner)</option>
                          <option value="19:00">07:00 PM (Dinner)</option>
                          <option value="20:00">08:00 PM (Dinner)</option>
                          <option value="21:00">09:00 PM (Dinner)</option>
                        </select>
                      </div>
                    </div>

                    {/* Occasion custom picker */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">{t("Special Occasion")}</label>
                      <select 
                        value={resForm.occasion}
                        onChange={(e) => setResForm({ ...resForm, occasion: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-[var(--primary)] text-stone-800"
                      >
                        <option value="Casual Dinner">{t("Casual Dinner / Socializing")}</option>
                        <option value="Birthday">{t("Birthday Celebration")}</option>
                        <option value="Anniversary">{t("Wedding Anniversary")}</option>
                        <option value="Business Meal">{t("Corporate / Business Dining")}</option>
                        <option value="Date Night">{t("Romantic Date Night")}</option>
                      </select>
                    </div>

                    {/* Custom notes box */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">{t("Notes or Special Requirements (Allergies, high chair, etc.)")}</label>
                      <textarea 
                        rows={3}
                        value={resForm.message}
                        onChange={(e) => setResForm({ ...resForm, message: e.target.value })}
                        placeholder={t("Please write down any dietary preferences...")}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-[var(--primary)] text-stone-800"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={resLoading}
                      className="w-full py-3 px-6 bg-[var(--primary)] text-stone-100 rounded-lg font-bold shadow hover:bg-opacity-95 transition-all text-sm cursor-pointer disabled:bg-stone-300"
                    >
                      {resLoading ? t("Submitting table inquiry...") : (t(sections.form?.submitLabel) || t("Request Table Booking"))}
                    </button>
                  </form>
                )}
              </div>

              {/* RESERVATIONS RULES SIDEBAR */}
              <div className="lg:col-span-5 space-y-6">
                {sections.reservationPolicy && (
                  <div className="bg-[var(--secondary)]/40 rounded-2xl p-6 border border-stone-200/50 space-y-4">
                    <h3 className="text-lg font-serif font-bold text-stone-900">{t(sections.reservationPolicy.title)}</h3>
                    <div className="w-10 h-0.5 bg-[var(--primary)]" />
                    <p className="text-stone-700 text-sm leading-relaxed">
                      {t(sections.reservationPolicy.content)}
                    </p>
                    <div className="text-xs text-stone-500 space-y-2 pt-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-[var(--accent)]" /> <span>{t("Standard 120-minute dining table block limits.")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[var(--accent)]" /> <span>{t("15 minutes grace period hold before automatic cancellation.")}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200/50 space-y-4 text-sm">
                  <h4 className="font-bold text-stone-800 font-serif text-base uppercase">{t("Opening Hours")}</h4>
                  <div className="divide-y divide-stone-200/40">
                    {data.business.openingHours.map(hrs => (
                      <div key={hrs.day} className="py-2 flex items-center justify-between font-medium">
                        <span className="text-stone-700">{t(hrs.day)}</span>
                        {hrs.closed ? (
                          <span className="text-red-600 font-bold uppercase tracking-wider text-xs">{t("Closed")}</span>
                        ) : (
                          <span className="text-stone-900 font-semibold">{hrs.open} - {hrs.close}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "ContactPage":
        return (
          <div id="contact-template" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 pb-16">
            {sections.hero && (
              <div className="text-center max-w-2xl mx-auto space-y-3">
                <span className="text-xs uppercase font-semibold text-[var(--accent)] tracking-widest">{t("FEEDBACK DESK")}</span>
                <h1 className="text-4xl font-serif font-black text-stone-950">{t(sections.hero.title)}</h1>
                <p className="text-stone-600 font-light">{t(sections.hero.subtitle)}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-5xl mx-auto items-stretch">
              {/* CONTACT DETAILS PANEL */}
              <div className="lg:col-span-5 bg-stone-900 rounded-2xl text-stone-200 p-8 space-y-8 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-stone-950/20" />
                <div className="relative z-10 space-y-6">
                  <h3 className="text-2xl font-serif font-bold text-white mb-2">{t("The Urban Fork")}</h3>
                  <div className="w-10 h-0.5 bg-[var(--accent)]" />
                  <p className="text-stone-400 text-sm leading-relaxed max-w-xs">
                    {t("Whether you are planning a corporate function, curious about our seasonal ingredients list, or have special dietary concerns, let us know!")}
                  </p>

                  <div className="space-y-4 text-sm pt-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-stone-300">{t("Our Location")}</h4>
                        <p className="text-xs text-stone-400 mt-1">
                          {t(data.business.address.street)}, {t(data.business.address.city)}, {t(data.business.address.state)} {data.business.address.postalCode}
                        </p>
                        <a 
                          href={data.business.address.mapUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs text-[var(--accent)] hover:underline mt-1.5 inline-block font-semibold"
                        >
                          {t("Open in Google Map navigation")}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-[var(--accent)] shrink-0" />
                      <div>
                        <h4 className="font-bold text-stone-300">{t("Call Us Directly")}</h4>
                        <span className="text-xs text-stone-400 font-mono">{data.business.phone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-[var(--accent)] shrink-0" />
                      <div>
                        <h4 className="font-bold text-stone-300">{t("Inquire via Email")}</h4>
                        <span className="text-xs text-stone-400 font-mono">{data.business.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 border-t border-stone-800 pt-6">
                  <h5 className="text-[11px] uppercase tracking-wider text-stone-400 font-medium">{t("Follow Social Connects")}</h5>
                  <div className="flex gap-3 mt-3">
                    {data.site.socialLinks.map(soc => (
                      <a 
                        key={soc.platform} 
                        href={soc.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="bg-stone-800 hover:bg-[var(--primary)] text-white text-xs px-3 py-1.5 rounded-lg border border-stone-700 font-bold transition-all"
                      >
                        {soc.platform}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* GENERAL FEEDBACK FORM */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200/70 p-6 md:p-8 shadow-sm flex flex-col justify-between">
                {contactSuccess ? (
                  <div className="text-center py-12 space-y-4 my-auto">
                    <div className="w-16 h-16 rounded-full bg-amber-100 text-[#D99A3D] flex items-center justify-center mx-auto">
                      <MessageSquare className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-stone-900">{t("Inquiry Submitted!")}</h3>
                    <p className="text-stone-600 max-w-sm mx-auto text-sm">
                      {t(contactSuccess)}
                    </p>
                    <button 
                      onClick={() => setContactSuccess(null)}
                      className="px-5 py-2 text-xs font-semibold uppercase bg-stone-100 rounded text-stone-700 hover:bg-stone-200 cursor-pointer"
                    >
                      {t("Send Another Inquiry Message")}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <h3 className="text-xl font-serif font-bold text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-[var(--primary)]" /> {t("Contact Feedback Desk")}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name input */}
                      <div>
                        <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">{t("* Your Name")}</label>
                        <input 
                          type="text" 
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          placeholder="Jane Doe"
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-[var(--primary)] text-stone-800"
                        />
                      </div>

                      {/* Email address */}
                      <div>
                        <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">{t("* Email Address")}</label>
                        <input 
                          type="email" 
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          placeholder="jane@example.com"
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-[var(--primary)] text-stone-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Optional phone */}
                      <div>
                        <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">{t("Phone Number")}</label>
                        <input 
                          type="tel" 
                          value={contactForm.phone}
                          onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                          placeholder="+1 555-000-0000"
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-[var(--primary)] text-stone-800"
                        />
                      </div>

                      {/* Subject headline */}
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#222222] mb-1.5">{t("* Subject Headline")}</label>
                        <input 
                          type="text" 
                          required
                          value={contactForm.subject}
                          onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                          placeholder="Event inquiry / general question..."
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-[var(--primary)] text-stone-800"
                        />
                      </div>
                    </div>

                    {/* Actual message */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">{t("* Custom Message Details")}</label>
                      <textarea 
                        rows={5}
                        required
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        placeholder={t("Write down your inquiry...")}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-[var(--primary)] text-stone-800"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={contactLoading}
                      className="w-full py-3 px-6 bg-[var(--primary)] text-stone-100 rounded-lg font-bold shadow hover:bg-opacity-95 transition-all text-sm cursor-pointer disabled:bg-stone-300"
                    >
                      {contactLoading ? t("Sending inquiry feedback...") : (t(sections.form?.submitLabel) || t("Send Message"))}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        );

      case "LegalPage":
        return (
          <div id="legal-template" className="max-w-4xl mx-auto px-4 py-16 space-y-8 pb-16">
            {sections.content && (
              <div className="bg-white rounded-2xl border border-stone-200/70 p-6 md:p-12 shadow-xs space-y-6">
                <span className="text-xs uppercase font-semibold text-stone-400 font-mono">Last Updated: {sections.content.lastUpdated}</span>
                <h1 className="text-3xl md:text-4xl font-serif font-black text-stone-900 border-b border-stone-100 pb-4">{t(sections.content.title)}</h1>
                <div className="space-y-4 md:space-y-6 text-stone-700 leading-relaxed font-sans text-sm md:text-base">
                  {sections.content.body.map((para, pIdx) => (
                    <p key={pIdx}>{t(para)}</p>
                  ))}
                  <p className="pt-4 text-xs font-medium text-stone-500 italic">
                    If you require any supplemental clarifications about {t(data.site.legalName)} general data safety and reservation guidelines, kindly contact the management desk at "{data.business.email}".
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ backgroundColor: siteColors.background }}>
      
      {/* GLOBAL BANNER STAT INFORMS */}
      <div className="bg-stone-950 py-2.5 text-stone-300 border-b border-stone-900 flex flex-wrap items-center justify-between text-[11px] md:text-xs px-4 sm:px-6 lg:px-8 font-mono tracking-wide">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[var(--accent)]" /> {t(data.business.address.street)}, {t(data.business.address.city)}</span>
          <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-[var(--accent)]" /> {data.business.phone}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[var(--accent)] font-semibold">
            <Clock className="w-3.5 h-3.5" /> <span>Open Mon-Sun 11 AM - 10 PM</span>
          </div>
          <button 
            id="admin-trigger-bar"
            onClick={() => setAdminOpen(true)}
            className="flex items-center gap-1 bg-[#8B2E20] hover:bg-opacity-90 text-[#F5E8D8] text-[10px] font-bold px-2 py-0.5 rounded transition-all cursor-pointer shadow animate-pulse"
          >
            <Settings className="w-3 h-3" /> Live JSON Admin Control Panel
          </button>
        </div>
      </div>

      {/* HEADER NAVIGATION APP BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo element Brand */}
          <button 
            onClick={() => navigateTo("/")}
            className="flex items-center gap-2 text-left cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-stone-100 flex items-center justify-center font-serif font-black text-lg shadow-md group-hover:scale-105 duration-200 transition-transform">
              U
            </div>
            <div>
              <span className="block text-lg font-serif font-black text-stone-900 tracking-tight leading-none group-hover:text-[var(--primary)] duration-200 transition-colors">
                {t(data.site.name)}
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-[var(--accent)] font-sans font-bold mt-1">
                {t(data.site.tagline)}
              </span>
            </div>
          </button>

          {/* Navigation Links item bars - Desktop (large tablet and up) */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-stone-700">
            {headerLinks.map(link => {
              const isActive = activeRoute === link.href || (link.href === "/" && activeRoute === "");
              return (
                <button
                  key={link.href}
                  id={`nav-link-${link.href.replace("/", "") || "home"}`}
                  onClick={() => navigateTo(link.href)}
                  className={`relative py-2 transition-all cursor-pointer ${
                    isActive 
                      ? "text-[var(--primary)] font-bold text-base" 
                      : "text-stone-700 hover:text-[var(--primary)] hover:translate-y-[-1px]"
                  }`}
                >
                  {t(link.label)}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action Call for reservation spot */}
          <div className="flex items-center gap-3">
            {/* Language Switcher Button before "book a table" */}
            <button
              id="lang-switcher"
              onClick={() => setLocale(locale === "en" ? "fr" : "en")}
              className="px-3 py-1.5 border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-black tracking-widest rounded-lg cursor-pointer uppercase transition-colors"
              title={locale === "en" ? "Switch to French" : "Passer en anglais"}
            >
              {locale === "en" ? "FR" : "EN"}
            </button>

            <button
              onClick={() => navigateTo(ctaButton.href)}
              className="px-5 py-2.5 bg-[var(--primary)] hover:bg-opacity-95 text-[#F5E8D8] text-xs font-bold tracking-wider rounded-lg uppercase shadow-xs transition-colors duration-250 cursor-pointer hidden lg:block"
            >
              {t(ctaButton.label)}
            </button>

            {/* Contemporary Hamburger Toggle Icon for Mobile & Tablet (below lg screen size) */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-lg bg-stone-50 border border-stone-200 hover:bg-stone-100 text-stone-700 flex items-center justify-center cursor-pointer transition-all focus:outline-hidden z-50 relative"
              aria-label="Toggle Navigation Menu"
            >
              <div className="relative w-5 h-4 flex flex-col justify-between items-center">
                <span className={`block h-[2px] w-5 rounded-full bg-stone-700 transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
                <span className={`block h-[2px] w-5 rounded-full bg-stone-700 transition-all duration-200 ${mobileMenuOpen ? "opacity-0 scale-x-0" : "opacity-100"}`} />
                <span className={`block h-[2px] w-5 rounded-full bg-stone-700 transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Collapsible dropdown menu inline below the header bar */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-stone-100 shadow-md divide-y divide-stone-100 relative z-40">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
              <nav className="flex flex-col gap-1">
                {headerLinks.map(link => {
                  const isActive = activeRoute === link.href || (link.href === "/" && activeRoute === "");
                  return (
                    <button
                      key={link.href}
                      onClick={() => navigateTo(link.href)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all font-sans font-bold text-sm flex items-center justify-between cursor-pointer ${
                        isActive 
                          ? "bg-[var(--primary)]/10 text-[var(--primary)] pl-5" 
                          : "text-stone-700 hover:bg-stone-50 hover:pl-5 hover:text-stone-950"
                      }`}
                    >
                      <span>{t(link.label)}</span>
                      <ChevronRight className={`w-4 h-4 opacity-70 transition-transform ${isActive ? "translate-x-1" : ""}`} />
                    </button>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-stone-100">
                <button
                  onClick={() => navigateTo(ctaButton.href)}
                  className="w-full py-3 bg-[var(--primary)] text-stone-100 font-bold rounded-xl shadow-xs text-xs hover:bg-opacity-95 uppercase tracking-wider text-center block cursor-pointer transition-all"
                >
                  {t(ctaButton.label)}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* RENDER ACTIVE PAGE TEMPLATE */}
      <main className="flex-1 bg-white relative">
        {renderPageContent()}
      </main>

      {/* FOOTER BLOCK CONTROLLER */}
      <footer className="bg-stone-950 text-stone-300 py-16 border-t border-stone-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 pb-10 border-b border-stone-900 text-sm">
          
          {/* Logo & Slogan Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-[var(--accent)] text-stone-950 flex items-center justify-center font-serif font-black text-base">
                U
              </div>
              <h3 className="font-serif font-bold text-white text-lg">{t(data.site.name)}</h3>
            </div>
            <p className="text-stone-400 font-light text-xs leading-relaxed max-w-xs">{t(data.site.description)}</p>
            <div className="flex gap-2">
              {data.site.socialLinks.map(soc => (
                <a 
                  key={soc.platform} 
                  href={soc.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="bg-stone-900 hover:bg-[var(--accent)] hover:text-stone-950 text-stone-300 text-xs px-2.5 py-1 rounded font-semibold transition-all border border-stone-800"
                >
                  {soc.platform}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Hours Column */}
          <div className="space-y-3">
            <h4 className="text-white font-serif font-semibold text-base uppercase">{t("Dining Hours")}</h4>
            <div className="w-8 h-0.5 bg-[var(--primary)]" />
            <div className="space-y-1 text-xs text-stone-400 font-light">
              <p>{t("Monday - Thursday: 11:00 AM - 10:00 PM")}</p>
              <p>{t("Friday - Saturday: 10:00 AM - 11:00 PM")}</p>
              <p>{t("Sunday: 10:00 AM - 09:00 PM")}</p>
            </div>
          </div>

          {/* Navigation Links column */}
          <div className="space-y-3">
            <h4 className="text-white font-serif font-semibold text-base uppercase">{t("Direct Sitemap")}</h4>
            <div className="w-8 h-0.5 bg-[var(--primary)]" />
            <div className="grid grid-cols-2 gap-2 text-xs font-medium text-stone-400">
              {headerLinks.map(link => (
                <button 
                  key={link.href} 
                  onClick={() => navigateTo(link.href)}
                  className="text-left hover:text-[var(--accent)] transition-colors cursor-pointer"
                >
                  {t(link.label)}
                </button>
              ))}
            </div>
          </div>

          {/* Business particulars column */}
          <div className="space-y-3">
            <h4 className="text-white font-serif font-semibold text-base uppercase">{t("Front Desk Concierge")}</h4>
            <div className="w-8 h-0.5 bg-[var(--primary)]" />
            <div className="space-y-2 text-xs font-light text-stone-400">
              <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" /> {t(data.business.address.street)}, {t(data.business.address.city)}</p>
              <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" /> {data.business.phone}</p>
              <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" /> {data.business.email}</p>
            </div>
          </div>
        </div>

        {/* Legal licensing row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-medium text-stone-500">
          <p>© 2026 {t(data.site.legalName)}. {t("All rights reserved under local hospitality protocols.")}</p>
          <div className="flex items-center gap-4 flex-wrap">
            {footerLinks.map(lnk => (
              <button 
                key={lnk.href} 
                onClick={() => navigateTo(lnk.href)}
                className="hover:text-stone-300 transition-colors cursor-pointer"
              >
                {t(lnk.label)}
              </button>
            ))}
          </div>
        </div>
      </footer>

      {/* MULTIPURPOSE DYNAMIC LIGHTBOX OVERLAY */}
      {lightboxImg && (
        <div id="gallery-lightbox" className="fixed inset-0 z-50 bg-stone-950/92 backdrop-blur-md flex items-center justify-center p-4">
          <button 
            onClick={() => setLightboxImg(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 block cursor-pointer transition-colors"
            title="Close Lightbox"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-4xl w-full text-center space-y-4">
            <div className="max-h-[80vh] rounded-xl overflow-hidden shadow-2xl bg-stone-900">
              <img src={lightboxImg.src} alt={lightboxImg.caption} className="w-auto max-h-[75vh] mx-auto object-contain" />
            </div>
            <p className="text-stone-100 font-serif font-semibold text-lg">{lightboxImg.caption}</p>
          </div>
        </div>
      )}

      {/* FLOATING JSON CONTROL PANEL PANEL */}
      <div 
        id="live-json-admin-panel" 
        className={`fixed top-0 bottom-0 right-0 z-50 w-full sm:w-[550px] bg-white shadow-2xl border-l border-stone-200 flex flex-col justify-between transition-transform duration-350 ease-out ${
          adminOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header toolbar */}
        <div className="bg-stone-900 text-stone-100 p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[var(--accent)]" />
            <div>
              <h3 className="font-serif font-black text-base text-white">JSON Control Panel</h3>
              <p className="text-[10px] text-stone-400 uppercase tracking-widest font-mono">Live Configuration Engine</p>
            </div>
          </div>
          <button 
            onClick={() => setAdminOpen(false)}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Admin tabs */}
        <div className="bg-stone-100 border-b border-stone-200/80 px-4 py-2 shrink-0 flex gap-1.5 text-xs font-bold font-sans overflow-x-auto">
          <button
            onClick={() => setAdminTab('quick')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              adminTab === 'quick' ? "bg-white text-[var(--primary)] shadow-xs" : "text-stone-600 hover:bg-stone-200"
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Easy UI Editor
          </button>
          <button
            onClick={() => setAdminTab('raw')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              adminTab === 'raw' ? "bg-white text-[var(--primary)] shadow-xs" : "text-stone-600 hover:bg-stone-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Raw JSON Schema
          </button>
          <button
            onClick={() => setAdminTab('reservations')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              adminTab === 'reservations' ? "bg-white text-[var(--primary)] shadow-xs" : "text-stone-600 hover:bg-stone-200"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Bookings Office ({reservations.length})
          </button>
          <button
            onClick={() => setAdminTab('messages')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              adminTab === 'messages' ? "bg-white text-[var(--primary)] shadow-xs" : "text-stone-600 hover:bg-stone-200"
            }`}
          >
            <Mail className="w-3.5 h-3.5" /> Messages Inbox ({contacts.length})
          </button>
        </div>

        {/* Tab contents controller */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {adminSuccessMsg && (
            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-lg flex items-center gap-2 border border-emerald-100 text-xs font-semibold shadow-xs">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{adminSuccessMsg}</span>
            </div>
          )}

          {/* QUICK EDITOR */}
          {adminTab === 'quick' && (
            <div className="space-y-5 text-sm">
              <p className="text-xs text-stone-500 font-light leading-relaxed">
                Alter visual themes, branding slogans, operational hours, or coordinates below. Any changes are automatically updated both on the screen and persisted back into `/src/restaurant-data.json`.
              </p>

              {/* Branding */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/50 space-y-4">
                <h4 className="font-bold text-stone-900 border-b border-stone-200pb-1">Branding Config</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-stone-500 mb-1 font-bold">Restaurant Name</label>
                    <input 
                      type="text"
                      value={data.site.name[locale] || ""}
                      onChange={(e) => handleQuickEdit(['site', 'name', locale], e.target.value)}
                      className="w-full bg-white border border-stone-200 p-2 rounded text-stone-800"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 mb-1 font-bold">Tagline Slogan</label>
                    <input 
                      type="text"
                      value={data.site.tagline[locale] || ""}
                      onChange={(e) => handleQuickEdit(['site', 'tagline', locale], e.target.value)}
                      className="w-full bg-white border border-stone-200 p-2 rounded text-stone-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-stone-500 mb-1 text-xs font-bold">Brief Legal Name</label>
                  <input 
                    type="text"
                    value={data.site.legalName[locale] || ""}
                    onChange={(e) => handleQuickEdit(['site', 'legalName', locale], e.target.value)}
                    className="w-full bg-white border border-stone-200 p-2 rounded text-stone-800 text-xs"
                  />
                </div>
              </div>

              {/* Dynamic Theme Color Sliders */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/50 space-y-4">
                <h4 className="font-bold text-stone-900 border-b border-stone-200 pb-1">Dynamic Color Themes</h4>
                <p className="text-stone-500 text-[11px] font-light">Changing these values overrides the CSS parameters of the active UI instantly.</p>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-stone-500 mb-1 font-bold">Primary Color</label>
                    <div className="flex gap-1">
                      <input 
                        type="color"
                        value={data.site.theme.primaryColor}
                        onChange={(e) => handleQuickEdit(['site', 'theme', 'primaryColor'], e.target.value)}
                        className="w-8 h-8 rounded border border-stone-300 cursor-pointer shrink-0"
                      />
                      <input 
                        type="text" 
                        value={data.site.theme.primaryColor}
                        onChange={(e) => handleQuickEdit(['site', 'theme', 'primaryColor'], e.target.value)}
                        className="w-full bg-white border border-stone-200 p-1 rounded text-[10px] font-mono text-stone-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-stone-500 mb-1 font-bold">Secondary Color</label>
                    <div className="flex gap-1">
                      <input 
                        type="color"
                        value={data.site.theme.secondaryColor}
                        onChange={(e) => handleQuickEdit(['site', 'theme', 'secondaryColor'], e.target.value)}
                        className="w-8 h-8 rounded border border-stone-300 cursor-pointer shrink-0"
                      />
                      <input 
                        type="text" 
                        value={data.site.theme.secondaryColor}
                        onChange={(e) => handleQuickEdit(['site', 'theme', 'secondaryColor'], e.target.value)}
                        className="w-full bg-white border border-stone-200 p-1 rounded text-[10px] font-mono text-stone-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-stone-500 mb-1 font-bold">Accent Color</label>
                    <div className="flex gap-1">
                      <input 
                        type="color"
                        value={data.site.theme.accentColor}
                        onChange={(e) => handleQuickEdit(['site', 'theme', 'accentColor'], e.target.value)}
                        className="w-8 h-8 rounded border border-stone-300 cursor-pointer shrink-0"
                      />
                      <input 
                        type="text" 
                        value={data.site.theme.accentColor}
                        onChange={(e) => handleQuickEdit(['site', 'theme', 'accentColor'], e.target.value)}
                        className="w-full bg-white border border-stone-200 p-1 rounded text-[10px] font-mono text-stone-800"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/50 space-y-4">
                <h4 className="font-bold text-stone-900 border-b border-stone-200 pb-1 flex items-center justify-between">
                  <span>Front Desk Details</span>
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-stone-500 mb-1 font-bold">Phone Connection</label>
                    <input 
                      type="text"
                      value={data.business.phone}
                      onChange={(e) => handleQuickEdit(['business', 'phone'], e.target.value)}
                      className="w-full bg-white border border-stone-200 p-2 rounded text-stone-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 mb-1 font-bold">Concierge Email</label>
                    <input 
                      type="text"
                      value={data.business.email}
                      onChange={(e) => handleQuickEdit(['business', 'email'], e.target.value)}
                      className="w-full bg-white border border-stone-200 p-2 rounded text-stone-800 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-stone-500 mb-1 text-xs font-bold font-serif">Street Location</label>
                  <input 
                    type="text"
                    value={data.business.address.street}
                    onChange={(e) => handleQuickEdit(['business', 'address', 'street'], e.target.value)}
                    className="w-full bg-white border border-stone-200 p-2 rounded text-stone-800 text-xs"
                  />
                </div>
              </div>

              {/* Menu Specials Admin Price Modifiers */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/50 space-y-4">
                <h4 className="font-bold text-stone-900 border-b border-stone-200 pb-1">Featured Dish Pricing</h4>
                <p className="text-stone-500 text-[11px] font-light">Dynamically edits price indexes inside the database.</p>
                <div className="space-y-3">
                  {data.menu.items.slice(0, 4).map(it => (
                    <div key={it.id} className="flex items-center justify-between gap-4 text-xs font-medium">
                      <span className="text-stone-700 truncate max-w-xs">{t(it.name)}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-stone-400">$</span>
                        <input 
                          type="number"
                          value={it.price}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const clonedItems = [...data.menu.items];
                            const idx = clonedItems.findIndex(x => x.id === it.id);
                            clonedItems[idx].price = val;
                            handleQuickEdit(['menu', 'items'], clonedItems);
                          }}
                          className="w-16 bg-white border border-stone-200 p-1 text-center rounded font-mono font-bold text-stone-800"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* RAW SCHEMA JSON */}
          {adminTab === 'raw' && (
            <div className="space-y-4 flex flex-col h-full text-sm">
              <p className="text-xs text-stone-500 font-light leading-relaxed mb-1">
                You can directly copy, paste, modify and customize any part of this schema (including sections, gallery assets, promotions banner texts, and meta SEO parameters). Click "Save live adjustments" to perform integrity validation check.
              </p>
              
              {jsonValidationError && (
                <div className="bg-red-50 text-red-800 p-3.5 border border-red-200 rounded text-xs font-semibold space-y-1">
                  <div className="flex items-center gap-1.5"><X className="w-4 h-4 text-red-600 shrink-0" /> JSON ValidationError</div>
                  <pre className="text-[10px] text-red-700 font-mono overflow-x-auto whitespace-pre-wrap">{jsonValidationError}</pre>
                </div>
              )}

              <div className="flex-1 min-h-[350px]">
                <textarea
                  rows={20}
                  value={rawJson}
                  onChange={(e) => setRawJson(e.target.value)}
                  className="w-full h-full bg-stone-900 text-emerald-400 font-mono text-[11px] p-4 rounded-xl border border-stone-800 focus:outline-hidden focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>

              <button
                onClick={handleRawJsonSubmit}
                className="w-full py-3 bg-[var(--primary)] text-stone-100 rounded-lg font-bold text-xs shadow-md hover:bg-opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Live JSON Adjustments
              </button>
            </div>
          )}

          {/* CUSTOMER RESERVATIONS LIST */}
          {adminTab === 'reservations' && (
            <div className="space-y-4">
              <p className="text-xs text-stone-500 font-light">
                Inspect customer spots requested from the reservation form page path. Change booking ticket status here to synchronize lists.
              </p>

              {reservations.length === 0 ? (
                <div className="text-center py-12 bg-stone-50 rounded-xl border border-stone-200/50">
                  <ClipboardList className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                  <p className="text-stone-500 text-xs">No reservation rows in active history registers yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reservations.slice().reverse().map(res => (
                    <div key={res.id} id={`admin-res-${res.id}`} className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-stone-200/50 pb-2">
                        <span className="font-bold text-stone-800 max-w-[150px] truncate">{res.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          res.status === 'Confirmed' ? "bg-emerald-100 text-emerald-800" :
                          res.status === 'Cancelled' ? "bg-red-100 text-red-800" :
                          "bg-amber-100 text-amber-800"
                        }`}>
                          {res.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-stone-600">
                        <p>Date: <span className="font-bold text-stone-800">{res.date}</span></p>
                        <p>Time: <span className="font-bold text-stone-800">{res.time}</span></p>
                        <p>Guests: <span className="font-bold text-stone-800">{res.guests} people</span></p>
                        <p>Occasion: <span className="font-bold text-stone-800">{res.occasion || "Dinner"}</span></p>
                      </div>

                      <div className="text-stone-500 border-t border-stone-200/40 pt-2 space-y-1">
                        <p>Phone: <span className="font-semibold text-stone-700 font-mono">{res.phone}</span></p>
                        <p>Email: <span className="font-semibold text-stone-700 font-mono">{res.email}</span></p>
                        {res.message && (
                          <p className="italic mt-1 text-stone-600">"{res.message}"</p>
                        )}
                      </div>

                      {res.status === 'Pending' && (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleUpdateReservationStatus(res.id, 'Confirmed')}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-stone-100 font-bold p-1.5 rounded text-[10px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <Check className="w-3 h-3" /> Approve Booking
                          </button>
                          <button
                            onClick={() => handleUpdateReservationStatus(res.id, 'Cancelled')}
                            className="bg-stone-200 hover:bg-stone-300 text-stone-750 font-bold p-1.5 rounded text-[10px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CONTACT MESSAGES */}
          {adminTab === 'messages' && (
            <div className="space-y-4">
              <p className="text-xs text-stone-500 font-light">
                Inbound business inquiries or recommendations submitted from the custom feedback section.
              </p>

              {contacts.length === 0 ? (
                <div className="text-center py-12 bg-stone-50 rounded-xl border border-stone-200/50">
                  <Mail className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                  <p className="text-stone-500 text-xs">Inbox is completely clean.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contacts.slice().reverse().map(msg => (
                    <div key={msg.id} id={`admin-msg-${msg.id}`} className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs space-y-2">
                      <div className="flex items-center justify-between border-b border-stone-200/50 pb-2">
                        <span className="font-bold text-stone-800">{msg.name}</span>
                        <span className="text-stone-400 font-mono text-[9px]">
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                      
                      <div className="text-stone-600 space-y-1">
                        <p className="font-semibold text-stone-800">Subject: {msg.subject || "No Subject"}</p>
                        <p className="italic text-stone-700 font-serif my-2 leading-relaxed bg-white p-2.5 rounded border border-stone-100">
                          "{msg.message}"
                        </p>
                        <p className="text-[10px] text-stone-500">
                          Email: <span className="font-mono text-stone-700">{msg.email}</span>
                          {msg.phone && (
                            <> | Phone: <span className="font-mono text-stone-700">{msg.phone}</span></>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info brand */}
        <div className="bg-stone-100 p-4 border-t border-stone-200/70 text-[10px] text-stone-500 font-mono text-center shrink-0">
          Double-click layout elements on screen to locate files.
        </div>
      </div>

    </div>
  );
}
