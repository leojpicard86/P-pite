// Single source of truth for every figure shown or spoken in the pitch.
// Each block says where it comes from. Nothing here is invented: unverified or
// estimated items carry a `status` so the UI can label them honestly.

export type Status = 'plan' | 'reported' | 'team-estimate' | 'extrapolation';

export const SOURCES = {
  bmc: 'Business_Model_Canvas_Pepite_EN.pdf',
  plan: 'Plan_de_financement_Pepite_trame_BGE_complete.pdf',
  dem: 'Demonter_une_evidence_Pepite.pdf',
  mat: 'Matrice_impact_faisabilite_Pepite.pdf',
  swot: 'SWOT_Pepite.pdf',
  mkt: 'Tableaux_Etude_de_marche_Pepite.xlsx',
  fcs: 'Facteurs_cles_de_succes_Pepite.xlsx',
  per: 'Donnees_Persona_Pepite_2.xlsx',
  deck: 'P_pite_pitch_deck_1.pptx'
} as const;

/* ---------------------------------------------------------------- finance */
export const finance = {
  src: `${SOURCES.plan}, tables 1 and 2 (provisional BGE plan, SAS, IS)`,
  status: 'plan' as Status,
  uses: [
    { key: 'setup', label: 'Fit-out & equipment (excl. VAT)', value: 18800 },
    { key: 'vat', label: 'VAT on fixed assets', value: 3160 },
    { key: 'stock', label: 'Initial stock', value: 5000 },
    { key: 'cash', label: 'Starting cash reserve', value: 7500 }
  ],
  totalUses: 34460,
  personal: 5000,
  loan: 29460,
  // Ending cash balances. Prudent and optimistic are only given at month 3 and 6.
  scenarios: {
    prudent: { m3: 2306, m6: -2644 },
    central: { m3: 3561, m6: 207 },
    optimistic: { m3: 5026, m6: 3758 }
  },
  startCash: 7500,
  // Central scenario, month by month (table 2).
  monthly: {
    revenue: [2000, 2200, 2420, 2660, 2920, 3220],
    opex: [3263, 3362, 3471, 3590, 3718, 3867],
    interest: [98, 97, 96, 95, 94, 93],
    repayment: [304, 305, 307, 308, 309, 310],
    vat: [0, 215, 248, 285, 325, 368],
    balance: [-1263, -1377, -1299, -1215, -1123, -1015],
    cumulative: [6237, 4860, 3561, 2346, 1223, 207]
  },
  cumulativeRevenue6m: { prudent: 9306, central: 15420, optimistic: 23342 }
};

/** Our own straight-line projection of month 7. NOT part of the BGE plan. */
export function extrapolateMonth7() {
  const b = finance.monthly.balance;
  const slope = (b[5] - b[0]) / 5; // average monthly change of the monthly balance
  const balance = Math.round(b[5] + slope);
  const cash = finance.monthly.cumulative[5] + balance;
  return { balance, cash, status: 'extrapolation' as Status };
}

/* ----------------------------------------------------------------- market */
export const market = {
  src: `${SOURCES.mkt}, tab "Pestel" (items C, E, H); ${SOURCES.swot}`,
  status: 'reported' as Status,
  secondHandBn2024: 14, // EUR bn, France, 2024 (Xerfi, relayed, unverified at source)
  fashionBn2024: 7,
  growth2024Pct: 12,
  boughtSecondHandPct2023: 64, // PESTEL item E. (SWOT says "nearly 3 in 4": inconsistent, we use the lower figure)
  vintedUsersFr: 23, // million, end 2024
  vintedRevenue2024: 813 // EUR million
};

/* ------------------------------------------------------------ competitors */
export const competitors = [
  {
    key: 'aux-bonheurs', name: 'Aux Bonheurs des Dames', place: 'Chantilly', type: 'Consignment shop',
    strength: 'Local proximity: the only competitor identified in Chantilly',
    weakness: 'Clothes mixed with antiques; little online visibility'
  },
  {
    key: 'neighbours', name: 'Slow-Topia · A Vos Marques', place: 'Compiègne · Beauvais', type: 'Thrift & consignment',
    strength: 'Quality control, social media presence · wide choice, fast seller payment',
    weakness: 'Prices not published · single shops'
  },
  {
    key: 'fait-affaire', name: 'Fait et Affaire', place: 'Noailles', type: 'Selective consignment, by appointment',
    strength: 'High-end brand selection',
    weakness: '3-month minimum deposit; cheque at maturity; 40% commission'
  },
  {
    key: 'dressing-circulaire', name: 'Le Dressing Circulaire', place: 'Paris, at home', type: 'Home consignment',
    strength: 'Turnkey home service: closest model to home buy-back',
    weakness: 'Travel fee €40–70; outside the Oise; 50/50 split'
  },
  {
    key: 'vinted', name: 'Vinted', place: 'Online', type: 'Peer-to-peer platform',
    strength: 'Massive audience, low prices',
    weakness: 'No shop, no advice, no fitting room'
  }
];
export const competitorsSrc = `${SOURCES.mkt}, tab "Concurrence"; ${SOURCES.dem}`;

/* ------------------------------------------------------------ key success */
export const ksf = {
  src: `${SOURCES.fcs}, tabs "Liste globale", "Liste réduite", "Graphiques"`,
  total: 40,
  shortlist: 10,
  levels: { fundamental: 8, high: 17, medium: 12, low: 3 },
  byCategory: [
    { cat: 'Offer', f: 2, h: 2, m: 1, l: 0 },
    { cat: 'Price', f: 2, h: 3, m: 0, l: 0 },
    { cat: 'Distribution', f: 2, h: 2, m: 0, l: 1 },
    { cat: 'Availability', f: 0, h: 2, m: 2, l: 1 },
    { cat: 'Promotion', f: 1, h: 1, m: 3, l: 0 },
    { cat: 'Image', f: 1, h: 2, m: 2, l: 0 },
    { cat: 'Innovation', f: 0, h: 2, m: 2, l: 1 },
    { cat: 'Impact', f: 0, h: 3, m: 2, l: 0 }
  ]
};

/* ----------------------------------------------------- impact / feasibility */
export type Bucket = 'priority' | 'plan' | 'quick' | 'later';
export const actions: { n: number; label: string; impact: number; feas: number; bucket: Bucket }[] = [
  { n: 1, label: 'Customer survey (sellers & buyers)', impact: 4, feas: 5, bucket: 'priority' },
  { n: 2, label: 'Instagram & TikTok before opening', impact: 4, feas: 5, bucket: 'priority' },
  { n: 3, label: 'Clear price & buy-back grid', impact: 4, feas: 4, bucket: 'priority' },
  { n: 4, label: 'Legal compliance (declaration, police register)', impact: 4, feas: 4, bucket: 'priority' },
  { n: 5, label: 'Home buy-back by appointment', impact: 5, feas: 3, bucket: 'plan' },
  { n: 6, label: 'Secure financing (contribution, honour loan, grants)', impact: 5, feas: 2, bucket: 'plan' },
  { n: 7, label: 'Opening event', impact: 3, feas: 4, bucket: 'quick' },
  { n: 8, label: 'Local partnerships', impact: 3, feas: 4, bucket: 'quick' },
  { n: 9, label: 'Flyers & street marketing', impact: 2, feas: 5, bucket: 'quick' },
  { n: 10, label: 'Loyalty & referral programme', impact: 3, feas: 3, bucket: 'later' },
  { n: 11, label: 'Click & collect, e-commerce', impact: 3, feas: 2, bucket: 'later' },
  { n: 12, label: 'Private sales & events', impact: 2, feas: 2, bucket: 'later' }
];
export const actionsSrc = `${SOURCES.mat} (threshold 3.5; scores are the team's working estimate)`;

/* --------------------------------------------------------------- verdicts */
export type Verdict = 'validated' | 'partial' | 'tovalidate' | 'invalid';
export const verdicts: { key: string; claim: string; verdict: Verdict; note: string }[] = [
  { key: 'market', claim: 'There is a market for second-hand clothing', verdict: 'validated', note: 'Growing market (estimates not verified at source)' },
  { key: 'buyback', claim: 'Home buy-back sets us apart locally', verdict: 'partial', note: 'Paris and online services exist' },
  { key: 'sellers', claim: 'Sellers prefer immediate payment', verdict: 'tovalidate', note: 'No customer data yet' },
  { key: 'buyers', claim: 'Chantilly customers buy second-hand in shops', verdict: 'tovalidate', note: 'Vinted is a free alternative' },
  { key: 'competition', claim: 'Competition is weak in Chantilly', verdict: 'partial', note: 'One local shop, but Vinted and nearby towns' },
  { key: 'finance', claim: 'The project is fundable with today’s contribution', verdict: 'invalid', note: '€5,000 against a €29,460 loan' },
  { key: 'margins', claim: 'Planned prices and margins make us profitable', verdict: 'tovalidate', note: 'Assumptions without source' }
];
export const verdictsSrc = `${SOURCES.dem}, main table`;

/* --------------------------------------------------------------- personas */
export const personas = {
  src: `${SOURCES.per}, tabs "Persona Léa (acheteuse)" and "Persona Nathalie (vendeuse)" (team-built working hypotheses)`,
  lea: {
    name: 'Léa', role: 'Buyer', age: 21, place: 'Gouvieux, Oise', job: 'Work-study sales student',
    income: 'Under €15k a year', brands: 'Vinted · Shein · Kiabi', media: 'TikTok · Instagram · YouTube',
    verbatim: 'I want to dress with style without going broke, and find pieces that other people don’t have.',
    pain: 'Small budget · shops far away · sizes hard to find online'
  },
  nathalie: {
    name: 'Nathalie', role: 'Seller', age: 58, place: 'Chantilly, Oise', job: 'Sales director',
    income: 'Over €50k a year', brands: 'Maje · Sandro · Max Mara', media: 'Local press · Facebook · newsletters',
    verbatim: 'My wardrobe is full of beautiful pieces I no longer wear. I would like them to have a second life without me dealing with it.',
    pain: 'No time · distrust of online buyers · sales that drag on'
  }
};

/* ------------------------------------------------------------------- road */
export const roadmap = [
  { n: 1, title: 'Survey', text: 'Future sellers and buyers' },
  { n: 2, title: 'Rework financing', text: 'Contribution, honour loan, grants' },
  { n: 3, title: 'Test buy-back', text: 'Payment model and travel zone' },
  { n: 4, title: 'Check prices', text: 'Nearby shops, final price grid' },
  { n: 5, title: 'Confirm legal', text: 'Status, VAT, police register' }
];
export const roadmapSrc = `${SOURCES.dem}, "Concrete conclusions and next steps"`;

export const boutique = { area: 25, src: `${SOURCES.bmc}, Key Resources (shop of about 25 m²)` };
