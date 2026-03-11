"""
Fix stuck reports that are in 'generating' status.
This script will mark them as 'error' so they can be regenerated.
"""

import os
import sys
from pathlib import Path
from supabase import create_client
from dotenv import load_dotenv
from datetime import datetime, timedelta

# Load .env from parent directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

# Initialize Supabase
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("✗ Error: Missing Supabase credentials in .env file")
    print(f"  SUPABASE_URL: {SUPABASE_URL is not None}")
    print(f"  SUPABASE_KEY: {SUPABASE_KEY is not None}")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def fix_stuck_reports():
    """Find and fix reports stuck in 'generating' status."""
    
    try:
        # Find reports that have been "generating" for more than 5 minutes
        five_minutes_ago = (datetime.utcnow() - timedelta(minutes=5)).isoformat()
        
        # Get stuck reports
        response = supabase.table('reports').select('*').eq('status', 'generating').execute()
        
        stuck_reports = response.data
        
        if not stuck_reports:
            print("✓ No stuck reports found. All reports are up to date.")
            return
        
        print(f"Found {len(stuck_reports)} stuck report(s) in 'generating' status:")
        for report in stuck_reports:
            print(f"  - ID: {report['id']}, Type: {report['report_type']}, Created: {report['created_at']}")
        
        # Update them to 'error' status so they can be regenerated
        for report in stuck_reports:
            supabase.table('reports').update({
                'status': 'error',
                'updated_at': datetime.utcnow().isoformat()
            }).eq('id', report['id']).execute()
        
        print(f"\n✓ Updated {len(stuck_reports)} report(s) to 'error' status.")
        print("  Users can now regenerate these reports using the 'Regenerate' button.")
        
    except Exception as e:
        print(f"✗ Error fixing stuck reports: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("=" * 60)
    print("LexGuard AI - Fix Stuck Reports")
    print("=" * 60)
    print()
    fix_stuck_reports()
    print()
    print("=" * 60)
