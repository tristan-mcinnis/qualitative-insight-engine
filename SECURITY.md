# Security Configuration Guide

## 🚨 Important Security Notice

This application requires proper environment variable configuration. **Never commit real API keys to version control.**

## Required Environment Variables

### Backend (.env)
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Optional: Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_index_name
PINECONE_HOST=your_pinecone_host_url
```

### Frontend (.env.production)
```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API Configuration
REACT_APP_API_URL=https://your-backend-api-url.com
```

## Setup Instructions

### 1. Local Development
1. Copy `.env.example` to `.env`
2. Fill in your actual API keys and URLs
3. Never commit the `.env` file

### 2. Production Deployment

#### Vercel
1. Go to your Vercel project settings
2. Add environment variables:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
   - `REACT_APP_API_URL`

#### Other Platforms
Follow your platform's documentation for setting environment variables.

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use different keys** for development and production
3. **Rotate keys regularly** 
4. **Restrict API key permissions** to minimum required
5. **Monitor API usage** for unusual activity
6. **Use HTTPS** for all communications

## Troubleshooting

### "Missing required environment variables" Error
- Ensure all required environment variables are set
- Check spelling and case sensitivity
- Verify values don't have extra spaces or quotes

### API Authentication Errors
- Verify API keys are valid and not expired
- Check that keys have proper permissions
- Ensure you're using the correct environment (dev vs prod)

## Emergency Response

If API keys are accidentally committed:
1. **Immediately** rotate all exposed keys
2. Update environment variables in all deployments
3. Monitor for unauthorized usage
4. Consider revoking and regenerating database tokens

## Contact

For security concerns, contact the development team immediately.