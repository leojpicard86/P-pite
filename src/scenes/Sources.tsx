import { Heading } from './common';
import { SOURCES } from '../data/facts';
import { Stamp } from '../components/ui';

const rows: [string, string][] = [
  [SOURCES.bmc, 'Concept, value proposition, segments, channels, 25 m² shop, costs'],
  [SOURCES.plan, 'Funding plan, three scenarios, monthly cash (provisional, SAS)'],
  [SOURCES.dem, 'Seven assumptions and verdicts, next steps'],
  [SOURCES.mat, 'Twelve actions scored for impact and feasibility'],
  [SOURCES.swot, 'Strengths, weaknesses, opportunities, threats'],
  [SOURCES.mkt, 'PESTEL, Porter 5+1, competitor table'],
  ['Facteurs_cles_de_succes_Pepite.xlsx', 'Forty success factors, ten shortlisted'],
  [SOURCES.per, 'Léa and Nathalie personas (team hypotheses)'],
  [SOURCES.deck, 'Brand identity and storyline of the first deck']
];

export default function Sources() {
  return (
    <>
      <Heading eyebrow="ANNEX · BACKUP">Sources and method</Heading>
      <div className="srcGrid">
        <ul className="srcList">{rows.map(([f, d]) => <li key={f}><code>{f}</code><span>{d}</span></li>)}</ul>
        <div className="srcLegend">
          <h4>STATUS OF FIGURES</h4>
          <p><Stamp tone="info">Plan</Stamp> BGE forecast. Provisional: SAS, 0 € partner pay, quotes and lease missing.</p>
          <p><Stamp>Reported</Stamp> Market and Vinted figures from secondary sources. Not verified at source.</p>
          <p><Stamp tone="good">Team estimate</Stamp> Impact/feasibility scores, personas.</p>
          <p><Stamp tone="bad">Extrapolation</Stamp> Month 7 cash: our straight-line projection, not in the plan.</p>
          <p className="fine">The 3D boutique is an artist's impression of the future shop (~25 m²). No real photos, plans or measurements were used.</p>
        </div>
      </div>
    </>
  );
}
