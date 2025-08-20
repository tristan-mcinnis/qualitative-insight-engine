#!/usr/bin/env python3
"""
Flask API Server for Qualitative Research Analysis Pipeline
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import time
import uuid
from pathlib import Path
from datetime import datetime
import threading

app = Flask(__name__)
CORS(app)

# In-memory storage for demo purposes
sessions = {}
uploads = {}

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})

@app.route('/upload', methods=['POST'])
def upload_files():
    """Handle file uploads"""
    session_id = str(uuid.uuid4())
    files = request.files.getlist('files')
    
    file_info = []
    for file in files:
        file_data = {
            'name': file.filename,
            'size': len(file.read()),
            'type': file.content_type
        }
        file.seek(0)
        file_info.append(file_data)
    
    uploads[session_id] = {
        'files': file_info,
        'timestamp': datetime.now().isoformat(),
        'status': 'uploaded'
    }
    
    return jsonify({
        'session_id': session_id,
        'files': file_info,
        'total_files': len(file_info)
    })

@app.route('/configure', methods=['POST'])
def configure_analysis():
    """Configure analysis settings"""
    data = request.json
    session_id = data.get('session_id')
    
    if session_id not in uploads:
        return jsonify({'error': 'Invalid session'}), 400
    
    config = {
        'template': data.get('template', 'standard'),
        'options': data.get('options', {}),
        'estimated_time': calculate_estimated_time(data.get('template'))
    }
    
    sessions[session_id] = {
        'config': config,
        'status': 'configured',
        'timestamp': datetime.now().isoformat()
    }
    
    return jsonify({
        'session_id': session_id,
        'config': config,
        'status': 'configured'
    })

@app.route('/analyze', methods=['POST'])
def start_analysis():
    """Start the analysis process"""
    data = request.json
    session_id = data.get('session_id')
    
    if session_id not in sessions:
        return jsonify({'error': 'Invalid session'}), 400
    
    # Start analysis in background
    def run_analysis():
        sessions[session_id]['status'] = 'processing'
        sessions[session_id]['progress'] = 0
        
        # Simulate processing
        for i in range(101):
            time.sleep(0.1)  # Simulate work
            sessions[session_id]['progress'] = i
            sessions[session_id]['current_step'] = get_step_name(i)
        
        # Generate mock results
        sessions[session_id]['status'] = 'completed'
        sessions[session_id]['results'] = generate_mock_results()
    
    thread = threading.Thread(target=run_analysis)
    thread.start()
    
    return jsonify({
        'session_id': session_id,
        'status': 'processing',
        'message': 'Analysis started'
    })

@app.route('/progress/<session_id>', methods=['GET'])
def get_progress(session_id):
    """Get analysis progress"""
    if session_id not in sessions:
        return jsonify({'error': 'Invalid session'}), 400
    
    session = sessions[session_id]
    return jsonify({
        'session_id': session_id,
        'status': session.get('status', 'unknown'),
        'progress': session.get('progress', 0),
        'current_step': session.get('current_step', 'Initializing'),
        'estimated_remaining': calculate_remaining_time(session.get('progress', 0))
    })

@app.route('/results/<session_id>', methods=['GET'])
def get_results(session_id):
    """Get analysis results"""
    if session_id not in sessions:
        return jsonify({'error': 'Invalid session'}), 400
    
    session = sessions[session_id]
    if session.get('status') != 'completed':
        return jsonify({'error': 'Analysis not completed'}), 400
    
    return jsonify({
        'session_id': session_id,
        'status': 'completed',
        'results': session.get('results', {})
    })

def calculate_estimated_time(template):
    """Calculate estimated processing time based on template"""
    times = {
        'standard': 5,
        'detailed': 10,
        'executive': 3,
        'custom': 7
    }
    return times.get(template, 5)

def get_step_name(progress):
    """Get current step name based on progress"""
    if progress < 25:
        return 'Preprocessing'
    elif progress < 50:
        return 'Theme Extraction'
    elif progress < 75:
        return 'Analysis'
    else:
        return 'Report Generation'

def calculate_remaining_time(progress):
    """Calculate remaining time in seconds"""
    if progress == 0:
        return 300
    return max(0, int((100 - progress) * 3))

def generate_mock_results():
    """Generate mock analysis results"""
    return {
        'themes': [
            {
                'id': 'theme1',
                'name': 'User Interface Complexity',
                'frequency': 42,
                'sentiment': 'negative',
                'quotes': [
                    'The interface is too complex and hard to navigate',
                    'I get lost trying to find features'
                ]
            },
            {
                'id': 'theme2',
                'name': 'Need for Better Visualization',
                'frequency': 38,
                'sentiment': 'neutral',
                'quotes': [
                    'Would like to see patterns at a glance',
                    'Better charts would help understand the data'
                ]
            },
            {
                'id': 'theme3',
                'name': 'Keyboard Shortcuts Request',
                'frequency': 31,
                'sentiment': 'positive',
                'quotes': [
                    'Keyboard shortcuts would really speed things up',
                    'Love the idea of keyboard navigation'
                ]
            },
            {
                'id': 'theme4',
                'name': 'Report Customization',
                'frequency': 28,
                'sentiment': 'neutral',
                'quotes': [
                    'Need more options for customizing reports',
                    'Different stakeholders need different formats'
                ]
            },
            {
                'id': 'theme5',
                'name': 'Overall Satisfaction',
                'frequency': 25,
                'sentiment': 'positive',
                'quotes': [
                    'The system works well overall',
                    'Happy with the analysis capabilities'
                ]
            }
        ],
        'statistics': {
            'total_documents': 3,
            'total_themes': 5,
            'total_quotes': 156,
            'processing_time': 285
        },
        'insights': {
            'key_finding': 'Users primarily struggle with navigation but appreciate the analysis capabilities',
            'recommendations': [
                'Simplify the user interface',
                'Add keyboard shortcuts',
                'Improve data visualization',
                'Enhance report customization'
            ]
        }
    }

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)