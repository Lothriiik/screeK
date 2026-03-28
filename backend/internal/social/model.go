package social

import (
	"time"

	"github.com/StartLivin/cine-pass/backend/internal/movies"
	"github.com/StartLivin/cine-pass/backend/internal/users"
	"gorm.io/gorm"
)

type MovieLog struct {
	UserID    uint         `json:"user_id" gorm:"primaryKey;autoIncrement:false"`
	MovieID   uint         `json:"movie_id" gorm:"primaryKey;autoIncrement:false"`
	Watched   bool         `json:"watched" gorm:"not null"`
	Rating    float64      `json:"rating" gorm:"not null"`
	Liked     bool         `json:"liked" gorm:"not null"`
	CreatedAt time.Time    `json:"created_at" gorm:"not null;default:now()"`
	UpdatedAt time.Time    `json:"updated_at" gorm:"not null;default:now()"`

	User  users.User   `json:"user" gorm:"foreignKey:UserID"`
	Movie movies.Movie `json:"movie" gorm:"foreignKey:MovieID"`
}

type PostType string

const (
	PostTypeText         PostType = "TEXT"          
	PostTypeReview       PostType = "REVIEW"        
	PostTypeSessionShare PostType = "SESSION_SHARE" 
	PostTypeRepost       PostType = "REPOST"        
)

type Post struct {
	ID           uint       `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID       uint       `json:"user_id" gorm:"not null;index"`
	PostType     PostType   `json:"post_type" gorm:"type:string;not null;index"`
	Content      string     `json:"content"`
	ReferenceID  *uint      `json:"reference_id" gorm:"index"` 
	ParentID     *uint      `json:"parent_id" gorm:"index"`    
	LikesCount   int        `json:"likes_count" gorm:"not null;default:0"`
	RepliesCount int        `json:"replies_count" gorm:"not null;default:0"`
	CreatedAt    time.Time  `json:"created_at" gorm:"not null;default:now();index"`
	UpdatedAt    time.Time  `json:"updated_at" gorm:"not null;default:now()"`

	User users.User `json:"user" gorm:"foreignKey:UserID"`
	
	Parent  *Post      `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Replies []Post     `json:"replies,omitempty" gorm:"foreignKey:ParentID"`
	Likes   []PostLike `json:"likes,omitempty" gorm:"foreignKey:PostID"`
}

type PostLike struct {
	PostID    uint       `json:"post_id" gorm:"primaryKey;autoIncrement:false"`
	UserID    uint       `json:"user_id" gorm:"primaryKey;autoIncrement:false"`
	CreatedAt time.Time  `json:"created_at" gorm:"not null;default:now()"`
	
	Post Post       `json:"post" gorm:"foreignKey:PostID"`
	User users.User `json:"user" gorm:"foreignKey:UserID"`
}

type Follow struct {
	ID         uint       `json:"id" gorm:"primaryKey;autoIncrement"`
	FollowerID uint       `json:"follower_id" gorm:"not null;uniqueIndex:idx_follower_followee"`
	FolloweeID uint       `json:"followee_id" gorm:"not null;uniqueIndex:idx_follower_followee"`
	CreatedAt  time.Time  `json:"created_at" gorm:"not null;default:now()"`
	
	Follower users.User `json:"follower" gorm:"foreignKey:FollowerID"`
	Followee users.User `json:"followee" gorm:"foreignKey:FolloweeID"`
}

type Notification struct {
	ID        uint       `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID    uint       `json:"user_id" gorm:"not null"`
	Type      string     `json:"type" gorm:"not null"`
	Title     string     `json:"title" gorm:"not null"`
	Message   string     `json:"message" gorm:"not null"`
	IsRead    bool       `json:"is_read" gorm:"not null;default:false"`
	Link      string     `json:"link" gorm:"not null"`
	CreatedAt time.Time  `json:"created_at" gorm:"not null;default:now()"`
	
	User users.User `json:"user" gorm:"foreignKey:UserID"`
}

type MovieList struct {
	ID          uint            `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID      uint            `json:"user_id" gorm:"not null"`
	Title       string          `json:"title" gorm:"not null"`
	IsPublic    bool            `json:"is_public" gorm:"not null;default:true"`
	Description string          `json:"description" gorm:"not null"`
	CreatedAt   time.Time       `json:"created_at" gorm:"not null;default:now()"`
	
	User  users.User      `json:"user" gorm:"foreignKey:UserID"`
	Items []MovieListItem `json:"items" gorm:"foreignKey:ListID"`
}

type MovieListItem struct {
	ID      uint         `json:"id" gorm:"primaryKey;autoIncrement"`
	ListID  uint         `json:"list_id" gorm:"not null"`
	MovieID uint         `json:"movie_id" gorm:"not null"`
	AddedAt time.Time    `json:"added_at" gorm:"not null;default:now()"`
	
	List  MovieList    `json:"list" gorm:"foreignKey:ListID"`
	Movie movies.Movie `json:"movie" gorm:"foreignKey:MovieID"`
}

type WatchlistItem struct {
	UserID  uint         `json:"user_id" gorm:"primaryKey;autoIncrement:false"`
	MovieID uint         `json:"movie_id" gorm:"primaryKey;autoIncrement:false"`
	AddedAt time.Time    `json:"added_at" gorm:"not null;default:now()"`
	
	User  users.User   `json:"user" gorm:"foreignKey:UserID"`
	Movie movies.Movie `json:"movie" gorm:"foreignKey:MovieID"`
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&MovieLog{},
		&Post{}, &PostLike{},
		&Follow{}, &Notification{},
		&MovieList{}, &MovieListItem{},
		&WatchlistItem{},
	)
}
