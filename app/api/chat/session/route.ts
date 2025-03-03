import { NextRequest } from 'next/server'
import { SalesforceAgentClient } from '@/lib/salesforce-agent-client'

// Store active client instances
const activeClients: Record<string, SalesforceAgentClient> = {}

// POST handler for starting a session
export async function POST(request: NextRequest) {
  try {
    // Create a new client instance
    const client = new SalesforceAgentClient()
    
    // Start a new chat session
    const sessionInfo = await client.startChatSession()
    
    // Store the client instance
    activeClients[sessionInfo.sessionId] = client
    
    // Return the session ID and initial message
    return new Response(
      JSON.stringify({
        sessionId: sessionInfo.sessionId,
        initialMessage: sessionInfo.initialMessage,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error: any) {
    console.error('Error starting chat session:', error)
    
    // Return an error response
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to start chat session',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}

// DELETE handler for closing a session
export async function DELETE(request: NextRequest) {
  // Get the session ID from the query parameters
  const sessionId = request.nextUrl.searchParams.get('sessionId')
  
  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: 'Session ID is required' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
  
  try {
    const client = activeClients[sessionId]
    
    if (!client) {
      // If client not found in the active clients object, create a new one
      // This can happen if the server was restarted
      const newClient = new SalesforceAgentClient()
      await newClient.closeSession(sessionId)
    } else {
      // Close the session using the existing client
      await client.closeSession(sessionId)
      // Remove the client from the active clients
      delete activeClients[sessionId]
    }
    
    // Return a success response
    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error: any) {
    console.error('Error closing chat session:', error)
    
    // Return an error response
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to close chat session',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
} 