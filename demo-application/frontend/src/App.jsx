import { useState, useEffect } from "react";
import "./App.css";

// ---------------------------------------------------------------------------
// LUXURY PERFUME BOTTLE SVG COMPONENTS (Matching the reference image bottles)
// ---------------------------------------------------------------------------

function BottleLAmour() {
  return (
    <svg viewBox="0 0 160 220" className="bottle-svg" aria-label="L'Amour Eau De Parfum Bottle">
      <defs>
        <linearGradient id="lamour-glass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fce7ea" stopOpacity="0.95" />
          <stop offset="40%" stopColor="#f9c8d1" stopOpacity="0.85" />
          <stop offset="70%" stopColor="#f2a8b7" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#f7d4dc" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="gold-cap" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#d4af37" />
          <stop offset="25%" stopColor="#fbeeaa" />
          <stop offset="50%" stopColor="#d4af37" />
          <stop offset="75%" stopColor="#aa7c11" />
          <stop offset="100%" stopColor="#e5c866" />
        </linearGradient>
        <linearGradient id="glass-spec" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="20%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="80%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.5" />
        </linearGradient>
        <filter id="bottle-shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#82384a" floodOpacity="0.22" />
        </filter>
      </defs>

      {/* Cap Stopper */}
      <rect x="62" y="16" width="36" height="34" rx="4" fill="url(#gold-cap)" filter="url(#bottle-shadow)" />
      <rect x="65" y="19" width="30" height="28" rx="2" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.5" />
      {/* Golden Collar / Atomizer Neck */}
      <rect x="68" y="50" width="24" height="14" rx="1" fill="url(#gold-cap)" />
      <line x1="68" y1="56" x2="92" y2="56" stroke="#875e0a" strokeWidth="1" />

      {/* Main Flacon Body (Faceted Glass) */}
      <rect x="36" y="64" width="88" height="134" rx="10" fill="url(#lamour-glass)" filter="url(#bottle-shadow)" />
      <rect x="42" y="70" width="76" height="122" rx="6" fill="#fbd3dc" opacity="0.6" />

      {/* Glass Inner Thickness & Facets */}
      <path d="M38 68 L48 76 L48 186 L38 194 Z" fill="#ffffff" opacity="0.35" />
      <path d="M122 68 L112 76 L112 186 L122 194 Z" fill="#b06375" opacity="0.25" />

      {/* Glass Specular Glare */}
      <rect x="36" y="64" width="88" height="134" rx="10" fill="url(#glass-spec)" pointerEvents="none" />
      <line x1="46" y1="74" x2="46" y2="188" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />

      {/* Label Plaque */}
      <rect x="47" y="104" width="66" height="54" rx="3" fill="#fffdfa" stroke="#d4af37" strokeWidth="1" />
      <text x="80" y="120" textAnchor="middle" fill="#4a1521" fontFamily="Playfair Display, serif" fontSize="9.5" fontWeight="600" letterSpacing="0.5">Veloura</text>
      <text x="80" y="129" textAnchor="middle" fill="#8c6b32" fontFamily="Montserrat, sans-serif" fontSize="5" letterSpacing="1.5">PARFUMS</text>
      <line x1="60" y1="133" x2="100" y2="133" stroke="#e8cfa1" strokeWidth="0.6" />
      <text x="80" y="142" textAnchor="middle" fill="#4a1521" fontFamily="Playfair Display, serif" fontSize="7.5" fontWeight="600" letterSpacing="0.8">L'AMOUR</text>
      <text x="80" y="150" textAnchor="middle" fill="#8b6873" fontFamily="Montserrat, sans-serif" fontSize="4.2" letterSpacing="0.8">EAU DE PARFUM</text>
    </svg>
  );
}

function BottleRoseNoir() {
  return (
    <svg viewBox="0 0 160 220" className="bottle-svg" aria-label="Rose Noir Extrait De Parfum Bottle">
      <defs>
        <linearGradient id="noir-glass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#430814" />
          <stop offset="40%" stopColor="#25030a" />
          <stop offset="70%" stopColor="#170105" />
          <stop offset="100%" stopColor="#3d0712" />
        </linearGradient>
        <linearGradient id="ruby-glow" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#8d1226" stopOpacity="0.7" />
          <stop offset="60%" stopColor="#530614" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#120104" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="gold-cap-noir" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#c59f37" />
          <stop offset="35%" stopColor="#fdedbb" />
          <stop offset="65%" stopColor="#b6891e" />
          <stop offset="100%" stopColor="#dfbd5e" />
        </linearGradient>
      </defs>

      {/* Cap Stopper - Deep Onyx with Gold Ring */}
      <rect x="60" y="18" width="40" height="32" rx="4" fill="#150206" stroke="url(#gold-cap-noir)" strokeWidth="1.2" />
      <rect x="64" y="22" width="32" height="24" rx="2" fill="none" stroke="#6d1222" strokeWidth="0.8" opacity="0.6" />
      {/* Gold Collar */}
      <rect x="67" y="50" width="26" height="14" rx="1" fill="url(#gold-cap-noir)" />

      {/* Main Flacon Body (Deep Ruby & Black Gloss) */}
      <rect x="36" y="64" width="88" height="134" rx="8" fill="url(#noir-glass)" />
      <rect x="42" y="70" width="76" height="122" rx="5" fill="url(#ruby-glow)" />

      {/* Gloss Reflections */}
      <path d="M42 68 L48 74 L48 186 L42 192 Z" fill="#ffffff" opacity="0.18" />
      <line x1="45" y1="72" x2="45" y2="188" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.4" />
      <line x1="115" y1="72" x2="115" y2="188" stroke="#ff8da3" strokeWidth="1" strokeLinecap="round" opacity="0.2" />

      {/* Label Plaque */}
      <rect x="47" y="104" width="66" height="54" rx="3" fill="#1b0308" stroke="url(#gold-cap-noir)" strokeWidth="1" />
      <text x="80" y="120" textAnchor="middle" fill="#e7caa1" fontFamily="Playfair Display, serif" fontSize="9.5" fontWeight="600" letterSpacing="0.5">Veloura</text>
      <text x="80" y="129" textAnchor="middle" fill="#cba258" fontFamily="Montserrat, sans-serif" fontSize="5" letterSpacing="1.5">PARFUMS</text>
      <line x1="60" y1="133" x2="100" y2="133" stroke="#b08b3e" strokeWidth="0.6" />
      <text x="80" y="142" textAnchor="middle" fill="#fdf0d5" fontFamily="Playfair Display, serif" fontSize="7.5" fontWeight="600" letterSpacing="0.8">ROSE NOIR</text>
      <text x="80" y="150" textAnchor="middle" fill="#e2a1b1" fontFamily="Montserrat, sans-serif" fontSize="4.2" letterSpacing="0.8">EXTRAIT DE PARFUM</text>
    </svg>
  );
}

function BottleLumiere() {
  return (
    <svg viewBox="0 0 160 220" className="bottle-svg" aria-label="Eau De Lumière Eau De Parfum Bottle">
      <defs>
        <linearGradient id="lumiere-liquid" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef8dc" />
          <stop offset="35%" stopColor="#f7e4a1" />
          <stop offset="70%" stopColor="#e8c257" />
          <stop offset="100%" stopColor="#f2d378" />
        </linearGradient>
        <linearGradient id="gold-cap-lumiere" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#d4af37" />
          <stop offset="30%" stopColor="#fff5cb" />
          <stop offset="60%" stopColor="#c59918" />
          <stop offset="100%" stopColor="#f1d46b" />
        </linearGradient>
      </defs>

      {/* Tall Gold Cap */}
      <rect x="63" y="14" width="34" height="36" rx="3" fill="url(#gold-cap-lumiere)" />
      <line x1="63" y1="26" x2="97" y2="26" stroke="#a07c1b" strokeWidth="1" />
      <rect x="68" y="50" width="24" height="14" rx="1" fill="url(#gold-cap-lumiere)" />

      {/* Flacon Body - Pure Golden Radiance */}
      <rect x="38" y="64" width="84" height="134" rx="8" fill="url(#lumiere-liquid)" />
      <rect x="44" y="70" width="72" height="122" rx="4" fill="#fff9e6" opacity="0.4" />

      {/* Crystal Vertical Flutes */}
      <line x1="52" y1="70" x2="52" y2="192" stroke="#ffffff" strokeWidth="1.2" opacity="0.6" />
      <line x1="62" y1="70" x2="62" y2="192" stroke="#d6a928" strokeWidth="0.8" opacity="0.4" />
      <line x1="98" y1="70" x2="98" y2="192" stroke="#d6a928" strokeWidth="0.8" opacity="0.4" />
      <line x1="108" y1="70" x2="108" y2="192" stroke="#ffffff" strokeWidth="1.2" opacity="0.6" />

      {/* Front Label */}
      <rect x="47" y="104" width="66" height="54" rx="3" fill="#fffdf5" stroke="#c5a059" strokeWidth="1" />
      <text x="80" y="119" textAnchor="middle" fill="#4a1521" fontFamily="Playfair Display, serif" fontSize="9.5" fontWeight="600" letterSpacing="0.5">Veloura</text>
      <text x="80" y="128" textAnchor="middle" fill="#8c6b32" fontFamily="Montserrat, sans-serif" fontSize="5" letterSpacing="1.5">PARFUMS</text>
      <line x1="60" y1="132" x2="100" y2="132" stroke="#e8cfa1" strokeWidth="0.6" />
      <text x="80" y="141" textAnchor="middle" fill="#4a1521" fontFamily="Playfair Display, serif" fontSize="7" fontWeight="600" letterSpacing="0.5">EAU DE LUMIÈRE</text>
      <text x="80" y="150" textAnchor="middle" fill="#8b6873" fontFamily="Montserrat, sans-serif" fontSize="4.2" letterSpacing="0.8">EAU DE PARFUM</text>
    </svg>
  );
}

function BottleJardin() {
  return (
    <svg viewBox="0 0 160 220" className="bottle-svg" aria-label="Jardin Secrète Eau De Parfum Bottle">
      <defs>
        <linearGradient id="jardin-liquid" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff2eb" />
          <stop offset="40%" stopColor="#fde0d3" />
          <stop offset="80%" stopColor="#f8c2ab" />
          <stop offset="100%" stopColor="#fdd9c8" />
        </linearGradient>
      </defs>

      {/* Cap - Rose Gold Square */}
      <rect x="62" y="18" width="36" height="32" rx="4" fill="url(#gold-cap)" />
      <rect x="68" y="50" width="24" height="14" rx="1" fill="url(#gold-cap)" />

      {/* Flacon Body */}
      <rect x="38" y="64" width="84" height="134" rx="12" fill="url(#jardin-liquid)" />
      <rect x="44" y="70" width="72" height="122" rx="8" fill="#ffffff" opacity="0.3" />

      {/* Highlights */}
      <line x1="46" y1="72" x2="46" y2="188" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />

      {/* Label */}
      <rect x="47" y="104" width="66" height="54" rx="3" fill="#fffaf7" stroke="#d4af37" strokeWidth="1" />
      <text x="80" y="120" textAnchor="middle" fill="#4a1521" fontFamily="Playfair Display, serif" fontSize="9.5" fontWeight="600" letterSpacing="0.5">Veloura</text>
      <text x="80" y="129" textAnchor="middle" fill="#8c6b32" fontFamily="Montserrat, sans-serif" fontSize="5" letterSpacing="1.5">PARFUMS</text>
      <line x1="60" y1="133" x2="100" y2="133" stroke="#e8cfa1" strokeWidth="0.6" />
      <text x="80" y="142" textAnchor="middle" fill="#4a1521" fontFamily="Playfair Display, serif" fontSize="7" fontWeight="600" letterSpacing="0.5">JARDIN SECRÈTE</text>
      <text x="80" y="150" textAnchor="middle" fill="#8b6873" fontFamily="Montserrat, sans-serif" fontSize="4.2" letterSpacing="0.8">EAU DE PARFUM</text>
    </svg>
  );
}

function BottleIntense() {
  return (
    <svg viewBox="0 0 160 220" className="bottle-svg" aria-label="Véloura Intense Extrait De Parfum Bottle">
      <defs>
        <linearGradient id="amber-intense" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fae2b6" />
          <stop offset="35%" stopColor="#e5a84b" />
          <stop offset="70%" stopColor="#b66b1a" />
          <stop offset="100%" stopColor="#8d4a07" />
        </linearGradient>
      </defs>

      {/* Rounded Sleek Gold Cap */}
      <rect x="64" y="16" width="32" height="34" rx="6" fill="url(#gold-cap)" />
      <rect x="68" y="50" width="24" height="14" rx="1" fill="url(#gold-cap)" />

      {/* Cylindrical Amber Flacon */}
      <rect x="42" y="64" width="76" height="134" rx="16" fill="url(#amber-intense)" />
      <rect x="48" y="70" width="64" height="122" rx="12" fill="#fff2db" opacity="0.25" />

      {/* Glass highlights */}
      <line x1="50" y1="74" x2="50" y2="186" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

      {/* Label */}
      <rect x="47" y="104" width="66" height="54" rx="3" fill="#2d1506" stroke="#e5b458" strokeWidth="1" />
      <text x="80" y="119" textAnchor="middle" fill="#fde6bf" fontFamily="Playfair Display, serif" fontSize="9" fontWeight="600" letterSpacing="0.5">Veloura</text>
      <text x="80" y="128" textAnchor="middle" fill="#e5b458" fontFamily="Montserrat, sans-serif" fontSize="5" letterSpacing="1.5">PARFUMS</text>
      <line x1="60" y1="132" x2="100" y2="132" stroke="#8d5b1e" strokeWidth="0.6" />
      <text x="80" y="141" textAnchor="middle" fill="#ffffff" fontFamily="Playfair Display, serif" fontSize="6.8" fontWeight="600" letterSpacing="0.5">VÉLOURA INTENSE</text>
      <text x="80" y="150" textAnchor="middle" fill="#e5b458" fontFamily="Montserrat, sans-serif" fontSize="4.2" letterSpacing="0.8">EXTRAIT DE PARFUM</text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// DATA: FEATURED FRAGRANCES MATCHING USER'S SCREENSHOT
// ---------------------------------------------------------------------------

const FRAGRANCES = [
  {
    id: 1,
    backendProductId: 101,
    name: "L'AMOUR",
    subtitle: "EAU DE PARFUM",
    price: 128.00,
    category: "floral",
    bottleComponent: BottleLAmour,
    description: "Centifolia roses, crystal peony, and luminous white musk.",
  },
  {
    id: 2,
    backendProductId: 102,
    name: "ROSE NOIR",
    subtitle: "EXTRAIT DE PARFUM",
    price: 158.00,
    category: "sensual",
    bottleComponent: BottleRoseNoir,
    description: "Midnight black rose, rare Bourbon vanilla, and smoked oud.",
  },
  {
    id: 3,
    backendProductId: 103,
    name: "EAU DE LUMIÈRE",
    subtitle: "EAU DE PARFUM",
    price: 128.00,
    category: "fresh",
    bottleComponent: BottleLumiere,
    description: "Sunlit bergamot, golden neroli blossom, and cashmere woods.",
  },
  {
    id: 4,
    backendProductId: 104,
    name: "JARDIN SECRÈTE",
    subtitle: "EAU DE PARFUM",
    price: 118.00,
    category: "floral",
    bottleComponent: BottleJardin,
    description: "Dew-kissed freesia, white peach nectar, and green cedar leaves.",
  },
  {
    id: 5,
    backendProductId: 105,
    name: "VÉLOURA INTENSE",
    subtitle: "EXTRAIT DE PARFUM",
    price: 168.00,
    category: "exclusive",
    bottleComponent: BottleIntense,
    description: "Roasted tonka bean, liquid amber resin, and golden saffron threads.",
  },
];

const COLLECTIONS = [
  {
    id: "floral",
    title: "FLORAL BOUQUETS",
    description: "Soft. Romantic. Timeless.",
    bgClass: "coll-floral",
    img: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "sensual",
    title: "WARM & SENSUAL",
    description: "Rich. Alluring. Addictive.",
    bgClass: "coll-sensual",
    img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "fresh",
    title: "FRESH & RADIANT",
    description: "Light. Elegant. Uplifting.",
    bgClass: "coll-fresh",
    img: "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "exclusive",
    title: "EXCLUSIVE COLLECTION",
    description: "Rare. Unique. Unforgettable.",
    bgClass: "coll-exclusive",
    img: "https://images.unsplash.com/photo-1563178406-4cdc2923acbc?auto=format&fit=crop&w=700&q=80",
  },
];

const REVIEWS = [
  {
    id: 1,
    quote: "Veloura Parfums is pure luxury. The scents are sophisticated, long-lasting, and absolutely mesmerizing.",
    name: "EMILY R.",
    verified: "Verified Buyer",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: 2,
    quote: "The attention to detail in every bottle is unmatched. It feels like wearing confidence and elegance.",
    name: "SOPHIA M.",
    verified: "Verified Buyer",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: 3,
    quote: "I've found my signature scent. Veloura is now the only perfume brand I trust and adore.",
    name: "LAUREN T.",
    verified: "Verified Buyer",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
  },
];

// ---------------------------------------------------------------------------
// SIMULATED ERROR PARSER
// Analyzes checkout API responses & errors to extract the exact simulation name
// ---------------------------------------------------------------------------

const parseSimulationError = (status, data, errorObj) => {
  const detail = (data && data.detail) || (errorObj && errorObj.message) || "";
  const detailStr = String(detail);
  const detailLower = detailStr.toLowerCase();

  // 1. HTTP 500 / Bad Deployment Rollout Simulation
  if (
    status === 500 ||
    detailLower.includes("deployment") ||
    detailLower.includes("rollout") ||
    detailLower.includes("internal")
  ) {
    return {
      statusCode: 500,
      badgeText: "HTTP 500 · INTERNAL SERVER ERROR",
      title: "There was an Internal Server Error",
      scenario: "Bad Deployment Simulation (Rollout Failure)",
      desc: "The server encountered an unexpected internal error during the deployment rollout simulation.",
      serverDetail: detailStr || "Simulated bad deployment: checkout service failed",
      sentinelAlert: "Sentinel incident detected on /checkout. HTTP 5xx error rate spike logged.",
    };
  }

  // 2. HTTP 503 / Database or service failure
  if (
    status === 503 ||
    detailLower.includes("database") ||
    detailLower.includes("temporarily unavailable") ||
    detailLower.includes("postgres")
  ) {
    return {
      statusCode: 503,
      badgeText: "HTTP 503 · SERVICE UNAVAILABLE",
      title: "There was a Service Unavailable Error",
      scenario: "Database Connection Pool Failure (PostgreSQL Down)",
      desc: "The server is temporarily unable to handle the checkout request due to a database connection failure.",
      serverDetail: detailStr || "Checkout temporarily unavailable",
      sentinelAlert: "Sentinel incident detected on /checkout. Database health check failed.",
    };
  }

  // 3. HTTP 504 / Gateway Timeout / High CPU load
  if (
    status === 504 ||
    detailLower.includes("timeout") ||
    detailLower.includes("gateway")
  ) {
    return {
      statusCode: 504,
      badgeText: "HTTP 504 · GATEWAY TIMEOUT",
      title: "There was a Gateway Timeout Error",
      scenario: "Resource Exhaustion (High CPU Stress Simulation)",
      desc: "The upstream checkout service timed out while handling the transaction under heavy simulated load.",
      serverDetail: detailStr || "Gateway Timeout: upstream service did not respond in time",
      sentinelAlert: "Sentinel incident detected on /checkout. Latency threshold exceeded.",
    };
  }

  // 4. HTTP 400 / Insufficient stock / Bad Request
  if (
    status === 400 ||
    detailLower.includes("stock") ||
    detailLower.includes("inventory")
  ) {
    return {
      statusCode: 400,
      badgeText: "HTTP 400 · BAD REQUEST",
      title: "There was a Bad Request Error",
      scenario: "Inventory Constraint (Insufficient Stock)",
      desc: "The requested fragrance quantity exceeds currently available warehouse inventory stock.",
      serverDetail: detailStr || "Insufficient stock",
      sentinelAlert: "Sentinel telemetry recorded client validation constraint on /checkout.",
    };
  }

  // 5. HTTP 404 / Product Not Found
  if (status === 404 || detailLower.includes("not found")) {
    return {
      statusCode: 404,
      badgeText: "HTTP 404 · NOT FOUND",
      title: "There was a Not Found Error",
      scenario: "Product Catalog Mismatch (Item Not Found)",
      desc: "The selected fragrance could not be located in the catalog database.",
      serverDetail: detailStr || "Product not found",
      sentinelAlert: "Sentinel telemetry recorded missing catalog item on /checkout.",
    };
  }

  // 6. Network failure / Connection refused / Service container offline
  if (
    detailLower.includes("fetch") ||
    detailLower.includes("network") ||
    detailLower.includes("failed to fetch") ||
    status === 0
  ) {
    return {
      statusCode: 0,
      badgeText: "NETWORK ERROR · CONNECTION REFUSED",
      title: "There was a Connection Failure",
      scenario: "Service Offline / Container Stopped",
      desc: "Unable to reach the checkout API server. The container may be offline or restarting.",
      serverDetail: detailStr || "Failed to fetch from /api/checkout",
      sentinelAlert: "Sentinel incident detected on /checkout. Backend service unreachable.",
    };
  }

  // Fallback
  return {
    statusCode: status || 500,
    badgeText: status ? `HTTP ${status} · ERROR` : "SIMULATION ERROR",
    title: `There was an HTTP ${status || 500} Error`,
    scenario: "Automated Incident Simulation",
    desc: "An unexpected error occurred during the checkout transaction.",
    serverDetail: detailStr || "Checkout operation failed",
    sentinelAlert: "Sentinel incident detected on /checkout.",
  };
};

// ---------------------------------------------------------------------------
// MAIN APPLICATION COMPONENT
// ---------------------------------------------------------------------------

function App() {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState(new Set());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [emailInput, setEmailInput] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Load initial cart state or fallback
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("veloura_cart");
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("veloura_cart", JSON.stringify(cart));
    } catch {
      // fallback
    }
  }, [cart]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  const toggleWishlist = (id) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast("Removed from your wishlist");
      } else {
        next.add(id);
        showToast("Added to your wishlist ♥");
      }
      return next;
    });
  };

  const addToCart = (fragrance) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === fragrance.id);
      if (existing) {
        return prev.map((item) =>
          item.id === fragrance.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...fragrance, quantity: 1 }];
    });
    showToast(`${fragrance.name} added to your bag`);
    setIsCartOpen(true);
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const rawSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = discountApplied ? rawSubtotal * 0.20 : 0;
  const subtotal = rawSubtotal - discountAmount;
  const freeShippingThreshold = 75;
  const shipping = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 15;
  const finalTotal = subtotal > 0 ? subtotal + shipping : 0;

  // Real Sentinel / Backend Checkout Integration
  const handleCheckout = async () => {
    if (cart.length === 0 || isCheckingOut) return;

    setIsCheckingOut(true);
    setCheckoutError(null);
    setCheckoutSuccess(false);

    const successfulOrders = [];
    const successfulItemIds = [];

    // Supports older cart items saved in localStorage.
    const backendIds = {
      1: 101,
      2: 102,
      3: 103,
      4: 104,
      5: 105,
    };

    try {
      for (const item of cart) {
        let response;
        try {
          response = await fetch("/api/checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              product_id: item.backendProductId || backendIds[item.id],
              quantity: item.quantity,
              user_email: "guest@velouraparfums.com",
            }),
          });
        } catch (fetchErr) {
          const netErr = parseSimulationError(0, null, fetchErr);
          throw netErr;
        }

        let result = null;
        try {
          result = await response.json();
        } catch {
          result = null;
        }

        if (!response.ok) {
          const parsed = parseSimulationError(response.status, result, null);
          throw parsed;
        }

        successfulOrders.push(result);
        successfulItemIds.push(item.id);
      }

      setCart([]);
      setCheckoutSuccess(true);
      setCheckoutError(null);

      showToast(
        `Order placed successfully! Order IDs: ${successfulOrders
          .map((order) => order.order_id)
          .join(", ")}`
      );
    } catch (err) {
      console.error("Checkout execution error:", err);

      const formattedError =
        err && err.badgeText
          ? err
          : parseSimulationError(err?.status || 0, null, err);

      setCheckoutError(formattedError);

      // Remove only the items that were successfully ordered.
      setCart((current) =>
        current.filter(
          (item) => !successfulItemIds.includes(item.id)
        )
      );

      if (successfulOrders.length > 0) {
        showToast("Some items were ordered. Please review your remaining bag.");
      }
    } finally {
      setIsCheckingOut(false);
    }
  };

  const filteredFragrances = FRAGRANCES.filter((item) => {
    const matchesFilter = selectedFilter === "all" || item.category === selectedFilter;
    const matchesSearch =
      searchQuery.trim() === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="veloura-store">
      {/* Toast Notification */}
      {toastMessage && <div className="veloura-toast">{toastMessage}</div>}

      {/* ------------------------------------------------------------- */}
      {/* 1. TOP ANNOUNCEMENT BAR */}
      {/* ------------------------------------------------------------- */}
      <div className="top-announcement-bar">
        <div className="announcement-content">
          <span className="sparkle-icon">✦</span>
          <span>COMPLIMENTARY SHIPPING ON ORDERS OVER $75</span>
          <span className="pipe-sep">|</span>
          <span>SAMPLE EVERY ORDER</span>
          <span className="pipe-sep">|</span>
          <span>LUXURY GIFT WRAPPING</span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. NAVBAR */}
      {/* ------------------------------------------------------------- */}
      <header className="main-navbar">
        <div className="nav-container">
          {/* Left Navigation */}
          <nav className="nav-left">
            <a href="#fragrances" className="nav-link">
              SHOP <span className="caret-down">▾</span>
            </a>
            <a href="#collections" className="nav-link">
              COLLECTIONS
            </a>
            <a href="#fragrances" className="nav-link">
              BESTSELLERS
            </a>
          </nav>

          {/* Center Brand Identity */}
          <div className="nav-center-brand">
            <a href="#" className="brand-logo-group">
              <span className="brand-title">Veloura</span>
              <span className="brand-subtitle">PARFUMS</span>
            </a>
          </div>

          {/* Right Navigation & Utility Icons */}
          <div className="nav-right">
            <nav className="nav-links-right">
              <a href="#story" className="nav-link">ABOUT</a>
              <a href="#reviews" className="nav-link">JOURNAL</a>
              <a href="#footer" className="nav-link">CONTACT</a>
            </nav>

            <div className="nav-icons-group">
              {/* Profile Icon */}
              <button className="icon-btn" aria-label="Customer Account">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>

              {/* Search Toggle Icon */}
              <button
                className="icon-btn"
                aria-label="Search Fragrances"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>

              {/* Shopping Bag Button */}
              <button
                className="icon-btn bag-btn"
                aria-label="Open Shopping Bag"
                onClick={() => setIsCartOpen(true)}
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <span className="bag-count-badge">{cartCount}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Search Input Bar */}
        {searchOpen && (
          <div className="nav-search-bar">
            <input
              type="text"
              placeholder="Search fragrances, concentrations, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery("")}>
                ✕
              </button>
            )}
          </div>
        )}
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 3. HERO SECTION */}
      {/* ------------------------------------------------------------- */}
      <section className="hero-section">
        <div className="hero-container">
          {/* Left Hero Content */}
          <div className="hero-text-column">
            <span className="hero-eyebrow">CRAFTED TO CAPTIVATE</span>
            <h1 className="hero-heading">
              Scents that<br />
              <span className="hero-italic-title">leave a legacy.</span>
            </h1>
            <p className="hero-description">
              Veloura Parfums creates timeless fragrances that celebrate elegance, femininity, and
              unforgettable presence.
            </p>

            <div className="hero-cta-wrapper">
              <a href="#fragrances" className="hero-primary-pill-btn">
                DISCOVER THE COLLECTION
              </a>
            </div>

            {/* 4 Feature Badges Row */}
            <div className="hero-features-row">
              <div className="feature-item">
                <div className="feature-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                  </svg>
                </div>
                <div className="feature-text">
                  <span className="feature-title">CLEAN</span>
                  <span className="feature-sub">INGREDIENTS</span>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div className="feature-text">
                  <span className="feature-title">LONG LASTING</span>
                  <span className="feature-sub">PERFORMANCE</span>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div className="feature-text">
                  <span className="feature-title">MADE IN</span>
                  <span className="feature-sub">FRANCE</span>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <polyline points="20 12 20 22 4 22 4 12" />
                    <rect x="2" y="7" width="20" height="5" />
                    <line x1="12" y1="22" x2="12" y2="7" />
                    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                  </svg>
                </div>
                <div className="feature-text">
                  <span className="feature-title">LUXURY</span>
                  <span className="feature-sub">PACKAGING</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Hero Visual (Exact mirror of reference image vanity) */}
          <div className="hero-visual-column">
            <div className="vanity-scene-card">
              <img
                src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1200&q=85"
                alt="Veloura Parfums Luxury Vanity Trio"
                className="vanity-backdrop-img"
              />
              <div className="vanity-overlay-glow"></div>

              {/* Realistic Floating Interactive Bottles matching the screenshot */}
              <div className="vanity-flacon-display">
                <div className="vanity-bottle-slot slot-rose-noir" onClick={() => addToCart(FRAGRANCES[1])}>
                  <BottleRoseNoir />
                  <span className="hover-flacon-tag">ROSE NOIR</span>
                </div>
                <div className="vanity-bottle-slot slot-lamour" onClick={() => addToCart(FRAGRANCES[0])}>
                  <BottleLAmour />
                  <span className="hover-flacon-tag">L'AMOUR</span>
                </div>
                <div className="vanity-bottle-slot slot-lumiere" onClick={() => addToCart(FRAGRANCES[2])}>
                  <BottleLumiere />
                  <span className="hover-flacon-tag">EAU DE LUMIÈRE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. SHOP BY COLLECTION */}
      {/* ------------------------------------------------------------- */}
      <section className="collections-section" id="collections">
        <div className="section-title-wrap">
          <h2 className="section-serif-title">SHOP BY COLLECTION</h2>
          <div className="gold-ornament-line">
            <span className="line-arm"></span>
            <span className="diamond-node">◆</span>
            <span className="line-arm"></span>
          </div>
        </div>

        <div className="collections-grid">
          {COLLECTIONS.map((col) => (
            <div
              key={col.id}
              className={`collection-card ${col.bgClass}`}
              onClick={() => {
                setSelectedFilter(col.id);
                document.getElementById("fragrances")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <img src={col.img} alt={col.title} className="collection-card-img" />
              <div className="collection-card-overlay">
                <h3 className="collection-title">{col.title}</h3>
                <p className="collection-desc">{col.description}</p>
                <button className="collection-shop-btn">SHOP NOW</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. FEATURED FRAGRANCES */}
      {/* ------------------------------------------------------------- */}
      <section className="featured-section" id="fragrances">
        <div className="section-title-wrap">
          <h2 className="section-serif-title">FEATURED FRAGRANCES</h2>
          <div className="gold-ornament-line">
            <span className="line-arm"></span>
            <span className="diamond-node">◆</span>
            <span className="line-arm"></span>
          </div>
        </div>

        {/* Collection Category Filter Pills */}
        <div className="category-filter-tabs">
          {["all", "floral", "sensual", "fresh", "exclusive"].map((filter) => (
            <button
              key={filter}
              className={`filter-pill ${selectedFilter === filter ? "active" : ""}`}
              onClick={() => setSelectedFilter(filter)}
            >
              {filter.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Product Cards Row (5 Bottles) */}
        <div className="fragrance-cards-container">
          {filteredFragrances.map((fragrance) => {
            const BottleComponent = fragrance.bottleComponent;
            const isWishlisted = wishlist.has(fragrance.id);

            return (
              <div key={fragrance.id} className="fragrance-card">
                {/* Wishlist Heart Toggle */}
                <button
                  className={`card-wishlist-btn ${isWishlisted ? "wishlisted" : ""}`}
                  aria-label="Save to Wishlist"
                  onClick={() => toggleWishlist(fragrance.id)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={isWishlisted ? "#8b182b" : "none"} stroke="#8b182b" strokeWidth="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>

                {/* Bottle Display Area */}
                <div className="bottle-stage">
                  <BottleComponent />
                </div>

                {/* Product Metadata */}
                <div className="card-info">
                  <h3 className="card-product-name">{fragrance.name}</h3>
                  <span className="card-concentration">{fragrance.subtitle}</span>
                  <div className="card-price">${fragrance.price.toFixed(2)}</div>
                </div>

                {/* Add to Cart CTA */}
                <button
                  className="card-add-btn"
                  onClick={() => addToCart(fragrance)}
                >
                  ADD TO CART
                </button>
              </div>
            );
          })}
        </div>

        <div className="view-all-wrap">
          <a href="#fragrances" className="view-all-link" onClick={() => setSelectedFilter("all")}>
            VIEW ALL FRAGRANCES &nbsp;›
          </a>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. OUR STORY / HERITAGE SECTION */}
      {/* ------------------------------------------------------------- */}
      <section className="heritage-story-section" id="story">
        <div className="heritage-grid">
          {/* Left Column Text & Values */}
          <div className="heritage-text-side">
            <span className="heritage-eyebrow">OUR STORY</span>
            <h2 className="heritage-heading">
              The art of fine fragrance<br />is our heritage.
            </h2>
            <p className="heritage-copy">
              At Veloura Parfums, every scent is a work of art—meticulously crafted in France using
              the world's finest ingredients. We believe in timeless elegance, sustainable luxury,
              and the emotion that only a signature scent can evoke.
            </p>

            <div className="heritage-cta">
              <a href="#collections" className="heritage-pill-btn">
                DISCOVER OUR CRAFT
              </a>
            </div>

            {/* 4 Pillars */}
            <div className="heritage-pillars-grid">
              <div className="pillar-item">
                <div className="pillar-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div>
                  <h4 className="pillar-heading">FINEST INGREDIENTS</h4>
                  <p className="pillar-sub">Sourced responsibly from around the world</p>
                </div>
              </div>

              <div className="pillar-item">
                <div className="pillar-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                    <path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0" />
                  </svg>
                </div>
                <div>
                  <h4 className="pillar-heading">EXPERT ARTISANS</h4>
                  <p className="pillar-sub">Blended by master perfumers in France</p>
                </div>
              </div>

              <div className="pillar-item">
                <div className="pillar-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                    <path d="M2 12h20" />
                  </svg>
                </div>
                <div>
                  <h4 className="pillar-heading">SUSTAINABLE LUXURY</h4>
                  <p className="pillar-sub">Eco-conscious choices for a better tomorrow</p>
                </div>
              </div>

              <div className="pillar-item">
                <div className="pillar-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 14 14" />
                  </svg>
                </div>
                <div>
                  <h4 className="pillar-heading">TIMELESS QUALITY</h4>
                  <p className="pillar-sub">Made to be treasured for generations</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Still Life Scene */}
          <div className="heritage-visual-side">
            <div className="heritage-scene-card">
              <img
                src="https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=900&q=85"
                alt="Veloura Parfums Heritage Craftsmanship"
                className="heritage-photo"
              />
              <div className="heritage-still-flacon">
                <BottleRoseNoir />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 7. 20% OFF SALE BANNER */}
      {/* ------------------------------------------------------------- */}
      <section className="promo-sale-banner">
        <div className="promo-banner-inner">
          <div className="promo-discount-num">20<span>%<br /><small>OFF</small></span></div>
          <div className="promo-text-middle">
            <h3 className="promo-title">Because you deserve something exquisite.</h3>
            <p className="promo-sub">Enjoy 20% off your order for a limited time only.</p>
          </div>
          <div className="promo-cta-side">
            <button
              className="promo-shop-sale-btn"
              onClick={() => {
                setDiscountApplied(true);
                showToast("20% discount code VELOURA20 applied!");
                setIsCartOpen(true);
              }}
            >
              SHOP THE SALE
            </button>
          </div>
          <div className="promo-filigree-bg">
            <svg width="180" height="120" viewBox="0 0 100 100" fill="none" stroke="#681e2e" strokeWidth="0.8">
              <path d="M50 0 C60 30 80 40 100 50 C80 60 60 70 50 100 C40 70 20 60 0 50 C20 40 40 30 50 0 Z" />
              <circle cx="50" cy="50" r="16" />
              <circle cx="50" cy="50" r="32" strokeDasharray="2 3" />
            </svg>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 8. LOVED BY OUR CLIENTS */}
      {/* ------------------------------------------------------------- */}
      <section className="testimonials-section" id="reviews">
        <div className="section-title-wrap">
          <h2 className="section-serif-title">LOVED BY OUR CLIENTS</h2>
          <div className="gold-ornament-line">
            <span className="line-arm"></span>
            <span className="diamond-node">◆</span>
            <span className="line-arm"></span>
          </div>
        </div>

        <div className="testimonials-slider-row">
          <button
            className="slider-nav-arrow arrow-prev"
            aria-label="Previous Testimonial"
            onClick={() => setActiveReviewIndex((prev) => (prev > 0 ? prev - 1 : REVIEWS.length - 1))}
          >
            ‹
          </button>

          <div className="testimonials-grid">
            {REVIEWS.map((review, idx) => (
              <div
                key={review.id}
                className={`testimonial-card ${activeReviewIndex === idx ? "highlighted" : ""}`}
              >
                <div className="quote-and-stars">
                  <span className="quote-mark">“</span>
                  <div className="star-rating">★★★★★</div>
                </div>

                <p className="testimonial-text">"{review.quote}"</p>

                <div className="testimonial-author-row">
                  <img src={review.avatar} alt={review.name} className="author-avatar" />
                  <div className="author-meta">
                    <h5 className="author-name">{review.name}</h5>
                    <span className="author-badge">{review.verified}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            className="slider-nav-arrow arrow-next"
            aria-label="Next Testimonial"
            onClick={() => setActiveReviewIndex((prev) => (prev + 1) % REVIEWS.length)}
          >
            ›
          </button>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 9. NEWSLETTER SUBSCRIPTION STRIP */}
      {/* ------------------------------------------------------------- */}
      <section className="newsletter-section">
        <div className="newsletter-card-inner">
          <div className="newsletter-botanical-art">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#d48c9a" strokeWidth="1.2">
              <path d="M12 2C6.5 2 2 6.5 2 12c0 3 1.5 6 4 8 2.5-4 4-8 6-8s3.5 4 6 8c2.5-2 4-5 4-8 0-5.5-4.5-10-10-10z" />
            </svg>
          </div>

          <div className="newsletter-copy">
            <h3 className="newsletter-title">Stay inspired & be the first to know</h3>
            <p className="newsletter-sub">Exclusive offers, new arrivals, and fragrance stories.</p>
          </div>

          <form
            className="newsletter-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (emailInput.includes("@")) {
                setNewsletterSubscribed(true);
                showToast("Welcome to the Veloura Circle!");
                setEmailInput("");
              }
            }}
          >
            <input
              type="email"
              placeholder="Enter your email address"
              className="newsletter-input"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              required
            />
            <button type="submit" className="newsletter-submit-btn">
              {newsletterSubscribed ? "SUBSCRIBED" : "SIGN ME UP"}
            </button>
          </form>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 10. LUXURY FOOTER */}
      {/* ------------------------------------------------------------- */}
      <footer className="veloura-footer" id="footer">
        <div className="footer-top-columns">
          {/* Brand & Socials */}
          <div className="footer-brand-column">
            <span className="footer-logo-title">Veloura</span>
            <span className="footer-logo-sub">PARFUMS</span>
            <p className="footer-tagline">
              Timeless fragrances.<br />Unforgettable you.
            </p>
            <div className="footer-social-icons">
              <a href="#instagram" aria-label="Instagram">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
              </a>
              <a href="#facebook" aria-label="Facebook">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
              </a>
              <a href="#pinterest" aria-label="Pinterest">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="10" /><path d="M8 12c.5-1.5 2-2 3.5-2 2 0 3.5 1 3.5 3 0 2-1 3.5-2.5 3.5-.8 0-1.5-.4-1.8-1L10 19" /></svg>
              </a>
              <a href="#tiktok" aria-label="TikTok">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
              </a>
            </div>
          </div>

          {/* Nav Links: SHOP */}
          <div className="footer-col">
            <h4 className="footer-col-header">SHOP</h4>
            <ul className="footer-links">
              <li><a href="#fragrances">All Fragrances</a></li>
              <li><a href="#fragrances">Bestsellers</a></li>
              <li><a href="#collections">Gift Sets</a></li>
              <li><a href="#fragrances">Travel Sprays</a></li>
              <li><a href="#collections">Sale</a></li>
            </ul>
          </div>

          {/* Nav Links: COLLECTIONS */}
          <div className="footer-col">
            <h4 className="footer-col-header">COLLECTIONS</h4>
            <ul className="footer-links">
              <li><a href="#collections" onClick={() => setSelectedFilter("floral")}>Floral Bouquets</a></li>
              <li><a href="#collections" onClick={() => setSelectedFilter("sensual")}>Warm & Sensual</a></li>
              <li><a href="#collections" onClick={() => setSelectedFilter("fresh")}>Fresh & Radiant</a></li>
              <li><a href="#collections" onClick={() => setSelectedFilter("exclusive")}>Exclusive Collection</a></li>
            </ul>
          </div>

          {/* Nav Links: CUSTOMER CARE */}
          <div className="footer-col">
            <h4 className="footer-col-header">CUSTOMER CARE</h4>
            <ul className="footer-links">
              <li><a href="#shipping">Shipping & Delivery</a></li>
              <li><a href="#returns">Returns & Exchanges</a></li>
              <li><a href="#faqs">FAQs</a></li>
              <li><a href="#contact">Contact Us</a></li>
            </ul>
          </div>

          {/* Nav Links: ABOUT */}
          <div className="footer-col">
            <h4 className="footer-col-header">ABOUT</h4>
            <ul className="footer-links">
              <li><a href="#story">Our Story</a></li>
              <li><a href="#story">Ingredients</a></li>
              <li><a href="#story">Craftsmanship</a></li>
              <li><a href="#story">Sustainability</a></li>
            </ul>
          </div>

          {/* Trust Badges Column */}
          <div className="footer-trust-column">
            <div className="trust-card">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              <div>
                <strong>COMPLIMENTARY SHIPPING</strong>
                <small>On orders over $75</small>
              </div>
            </div>

            <div className="trust-card">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              <div>
                <strong>EASY RETURNS</strong>
                <small>30-day return policy</small>
              </div>
            </div>

            <div className="trust-card">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <div>
                <strong>SECURE PAYMENTS</strong>
                <small>Shop with confidence</small>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom-bar">
          <p>© 2025 Veloura Parfums. All rights reserved.</p>
          <div className="footer-legal-links">
            <a href="#privacy">Privacy Policy</a>
            <span>|</span>
            <a href="#terms">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* ------------------------------------------------------------- */}
      {/* 11. LUXURY SLIDE-OUT SHOPPING BAG DRAWER */}
      {/* ------------------------------------------------------------- */}
      {isCartOpen && (
        <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="drawer-header">
              <div className="drawer-title-group">
                <h3 className="drawer-title">YOUR SHOPPING BAG</h3>
                <span className="drawer-count">({cartCount} items)</span>
              </div>
              <button
                className="drawer-close-btn"
                aria-label="Close Bag"
                onClick={() => setIsCartOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Free Shipping Tracker */}
            <div className="shipping-progress-banner">
              {subtotal >= freeShippingThreshold ? (
                <span>You've unlocked <strong>Complimentary Shipping!</strong></span>
              ) : (
                <span>
                  Add <strong>${(freeShippingThreshold - subtotal).toFixed(2)}</strong> more for Complimentary Shipping
                </span>
              )}
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Cart Body */}
            <div className="drawer-items-list">
              {cart.length === 0 ? (
                <div className="empty-drawer">
                  <div className="empty-drawer-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d48c9a" strokeWidth="1.2">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </div>
                  <h4>Your shopping bag is empty</h4>
                  <p>Discover our timeless fragrances and find your signature scent.</p>
                  <button
                    className="explore-fragrances-btn"
                    onClick={() => {
                      setIsCartOpen(false);
                      document.getElementById("fragrances")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    EXPLORE FRAGRANCES
                  </button>
                </div>
              ) : (
                cart.map((item) => {
                  const BottleComp = item.bottleComponent || BottleLAmour;
                  return (
                    <div key={item.id} className="drawer-cart-item">
                      <div className="item-thumbnail">
                        <BottleComp />
                      </div>
                      <div className="item-details">
                        <h4 className="item-name">{item.name}</h4>
                        <span className="item-conc">{item.subtitle}</span>
                        <div className="item-price">${item.price.toFixed(2)}</div>

                        <div className="item-qty-row">
                          <div className="qty-stepper">
                            <button onClick={() => updateQuantity(item.id, -1)}>−</button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                          </div>
                          <button
                            className="item-remove-btn"
                            onClick={() => updateQuantity(item.id, -item.quantity)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Drawer Footer & Checkout */}
            {cart.length > 0 && (
              <div className="drawer-footer">
                {/* Coupon Code Strip */}
                <div className="drawer-promo-code">
                  <button
                    className="apply-20-code"
                    onClick={() => {
                      setDiscountApplied(true);
                      showToast("20% discount code applied!");
                    }}
                  >
                    {discountApplied ? "✓ 20% SALE APPLIED" : "Apply 20% OFF (VELOURA20)"}
                  </button>
                </div>

                <div className="subtotal-breakdown">
                  <div className="breakdown-row">
                    <span>Subtotal</span>
                    <span>${rawSubtotal.toFixed(2)}</span>
                  </div>
                  {discountApplied && (
                    <div className="breakdown-row discount-row">
                      <span>20% Promotional Discount</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="breakdown-row">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="breakdown-row final-total-row">
                    <strong>Total</strong>
                    <strong>${finalTotal.toFixed(2)}</strong>
                  </div>
                </div>

                {/* Concise Checkout Error notification */}
                {checkoutError && (
                  <div className="concise-alert-card error" role="alert">
                    <div className="concise-alert-header">
                      <span className="concise-status-tag">
                        {checkoutError.badgeText || "SIMULATION ERROR"}
                      </span>
                      <button
                        type="button"
                        className="concise-dismiss-btn"
                        onClick={() => setCheckoutError(null)}
                        title="Dismiss notification"
                        aria-label="Dismiss error"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="concise-alert-title">
                      {checkoutError.title || "Checkout Simulation Error"}
                    </div>

                    <div className="concise-scenario-row">
                      <span className="concise-scenario-label">Simulated Scenario:</span>{" "}
                      <span className="concise-scenario-value">
                        {checkoutError.scenario || "Incident Simulation Active"}
                      </span>
                    </div>

                    <p className="concise-alert-desc">
                      {checkoutError.desc || "The server encountered an error during checkout."}
                    </p>

                    {checkoutError.serverDetail && (
                      <div className="concise-response-row">
                        <span className="concise-response-label">SERVER RESPONSE:</span>
                        <code className="concise-response-code">
                          "{checkoutError.serverDetail}"
                        </code>
                      </div>
                    )}

                    <div className="concise-sentinel-note">
                      {checkoutError.sentinelAlert || "Sentinel incident detected on /checkout."}
                    </div>
                  </div>
                )}

                {/* Concise Checkout Success notification */}
                {checkoutSuccess && (
                  <div className="concise-alert-card success" role="status">
                    <div className="concise-alert-header">
                      <span className="concise-status-tag success">ORDER CONFIRMED</span>
                      <button
                        type="button"
                        className="concise-dismiss-btn"
                        onClick={() => setCheckoutSuccess(false)}
                        title="Dismiss notification"
                        aria-label="Dismiss message"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="concise-alert-title">
                      Order Placed Successfully
                    </div>

                    <p className="concise-alert-desc">
                      Your fragrance order has been received and confirmed. Sentinel telemetry indicates normal checkout operation.
                    </p>
                  </div>
                )}

                <button
                  className="drawer-checkout-btn"
                  disabled={isCheckingOut}
                  onClick={handleCheckout}
                >
                  {isCheckingOut ? "PROCESSING..." : `CHECKOUT • $${finalTotal.toFixed(2)}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
