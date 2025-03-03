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
          content: 'Failed to connect to Salman Agent. Please try again later.',
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
    <div className="flex flex-col h-screen bg-background relative">
      {/* Neural Network background pattern */}
      <div 
        className="absolute inset-0 z-0 opacity-10" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3Cpath d='M6 5V0H5v5H0v1h5v94h1V6h94V5H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '30px 30px'
        }}
      ></div>
      
      {/* Neural network animated nodes */}
      <div className="absolute inset-0 z-0 opacity-10 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-primary"
            style={{
              width: `${Math.random() * 2 + 0.5}rem`,
              height: `${Math.random() * 2 + 0.5}rem`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.25,
              animation: `pulse ${Math.random() * 4 + 3}s infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>
      
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 shadow-md z-10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <div className="relative w-10 h-10 rounded-full overflow-hidden">
                <Image 
                  src="/profile.png" 
                  alt="Salman Agent Logo" 
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <h1 className="text-xl font-bold ml-3">Salman Agent</h1>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Connection status */}
            <div className="text-sm flex items-center">
              <span className={`h-2 w-2 rounded-full mr-2 ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></span>
              <span>{isConnected ? 'Connected' : 'Disconnecting'}</span>
            </div>
            
            {/* New Chat button */}
            <button 
              onClick={() => initSession()}
              disabled={isLoading}
              className="flex items-center space-x-1 bg-accent hover:bg-accent/80 text-white text-sm px-3 py-1.5 rounded-md transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>New Chat</span>
            </button>
          </div>
        </div>
      </header>
      
      {/* Chat container */}
      <div className="flex-1 overflow-y-auto p-4 container mx-auto max-w-4xl z-10">
        {messages.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="w-24 h-24 mb-6 rounded-full bg-secondary flex items-center justify-center">
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
            <h2 className="text-2xl font-semibold mb-2 text-foreground">Welcome!</h2>
            <p className="text-lg">Start a conversation with Salman Agent</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${
                    message.role === 'user' 
                      ? 'bg-primary/10 text-primary ml-2' 
                      : 'mr-2'
                  }`}>
                    {message.role === 'user' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <Image 
                        src="/profile.png" 
                        alt="Salman's Profile" 
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    )}
                  </div>
                  
                  {/* Message bubble */}
                  <div 
                    className={`rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : message.isProgress
                          ? 'bg-secondary text-secondary-foreground italic'
                          : 'bg-card text-card-foreground border border-border'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">
                      {message.isProgress ? (
                        <div className="flex items-center">
                          <div className="mr-2 flex space-x-1">
                            <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-pulse"></div>
                            <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-pulse animation-delay-150"></div>
                            <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-pulse animation-delay-300"></div>
                          </div>
                          {message.content}
                        </div>
                      ) : (
                        message.content
                      )}
                    </div>
                    <div className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Input area */}
      <div className="border-t border-border bg-card/80 backdrop-blur-sm p-4 z-10">
        <div className="container mx-auto max-w-4xl">
          <form onSubmit={sendMessage} className="flex items-end gap-2">
            <div className="flex-1 bg-secondary/80 backdrop-blur-sm rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:bg-background transition-all duration-200">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="w-full px-4 py-3 bg-transparent focus:outline-none resize-none max-h-32 text-foreground"
                rows={1}
                disabled={isLoading || !isConnected}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim() || !isConnected}
              className="bg-primary text-primary-foreground p-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
            >
              {isLoading ? (
                <div className="animate-spin h-5 w-5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </form>
          <div className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send, Shift+Enter for a new line
          </div>
        </div>
      </div>
    </div>
  )
} 