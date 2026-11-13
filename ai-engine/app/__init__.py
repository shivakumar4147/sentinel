from pathlib import Path
from dotenv import load_dotenv

_env_path = Path(__file__).resolve().parent.parent / ".env"
if _env_path.is_file():
    load_dotenv(_env_path)

