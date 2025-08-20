#!/usr/bin/env python3
"""
Flask API Server for Qualitative Research Analysis Pipeline
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import sys
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Qualitative Analysis Pipeline',
        'version': '3.0.0'
    })

@app.route('/run', methods=['POST'])
def run_pipeline():
    """
    Run the analysis pipeline with specified options
    
    Expected JSON payload:
    {
        "projectDir": "/path/to/project",
        "skipWord": false,
        "skipExcel": false,
        "debug": false,
        "dryRun": false
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'projectDir' not in data:
            return jsonify({
                'success': False,
                'message': 'projectDir is required'
            }), 400
        
        project_dir = data['projectDir']
        
        # Build command
        cmd = [sys.executable, 'src/main.py', project_dir]
        
        # Add optional flags
        if data.get('skipWord'):
            cmd.append('--skip-word')
        if data.get('skipExcel'):
            cmd.append('--skip-excel')
        if data.get('debug'):
            cmd.append('--debug')
        if data.get('dryRun'):
            cmd.append('--dry-run')
        
        logger.info(f"Running command: {' '.join(cmd)}")
        
        # Run the pipeline
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent
        )
        
        if result.returncode == 0:
            return jsonify({
                'success': True,
                'message': 'Pipeline completed successfully',
                'output': result.stdout
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Pipeline failed',
                'error': result.stderr
            }), 500
            
    except Exception as e:
        logger.error(f"Error running pipeline: {e}")
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/config', methods=['GET'])
def get_config():
    """Get current configuration"""
    try:
        config_path = Path(__file__).parent / 'config.yaml'
        with open(config_path, 'r') as f:
            import yaml
            config = yaml.safe_load(f)
        return jsonify(config)
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error loading config: {str(e)}'
        }), 500

if __name__ == '__main__':
    port = 5000
    logger.info(f"Starting server on http://127.0.0.1:{port}")
    app.run(debug=True, port=port)