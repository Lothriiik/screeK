package catalog

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Store struct {
	db *gorm.DB
}

func NewStore(db *gorm.DB) *Store {
	return &Store{db: db}
}

func (s *Store) UpsertMovieLog(ctx context.Context, log *MovieLog) error {
	return s.db.WithContext(ctx).Save(log).Error
}

func (s *Store) AddToWatchlist(ctx context.Context, item *WatchlistItem) error {
	return s.db.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(item).Error
}

func (s *Store) RemoveFromWatchlist(ctx context.Context, userID uuid.UUID, movieID uint) error {
	return s.db.WithContext(ctx).Where("user_id = ? AND movie_id = ?", userID, movieID).Delete(&WatchlistItem{}).Error
}

func (s *Store) GetWatchlist(ctx context.Context, userID uuid.UUID) ([]WatchlistItem, error) {
	var items []WatchlistItem
	err := s.db.WithContext(ctx).Preload("Movie").Where("user_id = ?", userID).Find(&items).Error
	return items, err
}

func (s *Store) CreateMovieList(ctx context.Context, list *MovieList) error {
	return s.db.WithContext(ctx).Create(list).Error
}

func (s *Store) GetMovieLists(ctx context.Context, userID uuid.UUID) ([]MovieList, error) {
	var lists []MovieList
	err := s.db.WithContext(ctx).Preload("Items").Where("user_id = ?", userID).Find(&lists).Error
	return lists, err
}

func (s *Store) GetMovieListByID(ctx context.Context, listID uint) (*MovieList, error) {
	var list MovieList
	err := s.db.WithContext(ctx).Preload("User").Preload("Items.Movie").First(&list, listID).Error
	return &list, err
}

func (s *Store) AddMovieToList(ctx context.Context, listID uint, movieID uint) error {
	item := MovieListItem{ListID: listID, MovieID: movieID}
	return s.db.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(&item).Error
}

func (s *Store) RemoveMovieFromList(ctx context.Context, listID uint, movieID uint) error {
	return s.db.WithContext(ctx).Where("list_id = ? AND movie_id = ?", listID, movieID).Delete(&MovieListItem{}).Error
}

func (s *Store) DeleteMovieList(ctx context.Context, listID uint) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("list_id = ?", listID).Delete(&MovieListItem{}).Error; err != nil {
			return err
		}
		return tx.Delete(&MovieList{}, listID).Error
	})
}
func (s *Store) SearchLists(ctx context.Context, query string) ([]MovieList, error) {
	var lists []MovieList
	pattern := "%" + query + "%"
	err := s.db.WithContext(ctx).Preload("User").Where("is_public = true AND (title ILIKE ? OR description ILIKE ?)", pattern, pattern).Find(&lists).Error
	return lists, err
}
