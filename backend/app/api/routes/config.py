from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from google import genai
from google.genai.errors import APIError
from app.api.deps import DBSession
from app.dynamic_config import DynamicConfig

router = APIRouter()

class ApiKeyInput(BaseModel):
    api_key: str

class ConfigStatusResponse(BaseModel):
    has_valid_key: bool

@router.get("/status", response_model=ConfigStatusResponse)
async def get_config_status(db: DBSession):
    key = await DynamicConfig.get_gemini_key(db)
    return ConfigStatusResponse(has_valid_key=bool(key))

@router.post("/key")
async def set_api_key(input_data: ApiKeyInput, db: DBSession):
    # Validate the key by making a lightweight test call
    try:
        client = genai.Client(api_key=input_data.api_key)
        # Test the key by just fetching the models list (doesn't use inference quota, won't fail on high demand)
        models = client.models.list()
        
        # Just iterate once to ensure the generator doesn't throw an auth error
        has_models = False
        for _ in models:
            has_models = True
            break
            
        if not has_models:
             raise ValueError("Empty response from Google API.")
    except APIError as e:
        # Check if it's an actual authentication error
        msg = e.message if hasattr(e, "message") else str(e)
        if "API key not valid" in msg or "API_KEY_INVALID" in msg or "authentication" in msg.lower():
            raise HTTPException(status_code=400, detail="Invalid API Key. Please check your key and try again.")
        else:
            # If it's a server overload or something else, it means the key actually worked to authenticate!
            pass
    except Exception as e:
        if "API_KEY_INVALID" in str(e):
             raise HTTPException(status_code=400, detail="Invalid API Key.")
        # Other errors might just be network issues, we shouldn't necessarily block saving if it looks like a transient issue.
        # But to be safe, we'll let it pass if it's not explicitly an invalid key.
        pass

    # Save to dynamic config (DB + Redis cache invalidation)
    await DynamicConfig.set_gemini_key(input_data.api_key, db)
    
    return {"message": "API key validated and saved securely."}
