# RealtorBot Backend

A Node.js backend for the RealtorBot real estate automation application, built with Express.js and IBM Watsonx Discovery.

## Features

- User authentication with JWT tokens
- Property management (CRUD operations)
- Integration with IBM Watsonx Discovery for data storage
- RESTful API endpoints
- Google OAuth support (planned)

## Prerequisites

- Node.js (v14 or higher)
- IBM Watsonx Discovery instance
- Google OAuth credentials (for future features)

## Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```bash
   cd RealtorBotBackend
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up environment variables:
   ```bash
   cp config.env.example config.env
   ```
   
   Edit `config.env` with your actual credentials:
   - `JWT_SECRET`: A strong, random secret key for JWT signing
   - `WATSON_DISCOVERY_URL`: Your Watson Discovery instance URL
   - `WATSON_DISCOVERY_USERNAME`: Watson Discovery username
   - `WATSON_DISCOVERY_PASSWORD`: Watson Discovery password
   - `WATSON_DISCOVERY_PORT`: Watson Discovery port (usually 31709)

5. Start the server:
   ```bash
   npm start
   ```

## Security Setup

### Environment Variables
- **NEVER commit `config.env` to version control**
- Use `config.env.example` as a template
- Generate a strong JWT secret (at least 32 characters)
- Keep Watson Discovery credentials secure

### Password Security
- User passwords are currently stored in plain text (for development)
- **IMPORTANT**: Implement password hashing before production deployment
- Consider using bcrypt or similar for password hashing

### JWT Security
- Use a strong, random JWT secret
- Consider implementing JWT refresh tokens
- Set appropriate token expiration times

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth login (planned)
- `GET /api/auth/verify` - Verify JWT token

### Properties
- `GET /api/properties` - Get all properties (with search/filters)
- `GET /api/properties/:id` - Get property by ID
- `POST /api/properties` - Create new property (requires auth)
- `PUT /api/properties/:id` - Update property (requires auth + ownership)
- `DELETE /api/properties/:id` - Delete property (requires auth + ownership)
- `GET /api/properties/seller/my-properties` - Get seller's properties (requires auth)

### Users
- `GET /api/users/profile` - Get user profile (requires auth)
- `PUT /api/users/profile` - Update user profile (requires auth)
- `GET /api/users/preferences` - Get user preferences (requires auth)
- `PUT /api/users/preferences` - Update user preferences (requires auth)
- `GET /api/users/suggestions` - Get property suggestions (requires auth)
- `PUT /api/users/role` - Update user role (requires auth)

## Development

### Testing Watson Discovery Connection
```bash
curl http://localhost:5001/test-watson
```

### Debug Endpoints
- `/api/debug/users` - List all users (development only)
- `/api/debug/properties` - List all properties (development only)

## Production Deployment

Before deploying to production:

1. **Implement password hashing** using bcrypt or similar
2. **Use environment variables** for all sensitive configuration
3. **Enable HTTPS** for all API endpoints
4. **Implement rate limiting** to prevent abuse
5. **Add input validation** and sanitization
6. **Set up proper logging** and monitoring
7. **Configure CORS** properly for your frontend domain
8. **Use a strong JWT secret** (generate with crypto.randomBytes)

## Troubleshooting

### Common Issues

1. **SSL Certificate Errors**: The backend is configured to accept self-signed certificates for Watson Discovery
2. **Port Conflicts**: Change the PORT in config.env if 5001 is already in use
3. **Watson Discovery Connection**: Ensure your Watson Discovery instance is running and accessible

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your environment variables.

## License

This project is for educational purposes. Implement proper security measures before using in production. 