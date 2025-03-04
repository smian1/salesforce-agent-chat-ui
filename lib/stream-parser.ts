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
 * 
 * Based on the Salesforce documentation, the API returns events in the following format:
 * - TextChunk: Contains a chunk of text from the response (used for streaming)
 * - ProgressIndicator: Indicates that a response is in progress
 * - Inform: Contains the complete message (we ignore this to avoid duplication)
 * - EndOfTurn: Indicates that the response is complete
 */
export function transformSalesforceStream(stream: ReadableStream): ReadableStream<EventData> {
  // Create a TextDecoder to convert Uint8Array chunks to strings
  const decoder = new TextDecoder();
  
  // Create a buffer to hold partial data
  let buffer = '';
  
  // Track the last message to prevent duplicates
  let lastMessageContent = '';
  
  // Create a transform stream to process the incoming data
  const transform = new TransformStream({
    transform(chunk, controller) {
      // Decode the chunk and add it to our buffer
      buffer += decoder.decode(chunk, { stream: true });
      
      // Process the buffer line by line
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last line in the buffer (it might be incomplete)
      
      let currentEventData = '';
      
      for (const line of lines) {
        // Skip empty lines
        if (!line.trim()) continue;
        
        // Check if this is a data line (SSE format)
        if (line.startsWith('data:')) {
          currentEventData = line.substring(5).trim();
          
          try {
            // Parse the JSON data
            const jsonData = JSON.parse(currentEventData);
            console.log('Debug - Parsed event data:', jsonData);
            
            // Check if we have a message object
            if (jsonData.message) {
              const messageObj = jsonData.message;
              const messageContent = messageObj.message || '';
              
              // Handle different message types based on Salesforce documentation
              switch (messageObj.type) {
                case 'TextChunk':
                  // Text chunk contains a piece of the response
                  // Only send if it's not a duplicate of the last message
                  if (messageContent !== lastMessageContent) {
                    controller.enqueue({
                      type: 'Text',
                      text: messageContent
                    });
                    lastMessageContent = messageContent;
                  }
                  break;
                  
                case 'ProgressIndicator':
                  // Progress indicator shows the agent is working
                  controller.enqueue({
                    type: 'Progress',
                    text: messageContent || 'Working on it...'
                  });
                  break;
                  
                case 'Inform':
                  // Inform contains the complete message
                  // We ignore this event type to avoid duplication with TextChunks
                  // This simplifies our logic and provides a better streaming experience
                  console.log('Ignoring Inform event to prevent duplication:', messageContent);
                  break;
                  
                case 'EndOfTurn':
                  // End of turn indicates the response is complete
                  controller.enqueue({
                    type: 'EndOfResponse'
                  });
                  // Reset the last message tracking after end of turn
                  lastMessageContent = '';
                  break;
                  
                default:
                  // For any other message type, try to extract useful text
                  if (messageContent && messageContent !== lastMessageContent) {
                    // Check if this looks like a progress indicator
                    if (messageObj.indicatorType === 'ACTION' || 
                        /^(Digging into|Looking up|Searching for|Analyzing|Checking|Working on)/i.test(messageContent)) {
                      controller.enqueue({
                        type: 'Progress',
                        text: messageContent
                      });
                    } else {
                      controller.enqueue({
                        type: 'Text',
                        text: messageContent
                      });
                      lastMessageContent = messageContent;
                    }
                  }
              }
            }
          } catch (e) {
            console.error('Error parsing JSON data:', e, 'Raw data:', currentEventData);
            
            // If JSON parsing fails, try to send the raw data
            if (currentEventData) {
              controller.enqueue({
                type: 'Text',
                text: `[Parsing Error] ${currentEventData}`
              });
            }
          }
          
          // Reset for next event
          currentEventData = '';
        }
      }
    },
    
    flush(controller) {
      // Process any remaining data in the buffer
      if (buffer.trim()) {
        try {
          const jsonData = JSON.parse(buffer);
          if (jsonData.message && jsonData.message.message && jsonData.message.type !== 'Inform') {
            // Only process non-Inform messages in the flush
            const messageContent = jsonData.message.message;
            if (messageContent !== lastMessageContent) {
              controller.enqueue({
                type: 'Text',
                text: messageContent
              });
            }
          }
        } catch (e) {
          // If parsing fails, send the raw buffer
          controller.enqueue({
            type: 'Text',
            text: buffer.trim()
          });
        }
      }
      
      // Send end of response if we haven't already
      controller.enqueue({
        type: 'EndOfResponse'
      });
      // Reset the tracking variables
      lastMessageContent = '';
    }
  });
  
  // Pipe the input stream through our transform
  return stream.pipeThrough(transform);
} 