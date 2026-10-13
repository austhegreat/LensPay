// Mock catalogue, brand bounties, camera scenes and pricing rules. All money is MYR.

export const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'brands', label: 'Brands & Food (Customer Proof)' },
  { key: 'auto', label: 'Automotive' },
  { key: 'street', label: 'Street Life' },
  { key: 'nature', label: 'Nature' },
  { key: 'breaking', label: 'Breaking News' },
];

export const CAT_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.key, c.label]));

export const CAT_ICON = {
  auto: 'car-sport',
  brands: 'fast-food',
  street: 'storefront',
  nature: 'leaf',
  breaking: 'warning',
};

export const CAT_TAGS = {
  auto: ['#Automotive', '#Unfiltered'],
  brands: ['#RealCustomerProof', '#AuthenticReview', '#Unfiltered'],
  street: ['#StreetCulture', '#Unfiltered'],
  nature: ['#Nature', '#Unfiltered'],
  breaking: ['#BreakingNews', '#Unfiltered'],
};

export const ALL_TAGS = [
  '#Unfiltered',
  '#AuthenticReview',
  '#Automotive',
  '#StreetCulture',
  '#RealCustomerProof',
  '#Nature',
  '#BreakingNews',
  '#NoAI',
];

// Economics
export const PLATFORM_FEE = 0.15; // consumer license sales
export const BOUNTY_FEE = 0.2; // brand bounty facilitation fee
export const WALLET_START = 127.5;
export const CAPTURES_START = 8;
export const SALES_START = 4;
export const EARNED_START = 245;

export const rm = (n) => `RM ${Number(n).toFixed(2)}`;

export function splitAmount(amount, fee = PLATFORM_FEE) {
  const platform = +(amount * fee).toFixed(2);
  return { gross: amount, platform, payout: +(amount - platform).toFixed(2) };
}

// Price estimator: rarity and demand are 0-100 slider values.
// Context quality is derived from the remark length and tag count.
export function estimatePrice({ rarity, demand, remarkLen, tagCount }) {
  const contextQ = Math.min(
    100,
    (Math.min(remarkLen, 240) / 240) * 80 + Math.min(tagCount, 2) * 10
  );
  const score = rarity * 0.4 + demand * 0.35 + contextQ * 0.25;

  if (score < 40) {
    return {
      score, contextQ, tier: 'Micro-Editorial / Social Proof', min: 15, max: 35,
      suggested: Math.round(15 + (score / 40) * 20),
    };
  }
  if (score < 75) {
    return {
      score, contextQ, tier: 'Commercial Brand Usage', min: 50, max: 120,
      suggested: Math.round(50 + ((score - 40) / 35) * 70),
    };
  }
  return {
    score, contextQ, tier: 'Exclusive Rights', min: 250, max: null,
    suggested: Math.round(250 + ((score - 75) / 25) * 250),
  };
}

export const PRICE_TIERS = [
  { name: 'Micro-Editorial / Social Proof', range: 'RM 15 – RM 35', key: 'micro' },
  { name: 'Commercial Brand Usage', range: 'RM 50 – RM 120', key: 'commercial' },
  { name: 'Exclusive Rights', range: 'RM 250+', key: 'exclusive' },
];

// Brand bounties (simulated brand demand)
export const BOUNTIES = [
  {
    id: 'b1',
    brand: "McDonald's Malaysia",
    brief: 'Real-world photos of the new menu items across outlets. Show the food as served, not as advertised.',
    reward: 40,
    slots: 12,
    deadline: 'Fri, 11:59 PM',
  },
  {
    id: 'b2',
    brand: 'Starbucks Malaysia',
    brief: 'Queue-time evidence at outlets during the morning rush. Time and place must be visible in the frame.',
    reward: 30,
    slots: 8,
    deadline: 'Sun, 9:00 PM',
  },
  {
    id: 'b3',
    brand: 'Demo Auto Dealer Group',
    brief: 'Honest condition shots of used-car lots. No staged angles, no retouching, no generated imagery.',
    reward: 55,
    slots: 5,
    deadline: 'Mon, 6:00 PM',
  },
];

// Camera scenes used by the simulated viewfinder (also the fallback on web and simulators)
export const SCENES = [
  {
    key: 'bmw',
    label: 'BMW M4 · Downtown KL',
    icon: 'car-sport',
    colors: ['#0F2233', '#1F4E6B'],
    seed: {
      title: 'BMW M4 in Downtown KL',
      cat: 'auto',
      location: 'Downtown KL',
      remark: 'Parked outside Jalan Sultan Ismail after the rain stopped. Wet asphalt reflections, untouched paint, and a parking ticket still tucked under the wiper.',
      tags: ['#Automotive', '#Unfiltered'],
    },
  },
  {
    key: 'mcd',
    label: "McDonald's Double Cheeseburger",
    icon: 'fast-food',
    colors: ['#3B1212', '#7A2A1C'],
    seed: {
      title: 'Double Cheeseburger Combo, 1:30 AM',
      cat: 'brands',
      location: "McDonald's Bukit Bintang",
      remark: "Ordered the double cheeseburger combo at McDonald's Bukit Bintang at 1:30 AM. Bun perfectly toasted, zero sogginess, fries still hot.",
      tags: ['#RealCustomerProof', '#Unfiltered'],
    },
  },
  {
    key: 'street',
    label: 'Jalan Alor Night',
    icon: 'storefront',
    colors: ['#1B1030', '#3D2160'],
    seed: {
      title: 'Jalan Alor Night Stalls',
      cat: 'street',
      location: 'Jalan Alor, KL',
      remark: 'Hawker smoke drifting under the Jalan Alor lights at 10 PM. Every stall in frame is real and unstaged, shot handheld.',
      tags: ['#StreetCulture', '#Unfiltered'],
    },
  },
  {
    key: 'nature',
    label: 'Sunrise at Bako',
    icon: 'leaf',
    colors: ['#0C2A1F', '#1F5C44'],
    seed: {
      title: 'Mist Over Bako',
      cat: 'nature',
      location: 'Bako National Park, Sarawak',
      remark: 'Fog lifting off the cliffs at Bako at 6:10 AM. Only one other hiker on the trail, no drone shots, no filters.',
      tags: ['#Nature', '#Unfiltered'],
    },
  },
  {
    key: 'breaking',
    label: 'Klang River Flood Line',
    icon: 'warning',
    colors: ['#1A2433', '#34506E'],
    seed: {
      title: 'Flood Line at Klang River',
      cat: 'breaking',
      location: 'Klang, Selangor',
      remark: 'Water mark on a shophouse wall near the river, about waist height. Photographed before the pumps arrived, with the date visible on the shutter.',
      tags: ['#BreakingNews', '#Unfiltered'],
    },
  },
];

const meta = (sha, device, time, geo) => ({ sha, device, time, geo });

// Seed marketplace listings
export const SEED_PHOTOS = [
  {
    id: 'p1', title: 'BMW E36 M3 in Bangsar', handle: '@hafiz.drives', cat: 'auto', location: 'Bangsar, KL',
    remark: 'Spotted this rare 1998 BMW E36 M3 in Bangsar with original factory BBS wheels and unrestored paint. The owner says the clear coat has never been polished.',
    tags: ['#Automotive', '#Unfiltered'], price: 48, colors: ['#0F2233', '#1F4E6B'], sold: 3, verified: true,
    meta: meta('0x7f4a...89c1', 'iPhone 15 Pro Max', '2026-10-10T11:20:00Z', '3.1177° N, 101.6718° E'),
  },
  {
    id: 'p2', title: 'Double Cheeseburger, 1:30 AM', handle: '@amir_eats', cat: 'brands', location: "McDonald's Bukit Bintang",
    remark: "Ordered the double cheeseburger combo at McDonald's Bukit Bintang at 1:30 AM. Bun perfectly toasted, zero sogginess, nothing like the poster.",
    tags: ['#RealCustomerProof', '#Unfiltered'], price: 35, colors: ['#3B1212', '#7A2A1C'], sold: 6, verified: true,
    meta: meta('0x2be9...10d4', 'iPhone 14', '2026-10-11T17:35:00Z', '3.1427° N, 101.7106° E'),
  },
  {
    id: 'p3', title: 'Starbucks Queue, 7:12 AM', handle: '@mei_cafe', cat: 'brands', location: 'Pavilion KL',
    remark: 'Queue wrapped past the escalator at 7:12 AM on a Monday. Counted 23 people before I stopped counting. Real staff, real cups, no staging.',
    tags: ['#RealCustomerProof', '#AuthenticReview'], price: 18, colors: ['#0D2A22', '#174F3E'], sold: 2, verified: true,
    meta: meta('0x9c10...f3a7', 'Pixel 8 Pro', '2026-10-12T23:12:00Z', '3.1490° N, 101.7135° E'),
  },
  {
    id: 'p4', title: 'Jalan Alor Night Stalls', handle: '@kenji_street', cat: 'street', location: 'Jalan Alor, KL',
    remark: 'Hawker smoke drifting under the Jalan Alor lights at 10 PM. Shot handheld, no tripod, no staging. The steam is what the night actually looked like.',
    tags: ['#StreetCulture', '#Unfiltered'], price: 28, colors: ['#1B1030', '#3D2160'], sold: 5, verified: true,
    meta: meta('0x51d8...e0b2', 'iPhone 15 Pro Max', '2026-10-09T14:05:00Z', '3.1456° N, 101.7097° E'),
  },
  {
    id: 'p5', title: 'Mist Over Bako', handle: '@nadirah_lens', cat: 'nature', location: 'Bako National Park, Sarawak',
    remark: 'Fog lifting off the cliffs at Bako at 6:10 AM. Only one other hiker on the trail, no drone shots, no filters, and the mud on my boots is real.',
    tags: ['#Nature', '#NoAI'], price: 65, colors: ['#0C2A1F', '#1F5C44'], sold: 1, verified: true,
    meta: meta('0x3e77...a5f0', 'iPhone 15', '2026-10-08T22:50:00Z', '1.6410° N, 110.4620° E'),
  },
  {
    id: 'p6', title: 'Flood Line at Klang River', handle: '@linh_photo', cat: 'breaking', location: 'Klang, Selangor',
    remark: 'Water mark on a shophouse wall near the river, about waist height. Photographed before the pumps arrived, with the date visible on the shutter.',
    tags: ['#BreakingNews', '#Unfiltered'], price: 70, colors: ['#1A2433', '#34506E'], sold: 2, verified: true,
    meta: meta('0xb4c2...6d19', 'Pixel 8 Pro', '2026-10-11T08:30:00Z', '3.0333° N, 101.4450° E'),
  },
  {
    id: 'p7', title: 'Used Car Lot, Shah Alam', handle: '@zack_motion', cat: 'auto', location: 'Shah Alam, Selangor',
    remark: 'Honest condition shot of a 2019 hatchback on a dealer lot. Visible door dent and faded rear bumper left in frame on purpose. No retouching.',
    tags: ['#Automotive', '#AuthenticReview'], price: 40, colors: ['#15202E', '#2B3F5A'], sold: 0, verified: true,
    meta: meta('0x0a6f...2c88', 'iPhone 15 Pro Max', '2026-10-12T10:02:00Z', '3.0738° N, 101.5183° E'),
  },
  {
    id: 'p8', title: 'Little India Chai at Dawn', handle: '@priya_streets', cat: 'street', location: 'Brickfields, KL',
    remark: 'Chai being poured from height at the stall in Brickfields before the sun is up. The cup on the left is my own, bought with my own money.',
    tags: ['#StreetCulture', '#Unfiltered'], price: 22, colors: ['#1E1A1A', '#3A2020'], sold: 4, verified: true,
    meta: meta('0x6d21...f9e4', 'iPhone 14', '2026-10-07T23:40:00Z', '3.1287° N, 101.6868° E'),
  },
];

export const SEED_TXS = [
  { id: 't1', type: 'sale', title: 'Mist Over Bako', party: '@sofie_d', amount: 58.5, time: 'Yesterday' },
  { id: 't2', type: 'bounty', title: "Bounty · McDonald's Malaysia", party: "McDonald's Malaysia", amount: 32, time: '2 days ago' },
  { id: 't3', type: 'withdraw', title: 'DuitNow transfer', party: 'Your bank account', amount: -80, time: '3 days ago' },
];
