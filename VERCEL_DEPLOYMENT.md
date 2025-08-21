# Vercel Deployment Guide

## Quick Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Visit Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Click "Add New..." → "Project"

2. **Import Git Repository**
   - Connect your GitHub account if not already connected
   - Select this repository: `qualitative-insight-engine`
   - Click "Import"

3. **Configure Project**
   - Framework Preset: Create React App (should auto-detect)
   - Root Directory: Leave as `.` (root)
   - Build settings are already configured in `vercel.json`

4. **Set Environment Variables**
   Add these environment variables in the Vercel dashboard:

   ```
   REACT_APP_SUPABASE_URL=https://owcstzxnpeyndgxlxxxx.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   REACT_APP_API_URL=https://your-deployed-url.vercel.app/api
   REACT_APP_DEBUG=false
   REACT_APP_ENABLE_REALTIME=true
   ```

   **Note**: Update `REACT_APP_API_URL` after deployment with your actual Vercel URL

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete

### Option 2: Deploy via CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Follow prompts**
   - Select your team: nexuslux1's projects
   - Link to existing project: No (create new)
   - Project name: qualitative-insight-engine
   - Root directory: ./
   - Override build settings: No (uses vercel.json)

5. **Set Environment Variables**
   ```bash
   vercel env add REACT_APP_SUPABASE_URL
   vercel env add REACT_APP_SUPABASE_ANON_KEY
   vercel env add REACT_APP_API_URL
   vercel env add REACT_APP_DEBUG
   vercel env add REACT_APP_ENABLE_REALTIME
   ```

## Post-Deployment

1. **Update API URL**
   - After deployment, get your production URL
   - Update `REACT_APP_API_URL` environment variable to point to your Vercel URL

2. **Configure Supabase**
   - Add your Vercel domain to Supabase URL Configuration
   - Go to Supabase Dashboard → Settings → API
   - Add your Vercel URL to allowed origins

3. **Test Your Deployment**
   - Visit your Vercel URL
   - Test all functionality
   - Check browser console for any errors

## Automatic Deployments

Once connected, Vercel will automatically deploy:
- Production deployments on pushes to `main`/`master` branch
- Preview deployments for pull requests

## Sharing with Colleagues

Your deployed app will be available at:
- Production: `https://qualitative-insight-engine.vercel.app`
- Preview URLs for each PR/branch

Share these URLs with your colleagues for easy access!