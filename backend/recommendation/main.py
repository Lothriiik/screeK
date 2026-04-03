from fastapi import FastAPI, HTTPException
import uvicorn
from engine import engine

app = FastAPI(title="screeK Intelligence Service", version="1.0.0")

@app.get("/")
def read_root():
    return {"message": "screeK Intelligence API is running", "engine_status": "loaded"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/recommendations/{user_id}")
def get_recommendations(user_id: str):

    try:
        recommendations = engine.calculate_similarity(user_id)
        return {
            "user_id": user_id,
            "recommendations": recommendations,
            "algorithm": "collaborative_filtering_baseline"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/similar/{movie_id}")
def get_similar_movies(movie_id: int):

    try:
        similar = engine.get_similar_movies(movie_id)
        return {
            "movie_id": movie_id,
            "similar": similar,
            "algorithm": "content_based_baseline"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8081)
