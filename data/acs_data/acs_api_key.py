from dotenv import load_dotenv
import os

load_dotenv()  # This loads the .env file

ACS_API_KEY = os.getenv("ACS_API_KEY")