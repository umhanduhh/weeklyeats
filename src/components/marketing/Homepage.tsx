import { MarketingHeader } from './MarketingHeader'
import { Hero } from './Hero'
import { HowItWorks } from './HowItWorks'
import { InsideTheApp } from './InsideTheApp'
import { Closer } from './Closer'

export function Homepage() {
  return (
    <div style={{ background: 'var(--color-parchment)', minHeight: '100vh' }}>
      <MarketingHeader />
      <Hero />
      <HowItWorks />
      <InsideTheApp />
      <Closer />
    </div>
  )
}
