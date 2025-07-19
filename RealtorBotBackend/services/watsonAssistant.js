const axios = require('axios');

class WatsonAssistantService {
  constructor() {
    this.apiKey = process.env.WATSONX_ASSISTANT_API_KEY;
    this.serviceUrl = process.env.WATSONX_ASSISTANT_URL;
    this.environmentId = process.env.WATSONX_ASSISTANT_ID; // This is your environment ID (Live or Draft)
    this.sessionId = null;
    this.apiVersion = '2024-10-01';
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
      const url = `${this.serviceUrl.replace(/\/instances\/.+$/, '')}/v2/assistants/${this.environmentId}/sessions?version=${this.apiVersion}`;
      const response = await axios.post(url, {}, this.getAuthConfig());
      this.sessionId = response.data.session_id;
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
      const url = `${this.serviceUrl.replace(/\/instances\/.+$/, '')}/v2/assistants/${this.environmentId}/sessions/${sessionToUse}/message?version=${this.apiVersion}`;
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
        const url = `${this.serviceUrl.replace(/\/instances\/.+$/, '')}/v2/assistants/${this.environmentId}/sessions/${sessionToUse}?version=${this.apiVersion}`;
        await axios.delete(url, this.getAuthConfig());
      }
      return { success: true };
    } catch (error) {
      console.error('Failed to delete Watsonx Assistant session:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }
}

module.exports = new WatsonAssistantService(); // Test comment for git
