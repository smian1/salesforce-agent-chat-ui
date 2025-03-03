import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-dark relative overflow-hidden">
      {/* Background elements */}
      <div 
        className="absolute inset-0 z-0 overflow-hidden"
        style={{ 
          backgroundImage: `radial-gradient(circle at 20% 30%, hsla(263, 70%, 50%, 0.15), transparent 20%), 
                           radial-gradient(circle at 75% 15%, hsla(199, 89%, 48%, 0.1), transparent 20%),
                           radial-gradient(circle at 85% 80%, hsla(283, 70%, 40%, 0.1), transparent 30%)`,
        }}
      >
        {/* More subtle, modern pattern */}
        <div className="absolute inset-0 z-0 opacity-10" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '30px 30px'
          }}
        ></div>
      </div>
      
      {/* Floating orbs */}
      <div className="absolute inset-0 z-0 opacity-30 overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => (
          <div 
            key={i}
            className={`absolute rounded-full ${i % 2 === 0 ? 'bg-primary animate-pulse-glow' : 'bg-secondary glow-secondary'}`}
            style={{
              width: `${Math.random() * 2.5 + 0.5}rem`,
              height: `${Math.random() * 2.5 + 0.5}rem`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.25,
              animation: `float ${Math.random() * 8 + 5}s ease-in-out infinite, pulse ${Math.random() * 4 + 3}s infinite`,
              animationDelay: `${Math.random() * 5}s`,
              filter: 'blur(4px)'
            }}
          />
        ))}
      </div>

      {/* Main content with glass card */}
      <div className="w-full max-w-4xl text-center p-4 md:p-8 z-10">
        {/* Profile Image with glow and animation */}
        <div className="relative w-28 h-28 md:w-40 md:h-40 mx-auto mb-6 md:mb-8 rounded-full overflow-hidden border-4 border-white/10 glow animate-float shadow-lg">
          <Image 
            src="/profile.png" 
            alt="Salesforce Agent Profile" 
            fill 
            className="object-cover"
          />
        </div>
        
        <div className="glass rounded-2xl p-4 md:p-8 border border-white/10 glow-subtle">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 text-white glow-text">
            Salesforce Agent
          </h1>
          
          <p className="text-lg md:text-xl text-foreground/90 mb-6 md:mb-8 max-w-2xl mx-auto">
            Chat with this agent to interact and ask questions
          </p>
          
          <Link 
            href="/chat" 
            className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 text-base md:text-lg font-medium text-white bg-gradient-secondary rounded-full shadow-md hover:opacity-90 transition-all duration-300 glow-secondary hover:glow animate-pulse-glow"
          >
            Start Chatting
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 md:h-6 md:w-6 ml-2" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </Link>
        </div>

        {/* Decorative circles */}
        <div className="absolute top-1/4 left-1/6 w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-primary opacity-20 blur-xl"></div>
        <div className="absolute bottom-1/4 right-1/6 w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-secondary opacity-20 blur-xl"></div>
      </div>
      
      {/* Powered by footer */}
      <div className="absolute bottom-4 left-0 w-full text-center z-10">
        <div className="inline-flex items-center justify-center glass px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-white/10 text-xs">
          <span className="text-white/70 mr-1.5">Powered by</span>
          <Image 
            src="/agentforce.png" 
            alt="Salesforce AgentForce" 
            width={20} 
            height={20}
            className="mr-1"
          />
          <span className="font-medium text-white/80">Salesforce AgentForce</span>
        </div>
      </div>
    </div>
  )
} 