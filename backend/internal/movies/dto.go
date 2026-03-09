package movies

type MovieDTO struct {
    ID        	int    	`json:"id"`
	TMDBID		int		`json:"tmdb_id"`
    Title      	string 	`json:"title"`
    PosterURL  	string 	`json:"poster_url"`
}
