import os
from dotenv import load_dotenv

# Load environment variables from .env at the project root
load_dotenv()

HF_API_KEY = os.getenv("HF_API_KEY")
