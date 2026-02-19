import sys
from pathlib import Path

# Add backend/ to Python path so `from app.main import app` resolves correctly
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
