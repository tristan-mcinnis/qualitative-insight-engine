# Qualitative Research Analysis Pipeline v3.0

An AI-powered qualitative research analysis tool that processes interview transcripts, performs topic analysis, and generates comprehensive reports.

## 🚀 Features

- **GPT-5 Nano Integration**: Advanced AI analysis using OpenAI's latest model
- **Pinecone Vector Storage**: Semantic search and retrieval of verbatims
- **Automated Topic Analysis**: Emergent theme identification and categorization
- **Multi-format Export**: Excel workbooks and Word documents with color-coding
- **Chinese-English Translation**: Automatic translation of multilingual content
- **Strategic Insights**: AI-generated recommendations and key takeaways

## 📋 Requirements

- Python 3.8+
- OpenAI API key
- Pinecone API key (optional, for vector storage)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd TextGrouping
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
export OPENAI_API_KEY="your-openai-api-key"
export PINECONE_API_KEY="your-pinecone-api-key"  # Optional
```

## 📁 Project Structure

```
TextGrouping/
├── config.yaml          # Configuration settings
├── requirements.txt     # Python dependencies
├── run_analysis.py      # CLI entry point
├── run_server.py        # Flask API server
├── src/
│   ├── main.py         # Main pipeline logic
│   ├── config/         # Configuration management
│   ├── processors/     # AI and text processing
│   ├── exporters/      # Report generation
│   └── utils/          # Utility functions
└── archive/            # Old/deprecated files
```

## 🔧 Configuration

Edit `config.yaml` to customize:
- AI model settings
- Processing parameters
- Export options
- File handling preferences

## 📖 Usage

### Command Line Interface

```bash
# Basic usage
python run_analysis.py /path/to/project/directory

# With options
python run_analysis.py /path/to/project --skip-word --debug

# Dry run (no API calls)
python run_analysis.py /path/to/project --dry-run
```

**Options:**
- `--skip-word`: Skip Word document generation
- `--skip-excel`: Skip Excel report generation
- `--debug`: Enable verbose logging
- `--dry-run`: Test without making API calls

### API Server

Start the Flask server:
```bash
python run_server.py
```

Send POST request to `http://127.0.0.1:5000/run`:
```json
{
  "projectDir": "/path/to/project",
  "skipWord": false,
  "skipExcel": false,
  "debug": false,
  "dryRun": false
}
```

### Project Directory Structure

Your project directory should contain:
- **Discussion Guide**: File with 'dg', 'guide', or 'discussion' in filename
- **Transcripts**: `.docx` or `.txt` files with interview transcripts

Format for transcripts:
```
Speaker Name: What they said
Interviewer: Question asked
Participant 1: Response given
```

## 📊 Output Files

The pipeline generates the following in `{project_dir}/analysis_output/`:

- `guide_objectives.json` - Extracted discussion guide questions
- `emergent_topics_report.xlsx` - Topic analysis results
- `question_mapping_clean.xlsx` - Verbatim-to-question mappings
- `strategic_analysis.xlsx` - Strategic insights and recommendations
- `master_strategic_report.xlsx` - Comprehensive multi-sheet report
- `analysis_report.docx` - Color-coded Word document
- `executive_summary.docx` - High-level summary for stakeholders
- `manual_coding_workbook.docx` - QDA workbook for manual analysis

## 🤖 AI Components

### GPT-5 Nano
The system uses OpenAI's GPT-5 Nano model for:
- Discussion guide objective extraction
- Verbatim-to-question mapping
- Emergent topic identification
- Strategic analysis generation
- Chinese-English translation

### Pinecone Vector Storage
Optional integration for:
- Storing verbatim embeddings
- Semantic similarity search
- Cross-reference analysis
- Duplicate detection

## 🔒 Security

- API keys stored as environment variables
- No sensitive data in configuration files
- Secure handling of research data

## 🐛 Troubleshooting

1. **API Key Errors**: Ensure environment variables are set correctly
2. **File Encoding Issues**: Files are processed with multiple encoding attempts
3. **Memory Issues**: Reduce batch sizes in `config.yaml`
4. **Rate Limits**: Adjust `max_concurrent_requests` in configuration

## 📝 License

Copyright © 2024. All rights reserved.

## 🤝 Support

For issues or questions, please contact the development team.