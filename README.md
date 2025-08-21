# Qualitative Insight Engine

An AI-powered qualitative research analysis platform with real-time processing, persistent storage, and enterprise-ready architecture.

## 🚀 Features

- **Supabase Backend**: Full PostgreSQL database with real-time capabilities
- **GPT-5 Nano Integration**: Advanced AI analysis using OpenAI's latest model
- **Real-time Updates**: Live progress tracking via Supabase channels
- **Persistent Storage**: All data permanently stored with secure file management
- **Multi-Project Support**: Manage multiple analysis projects simultaneously
- **Automated Topic Analysis**: Emergent theme identification and categorization
- **Strategic Insights**: AI-generated recommendations and key takeaways
- **Multi-format Export**: Excel workbooks and Word documents with detailed analysis

## 🏗️ Architecture

### Technology Stack
- **Backend**: Node.js/Express with TypeScript
- **Database**: PostgreSQL via Supabase
- **Storage**: Supabase Storage (S3-compatible)
- **Real-time**: Supabase Channels (WebSocket)
- **Frontend**: React with TypeScript
- **AI Processing**: OpenAI GPT-5 Nano
- **Edge Functions**: Supabase Edge Functions (Deno)

### Key Components
- **Project Management**: Create and manage multiple research projects
- **File Upload**: Secure storage for discussion guides and transcripts
- **Analysis Pipeline**: Async AI processing with progress tracking
- **Real-time Subscriptions**: Live updates during analysis
- **Results Export**: Comprehensive reports in multiple formats

## 📋 Requirements

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/qualitative-insight-engine.git
cd qualitative-insight-engine
```

### 2. Backend Setup
```bash
cd src/backend
npm install
cp .env.example .env
# Edit .env with your Supabase and OpenAI credentials
```

### 3. Frontend Setup
```bash
cd src/frontend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 4. Environment Variables

#### Backend (.env)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
OPENAI_API_KEY=your_openai_key
PORT=5000
NODE_ENV=development
```

#### Frontend (.env)
```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
REACT_APP_API_URL=http://localhost:5000/api
```

## 📖 Usage

### Start the Backend Server
```bash
cd src/backend
npm run dev  # Development mode
npm run build && npm start  # Production mode
```

### Start the Frontend Application
```bash
cd src/frontend
npm start  # Development mode
npm run build  # Production build
```

### API Endpoints

#### Project Management
- `POST /api/projects` - Create new project
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

#### File Upload
- `POST /api/projects/:id/upload/guide` - Upload discussion guide
- `POST /api/projects/:id/upload/transcripts` - Upload transcript files
- `GET /api/projects/:id/files` - List project files

#### Analysis
- `POST /api/analysis/start` - Start analysis for project
- `GET /api/analysis/progress/:sessionId` - Get analysis progress
- `GET /api/analysis/results/:sessionId` - Get analysis results

## 📁 Project Structure

```
qualitative-insight-engine/
├── src/
│   ├── backend/          # TypeScript backend services
│   │   ├── src/
│   │   │   ├── config/   # Configuration
│   │   │   ├── routes/   # API routes
│   │   │   ├── services/ # Business logic
│   │   │   └── types/    # TypeScript types
│   │   └── package.json
│   └── frontend/         # React frontend
│       ├── src/
│       │   ├── components/
│       │   ├── services/
│       │   └── types/
│       └── package.json
├── supabase/
│   └── functions/        # Edge Functions
│       ├── process-analysis/
│       ├── extract-verbatims/
│       └── analyze-topics/
├── tests/
│   └── backend/          # Backend test suite
└── README.md
```

## 🔄 Workflow

1. **Create Project**: Initialize a new analysis project
2. **Upload Files**: Add discussion guide and transcript files
3. **Configure Analysis**: Set analysis parameters and options
4. **Start Processing**: Initiate AI-powered analysis
5. **Track Progress**: Real-time updates during processing
6. **View Results**: Interactive results dashboard
7. **Export Reports**: Download comprehensive reports

## 🧪 Testing

### Backend Tests
```bash
cd tests/backend
npm install
npm test              # Run all tests
npm run test:coverage # Coverage report
```

### Test Categories
- **Unit Tests**: Individual service testing
- **Integration Tests**: API endpoint testing
- **Service Tests**: Business logic validation

## 🔒 Security

- Row Level Security (RLS) on all database tables
- Secure file storage with signed URLs
- Environment-based configuration
- API validation and error handling
- Future-ready authentication system

## 🚢 Deployment

### Supabase Setup
1. Create a new Supabase project
2. Run database migrations from `supabase/migrations/`
3. Deploy Edge Functions
4. Configure storage buckets

### Backend Deployment
```bash
cd src/backend
npm run build
# Deploy to your preferred Node.js hosting
```

### Frontend Deployment
```bash
cd src/frontend
npm run build
# Deploy build/ directory to CDN or static hosting
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues or questions:
- Open an issue on GitHub
- Check the documentation
- Contact the development team

## 🎯 Roadmap

- [ ] User authentication and multi-tenancy
- [ ] Collaborative analysis features
- [ ] Advanced visualization options
- [ ] Custom AI model training
- [ ] API rate limiting and quotas
- [ ] Webhook integrations
- [ ] Mobile application

---

Built with ❤️ using Supabase, React, and TypeScript