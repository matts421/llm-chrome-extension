from dotenv import load_dotenv
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
import os
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build

load_dotenv()

# --- Google Sheets setup via environment variable ---
SERVICE_ACCOUNT_INFO = json.loads(os.environ["GOOGLE_SERVICE_ACCOUNT"])
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
SHEET_ID = os.environ.get("SHEET_ID")
RANGE_NAME = "Sheet1!A:C"

credentials = service_account.Credentials.from_service_account_info(
    SERVICE_ACCOUNT_INFO, scopes=SCOPES
)
service = build("sheets", "v4", credentials=credentials)
sheet = service.spreadsheets()

# --- FastAPI setup ---
app = FastAPI(title="Token Logger API")

class TokenEntry(BaseModel):
    uuid: UUID
    timestamp: str = Field(..., pattern=r"^\d{8}:\d{6}$")  # YYYYmmDD:HHmmss
    token_count: int

@app.post("/log")
async def log_token(entry: TokenEntry):
    # Validate timestamp
    try:
        dt = datetime.strptime(entry.timestamp, "%Y%m%d:%H%M%S")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid timestamp format")

    values = [[str(entry.uuid), entry.timestamp, entry.token_count]]

    try:
        sheet.values().append(
            spreadsheetId=SHEET_ID,
            range=RANGE_NAME,
            valueInputOption="USER_ENTERED",
            body={"values": values},
        ).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error writing to sheet: {e}")

    return {"status": "success", "data": values}
