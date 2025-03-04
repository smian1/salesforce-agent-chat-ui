import { NextRequest } from 'next/server'
import { SalesforceAgentClient } from '@/lib/salesforce-agent-client'
import { transformSalesforceStream } from '@/lib/stream-parser'

// Store active client instances
const activeClients: Record<string, SalesforceAgentClient> = {}

// GET handler for streaming messages
export async function GET(request: NextRequest) {
  // Get the session ID and message from the query parameters
  const sessionId = request.nextUrl.searchParams.get('sessionId')
  const message = request.nextUrl.searchParams.get('message')
  
  if (!sessionId || !message) {
    return new Response(
      JSON.stringify({ error: 'Session ID and message are required' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
  
  try {
    // Get an existing client or create a new one
    let client = activeClients[sessionId]
    
    if (!client) {
      // Create a new client instance if one doesn't exist for this session
      // This can happen if the server was restarted
      client = new SalesforceAgentClient()
      
      // Get the OAuth token
      await client.getOAuthToken()
      
      // Store the client
      activeClients[sessionId] = client
    }
    
    // Send the message and get the raw streaming response
    // Note: The client already sets the Accept: text/event-stream header
    const rawStream = await client.sendMessageStreaming(sessionId, message)
    
    // Transform the raw stream into parsed events
    const transformedStream = transformSalesforceStream(rawStream)
    
    // Create a new ReadableStream that converts the events into SSE format
    const sseStream = new ReadableStream({
      start(controller) {
        const reader = transformedStream.getReader()
        
        // Track if we've sent an EndOfResponse event
        let endOfResponseSent = false
        
        function pushEvent() {
          reader.read().then(({ done, value }) => {
            if (done) {
              // End of stream
              controller.close()
              return
            }
            
            // Log the event for debugging
            console.log('Sending SSE event:', value)
            
            // For EndOfResponse events, only send one
            if (value.type === 'EndOfResponse') {
              if (!endOfResponseSent) {
                const event = `data: ${JSON.stringify(value)}\n\n`
                controller.enqueue(new TextEncoder().encode(event))
                endOfResponseSent = true
              }
            } else {
              // For all other events, send normally
              const event = `data: ${JSON.stringify(value)}\n\n`
              controller.enqueue(new TextEncoder().encode(event))
            }
            
            // Read the next chunk
            pushEvent()
          }).catch(error => {
            console.error('Error reading from stream:', error)
            
            // Send error as an SSE event
            const errorEvent = `data: ${JSON.stringify({ 
              type: 'Error', 
              error: 'Error processing message' 
            })}\n\n`
            
            controller.enqueue(new TextEncoder().encode(errorEvent))
            
            // Send end of response to ensure client knows the stream is done
            if (!endOfResponseSent) {
              const endEvent = `data: ${JSON.stringify({ 
                type: 'EndOfResponse'
              })}\n\n`
              
              controller.enqueue(new TextEncoder().encode(endEvent))
              endOfResponseSent = true
            }
            
            // Close the stream after error
            controller.close()
          })
        }
        
        // Start reading from the stream
        pushEvent()
      }
    })
    
    // Return the stream as an SSE response with appropriate headers
    return new Response(sseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('Error processing message:', error)
    
    // Return an error response
    return new Response(
      JSON.stringify({
        error: error.message || 'Error processing message'
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