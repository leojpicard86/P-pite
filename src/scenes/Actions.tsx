import { Reveal } from '../components/ui';
import { ActionMatrix } from '../components/charts';
import { actions } from '../data/facts';
import { Heading, SceneProps } from './common';

const groups = [
  { b: 'priority', title: 'DO FIRST', at: 1, color: '#8b4545' },
  { b: 'plan', title: 'PLAN CAREFULLY', at: 2, color: '#6b6259' },
  { b: 'quick', title: 'QUICK WINS', at: 3, color: '#8c9585' },
  { b: 'later', title: 'LATER', at: 3, color: '#b7a793' }
] as const;

export default function Actions({ beat }: SceneProps) {
  return (
    <>
      <Heading eyebrow="GO TO MARKET">What we do first</Heading>
      <div className="actionsGrid">
        <div className="matrixWrap"><ActionMatrix beat={beat} /></div>
        <div className="actionList">
          {groups.map(g => (
            <Reveal key={g.b} beat={beat} at={g.at} delay={g.b === 'later' ? 1.4 : 0} className="actionGroup">
              <h4 style={{ color: g.color }}>{g.title}</h4>
              <ul>
                {actions.filter(a => a.bucket === g.b).map(a => (
                  <li key={a.n}><i style={{ background: g.color }}>{a.n}</i>{a.label}<small>{a.impact}/{a.feas}</small></li>
                ))}
              </ul>
            </Reveal>
          ))}
          <Reveal beat={beat} at={4} className="footnote">Scores 1–5 for impact / feasibility; threshold 3.5. The team's working estimate, to be adjusted with the survey.</Reveal>
        </div>
      </div>
    </>
  );
}
