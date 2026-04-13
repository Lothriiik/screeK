package store

import (
	"github.com/StartLivin/screek/backend/internal/catalog"
)

func ToMovieLogDomain(r *MovieLogRecord) *catalog.MovieLog {
	if r == nil {
		return nil
	}
	return &catalog.MovieLog{
		UserID:    r.UserID,
		MovieID:   r.MovieID,
		Watched:   r.Watched,
		Rating:    r.Rating,
		Liked:     r.Liked,
		CreatedAt: r.CreatedAt,
		UpdatedAt: r.UpdatedAt,
	}
}

func ToMovieLogList(records []MovieLogRecord) []catalog.MovieLog {
	list := make([]catalog.MovieLog, len(records))
	for i := range records {
		list[i] = *ToMovieLogDomain(&records[i])
	}
	return list
}

func ToMovieLogRecord(d *catalog.MovieLog) *MovieLogRecord {
	if d == nil {
		return nil
	}
	return &MovieLogRecord{
		UserID:    d.UserID,
		MovieID:   d.MovieID,
		Watched:   d.Watched,
		Rating:    d.Rating,
		Liked:     d.Liked,
		CreatedAt: d.CreatedAt,
		UpdatedAt: d.UpdatedAt,
	}
}

func ToMovieListDomain(r *MovieListRecord) *catalog.MovieList {
	if r == nil {
		return nil
	}

	items := make([]catalog.MovieListItem, len(r.Items))
	for i, item := range r.Items {
		items[i] = catalog.MovieListItem{
			ID:      item.ID,
			ListID:  item.ListID,
			MovieID: item.MovieID,
			AddedAt: item.AddedAt,
		}
	}

	return &catalog.MovieList{
		ID:          r.ID,
		UserID:      r.UserID,
		Title:       r.Title,
		IsPublic:    r.IsPublic,
		Description: r.Description,
		Items:       items,
		CreatedAt:   r.CreatedAt,
	}
}

func ToMovieListList(records []MovieListRecord) []catalog.MovieList {
	list := make([]catalog.MovieList, len(records))
	for i := range records {
		list[i] = *ToMovieListDomain(&records[i])
	}
	return list
}

func ToMovieListRecord(d *catalog.MovieList) *MovieListRecord {
	if d == nil {
		return nil
	}
	return &MovieListRecord{
		ID:          d.ID,
		UserID:      d.UserID,
		Title:       d.Title,
		IsPublic:    d.IsPublic,
		Description: d.Description,
		CreatedAt:   d.CreatedAt,
	}
}

func ToWatchlistItemDomain(r *WatchlistItemRecord) *catalog.WatchlistItem {
	if r == nil {
		return nil
	}
	return &catalog.WatchlistItem{
		UserID:  r.UserID,
		MovieID: r.MovieID,
		AddedAt: r.AddedAt,
	}
}

func ToWatchlistList(records []WatchlistItemRecord) []catalog.WatchlistItem {
	list := make([]catalog.WatchlistItem, len(records))
	for i := range records {
		list[i] = *ToWatchlistItemDomain(&records[i])
	}
	return list
}

func ToWatchlistItemRecord(d *catalog.WatchlistItem) *WatchlistItemRecord {
	if d == nil {
		return nil
	}
	return &WatchlistItemRecord{
		UserID:  d.UserID,
		MovieID: d.MovieID,
		AddedAt: d.AddedAt,
	}
}

func ToMovieStatsDomain(r *MovieStatsRecord) *catalog.MovieStats {
	if r == nil {
		return nil
	}
	return &catalog.MovieStats{
		MovieID:       r.MovieID,
		AverageRating: r.AverageRating,
		TotalReviews:  r.TotalReviews,
		TotalLikes:    r.TotalLikes,
	}
}

func ToMovieStatsList(records []MovieStatsRecord) []catalog.MovieStats {
	list := make([]catalog.MovieStats, len(records))
	for i := range records {
		list[i] = *ToMovieStatsDomain(&records[i])
	}
	return list
}
