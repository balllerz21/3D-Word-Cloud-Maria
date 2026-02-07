# imports
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from utilities.fetcher import html_fetcher
from utilities.extractor import get_text
from utilities.analyzer import get_keywords
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
    html = html_fetcher(req.url)
    if not html:
        return {"words": [], "error": "Failed to fetch HTML"}

    text = get_text(html)
    if not text:
        return {"words": [], "error": "Failed to extract article text"}

    words = get_keywords(text, top_k=25)  
    return {"words": words}
