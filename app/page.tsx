import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
      <div className="w-full max-w-4xl text-center">
        {/* Profile Image - Circular */}
        <div className="relative w-32 h-32 mx-auto mb-8 rounded-full overflow-hidden border-4 border-primary shadow-lg">
          {/* Profile image */}
          <Image 
            src="/profile.png" 
            alt="Salman's Profile" 
            fill 
            className="object-cover"
          />
        </div>
        
        <h1 className="text-4xl font-bold text-primary mb-6">
          Salman Agent
        </h1>
        <p className="text-xl text-foreground mb-8">
          Chat with my agent to interact and ask questions about me
        </p>
        
        <Link 
          href="/chat" 
          className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium text-white bg-primary rounded-md shadow-md hover:bg-accent transition-colors duration-200"
        >
          Start Chatting
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 ml-2" 
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
      
      <footer className="mt-16 text-center text-muted-foreground">
        <p>Powered by Salesforce AgentForce API</p>
      </footer>
    </div>
  )
} 