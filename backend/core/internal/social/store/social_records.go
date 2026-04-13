package store

import (
	"time"

	"github.com/StartLivin/screek/backend/internal/social"
	userstore "github.com/StartLivin/screek/backend/internal/users/store"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostRecord struct {
	ID           uint            `gorm:"primaryKey;autoIncrement"`
	UserID       uuid.UUID       `gorm:"type:uuid;not null;index"`
	PostType     social.PostType `gorm:"type:string;not null;index"`
	Content      string          `gorm:"type:text"`
	IsSpoiler    bool            `gorm:"not null;default:false"`
	ReferenceID  *uint           `gorm:"index"`
	ParentID     *uint           `gorm:"index"`
	LikesCount   int             `gorm:"not null;default:0"`
	RepliesCount int             `gorm:"not null;default:0"`
	CreatedAt    time.Time       `gorm:"not null;default:now();index"`
	UpdatedAt    time.Time       `gorm:"not null;default:now()"`

	User    userstore.UserRecord `gorm:"foreignKey:UserID"`
	Parent  *PostRecord          `gorm:"foreignKey:ParentID"`
	Replies []PostRecord         `gorm:"foreignKey:ParentID"`
	Likes   []PostLikeRecord     `gorm:"foreignKey:PostID"`
}

type PostLikeRecord struct {
	PostID    uint      `gorm:"primaryKey;autoIncrement:false"`
	UserID    uuid.UUID `gorm:"type:uuid;primaryKey"`
	CreatedAt time.Time `gorm:"not null;default:now()"`

	Post PostRecord           `gorm:"foreignKey:PostID"`
	User userstore.UserRecord `gorm:"foreignKey:UserID"`
}

type FollowRecord struct {
	ID         uint      `gorm:"primaryKey;autoIncrement"`
	FollowerID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_follower_followee"`
	FolloweeID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_follower_followee"`
	CreatedAt  time.Time `gorm:"not null;default:now()"`

	Follower userstore.UserRecord `gorm:"foreignKey:FollowerID"`
	Followee userstore.UserRecord `gorm:"foreignKey:FolloweeID"`
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&PostRecord{}, &PostLikeRecord{},
		&FollowRecord{},
	)
}
