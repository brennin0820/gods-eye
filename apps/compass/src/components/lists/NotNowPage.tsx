import { Compass } from 'lucide-react'
import { useCompassData } from '../../hooks/useCompassData'
import { NotNowCard } from '../dashboard/NotNowCard'

export function NotNowPage() {
  const { snapshot } = useCompassData()
  const notNowItems = snapshot?.notNowItems ?? []

  return (
    <section className="list-page" aria-labelledby="not-now-title">
      <article className="dashboard-card dashboard-card--wide">
        <div className="card-heading">
          <span className="card-icon card-icon--amber">
            <Compass size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Not now</p>
            <h2 id="not-now-title">Guardrails and deferred work</h2>
          </div>
        </div>
        <p className="card-copy">
          From overlay boundaries and NightRaven defaults — do not build these yet.
        </p>
      </article>

      <NotNowCard items={notNowItems} />
    </section>
  )
}
