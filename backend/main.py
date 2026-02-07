# imports
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# starting of app
app = FastAPI()

# adding CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    url: str

# route
@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    return {
        "words": [
            {"word": "data", "weight": 1.0},
            {"word": "model", "weight": 0.8},
            {"word": "analysis", "weight": 0.6},
        ]
    }
