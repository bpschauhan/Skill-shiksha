import CompanionCard from '@/components/CompanionCard'
import CompanionsList from '@/components/companionsList'
import CTA from '@/components/CTA'
import React from 'react'

const Page = () => {
  return (
    <div>
      <h1 className="text-2xl underline">
        Popular Companions
      </h1>

      <section className="home-section">
        <CompanionCard 
          id="123"
          name="Neura the Brainy Explorer"
          topic="Neural Network of the Human Brain"
          subject="Science"
          duration={45}
          color="#ffda6e"
        />
        <CompanionCard 
          id="456"
          name="Countsy the Wizard"
          topic="Derivatives and Integrals"
          subject="Mathematics"
          duration={30}
          color="#e5d0ff"
        />
        <CompanionCard 
          id="789"
          name="Verba the vocabulary"
          topic="Language and Literature"
          subject="English"
          duration={30}
          color="#BDE7FF"
        />
      </section>

      <section className="home-section">
        <CompanionsList />
        <CTA />
      </section>

    </div>
  )
}

export default Page