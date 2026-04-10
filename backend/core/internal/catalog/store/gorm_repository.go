package store

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"github.com/StartLivin/screek/backend/internal/catalog"
)

type Store struct {
	db *gorm.DB
}

func NewStore(db *gorm.DB) *Store {
	return &Store{db: db}
}

func (s *Store) UpsertMovieLog(ctx context.Context, log *catalog.MovieLog) error {
	return s.db.WithContext(ctx).Save(log).Error
}

func (s *Store) AddToWatchlist(ctx context.Context, item *catalog.WatchlistItem) error {
	return s.db.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(item).Error
}

func (s *Store) RemoveFromWatchlist(ctx context.Context, userID uuid.UUID, movieID uint) error {
	return s.db.WithContext(ctx).Where("user_id = ? AND movie_id = ?", userID, movieID).Delete(&catalog.WatchlistItem{}).Error
}

func (s *Store) GetWatchlist(ctx context.Context, userID uuid.UUID) ([]catalog.WatchlistItem, error) {
	var items []catalog.WatchlistItem
	err := s.db.WithContext(ctx).Preload("Movie").Where("user_id = ?", userID).Find(&items).Error
	return items, err
}

func (s *Store) CreateMovieList(ctx context.Context, list *catalog.MovieList) error {
	return s.db.WithContext(ctx).Create(list).Error
}

func (s *Store) UpdateMovieList(ctx context.Context, list *catalog.MovieList) error {
	return s.db.WithContext(ctx).Save(list).Error
}

func (s *Store) GetMovieLists(ctx context.Context, userID uuid.UUID) ([]catalog.MovieList, error) {
	var lists []catalog.MovieList
	err := s.db.WithContext(ctx).Preload("Items").Where("user_id = ?", userID).Find(&lists).Error
	return lists, err
}

func (s *Store) GetMovieListByID(ctx context.Context, listID uint) (*catalog.MovieList, error) {
	var list catalog.MovieList
	err := s.db.WithContext(ctx).Preload("User").Preload("Items.Movie").First(&list, listID).Error
	return &list, err
}

func (s *Store) AddMovieToList(ctx context.Context, listID uint, movieID uint) error {
	item := catalog.MovieListItem{ListID: listID, MovieID: movieID}
	return s.db.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(&item).Error
}

func (s *Store) RemoveMovieFromList(ctx context.Context, listID uint, movieID uint) error {
	return s.db.WithContext(ctx).Where("list_id = ? AND movie_id = ?", listID, movieID).Delete(&catalog.MovieListItem{}).Error
}

func (s *Store) DeleteMovieList(ctx context.Context, listID uint) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("list_id = ?", listID).Delete(&catalog.MovieListItem{}).Error; err != nil {
			return err
		}
		return tx.Delete(&catalog.MovieList{}, listID).Error
	})
}
func (s *Store) SearchLists(ctx context.Context, query string) ([]catalog.MovieList, error) {
	var lists []catalog.MovieList
	pattern := "%" + query + "%"
	err := s.db.WithContext(ctx).Preload("User").Where("is_public = true AND (title ILIKE ? OR description ILIKE ?)", pattern, pattern).Find(&lists).Error
	return lists, err
}

func (s *Store) GetMovieStats(ctx context.Context, movieID uint) (*catalog.MovieStats, error) {
	var stats catalog.MovieStats
	err := s.db.WithContext(ctx).Where("movie_id = ?", movieID).First(&stats).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &stats, nil
}

func (s *Store) GetUserLogs(ctx context.Context, userID uuid.UUID) ([]catalog.MovieLog, error) {
	var logs []catalog.MovieLog
	err := s.db.WithContext(ctx).
		Preload("Movie").
		Where("user_id = ?", userID).
		Order("updated_at DESC").
		Find(&logs).Error
	return logs, err
}

func (s *Store) GetMovieLog(ctx context.Context, userID uuid.UUID, movieID uint) (*catalog.MovieLog, error) {
	var log catalog.MovieLog
	err := s.db.WithContext(ctx).Where("user_id = ? AND movie_id = ?", userID, movieID).First(&log).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &log, nil
}
