const axios = require('axios');

class WatsonAssistantService {
  constructor() {
    this.apiKey = process.env.WATSONX_ASSISTANT_API_KEY;
    this.serviceUrl = process.env.WATSONX_ASSISTANT_URL;
    this.environmentId = process.env.WATSONX_ASSISTANT_ID; // This is your environment ID (Live or Draft)
    this.sessionId = null;
    this.apiVersion = '2021-11-27';
  }

  // Helper to get auth config for axios
  getAuthConfig() {
    return {
      auth: {
        username: 'apikey',
        password: this.apiKey,
      },
    };
  }

  // Create a new session
  async createSession() {
    try {
      // Extract the base URL from the service URL
      const baseUrl = this.serviceUrl.replace(/\/instances\/.+$/, '');
      const url = `${baseUrl}/v2/assistants/${this.environmentId}/sessions?version=${this.apiVersion}`;
      
      console.log('Creating session with URL:', url);
      console.log('Environment ID:', this.environmentId);
      
      const response = await axios.post(url, {}, this.getAuthConfig());
      this.sessionId = response.data.session_id;
      
      console.log('Session created successfully:', this.sessionId);
      return { success: true, sessionId: this.sessionId };
    } catch (error) {
      console.error('Failed to create Watsonx Assistant session:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }

  // Send a message to Watsonx Assistant
  async sendMessage(message, sessionId = null) {
    try {
      const sessionToUse = sessionId || this.sessionId;
      if (!sessionToUse) {
        const sessionResult = await this.createSession();
        if (!sessionResult.success) {
          return sessionResult;
        }
      }
      
      // Extract the base URL from the service URL
      const baseUrl = this.serviceUrl.replace(/\/instances\/.+$/, '');
      const url = `${baseUrl}/v2/assistants/${this.environmentId}/sessions/${sessionToUse}/message?version=${this.apiVersion}`;
      
      console.log('Sending message to URL:', url);
      console.log('Message:', message);
      console.log('Session ID:', sessionToUse);
      
      const response = await axios.post(
        url,
        {
          input: {
            message_type: 'text',
            text: message,
          },
        },
        this.getAuthConfig()
      );
      
      console.log('Assistant response received:', {
        hasOutput: !!response.data.output,
        hasActions: !!(response.data.output && response.data.output.actions),
        actionsCount: response.data.output?.actions?.length || 0,
        hasGeneric: !!(response.data.output && response.data.output.generic),
        genericCount: response.data.output?.generic?.length || 0
      });
      
      return {
        success: true,
        response: response.data,
        sessionId: sessionToUse,
      };
    } catch (error) {
      console.error('Failed to send message to Watsonx Assistant:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }

  // Delete a session
  async deleteSession(sessionId = null) {
    try {
      const sessionToUse = sessionId || this.sessionId;
      if (sessionToUse) {
        const baseUrl = this.serviceUrl.replace(/\/instances\/.+$/, '');
        const url = `${baseUrl}/v2/assistants/${this.environmentId}/sessions/${sessionToUse}?version=${this.apiVersion}`;
        await axios.delete(url, this.getAuthConfig());
      }
      return { success: true };
    } catch (error) {
      console.error('Failed to delete Watsonx Assistant session:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }
}

module.exports = new WatsonAssistantService(); 