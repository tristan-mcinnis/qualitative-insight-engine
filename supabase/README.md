# Supabase Project Directory

This directory contains all Supabase-specific configurations and code for the Qualitative Insight Engine.

## Directory Structure

```
supabase/
├── config.toml          # Supabase local development configuration
├── functions/           # Edge Functions (Deno runtime)
│   ├── process-analysis/    # Main analysis orchestration
│   ├── extract-verbatims/   # Verbatim extraction from transcripts
│   └── analyze-topics/      # Topic and theme analysis
├── migrations/          # Database migrations (SQL files)
└── .gitignore          # Supabase-specific git ignores
```

## Edge Functions

Edge Functions run on Deno runtime and handle async processing:

- **process-analysis**: Orchestrates the entire analysis workflow
- **extract-verbatims**: Extracts meaningful quotes from transcripts
- **analyze-topics**: Identifies themes and patterns using AI

## Local Development

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase instance
supabase start

# Deploy Edge Functions
supabase functions deploy

# Run database migrations
supabase db push
```

## Deployment

```bash
# Link to your Supabase project
supabase link --project-ref <your-project-ref>

# Deploy Edge Functions to production
supabase functions deploy --project-ref <your-project-ref>

# Push database changes
supabase db push --project-ref <your-project-ref>
```

## Environment Variables

Edge Functions use these environment variables (set in Supabase dashboard):
- `OPENAI_API_KEY`: For AI processing
- `SUPABASE_URL`: Project URL (automatically available)
- `SUPABASE_ANON_KEY`: Anonymous key (automatically available)
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (automatically available)

## Testing

```bash
# Test Edge Functions locally
supabase functions serve process-analysis

# In another terminal, invoke the function
curl -i --location --request POST 'http://localhost:54321/functions/v1/process-analysis' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"projectId":"test-123"}'
```

## Database Migrations

Create new migrations:
```bash
# Create a new migration
supabase migration new <migration_name>

# Generate migration from local changes
supabase db diff --use-migra -f <migration_name>
```

## Important Notes

- This directory must remain at the project root for Supabase CLI to work correctly
- Edge Functions use Deno runtime, not Node.js
- All database changes should be tracked via migrations
- Local development requires Docker Desktop