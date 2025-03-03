/**
 * Salesforce Agent Client
 * 
 * A TypeScript client for interacting with Salesforce Agent API using streaming responses
 */

// Define types for our responses
export type AgentMessage = {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
};

export type SessionInfo = {
  sessionId: string;
  initialMessage?: string;
};

export class SalesforceAgentClient {
  private botId: string;
  private afpApiUrl: string;
  private coreUrl: string;
  private clientId: string;
  private clientSecret: string;
  
  private accessToken: string | null = null;
  private sessionId: string | null = null;
  private headers: Record<string, string> = {};
  private sequenceCounter: number;

  constructor() {
    // Load credentials from environment variables
    this.botId = process.env.BOT_ID || '';
    this.afpApiUrl = process.env.AFP_API_URL || '';
    this.coreUrl = process.env.CORE_URL || '';
    this.clientId = process.env.CLIENT_ID || '';
    this.clientSecret = process.env.CLIENT_SECRET || '';
    
    // Initialize counter for generating message IDs
    this.sequenceCounter = Date.now();
    
    // Check if all environment variables are loaded
    if (!this.botId || !this.afpApiUrl || !this.coreUrl || !this.clientId || !this.clientSecret) {
      throw new Error("Missing required environment variables");
    }
  }

  /**
   * Get OAuth token using client credentials flow
   */
  async getOAuthToken(): Promise<string> {
    console.log("Authenticating with Salesforce...");
    
    // Construct the OAuth token endpoint URL
    const tokenUrl = `${this.coreUrl}/services/oauth2/token`;
    
    // Prepare the request payload
    const payload = new URLSearchParams({
      'grant_type': 'client_credentials',
      'client_id': this.clientId,
      'client_secret': this.clientSecret
    });
    
    // Make the request to get the token
    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: payload
      });
      
      if (!response.ok) {
        throw new Error(`Authentication failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Store the access token
      this.accessToken = data.access_token;
      
      if (!this.accessToken) {
        throw new Error("Failed to get access token from response");
      }
      
      // Update the headers with the new token
      this.headers = {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      };
      
      console.log("Successfully authenticated with Salesforce");
      return this.accessToken;
    } catch (error) {
      console.error("Error getting OAuth token:", error);
      throw error;
    }
  }

  /**
   * Start a new chat session
   */
  async startChatSession(): Promise<SessionInfo> {
    // Make sure we have a valid token
    if (!this.accessToken) {
      await this.getOAuthToken();
    }
    
    try {
      // Construct the session URL - using the correct endpoint format
      const sessionUrl = `${this.afpApiUrl}/einstein/ai-agent/v1/agents/${this.botId}/sessions`;
      
      // Generate a random UUID for session key
      const sessionKey = crypto.randomUUID();
      
      // Prepare the request payload with streaming capabilities
      const payload = {
        externalSessionKey: sessionKey,
        instanceConfig: {
          endpoint: this.coreUrl
        },
        streamingCapabilities: {
          chunkTypes: ["Text"]
        },
        bypassUser: true
      };
      
      console.log(`Making session request to: ${sessionUrl}`);
      console.log(`With payload: ${JSON.stringify(payload)}`);
      
      // Make the request to start a session
      const response = await fetch(sessionUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        console.error(`Failed to start session: ${response.status}`);
        console.error(`Response: ${await response.text()}`);
        throw new Error(`Failed to start session with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Session response: ${JSON.stringify(data)}`);
      
      // Store the session ID
      const conversationId: string = data.sessionId;
      if (!conversationId) {
        throw new Error("Failed to get a valid session ID from the response");
      }
      
      this.sessionId = conversationId;
      
      // Check for initial messages
      let initialMessage = undefined;
      if (data.messages && data.messages.length > 0) {
        initialMessage = data.messages[0].message;
      }
      
      console.log(`Session started with ID: ${this.sessionId}`);
      
      return {
        sessionId: this.sessionId,
        initialMessage
      };
    } catch (error) {
      console.error("Error starting chat session:", error);
      throw error;
    }
  }

  /**
   * Send a message and get a streaming response
   */
  async sendMessageStreaming(sessionId: string, messageText: string): Promise<ReadableStream> {
    // Make sure we have a valid token
    if (!this.accessToken) {
      await this.getOAuthToken();
    }
    
    this.sessionId = sessionId;
    
    try {
      // Increment the sequence counter for this message
      this.sequenceCounter += 1;
      
      // Construct the streaming message endpoint URL
      const streamUrl = `${this.afpApiUrl}/einstein/ai-agent/v1/sessions/${this.sessionId}/messages/stream`;
      
      // Prepare the request payload according to the correct format
      const payload = {
        message: {
          sequenceId: this.sequenceCounter,
          type: "Text",
          text: messageText
        },
        variables: []
      };
      
      console.log(`Sending streaming message to: ${streamUrl}`);
      console.log(`With payload: ${JSON.stringify(payload)}`);
      
      // Set up headers for SSE request
      const sseHeaders = {
        ...this.headers,
        'Accept': 'text/event-stream'
      };
      
      // Make the request to send a message and get a streaming response
      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: sseHeaders,
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        console.error(`Failed to send streaming message: ${response.status}`);
        console.error(`Response: ${await response.text()}`);
        throw new Error(`Failed to send message with status: ${response.status}`);
      }
      
      return response.body as ReadableStream;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  /**
   * Close an existing chat session
   */
  async closeSession(sessionId: string): Promise<void> {
    // Make sure we have a valid token
    if (!this.accessToken) {
      await this.getOAuthToken();
    }
    
    try {
      // Construct the session URL for closing
      const closeUrl = `${this.afpApiUrl}/einstein/ai-agent/v1/sessions/${sessionId}`;
      
      console.log(`Closing session at: ${closeUrl}`);
      
      // Make the request to close the session
      const response = await fetch(closeUrl, {
        method: 'DELETE',
        headers: this.headers
      });
      
      if (!response.ok) {
        console.error(`Failed to close session: ${response.status}`);
        console.error(`Response: ${await response.text()}`);
        throw new Error(`Failed to close session with status: ${response.status}`);
      }
      
      console.log(`Session ${sessionId} closed successfully`);
      this.sessionId = null;
    } catch (error) {
      console.error("Error closing session:", error);
      throw error;
    }
  }
} 