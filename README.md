# 3D-Word-Cloud-Maria

Interactive web app that visualizes topics from a news article as a **3D word cloud**.

Users paste a news article URL → backend extracts keywords → frontend renders an interactive 3D globe using React Three Fiber.

---

## Architecture Diagram
https://excalidraw.com/#json=sgVMfrFIA03GF6aR3oL1E,0ekdynoRdnb0xRpe5Hemjg

---

## Tech Stack

### Frontend
- React + TypeScript  
- React Three Fiber (Three.js for React)
- Custom 3D globe layout + animations

### Backend
- Python
- FastAPI
- BeautifulSoup (HTML parsing)
- scikit-learn TF-IDF (keyword extraction)
- httpx (fetching articles)

---

## Features

- Paste a news article URL
- Backend fetches and cleans article text
- Lightweight NLP keyword extraction (TF-IDF)
- Returns `{ word, weight }` data
- Interactive 3D globe word cloud
- Word size + color scale by relevance (The more purple the word + higher in position in the globe, the more weight it has in the article)
- Hover tooltips
- Loading + error states
- Sample article buttons

---

## How It Works

1. User enters article URL  
2. Frontend sends POST `/analyze` request  
3. Backend:
   - fetches HTML
   - extracts article text
   - runs TF-IDF keyword extraction  
4. Returns weighted words  
5. Frontend renders 3D globe visualization  

Focus of project: **end-to-end integration + creative UI**, not heavy ML.

---

## Sample Articles

You can test the app with these:

- https://www.npr.org/2026/02/04/nx-s1-5698470/bad-bunny-makes-history-at-the-grammys-up-next-the-super-bbowl 
- https://www.theguardian.com/world/2026/feb/07/volodymyr-zelenskyy-us-june-deadline-ukraine-russia-peace-deal
- https://www.bbc.com/sport/rugby-union/articles/clymye806k0o

---

## Setup (macOS)

From project root:

```bash
./setup.sh
