import { SOURCES, boutique, competitorsSrc, finance, ksf, personas, actionsSrc, verdictsSrc, roadmapSrc } from './facts';

export type SceneKind =
  | 'hero' | 'problem' | 'why' | 'personas' | 'solution' | 'tour'
  | 'competition' | 'model' | 'actions' | 'finance' | 'verdicts' | 'roadmap' | 'sources';

export type Beat = { say: string; cue: string };
export type Scene = {
  id: SceneKind;
  eyebrow: string;
  title: string;
  /** planned duration in seconds; the 12 scenes sum to exactly 720 */
  duration: number;
  /** true when the presenters change after this scene (a hand-over cue is shown in the notes) */
  handover?: boolean;
  sources: string[];
  beats: Beat[];
};

// Beat n of a scene is on screen while its `say` line is spoken. Press → to move to the next beat.
// The script is written for B1–B2 English speakers: short sentences, plain words, about 110–120 words/min with pauses.
export const scenes: Scene[] = [
  {
    id: 'hero', eyebrow: 'Introduction', title: 'PÉPITE', duration: 45,
    sources: [SOURCES.bmc, SOURCES.deck],
    beats: [
      { say: 'Good morning, everyone. Think about your wardrobe for a moment. How many clothes did you stop wearing this year?', cue: 'Dark stage. A rail of garments slides in and sways.' },
      { say: 'Today we present PÉPITE, a second-hand boutique planned for Chantilly, in the Oise.', cue: 'PÉPITE title appears, letter by letter.' },
      { say: 'In French, a pépite is a precious find: something valuable that nobody had really noticed.', cue: 'Definition fades in. One garment glows on the rail.' },
      { say: 'Our idea is simple. We give beautiful clothes a second story, and we make it easy for everyone.', cue: 'Tagline appears under the title.' },
      { say: 'First the idea and the shop, then the numbers, and then the hard questions.', cue: 'Agenda line: Idea · Boutique · Numbers · Hard questions.' }
    ]
  },
  {
    id: 'problem', eyebrow: 'The problem', title: 'Our wardrobes are full. Reselling is hard work.', duration: 55,
    sources: [`${SOURCES.deck}, slide 2`, SOURCES.dem, SOURCES.per],
    beats: [
      { say: 'Our wardrobes are full. But reselling clothes is hard work.', cue: 'Title and the two columns, still empty.' },
      { say: 'Think about the seller. She takes photos, writes a listing, answers messages, negotiates, and sends a parcel. Five steps for one jumper.', cue: 'Seller steps 1 to 5 pop in one by one.' },
      { say: 'Now think about the buyer. She sees hundreds of listings. She searches, sorts, and she is still not sure about the size or the condition. It takes hours.', cue: 'Buyer steps 1 to 5 pop in one by one.' },
      { say: 'Both sides lose time. That is the gap we want to fill: second-hand, without the constraints of second-hand.', cue: 'Both columns dim; the gap line appears.' }
    ]
  },
  {
    id: 'why', eyebrow: 'Why now', title: 'A market in motion', duration: 80, handover: true,
    sources: [`${SOURCES.mkt}, tab Pestel (C, E, H)`, SOURCES.swot, SOURCES.dem],
    beats: [
      { say: 'Why now? First, the market is moving. Reported estimates say that second-hand in France was worth about 14 billion euros in 2024, and about 7 billion euros for fashion.', cue: 'Two big counters roll up: €14 bn and €7 bn.' },
      { say: 'We could not verify these figures at the original source, so we use them with care.', cue: '"Reported · not verified at source" stamps appear.' },
      { say: 'Habits are changing too. One estimate says that 64 percent of French people bought second-hand in 2023.', cue: 'Ring chart fills to 64%.' },
      { say: 'The law is moving as well. A 2026 anti fast-fashion law has passed, but the application decrees are not published yet. So the rules are still unclear.', cue: 'Law card slides in with the "decrees pending" tag.' },
      { say: 'And there is one giant player: Vinted, with more than 23 million users in France. We will come back to it.', cue: 'Vinted counter rolls to 23 M+.' },
      { say: 'Our own analysis says something important. Demand is not our main risk. Financing and sourcing are.', cue: 'Callout banner: demand is not the main risk.' }
    ]
  },
  {
    id: 'personas', eyebrow: 'The customers', title: 'Two needs. One boutique.', duration: 50,
    sources: [personas.src],
    beats: [
      { say: 'Two customers, two needs. Meet Léa. She is 21, a work-study student near Chantilly. Small budget, big sense of style.', cue: 'Léa card slides in with her quote.' },
      { say: 'She buys on Vinted, she follows TikTok and Instagram, and she wants unique pieces.', cue: 'Léa details light up: brands, media, frustrations.' },
      { say: 'Now meet Nathalie. She is 58, a sales director in Chantilly. Her wardrobe is full of brand pieces that she rarely wears.', cue: 'Nathalie card slides in with her quote.' },
      { say: 'She wants to sell them easily, in good conditions, with an appointment at home.', cue: 'Nathalie details light up.' },
      { say: 'These are personas built by our team. They are working hypotheses, and our survey will test them.', cue: 'Banner: working hypotheses, to be tested by the survey.' }
    ]
  },
  {
    id: 'solution', eyebrow: 'Our solution', title: 'A local circle for second-hand fashion', duration: 45,
    sources: [SOURCES.bmc, SOURCES.dem],
    beats: [
      { say: 'Our solution connects Léa and Nathalie. It is a local circle.', cue: 'Circle path draws itself.' },
      { say: 'First, home buy-back. We visit the seller by appointment, we choose the pieces, and we offer a price. The payment terms are still to be defined.', cue: 'Node 1: wardrobe → home buy-back. A garment travels along the path.' },
      { say: 'Then we inspect, clean, label and price each piece. Only the best ones go to the shop.', cue: 'Node 2: the PÉPITE selection.' },
      { say: 'In the boutique, the buyer finds a curated selection, a warm welcome and no pressure.', cue: 'Node 3: boutique, then the new owner.' },
      { say: 'And one person can be a seller today and a buyer tomorrow.', cue: 'Return arrow closes the loop.' }
    ]
  },
  {
    id: 'tour', eyebrow: 'The experience', title: 'Step inside PÉPITE', duration: 85, handover: true,
    sources: [boutique.src, SOURCES.mkt],
    beats: [
      { say: 'Now, let\u2019s step inside our future boutique. This is our vision of PÉPITE: 25 square metres in Chantilly, warm and welcoming.', cue: '3D: the shop front at dusk, lit from inside. Badge: artist\u2019s impression.' },
      { say: 'Outside, a dark façade, golden letters and a striped awning. Our window must stop people in the street in a few seconds.', cue: '3D: camera glides to the window display; the door opens.' },
      { say: 'Inside, the rails. Every piece is chosen, cleaned and presented like in a fashion boutique. New pieces arrive often, so there is always something to discover.', cue: '3D: camera enters; garments sway on the brass rail.' },
      { say: 'Here is the fitting room, with a velvet curtain and a big mirror. You cannot try clothes on when you buy online.', cue: '3D: camera turns to the fitting room; the curtain moves.' },
      { say: 'At the counter, a warm welcome and advice without pressure. Card payment, and later a loyalty programme.', cue: '3D: camera moves to the marble counter.' },
      { say: 'A small space, a big experience. Every piece has to earn its place, and that is what makes each visit a discovery.', cue: '3D: the roof lifts away for an overview. Drag to explore.' }
    ]
  },
  {
    id: 'competition', eyebrow: 'Positioning', title: 'More than another listing', duration: 65,
    sources: [competitorsSrc],
    beats: [
      { say: 'Who are we up against? We studied the local shops in the Oise and the online players.', cue: 'Title and an empty map of competitors.' },
      { say: 'In Chantilly, we found one direct competitor. Other shops are in Senlis, Compiègne and Beauvais.', cue: 'Cards: Aux Bonheurs des Dames; Slow-Topia · A Vos Marques.' },
      { say: 'Fait et Affaire is selective, but asks for a three-month deposit.', cue: 'Card: Fait et Affaire.' },
      { say: 'In Paris, Le Dressing Circulaire comes to your home, but the visit costs forty to seventy euros.', cue: 'Card: Le Dressing Circulaire.' },
      { say: 'Our real competitor is Vinted. It is free, huge, and easy. It has no shop, no advice, and no fitting room.', cue: 'Vinted card grows to the largest size.' },
      { say: 'So we will not out-list Vinted. We offer a service around the shop. As far as we know, no local competitor offers home buy-back. We must still confirm this on the ground.', cue: 'PÉPITE card closes the grid. Note: "per our current analysis".' }
    ]
  },
  {
    id: 'model', eyebrow: 'Business model', title: 'Turning wardrobes into value', duration: 60,
    sources: [SOURCES.bmc, ksf.src, SOURCES.deck],
    beats: [
      { say: 'How does the model work? We buy pieces from individuals. This is our biggest cost.', cue: 'Step 1: Buy. Cost tag.' },
      { say: 'We select, clean and price them. Then we sell in the shop, with display and advice. Our margin is the difference between the buying price and the selling price.', cue: 'Steps 2 to 4 follow; margin bracket.' },
      { say: 'Accessories and shoes help to raise the average basket. Online sales and events come later.', cue: 'Add-on and future revenue chips.' },
      { say: 'We listed forty success factors, and kept ten. Eight are rated fundamental: for example, quality, a fair buy-back price, and trust in our estimates.', cue: 'Stacked bars by category; the fundamental level pulses.' },
      { say: 'Three numbers will guide us from day one: margin per item, stock turnover, and average basket. Today, all three are still to be validated.', cue: 'Three KPI tiles marked "to validate".' }
    ]
  },
  {
    id: 'actions', eyebrow: 'Go to market', title: 'What we do first', duration: 55, handover: true,
    sources: [actionsSrc],
    beats: [
      { say: 'We have many ideas, so we scored twelve actions, from one to five, for impact and for feasibility.', cue: 'Matrix axes draw; threshold lines at 3.5.' },
      { say: 'Four actions are top priority: a customer survey, Instagram and TikTok before opening, a clear price grid, and legal compliance.', cue: 'Actions 1 to 4 drop in (green zone).' },
      { say: 'Two actions have a very high impact but need more means: home buy-back, and securing the financing. We must plan them carefully.', cue: 'Actions 5 and 6 drop in (plan zone).' },
      { say: 'The opening event, local partnerships and flyers are quick wins. A loyalty programme, click and collect, and private sales can wait.', cue: 'Actions 7 to 9, then 10 to 12 in grey.' },
      { say: 'These scores are our team’s working estimate. We will adjust them with the survey.', cue: 'Footnote: working estimate.' }
    ]
  },
  {
    id: 'finance', eyebrow: 'The numbers', title: 'A promising idea needs financial discipline', duration: 80,
    sources: [finance.src],
    beats: [
      { say: 'Now, the numbers. We need 34,460 euros to start. That covers renovation and equipment, VAT, our first stock, and a cash reserve of 7,500 euros.', cue: 'Uses of funds bar builds up to €34,460.' },
      { say: 'We plan 5,000 euros of our own money and a bank loan of 29,460 euros. That is about 15 percent and 85 percent: a weak ratio.', cue: 'Sources bar: €5,000 + €29,460.' },
      { say: 'After six months, the optimistic case ends at plus 3,758 euros. The central case ends at 207 euros. The prudent case ends at minus 2,644.', cue: 'Three cash curves draw; end labels appear.' },
      { say: 'Even in the central case, we lose money every month. If this continues, cash goes below zero in month seven. This is our extrapolation, not the plan.', cue: 'Monthly bars M1–M6, then a dashed M7 marked "our extrapolation".' },
      { say: 'Also, the plan counts zero salary for the two partners. These are forecasts, not results.', cue: 'Stamp: forecast, not actuals.' }
    ]
  },
  {
    id: 'verdicts', eyebrow: 'Reality check', title: 'What we still have to prove', duration: 55,
    sources: [verdictsSrc, SOURCES.swot],
    beats: [
      { say: 'A good idea gets stronger when we challenge it. We tested seven assumptions against our research.', cue: 'Seven face-down cards.' },
      { say: 'One is validated: there is a market for second-hand. Two are partly validated, for example the idea that home buy-back makes us different locally.', cue: 'Cards flip: 1 validated, 2 partly validated.' },
      { say: 'Three are still to validate: do sellers want immediate payment, will Chantilly customers buy in a shop, and are our prices and margins enough?', cue: 'Cards flip: 3 to validate.' },
      { say: 'And one does not hold as it stands: financing. With today’s contribution, the plan does not work.', cue: 'Last card flips red: not valid as it stands.' },
      { say: 'So our key risks are financing and sourcing. We know it, and we have a plan.', cue: 'Conclusion banner.' }
    ]
  },
  {
    id: 'roadmap', eyebrow: 'Next chapter', title: 'From a pépite to a boutique', duration: 45,
    sources: [roadmapSrc, SOURCES.deck],
    beats: [
      { say: 'Here is our plan. First, a survey of future sellers and buyers. Second, rework the financing: more contribution, an honour loan, and grants. Third, test the buy-back model. Fourth, check prices in nearby shops. Fifth, confirm our legal status and VAT with a professional.', cue: 'Five roadmap steps light up in sequence.' },
      { say: 'A pépite is something valuable that nobody had really noticed. We believe there are many of them in the wardrobes around Chantilly.', cue: 'Roadmap fades; quote on a dark stage.' },
      { say: 'Who wants to build PÉPITE with us? Thank you. We are happy to take your questions.', cue: 'Closing question and thank-you. Hold for Q&A.' }
    ]
  },
  {
    id: 'sources', eyebrow: 'Annex', title: 'Sources & method', duration: 0,
    sources: Object.values(SOURCES),
    beats: [{ say: '(Backup slide for questions: sources and the status of every figure.)', cue: 'Static annex.' }]
  }
];

/** Scenes that count towards the 12 minutes (everything except the annex). */
export const timed = scenes.filter(s => s.duration > 0);
export const TOTAL_SECONDS = timed.reduce((a, s) => a + s.duration, 0);

export const wordCount = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;
export const sceneWords = (s: Scene) => s.beats.reduce((a, b) => a + wordCount(b.say), 0);
export const TOTAL_WORDS = timed.reduce((a, s) => a + sceneWords(s), 0);

/** Which of the four 3-minute parts a scene belongs to (1–4). Only used for hand-over cues, never shown as a name. */
export const partOf = (index: number) => {
  let part = 1;
  for (let i = 0; i < index; i++) if (scenes[i].handover) part++;
  return part;
};
