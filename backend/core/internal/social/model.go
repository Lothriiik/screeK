package social

import (
	"time"

	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostType string

const (
	PostTypeText         PostType = "TEXT"          
	PostTypeReview       PostType = "REVIEW"        
	PostTypeSessionShare PostType = "SESSION_SHARE" 
	PostTypeRepost       PostType = "REPOST"        
)

type Post struct {
	ID           uint       `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID       uuid.UUID  `json:"user_id" gorm:"type:uuid;not null;index"`
	PostType     PostType   `json:"post_type" gorm:"type:string;not null;index"`
	Content      string     `json:"content"`
	IsSpoiler    bool       `json:"is_spoiler" gorm:"not null;default:false"`
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
	UserID    uuid.UUID  `json:"user_id" gorm:"type:uuid;primaryKey"`
	CreatedAt time.Time  `json:"created_at" gorm:"not null;default:now()"`
	
	Post Post       `json:"post" gorm:"foreignKey:PostID"`
	User users.User `json:"user" gorm:"foreignKey:UserID"`
}

type Follow struct {
	ID         uint       `json:"id" gorm:"primaryKey;autoIncrement"`
	FollowerID uuid.UUID  `json:"follower_id" gorm:"type:uuid;not null;uniqueIndex:idx_follower_followee"`
	FolloweeID uuid.UUID  `json:"followee_id" gorm:"type:uuid;not null;uniqueIndex:idx_follower_followee"`
	CreatedAt  time.Time  `json:"created_at" gorm:"not null;default:now()"`
	
	Follower users.User `json:"follower" gorm:"foreignKey:FollowerID"`
	Followee users.User `json:"followee" gorm:"foreignKey:FolloweeID"`
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&Post{}, &PostLike{},
		&Follow{},
	)
}
