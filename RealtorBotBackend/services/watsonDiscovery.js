const axios = require('axios');
const https = require('https');

class WatsonDiscoveryService {
  constructor() {
    this.baseURL = process.env.WATSON_DISCOVERY_URL;
    this.port = process.env.WATSON_DISCOVERY_PORT;
    this.username = process.env.WATSON_DISCOVERY_USERNAME;
    this.password = process.env.WATSON_DISCOVERY_PASSWORD;
    
    // Create axios instance with basic auth and SSL certificate handling
    this.client = axios.create({
      baseURL: `${this.baseURL}:${this.port}`,
      auth: {
        username: this.username,
        password: this.password
      },
      headers: {
        'Content-Type': 'application/json'
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // Allow self-signed certificates
      })
    });
  }

  // Test connection to Watsonx Discovery
  async testConnection() {
    try {
      const response = await this.client.get('/');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Watsonx Discovery connection failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Index a document (create or update)
  async indexDocument(collection, document) {
    try {
      const response = await this.client.post(`/${collection}/_doc/${document.id}`, document);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Index document failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Search documents
  async searchDocuments(collection, query, filters = {}) {
    try {
      const searchBody = {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: query,
                  fields: ['title^2', 'description', 'address', 'features']
                }
              }
            ],
            filter: []
          }
        },
        sort: [
          { '_score': { order: 'desc' } },
          { 'created_at': { order: 'desc' } }
        ],
        size: 20
      };

      // Add filters
      if (filters.price_min || filters.price_max) {
        const priceFilter = { range: { price: {} } };
        if (filters.price_min) priceFilter.range.price.gte = filters.price_min;
        if (filters.price_max) priceFilter.range.price.lte = filters.price_max;
        searchBody.query.bool.filter.push(priceFilter);
      }

      if (filters.status) {
        searchBody.query.bool.filter.push({ term: { status: filters.status } });
      }

      if (filters.seller_id) {
        searchBody.query.bool.filter.push({ term: { seller_id: filters.seller_id } });
      }

      const response = await this.client.post(`/${collection}/_search`, searchBody);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Search documents failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Search users by email (specific method for user authentication)
  async searchUserByEmail(collection, email) {
    try {
      // Use match query for better compatibility with different field mappings
      const searchBody = {
        query: {
          match: {
            email: email
          }
        },
        size: 10  // Get more results to handle potential duplicates
      };

      console.log('Searching for user with email:', email);
      console.log('Search body:', JSON.stringify(searchBody, null, 2));

      const response = await this.client.post(`/${collection}/_search`, searchBody);
      
      console.log('Search response:', JSON.stringify(response.data, null, 2));
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Search user by email failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get document by ID
  async getDocument(collection, id) {
    try {
      const response = await this.client.get(`/${collection}/_doc/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get document failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Delete document
  async deleteDocument(collection, id) {
    try {
      const response = await this.client.delete(`/${collection}/_doc/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Delete document failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Update document
  async updateDocument(collection, id, updates) {
    try {
      const response = await this.client.post(`/${collection}/_update/${id}`, {
        doc: updates
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Update document failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get all documents (with pagination)
  async getAllDocuments(collection, page = 1, size = 10) {
    try {
      const from = (page - 1) * size;
      const response = await this.client.post(`/${collection}/_search`, {
        query: { match_all: {} },
        sort: [{ 'created_at': { order: 'desc' } }],
        from: from,
        size: size
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get all documents failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Create collection (if it doesn't exist)
  async createCollection(collectionName) {
    try {
      const response = await this.client.put(`/${collectionName}`, {
        mappings: {
          properties: {
            id: { type: 'keyword' },
            created_at: { type: 'date' },
            updated_at: { type: 'date' }
          }
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Create collection failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Ensure users collection exists with proper mappings
  async ensureUsersCollection() {
    try {
      console.log('Ensuring users collection exists...');
      
      // First, try to get the existing collection to check if it exists
      try {
        const existingCollection = await this.client.get('/users');
        console.log('Users collection already exists');
        return { success: true, data: existingCollection.data, exists: true };
      } catch (error) {
        if (error.response && error.response.status === 404) {
          // Collection doesn't exist, create it
          console.log('Users collection does not exist, creating...');
        } else {
          // Some other error, re-throw
          throw error;
        }
      }
      
      // Create new collection with proper mapping
      const response = await this.client.put(`/users`, {
        mappings: {
          properties: {
            id: { type: 'keyword' },
            email: { type: 'keyword' },
            password: { type: 'text' },
            role: { type: 'keyword' },
            created_at: { type: 'date' },
            updated_at: { type: 'date' }
          }
        }
      });
      
      console.log('Users collection created successfully');
      return { success: true, data: response.data, exists: false };
    } catch (error) {
      console.error('Ensure users collection failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Recreate users collection with proper mapping
  async recreateUsersCollection() {
    try {
      console.log('Recreating users collection...');
      
      // Delete existing collection if it exists
      try {
        await this.client.delete('/users');
        console.log('Deleted existing users collection');
      } catch (error) {
        console.log('No existing users collection to delete');
      }
      
      // Create new collection with proper mapping
      const response = await this.client.put(`/users`, {
        mappings: {
          properties: {
            id: { type: 'keyword' },
            email: { type: 'keyword' },
            password: { type: 'text' },
            role: { type: 'keyword' },
            created_at: { type: 'date' },
            updated_at: { type: 'date' }
          }
        }
      });
      
      console.log('Created new users collection with proper mapping');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Recreate users collection failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Ensure tours collection exists with proper mappings
  async ensureToursCollection() {
    try {
      console.log('Ensuring tours collection exists...');
      
      // First, try to get the existing collection to check if it exists
      try {
        const existingCollection = await this.client.get('/tours');
        console.log('Tours collection already exists');
        return { success: true, data: existingCollection.data, exists: true };
      } catch (error) {
        if (error.response && error.response.status === 404) {
          // Collection doesn't exist, create it
          console.log('Tours collection does not exist, creating...');
        } else {
          // Some other error, re-throw
          throw error;
        }
      }
      
      // Create new collection with proper mapping
      const response = await this.client.put(`/tours`, {
        mappings: {
          properties: {
            id: { type: 'keyword' },
            street: { type: 'text' },
            city: { type: 'text' },
            state: { type: 'keyword' },
            zip: { type: 'keyword' },
            scheduled_date: { type: 'date' },
            scheduled_time: { type: 'keyword' },
            notes: { type: 'text' },
            status: { type: 'keyword' },
            buyer_id: { type: 'keyword' },
            created_at: { type: 'date' },
            updated_at: { type: 'date' }
          }
        }
      });
      
      console.log('Tours collection created successfully');
      return { success: true, data: response.data, exists: false };
    } catch (error) {
      console.error('Ensure tours collection failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Ensure properties collection exists with proper mappings
  async ensurePropertiesCollection() {
    try {
      console.log('Ensuring properties collection exists...');
      
      // First, try to get the existing collection to check if it exists
      try {
        const existingCollection = await this.client.get('/properties');
        console.log('Properties collection already exists');
        return { success: true, data: existingCollection.data, exists: true };
      } catch (error) {
        if (error.response && error.response.status === 404) {
          // Collection doesn't exist, create it
          console.log('Properties collection does not exist, creating...');
        } else {
          // Some other error, re-throw
          throw error;
        }
      }
      
      // Create new collection with proper mapping for properties
      const response = await this.client.put(`/properties`, {
        mappings: {
          properties: {
            id: { type: 'keyword' },
            title: { type: 'text' },
            propertyType: { type: 'keyword' },
            address: { type: 'text' },
            street: { type: 'text' },
            city: { type: 'text' },
            state: { type: 'keyword' },
            zip: { type: 'keyword' },
            price: { type: 'integer' },
            bedrooms: { type: 'integer' },
            bathrooms: { type: 'integer' },
            squareFootage: { type: 'integer' },
            description: { type: 'text' },
            features: { type: 'keyword' },
            status: { type: 'keyword' },
            seller_id: { type: 'keyword' },
            image: { type: 'text' },
            created_at: { type: 'date' },
            updated_at: { type: 'date' }
          }
        }
      });
      
      console.log('Properties collection created successfully');
      return { success: true, data: response.data, exists: false };
    } catch (error) {
      console.error('Ensure properties collection failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Search properties in TechZone Watsonx Discovery (external collection)
  async searchTechZoneProperties(query, filters = {}) {
    try {
      console.log('Searching TechZone properties with query:', query, 'filters:', filters);
      
      // Use the same client since TechZone and local are the same instance
      // The difference is in the search parameters and collection
      const searchBody = {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: query,
                  fields: ['title^2', 'description', 'address', 'features', 'propertyType']
                }
              }
            ],
            filter: []
          }
        },
        sort: [
          { '_score': { order: 'desc' } },
          { 'created_at': { order: 'desc' } }
        ],
        size: 10
      };

      // Add filters for TechZone properties
      if (filters.price_min || filters.price_max) {
        const priceFilter = { range: { price: {} } };
        if (filters.price_min) priceFilter.range.price.gte = filters.price_min;
        if (filters.price_max) priceFilter.range.price.lte = filters.price_max;
        searchBody.query.bool.filter.push(priceFilter);
      }

      if (filters.bedrooms_min) {
        searchBody.query.bool.filter.push({ 
          range: { bedrooms: { gte: filters.bedrooms_min } } 
        });
      }

      if (filters.bathrooms_min) {
        searchBody.query.bool.filter.push({ 
          range: { bathrooms: { gte: filters.bathrooms_min } } 
        });
      }

      if (filters.location) {
        searchBody.query.bool.must.push({
          multi_match: {
            query: filters.location,
            fields: ['city', 'state', 'zip', 'address']
          }
        });
      }

      console.log('TechZone search body:', JSON.stringify(searchBody, null, 2));

      // Use the same client but search in the properties collection
      const response = await this.client.post(`/properties/_search`, searchBody);
      
      console.log('TechZone search response:', {
        total: response.data.hits.total.value,
        hits: response.data.hits.hits.length
      });

      // Format the results for frontend consumption
      const properties = response.data.hits.hits.map(hit => {
        const source = hit._source;
        return {
          id: source.id,
          title: source.title || `${source.propertyType || 'Property'} at ${source.address || 'Unknown Address'}`,
          address: source.address,
          street: source.street,
          city: source.city,
          state: source.state,
          zip: source.zip,
          price: source.price,
          bedrooms: source.bedrooms || 0,
          bathrooms: source.bathrooms || 0,
          squareFootage: source.squareFootage || 0,
          description: source.description,
          propertyType: source.propertyType,
          features: source.features || [],
          status: source.status || 'active',
          score: hit._score,
          source: 'techzone' // Mark as external source
        };
      });

      return { 
        success: true, 
        data: {
          properties,
          total: response.data.hits.total.value
        }
      };
    } catch (error) {
      console.error('TechZone property search failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new WatsonDiscoveryService(); 