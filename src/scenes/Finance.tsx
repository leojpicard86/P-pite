import { Reveal, Stamp } from '../components/ui';
import { FundsBar, MonthlyChart, ScenarioChart } from '../components/charts';
import { Heading, SceneProps } from './common';

export default function Finance({ beat }: SceneProps) {
  return (
    <>
      <Heading eyebrow="THE NUMBERS">A promising idea needs<br />financial discipline</Heading>
      <div className="finGrid">
        <div className="finLeft">
          <Reveal beat={beat} at={0}><FundsBar kind="uses" active={beat >= 0} /></Reveal>
          <Reveal beat={beat} at={1}><FundsBar kind="sources" active={beat >= 1} /></Reveal>
          <Reveal beat={beat} at={1} until={4} delay={1.2} className="ratioNote">≈ 15% own funds / 85% debt: a weak ratio</Reveal>
        </div>
        <div className="finRight">
          <Reveal beat={beat} at={2} until={3} className="chartPanel">
            <h4>CASH BALANCE BY SCENARIO · €</h4>
            <ScenarioChart active={beat >= 2} />
          </Reveal>
          <Reveal beat={beat} at={3} className="chartPanel overlayPanel">
            <h4>CENTRAL SCENARIO · MONTHLY BALANCE (BARS) AND CUMULATIVE CASH (LINE) · €</h4>
            <MonthlyChart active={beat >= 3} />
          </Reveal>
        </div>
      </div>
      <Reveal beat={beat} at={4} className="forecastStamp"><Stamp tone="bad">Forecast · not actuals</Stamp><span>Partner pay is €0 in the plan. Sales and margins are unvalidated assumptions. Month 7 is our own extrapolation.</span></Reveal>
    </>
  );
}
