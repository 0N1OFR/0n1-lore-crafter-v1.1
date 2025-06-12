"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Brain, Save, RotateCcw, Shuffle } from "lucide-react"
import type { PersonalitySettings } from "@/lib/types"
import type { StoredSoul } from "@/lib/soul-types"
import { generatePersonalityFromSoul, createDefaultPersonalitySettings } from "@/lib/personality-generator"

interface PersonalityDashboardProps {
  soul: StoredSoul
  onUpdate: (updatedSoul: StoredSoul) => void
}

export function PersonalityDashboard({ soul, onUpdate }: PersonalityDashboardProps) {
  const [personalitySettings, setPersonalitySettings] = useState<PersonalitySettings>(() => {
    return soul.data.personalitySettings || generatePersonalityFromSoul(soul.data)
  })
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const handleSliderChange = (field: keyof PersonalitySettings, value: number[]) => {
    setPersonalitySettings(prev => ({ ...prev, [field]: value[0] }))
    setHasUnsavedChanges(true)
  }

  const handleInputChange = (field: keyof PersonalitySettings, value: string) => {
    setPersonalitySettings(prev => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
  }

  const handleCheckboxChange = (field: keyof PersonalitySettings, checked: boolean) => {
    setPersonalitySettings(prev => ({ ...prev, [field]: checked }))
    setHasUnsavedChanges(true)
  }

  const handleSave = () => {
    const updatedSoul = {
      ...soul,
      data: {
        ...soul.data,
        personalitySettings
      }
    }
    onUpdate(updatedSoul)
    setHasUnsavedChanges(false)
  }

  const handleReset = () => {
    const defaultSettings = generatePersonalityFromSoul(soul.data)
    setPersonalitySettings(defaultSettings)
    setHasUnsavedChanges(true)
  }

  const handleRandomize = () => {
    const randomSettings = createDefaultPersonalitySettings()
    setPersonalitySettings(randomSettings)
    setHasUnsavedChanges(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="h-8 w-8 text-purple-400" />
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              Personality Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure the personality matrix for {soul.data.soulName}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            className="border-purple-500/30 hover:bg-purple-900/20"
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Soul
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="border-purple-500/30 hover:bg-purple-900/20"
            onClick={handleRandomize}
          >
            <Shuffle className="h-4 w-4 mr-2" />
            Randomize
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Main Dashboard */}
      <Card className="border border-purple-500/30 bg-black/60 backdrop-blur-sm">
        <CardContent className="p-6">
          <Tabs defaultValue="core-traits" className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="core-traits">Core Traits</TabsTrigger>
              <TabsTrigger value="communication">Communication</TabsTrigger>
              <TabsTrigger value="psychology">Psychology</TabsTrigger>
              <TabsTrigger value="background">Background</TabsTrigger>
              <TabsTrigger value="relationships">Relationships</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            {/* Core Personality Traits */}
            <TabsContent value="core-traits" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SliderControl
                  label="Openness to Experience"
                  description="Conservative ← → Creative/Unconventional"
                  value={personalitySettings.openness}
                  onChange={(value) => handleSliderChange('openness', value)}
                />
                <SliderControl
                  label="Conscientiousness"
                  description="Spontaneous ← → Organized/Disciplined"
                  value={personalitySettings.conscientiousness}
                  onChange={(value) => handleSliderChange('conscientiousness', value)}
                />
                <SliderControl
                  label="Extraversion"
                  description="Introverted ← → Outgoing/Social"
                  value={personalitySettings.extraversion}
                  onChange={(value) => handleSliderChange('extraversion', value)}
                />
                <SliderControl
                  label="Agreeableness"
                  description="Competitive ← → Cooperative/Trusting"
                  value={personalitySettings.agreeableness}
                  onChange={(value) => handleSliderChange('agreeableness', value)}
                />
                <SliderControl
                  label="Neuroticism"
                  description="Stable ← → Anxious/Emotional"
                  value={personalitySettings.neuroticism}
                  onChange={(value) => handleSliderChange('neuroticism', value)}
                />
                <SliderControl
                  label="Sarcasm Level"
                  description="Genuine ← → Cutting/Dry"
                  value={personalitySettings.sarcasmLevel}
                  onChange={(value) => handleSliderChange('sarcasmLevel', value)}
                />
                <SliderControl
                  label="Wit/Humor"
                  description="Serious ← → Quick/Clever"
                  value={personalitySettings.witHumor}
                  onChange={(value) => handleSliderChange('witHumor', value)}
                />
                <SliderControl
                  label="Empathy"
                  description="Cold ← → Deeply Caring"
                  value={personalitySettings.empathy}
                  onChange={(value) => handleSliderChange('empathy', value)}
                />
                <SliderControl
                  label="Confidence"
                  description="Self-Doubting ← → Self-Assured"
                  value={personalitySettings.confidence}
                  onChange={(value) => handleSliderChange('confidence', value)}
                />
                <SliderControl
                  label="Impulsiveness"
                  description="Cautious ← → Reckless"
                  value={personalitySettings.impulsiveness}
                  onChange={(value) => handleSliderChange('impulsiveness', value)}
                />
              </div>
            </TabsContent>

            {/* Communication Style */}
            <TabsContent value="communication" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SliderControl
                  label="Formality Level"
                  description="Casual Slang ← → Professional/Formal"
                  value={personalitySettings.formalityLevel}
                  onChange={(value) => handleSliderChange('formalityLevel', value)}
                />
                <SliderControl
                  label="Verbosity"
                  description="Terse/Brief ← → Rambling/Detailed"
                  value={personalitySettings.verbosity}
                  onChange={(value) => handleSliderChange('verbosity', value)}
                />
                <SliderControl
                  label="Directness"
                  description="Diplomatic/Evasive ← → Blunt/Honest"
                  value={personalitySettings.directness}
                  onChange={(value) => handleSliderChange('directness', value)}
                />
                <SliderControl
                  label="Profanity Usage"
                  description="Clean ← → Frequent Swearing"
                  value={personalitySettings.profanityUsage}
                  onChange={(value) => handleSliderChange('profanityUsage', value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SelectControl
                  label="Primary Language Style"
                  value={personalitySettings.primaryLanguageStyle}
                  onChange={(value) => handleInputChange('primaryLanguageStyle', value)}
                  options={[
                    'Street Slang',
                    'Academic', 
                    'Corporate',
                    'Military',
                    'Artistic',
                    'Technical',
                    'Archaic'
                  ]}
                />
                <SelectControl
                  label="Sentence Structure"
                  value={personalitySettings.sentenceStructure}
                  onChange={(value) => handleInputChange('sentenceStructure', value)}
                  options={[
                    'Short & Punchy',
                    'Flowing & Complex',
                    'Fragmented',
                    'Poetic',
                    'Stream of Consciousness'
                  ]}
                />
                <SelectControl
                  label="Response Speed Style"
                  value={personalitySettings.responseSpeedStyle}
                  onChange={(value) => handleInputChange('responseSpeedStyle', value)}
                  options={[
                    'Immediate',
                    'Thoughtful Pauses',
                    'Delayed',
                    'Interrupt-Heavy'
                  ]}
                />
              </div>
            </TabsContent>

            {/* Psychology Tab */}
            <TabsContent value="psychology" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SliderControl
                  label="Emotional Volatility"
                  description="Stable ← → Mood Swings"
                  value={personalitySettings.emotionalVolatility}
                  onChange={(value) => handleSliderChange('emotionalVolatility', value)}
                />
                <SliderControl
                  label="Trust Level"
                  description="Paranoid ← → Naive/Trusting"
                  value={personalitySettings.trustLevel}
                  onChange={(value) => handleSliderChange('trustLevel', value)}
                />
                <SliderControl
                  label="Optimism"
                  description="Pessimistic ← → Relentlessly Positive"
                  value={personalitySettings.optimism}
                  onChange={(value) => handleSliderChange('optimism', value)}
                />
                <SliderControl
                  label="Stress Response"
                  description="Freeze ← → Fight"
                  value={personalitySettings.stressResponse}
                  onChange={(value) => handleSliderChange('stressResponse', value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="coreFear">Core Fear</Label>
                  <Input
                    id="coreFear"
                    value={personalitySettings.coreFear}
                    onChange={(e) => handleInputChange('coreFear', e.target.value)}
                    placeholder="Being abandoned"
                    className="bg-background/50 border-purple-500/30 focus-visible:ring-purple-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="greatestDesire">Greatest Desire</Label>
                  <Input
                    id="greatestDesire"
                    value={personalitySettings.greatestDesire}
                    onChange={(e) => handleInputChange('greatestDesire', e.target.value)}
                    placeholder="Recognition and respect"
                    className="bg-background/50 border-purple-500/30 focus-visible:ring-purple-500"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Background & Identity */}
            <TabsContent value="background" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectControl
                  label="Education Level"
                  value={personalitySettings.educationLevel}
                  onChange={(value) => handleInputChange('educationLevel', value)}
                  options={[
                    'None',
                    'Street-Smart',
                    'Trade School',
                    'College',
                    'Advanced Degree',
                    'Self-Taught Genius'
                  ]}
                />
                <SelectControl
                  label="Social Class"
                  value={personalitySettings.socialClass}
                  onChange={(value) => handleInputChange('socialClass', value)}
                  options={[
                    'Elite/Noble',
                    'Upper Middle',
                    'Middle',
                    'Working',
                    'Street/Exile',
                    'Criminal'
                  ]}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="culturalBackground">Cultural Background</Label>
                  <Input
                    id="culturalBackground"
                    value={personalitySettings.culturalBackground}
                    onChange={(e) => handleInputChange('culturalBackground', e.target.value)}
                    placeholder="Raised in underground tech communes"
                    className="bg-background/50 border-purple-500/30 focus-visible:ring-purple-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="formativeTrauma">Formative Trauma</Label>
                  <Input
                    id="formativeTrauma"
                    value={personalitySettings.formativeTrauma}
                    onChange={(e) => handleInputChange('formativeTrauma', e.target.value)}
                    placeholder="Betrayed by mentor"
                    className="bg-background/50 border-purple-500/30 focus-visible:ring-purple-500"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Relationships */}
            <TabsContent value="relationships" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SliderControl
                  label="Dominance"
                  description="Submissive ← → Alpha/Commanding"
                  value={personalitySettings.dominance}
                  onChange={(value) => handleSliderChange('dominance', value)}
                />
                <SliderControl
                  label="Social Energy"
                  description="Drains in Groups ← → Energized by People"
                  value={personalitySettings.socialEnergy}
                  onChange={(value) => handleSliderChange('socialEnergy', value)}
                />
                <SliderControl
                  label="Loyalty"
                  description="Fickle ← → Ride-or-Die"
                  value={personalitySettings.loyalty}
                  onChange={(value) => handleSliderChange('loyalty', value)}
                />
                <SliderControl
                  label="Conflict Style"
                  description="Avoidant ← → Confrontational"
                  value={personalitySettings.conflictStyle}
                  onChange={(value) => handleSliderChange('conflictStyle', value)}
                />
              </div>
            </TabsContent>

            {/* Advanced Controls */}
            <TabsContent value="advanced" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-purple-300">Quirks & Personality Flavoring</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="signaturePhrase">Signature Phrase</Label>
                    <Input
                      id="signaturePhrase"
                      value={personalitySettings.signaturePhrase}
                      onChange={(e) => handleInputChange('signaturePhrase', e.target.value)}
                      placeholder="As the old saying goes..."
                      className="bg-background/50 border-purple-500/30 focus-visible:ring-purple-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="speakingTic">Speaking Tic</Label>
                    <Input
                      id="speakingTic"
                      value={personalitySettings.speakingTic}
                      onChange={(e) => handleInputChange('speakingTic', e.target.value)}
                      placeholder="Always taps fingers when thinking"
                      className="bg-background/50 border-purple-500/30 focus-visible:ring-purple-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CheckboxControl
                    label="Speaks in questions"
                    checked={personalitySettings.speaksInQuestions}
                    onChange={(checked) => handleCheckboxChange('speaksInQuestions', checked)}
                  />
                  <CheckboxControl
                    label="Never uses contractions"
                    checked={personalitySettings.neverUsesContractions}
                    onChange={(checked) => handleCheckboxChange('neverUsesContractions', checked)}
                  />
                  <CheckboxControl
                    label="Always gives advice"
                    checked={personalitySettings.alwaysGivesAdvice}
                    onChange={(checked) => handleCheckboxChange('alwaysGivesAdvice', checked)}
                  />
                  <CheckboxControl
                    label="Avoids naming people"
                    checked={personalitySettings.avoidsNamingPeople}
                    onChange={(checked) => handleCheckboxChange('avoidsNamingPeople', checked)}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-purple-300">Output Controls</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SliderControl
                    label="Response Length Preference"
                    description="Concise ← → Elaborate"
                    value={personalitySettings.responseLengthPreference}
                    onChange={(value) => handleSliderChange('responseLengthPreference', value)}
                  />
                  <SliderControl
                    label="Emotion Intensity"
                    description="Subdued ← → Dramatic"
                    value={personalitySettings.emotionIntensity}
                    onChange={(value) => handleSliderChange('emotionIntensity', value)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper components
function SliderControl({ 
  label, 
  description, 
  value, 
  onChange 
}: { 
  label: string
  description: string
  value: number
  onChange: (value: number[]) => void 
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center space-x-3">
        <span className="text-xs text-muted-foreground">0</span>
        <Slider
          value={[value]}
          onValueChange={onChange}
          max={100}
          step={1}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground">100</span>
        <span className="text-sm font-medium w-8 text-right">{value}</span>
      </div>
    </div>
  )
}

function SelectControl({ 
  label, 
  value, 
  onChange, 
  options 
}: { 
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-background/50 border-purple-500/30 focus-visible:ring-purple-500">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function CheckboxControl({ 
  label, 
  checked, 
  onChange 
}: { 
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={label}
        checked={checked}
        onCheckedChange={onChange}
        className="border-purple-500/30"
      />
      <Label htmlFor={label} className="text-sm">
        {label}
      </Label>
    </div>
  )
} 