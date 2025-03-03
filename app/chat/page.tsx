'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, RefreshCw } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

// Define message type
type Message = {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: Date
  isProgress?: boolean
}

export default function ChatPage() {
  // State for messages and input
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  
  // Ref for message container to auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // Initialize chat session when component mounts
  useEffect(() => {
    initSession()
  }, [])
  
  // Function to initialize a new chat session
  const initSession = async () => {
    try {
      setIsLoading(true)
      setMessages([]) // Clear existing messages
      
      const response = await fetch('/api/chat/session', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to start chat session')
      }
      
      const data = await response.json()
      setSessionId(data.sessionId)
      
      // Add initial message if available
      if (data.initialMessage) {
        setMessages([
          {
            id: '0',
            role: 'agent',
            content: data.initialMessage,
            timestamp: new Date(),
          },
        ])
      }
      
      setIsConnected(true)
    } catch (error) {
      console.error('Error starting chat session:', error)
      setMessages([
        {
          id: 'error',
          role: 'agent',
          content: 'Failed to connect to Salesforce Agent. Please try again later.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }
  
  // Cleanup function to close session
  useEffect(() => {
    return () => {
      if (sessionId) {
        fetch(`/api/chat/session?sessionId=${sessionId}`, {
          method: 'DELETE',
        }).catch(err => console.error('Error closing session:', err))
      }
    }
  }, [sessionId])
  
  // Handle sending a message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim() || !sessionId || isLoading) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }
    
    // Add user message to state
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    
    try {
      // Create a unique ID for this response
      const responseId = Date.now().toString() + '-response'
      
      // Add a placeholder for the agent's response
      setMessages(prev => [
        ...prev,
        {
          id: responseId,
          role: 'agent',
          content: '',
          timestamp: new Date(),
          isProgress: false
        },
      ])
      
      // Set up event source for streaming response
      const eventSource = new EventSource(`/api/chat/message?sessionId=${sessionId}&message=${encodeURIComponent(input)}`)
      
      // Track the current response ID
      let currentResponseId = responseId
      let hasProgressIndicator = false
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('Received event:', data)
          
          if (data.type === 'Progress') {
            // For progress indicators, update the message with the progress text
            hasProgressIndicator = true
            setMessages(prev => 
              prev.map(msg => 
                msg.id === currentResponseId 
                  ? { ...msg, content: data.text || 'Working on it...', isProgress: true } 
                  : msg
              )
            )
          } else if (data.type === 'Text') {
            // For text chunks, either replace the progress indicator or append to existing content
            if (hasProgressIndicator) {
              // Replace progress indicator with actual content
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === currentResponseId 
                    ? { ...msg, content: data.text || '', isProgress: false } 
                    : msg
                )
              )
              hasProgressIndicator = false
            } else {
              // Append to the current message
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === currentResponseId 
                    ? { ...msg, content: msg.content + (data.text || ''), isProgress: false } 
                    : msg
                )
              )
            }
          } else if (data.type === 'EndOfResponse') {
            // Close the event source when the response is complete
            eventSource.close()
            setIsLoading(false)
            
            // Make sure the final message is not marked as in progress
            setMessages(prev => 
              prev.map(msg => 
                msg.id === currentResponseId 
                  ? { ...msg, isProgress: false } 
                  : msg
              )
            )
          }
        } catch (error) {
          console.error('Error parsing event data:', error)
        }
      }
      
      eventSource.onerror = (error) => {
        console.error('EventSource error:', error)
        eventSource.close()
        setIsLoading(false)
        
        // Update the agent's message with an error
        setMessages(prev => 
          prev.map(msg => 
            msg.id === responseId 
              ? { ...msg, content: msg.content || 'Error receiving response. Please try again.', isProgress: false } 
              : msg
          )
        )
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setIsLoading(false)
      
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString() + '-error',
          role: 'agent',
          content: 'Failed to send message. Please try again.',
          timestamp: new Date(),
        },
      ])
    }
  }
  
  return (
    <div className="flex flex-col h-screen bg-gradient-dark relative">
      {/* Futuristic animated background */}
      <div 
        className="absolute inset-0 z-0 overflow-hidden"
        style={{ 
          backgroundImage: `radial-gradient(circle at 20% 30%, hsla(263, 70%, 50%, 0.15), transparent 20%), 
                            radial-gradient(circle at 75% 15%, hsla(199, 89%, 48%, 0.1), transparent 20%),
                            radial-gradient(circle at 85% 80%, hsla(283, 70%, 40%, 0.1), transparent 30%)`,
        }}
      >
        {/* Neural network background pattern - replaced with more subtle, modern pattern */}
        <div className="absolute inset-0 z-0 opacity-10" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '30px 30px'
          }}
        ></div>
      </div>
      
      {/* Floating orbs with improved animation */}
      <div className="absolute inset-0 z-0 opacity-30 overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
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
      
      {/* Header - updated with glassmorphism */}
      <header className="glass z-10 shadow-md bg-gradient-primary animate-gradient border-b border-white/10">
        <div className="container mx-auto flex items-center justify-between p-3 md:p-4">
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden glow-subtle transition-all duration-300 group-hover:glow">
                <Image 
                  src="/profile.png" 
                  alt="Salesforce Agent Logo" 
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <h1 className="text-lg md:text-xl font-bold ml-2 md:ml-3 text-white">Salesforce Agent</h1>
            </Link>
          </div>
          
          <div className="flex items-center">
            {/* Connection status */}
            <div className="text-xs md:text-sm flex items-center mr-2 md:mr-4">
              <span className={`h-2 w-2 rounded-full mr-1 md:mr-2 ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></span>
              <span className="hidden xs:inline">{isConnected ? 'Connected' : 'Disconnecting'}</span>
            </div>
            
            {/* New Chat button - completely redesigned */}
            <button 
              onClick={() => initSession()}
              disabled={isLoading}
              className="flex items-center space-x-1 bg-gradient-secondary hover:opacity-90 text-white px-2 py-1.5 md:px-4 md:py-2 rounded-full shadow-md transition-all duration-300 font-medium glow-secondary hover:glow text-xs md:text-sm"
            >
              <RefreshCw className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              <span>New Chat</span>
            </button>
          </div>
        </div>
      </header>
      
      {/* Chat container */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 container mx-auto max-w-4xl z-10">
        {messages.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="w-24 h-24 mb-6 rounded-full bg-gradient-card glass flex items-center justify-center animate-float">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-12 w-12 text-primary" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-white">Welcome!</h2>
            <p className="text-lg text-white/90">Start a conversation with Salesforce Agent</p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar - enhanced with glow and animation */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden transition-all duration-300 ${
                    message.role === 'user' 
                      ? 'bg-gradient-secondary ml-3 glow-secondary' 
                      : 'mr-3 glow'
                  } ${message.isProgress ? 'animate-pulse' : ''}`}>
                    {message.role === 'user' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <Image 
                        src="/profile.png" 
                        alt="Salesforce Agent Profile" 
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    )}
                  </div>
                  
                  {/* Message bubble - completely redesigned */}
                  <div 
                    className={`rounded-2xl px-3 py-2 md:px-4 md:py-3 shadow-lg transition-all ${
                      message.role === 'user'
                        ? 'bg-gradient-secondary text-white rounded-tr-none'
                        : message.isProgress
                          ? 'glass text-white/80 italic rounded-tl-none'
                          : 'glass text-white/90 rounded-tl-none border border-white/10'
                    }`}
                  >
                    {/* Timestamp with improved styling */}
                    <div className={`text-xs ${
                      message.role === 'user' 
                        ? 'text-primary-foreground/70 text-right' 
                        : 'text-primary-foreground/70'
                    } mb-1`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                    
                    {/* Message content with improved styling */}
                    <div className="whitespace-pre-wrap">
                      {message.content}
                      {message.isProgress && (
                        <span className="inline-flex items-center">
                          <span className="animate-pulse">.</span>
                          <span className="animate-pulse animation-delay-150">.</span>
                          <span className="animate-pulse animation-delay-300">.</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Message input - enhanced with glassmorphism */}
      <div className="border-t border-white/10 p-4 glass z-10 relative">
        <div className="container mx-auto max-w-4xl">
          <form onSubmit={sendMessage} className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                placeholder="Type your message..."
                className="w-full px-4 py-3 pb-6 rounded-full bg-white/5 border border-white/10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder-white/50"
              />
              <div className="absolute bottom-2 text-xs text-white/70 left-0 w-full text-center">
                Press Enter to send, Shift+Enter for a new line
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={`rounded-full p-3 ${
                isLoading || !input.trim() 
                  ? 'bg-white/10 text-white/50' 
                  : 'bg-gradient-primary text-white glow hover:opacity-90'
              } transition-all duration-300`}
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
        
        {/* Powered by footer - moved inside the input container */}
        <div className="w-full flex justify-center mt-2">
          <div className="inline-flex items-center justify-center glass px-3 py-1 rounded-full border border-white/10 text-xs">
            <span className="text-white/70 mr-1.5">Powered by</span>
            <Image 
              src="/agentforce.png" 
              alt="Salesforce AgentForce" 
              width={16} 
              height={16}
              className="mr-1"
            />
            <span className="font-medium text-white/80">Salesforce AgentForce</span>
          </div>
        </div>
      </div>
    </div>
  )
} 