"use client"

import { useState } from "react"
import { PfpInput } from "@/components/steps/pfp-input"
import { ArchetypeSelection } from "@/components/steps/archetype-selection"
import { Background } from "@/components/steps/background"
import { Hopes } from "@/components/steps/hopes"
import { Fears } from "@/components/steps/fears"
import { PersonalityProfile } from "@/components/steps/personality-profile"
import { Motivations } from "@/components/steps/motivations"
import { Relationships } from "@/components/steps/relationships"
import { WorldPosition } from "@/components/steps/world-position"
import { Voice } from "@/components/steps/voice"
import { Symbolism } from "@/components/steps/symbolism"
import { PowersAbilities } from "@/components/steps/powers-abilities"
import { FinalLore } from "@/components/steps/final-lore"
import type { CharacterData } from "@/lib/types"
import { useWallet } from "@/components/wallet/wallet-provider"

export function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const { isConnected } = useWallet()
  const [characterData, setCharacterData] = useState<CharacterData>({
    pfpId: "",
    traits: [],
    archetype: "",
    background: "",
    hopesFears: {
      hopes: "",
      fears: "",
    },
    personalityProfile: {
      description: "",
    },
    motivations: {
      drives: "",
      goals: "",
      values: "",
    },
    relationships: {
      friends: "",
      rivals: "",
      family: "",
    },
    worldPosition: {
      societalRole: "",
      classStatus: "",
      perception: "",
    },
    voice: {
      speechStyle: "",
      innerDialogue: "",
      uniquePhrases: "",
    },
    symbolism: {
      colors: "",
      items: "",
      motifs: "",
    },
    powersAbilities: {
      powers: [],
      description: "",
    },
    soulName: "",
  })

  const updateCharacterData = (data: Partial<CharacterData>) => {
    setCharacterData((prev) => ({ ...prev, ...data }))
  }

  const nextStep = () => {
    setCurrentStep((prev) => prev + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const steps = [
    <PfpInput
      key="pfp-input"
      characterData={characterData}
      updateCharacterData={updateCharacterData}
      nextStep={nextStep}
    />,
    <ArchetypeSelection
      key="archetype-selection"
      characterData={characterData}
      updateCharacterData={updateCharacterData}
      nextStep={nextStep}
      prevStep={prevStep}
    />,
    <Background
      key="background"
      characterData={characterData}
      updateCharacterData={updateCharacterData}
      nextStep={nextStep}
      prevStep={prevStep}
    />,
    <Hopes
      key="hopes"
      characterData={characterData}
      updateCharacterData={updateCharacterData}
      nextStep={nextStep}
      prevStep={prevStep}
    />,
    <Fears
      key="fears"
      characterData={characterData}
      updateCharacterData={updateCharacterData}
      nextStep={nextStep}
      prevStep={prevStep}
    />,
    <PersonalityProfile
      key="personality-profile"
      characterData={characterData}
      updateCharacterData={updateCharacterData}
      nextStep={nextStep}
      prevStep={prevStep}
    />,
    <Motivations
      key="motivations"
      characterData={characterData}
      updateCharacterData={updateCharacterData}
      nextStep={nextStep}
      prevStep={prevStep}
    />,
    <Relationships
      key="relationships"
      characterData={characterData}
      updateCharacterData={updateCharacterData}
      nextStep={nextStep}
      prevStep={prevStep}
    />,
    <WorldPosition
      key="world-position"
      characterData={characterData}
      updateCharacterData={updateCharacterData}
      nextStep={nextStep}
      prevStep={prevStep}
    />,
    <Voice
      key="voice"
      characterData={characterData}
      updateCharacterData={updateCharacterData}
      nextStep={nextStep}
      prevStep={prevStep}
    />,
    <Symbolism
      key="symbolism"
      characterData={characterData}
      updateCharacterData={updateCharacterData}
      nextStep={nextStep}
      prevStep={prevStep}
    />,
    <PowersAbilities
      key="powers-abilities"
      characterData={characterData}
      updateCharacterData={updateCharacterData}
      nextStep={nextStep}
      prevStep={prevStep}
    />,
    <FinalLore
      key="final-lore"
      characterData={characterData}
      updateCharacterData={updateCharacterData}
      prevStep={prevStep}
    />,
  ]

  // Hide hero section when wallet is connected and user has selected an NFT (moved past step 0)
  const showHeroSection = currentStep === 0 && (!isConnected || !characterData.pfpId)

  return (
    <div className="container mx-auto px-4 py-8 relative z-20">
      {/* Simplified Hero Header - Only show on initial landing */}
      {showHeroSection && (
        <div className="mb-12 text-center animate-slide-in-up">
          <div className="relative inline-block">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 relative">
              <span className="block text-transparent bg-clip-text bg-cyber-gradient uppercase tracking-wider font-black">
                DISCOVER
              </span>
              <span className="block text-transparent bg-clip-text bg-cyber-gradient uppercase tracking-wider font-black">
                YOUR
              </span>
              <span className="block text-white uppercase tracking-wider font-black text-6xl md:text-8xl animate-glow-pulse">
                INNER POWER
              </span>
            </h1>
            {/* Glow Effect */}
            <div className="absolute inset-0 text-5xl md:text-7xl font-bold tracking-tight opacity-30 blur-lg">
              <span className="block text-cyber-red uppercase tracking-wider font-black">
                DISCOVER
              </span>
              <span className="block text-cyber-red uppercase tracking-wider font-black">
                YOUR
              </span>
              <span className="block text-cyber-red uppercase tracking-wider font-black text-6xl md:text-8xl">
                INNER POWER
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Progress Bar - Only show when past initial step or when NFT is selected */}
      {(currentStep > 0 || characterData.pfpId) && (
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-3 p-4 rounded-full bg-black/40 backdrop-blur-sm border border-cyber-red/20">
            {Array.from({ length: steps.length }).map((_, index) => (
              <div key={index} className="relative">
                <div
                  className={`h-3 w-3 rounded-full transition-all duration-500 ${
                    index === currentStep 
                      ? "w-8 bg-cyber-red shadow-cyber animate-pulse-glow" 
                      : index < currentStep 
                      ? "bg-cyber-red/70 shadow-cyber-lg" 
                      : "bg-muted/40 hover:bg-muted/60"
                  }`}
                />
                {/* Connection lines */}
                {index < steps.length - 1 && (
                  <div 
                    className={`absolute top-1/2 left-full w-6 h-px transition-colors duration-500 ${
                      index < currentStep ? "bg-cyber-red/50" : "bg-muted/30"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step Content with Enhanced Animation */}
      <div className="max-w-4xl mx-auto">
        <div 
          key={currentStep}
          className="animate-slide-in-up"
          style={{ animationDelay: '0.1s' }}
        >
          {steps[currentStep]}
        </div>
      </div>
    </div>
  )
}
