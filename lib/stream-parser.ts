/**
 * Stream Parser Utility
 * 
 * Utility for parsing Server-Sent Events (SSE) from the Salesforce API
 */

// Use the web standard streams rather than Node.js streams
// Remove the explicit import and use the global types
// import { ReadableStream, TransformStream } from 'stream/web';

export type EventData = {
  type: 'Text' | 'Progress' | 'EndOfResponse' | 'Error';
  text?: string;
  error?: string;
};

/**
 * Transforms a ReadableStream from Salesforce into a stream of parsed events
 */
export function transformSalesforceStream(stream: ReadableStream): ReadableStream<EventData> {
  // Create a TextDecoder to convert Uint8Array chunks to strings
  const decoder = new TextDecoder();
  
  // Create a buffer to hold partial data
  let buffer = '';
  
  // Create a transform stream to process the incoming data
  const transform = new TransformStream({
    transform(chunk, controller) {
      // Decode the chunk and add it to our buffer
      buffer += decoder.decode(chunk, { stream: true });
      
      // Process the buffer line by line
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last line in the buffer (it might be incomplete)
      
      let currentEventType = '';
      let currentEventData = '';
      
      for (const line of lines) {
        console.log('Debug - Raw line:', line); // Debug logging
        
        // Check if this is an event line
        if (line.startsWith('event:')) {
          currentEventType = line.substring(7).trim();
          continue;
        }
        
        // Check if this is a data line
        if (line.startsWith('data:')) {
          currentEventData = line.substring(5).trim();
          
          // If we have both event type and data, process it
          if (currentEventType && currentEventData) {
            try {
              const jsonData = JSON.parse(currentEventData);
              console.log('Debug - Parsed data:', jsonData);
              
              // Handle different event types
              if (currentEventType === 'INFORM' && jsonData.message && jsonData.message.type === 'Inform') {
                // Check if this is a thinking/processing message or a real response
                const messageText = jsonData.message.message || '';
                
                // Detect if this is a "thinking" message like "Digging into..."
                const isThinkingMessage = /^(Digging into|Looking up|Searching for|Analyzing|Checking|Let me|I'm thinking)/i.test(messageText.trim());
                
                controller.enqueue({
                  type: isThinkingMessage ? 'Progress' : 'Text',
                  text: messageText
                });
              } 
              // Handle progress indicators
              else if (currentEventType === 'PROGRESS' || 
                      (jsonData.message && jsonData.message.type === 'ProgressIndicator')) {
                let text = '';
                if (jsonData.message && jsonData.message.message) {
                  text = jsonData.message.message;
                } else if (jsonData.message && jsonData.message.type === 'ProgressIndicator') {
                  text = 'Processing...';
                }
                
                controller.enqueue({
                  type: 'Progress',
                  text
                });
              } 
              // Handle end of turn
              else if (currentEventType === 'END_OF_TURN' || 
                      (jsonData.message && jsonData.message.type === 'EndOfTurn')) {
                controller.enqueue({
                  type: 'EndOfResponse'
                });
              }
              
            } catch (e) {
              console.error('Error parsing JSON data:', e);
              
              // If JSON parsing fails, try to extract text using regex
              if (currentEventType === 'INFORM' || currentEventType === 'PROGRESS') {
                // Try to extract any meaningful text
                const text = currentEventData.replace(/[{}"\\]/g, '').trim();
                if (text) {
                  // Detect if this is a "thinking" message
                  const isThinkingMessage = /^(Digging into|Looking up|Searching for|Analyzing|Checking|Let me|I'm thinking)/i.test(text.trim());
                  
                  controller.enqueue({
                    type: isThinkingMessage ? 'Progress' : 'Text',
                    text
                  });
                }
              }
            }
            
            // Reset for next event
            currentEventType = '';
            currentEventData = '';
          }
        } else if (line.trim() === '') {
          // Empty line signals the end of an event
          currentEventType = '';
          currentEventData = '';
        }
      }
      
      // Check for fallback patterns if we don't find standard SSE format
      if (buffer.length > 0) {
        // Pattern 1: Look for text chunks in the standard format
        const textChunkRegex = /Agent \((?:streaming|simple streaming)\): (.+?)(?=\n|$)/g;
        let match;
        let foundMatch = false;
        
        while ((match = textChunkRegex.exec(buffer)) !== null) {
          const text = match[1];
          
          controller.enqueue({
            type: 'Text',
            text
          });
          
          foundMatch = true;
        }
        
        // If we didn't find a match with the first pattern, try other patterns
        if (!foundMatch) {
          // Pattern 2: Look for any text after "Agent:" with or without spaces
          const agentTextRegex = /Agent:?\s*(.+?)(?=\n|$)/;
          const agentMatch = buffer.match(agentTextRegex);
          
          if (agentMatch && agentMatch[1]) {
            const text = agentMatch[1].trim();
            
            controller.enqueue({
              type: 'Text',
              text
            });
          } 
          // Pattern 3: If the output contains "(simple streaming):" or similar, extract the actual content
          else if (buffer.includes('(simple streaming):')) {
            // Try to get content after the marker
            const parts = buffer.split('(simple streaming):');
            if (parts.length > 1) {
              const text = parts[1].trim();
              
              // Only send if there's actual content
              if (text) {
                controller.enqueue({
                  type: 'Text',
                  text
                });
              }
            }
          }
        }
        
        // Clear the buffer if we've processed it
        if (foundMatch) {
          buffer = '';
        }
      }
    },
    
    flush(controller) {
      // Process any remaining data in the buffer
      if (buffer.trim()) {
        controller.enqueue({
          type: 'Text',
          text: buffer.trim()
        });
      }
      
      // Send end of response if we haven't already
      controller.enqueue({
        type: 'EndOfResponse'
      });
    }
  });
  
  // Pipe the input stream through our transform
  return stream.pipeThrough(transform);
} 