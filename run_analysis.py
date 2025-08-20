#!/usr/bin/env python3
"""
Main entry point for running the Qualitative Research Analysis Pipeline
"""

import sys
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent))

if __name__ == "__main__":
    from src.main import main
    import asyncio
    
    # Handle Windows event loop
    if sys.platform.startswith('win'):
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    
    # Run the main function
    asyncio.run(main())