package store

import (
	"context"

	"github.com/StartLivin/screek/backend/internal/catalog"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var _ catalog.CatalogRepository = (*Store)(nil)

type Store struct {
	db *gorm.DB
}

func NewStore(db *gorm.DB) *Store {
	return &Store{db: db}
}

func (s *Store) UpsertMovieLog(ctx context.Context, log *catalog.MovieLog) error {
	record := ToMovieLogRecord(log)
	return s.db.WithContext(ctx).Save(record).Error
}

func (s *Store) AddToWatchlist(ctx context.Context, item *catalog.WatchlistItem) error {
	record := ToWatchlistItemRecord(item)
	return s.db.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(record).Error
}

func (s *Store) RemoveFromWatchlist(ctx context.Context, userID uuid.UUID, movieID uint) error {
	return s.db.WithContext(ctx).Where("user_id = ? AND movie_id = ?", userID, movieID).Delete(&WatchlistItemRecord{}).Error
}

func (s *Store) GetWatchlist(ctx context.Context, userID uuid.UUID) ([]catalog.WatchlistItem, error) {
	var records []WatchlistItemRecord
	err := s.db.WithContext(ctx).Where("user_id = ?", userID).Find(&records).Error
	return ToWatchlistList(records), err
}

func (s *Store) CreateMovieList(ctx context.Context, list *catalog.MovieList) error {
	record := ToMovieListRecord(list)
	if err := s.db.WithContext(ctx).Create(record).Error; err != nil {
		return err
	}
	list.ID = record.ID
	return nil
}

func (s *Store) UpdateMovieList(ctx context.Context, list *catalog.MovieList) error {
	record := ToMovieListRecord(list)
	return s.db.WithContext(ctx).Save(record).Error
}

func (s *Store) GetMovieLists(ctx context.Context, userID uuid.UUID) ([]catalog.MovieList, error) {
	var records []MovieListRecord
	err := s.db.WithContext(ctx).Preload("Items").Where("user_id = ?", userID).Find(&records).Error
	return ToMovieListList(records), err
}

func (s *Store) GetMovieListByID(ctx context.Context, listID uint) (*catalog.MovieList, error) {
	var record MovieListRecord
	err := s.db.WithContext(ctx).Preload("Items").First(&record, listID).Error
	if err != nil {
		return nil, err
	}
	return ToMovieListDomain(&record), nil
}

func (s *Store) AddMovieToList(ctx context.Context, listID uint, movieID uint) error {
	record := MovieListItemRecord{ListID: listID, MovieID: movieID}
	return s.db.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(&record).Error
}

func (s *Store) RemoveMovieFromList(ctx context.Context, listID uint, movieID uint) error {
	return s.db.WithContext(ctx).Where("list_id = ? AND movie_id = ?", listID, movieID).Delete(&MovieListItemRecord{}).Error
}

func (s *Store) DeleteMovieList(ctx context.Context, listID uint) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("list_id = ?", listID).Delete(&MovieListItemRecord{}).Error; err != nil {
			return err
		}
		return tx.Delete(&MovieListRecord{}, listID).Error
	})
}

func (s *Store) SearchLists(ctx context.Context, query string) ([]catalog.MovieList, error) {
	var records []MovieListRecord
	pattern := "%" + query + "%"
	err := s.db.WithContext(ctx).
		Where("is_public = true AND (title ILIKE ? OR description ILIKE ?)", pattern, pattern).
		Find(&records).Error
	return ToMovieListList(records), err
}

func (s *Store) GetMovieStats(ctx context.Context, movieID uint) (*catalog.MovieStats, error) {
	var record MovieStatsRecord
	err := s.db.WithContext(ctx).Where("movie_id = ?", movieID).First(&record).Error
	if err != nil {
		return nil, err
	}
	return ToMovieStatsDomain(&record), nil
}

func (s *Store) GetUserLogs(ctx context.Context, userID uuid.UUID) ([]catalog.MovieLog, error) {
	var records []MovieLogRecord
	err := s.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("updated_at DESC").
		Find(&records).Error
	return ToMovieLogList(records), err
}

func (s *Store) GetMovieLog(ctx context.Context, userID uuid.UUID, movieID uint) (*catalog.MovieLog, error) {
	var record MovieLogRecord
	err := s.db.WithContext(ctx).Where("user_id = ? AND movie_id = ?", userID, movieID).First(&record).Error
	if err != nil {
		return nil, err
	}
	return ToMovieLogDomain(&record), nil
}
