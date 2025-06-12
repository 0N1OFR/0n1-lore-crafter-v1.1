import { MultiStepForm } from "@/components/multi-step-form"
import { SplashScreen } from "@/components/splash-screen"
import { NetworkAnimation } from "@/components/NetworkAnimation"

export default function Home() {
  return (
    <main className="relative min-h-screen bg-background overflow-hidden">
      {/* Particle Network Background */}
      <NetworkAnimation />
      
      {/* Additional Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-[1]">
        {/* Large Blurred Background Elements */}
        <div className="absolute top-40 -right-20 w-80 h-80 bg-cyber-red/5 blur-3xl rounded-full opacity-40 animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-cyber-pink/5 blur-3xl rounded-full opacity-40 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-60 left-10 w-64 h-64 bg-cyber-orange/5 blur-3xl rounded-full opacity-40 animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-40 right-10 w-72 h-72 bg-cyber-red/5 blur-3xl rounded-full opacity-40 animate-pulse" style={{ animationDelay: '2.5s' }} />
        
        {/* Floating Geometric Shapes */}
        <div className="absolute top-1/3 left-1/4 w-6 h-6 bg-cyber-red/20 rounded-full blur-sm animate-float" />
        <div className="absolute top-1/4 right-1/3 w-8 h-8 bg-cyber-red/10 blur-md animate-float" style={{ animationDelay: '0.5s' }} />
        <div 
          className="absolute top-2/3 right-1/5 w-0 h-0 blur-md animate-float"
          style={{ 
            borderLeft: '8px solid transparent', 
            borderRight: '8px solid transparent', 
            borderBottom: '15px solid rgba(255, 72, 79, 0.15)',
            animationDelay: '0.7s'
          }}
        />
        <div 
          className="absolute bottom-1/6 right-1/6 w-10 h-10 blur-md animate-float"
          style={{
            backgroundColor: 'transparent',
            backgroundImage: 'linear-gradient(135deg, rgba(230, 61, 122, 0.15), rgba(255, 72, 79, 0.05))',
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            animationDelay: '0.3s'
          }}
        />
        
        {/* Circuit Line Animations */}
        <div className="absolute bottom-10 left-10 w-32 h-32 pointer-events-none opacity-20">
          <div className="absolute top-0 left-0 w-full h-px bg-cyber-red animate-circuit-flow" />
          <div className="absolute top-0 left-0 w-px h-full bg-cyber-red animate-circuit-flow" style={{ animationDelay: '0.5s' }} />
        </div>
        <div className="absolute top-10 right-10 w-24 h-24 pointer-events-none opacity-20">
          <div className="absolute bottom-0 right-0 w-full h-px bg-cyber-pink animate-circuit-flow" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-0 right-0 w-px h-full bg-cyber-pink animate-circuit-flow" style={{ animationDelay: '1.5s' }} />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <SplashScreen />
        <MultiStepForm />
      </div>
    </main>
  )
}
