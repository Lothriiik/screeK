package social

import (
	"time"

	"github.com/StartLivin/cine-pass/backend/internal/movies"
	"github.com/StartLivin/cine-pass/backend/internal/users"
	"gorm.io/gorm"
)

type Review struct {
	ID               int             `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID           int             `json:"user_id" gorm:"not null"`
	MovieID          int             `json:"movie_id" gorm:"not null"`
	Rating           int             `json:"rating" gorm:"not null"`
	Text             string          `json:"text" gorm:"not null"`
	ContainsSpoilers bool            `json:"contains_spoilers" gorm:"not null;default:false"`
	CreatedAt        time.Time       `json:"created_at" gorm:"not null;default:now()"`
	User             users.User      `json:"user" gorm:"foreignKey:UserID"`
	Movie            movies.Movie    `json:"movie" gorm:"foreignKey:MovieID"`
	Likes            []ReviewLike    `json:"likes" gorm:"foreignKey:ReviewID"`
	Comments         []ReviewComment `json:"comments" gorm:"foreignKey:ReviewID"`
}

type WatchedMovie struct {
	ID          int          `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID      int          `json:"user_id" gorm:"not null"`
	MovieID     int          `json:"movie_id" gorm:"not null"`
	Liked       bool         `json:"liked" gorm:"not null"`
	Rating      float64      `json:"rating" gorm:"not null"`
	WatchedDate time.Time    `json:"watched_date" gorm:"not null;default:now()"`
	User        users.User   `json:"user" gorm:"foreignKey:UserID"`
	Movie       movies.Movie `json:"movie" gorm:"foreignKey:MovieID"`
}

type MovieList struct {
	ID          int             `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID      int             `json:"user_id" gorm:"not null"`
	Title       string          `json:"title" gorm:"not null"`
	IsPublic    bool            `json:"is_public" gorm:"not null;default:true"`
	Description string          `json:"description" gorm:"not null"`
	CreatedAt   time.Time       `json:"created_at" gorm:"not null;default:now()"`
	User        users.User      `json:"user" gorm:"foreignKey:UserID"`
	Items       []MovieListItem `json:"items" gorm:"foreignKey:ListID"`
}

type MovieListItem struct {
	ID      int          `json:"id" gorm:"primaryKey;autoIncrement"`
	ListID  int          `json:"list_id" gorm:"not null"`
	MovieID int          `json:"movie_id" gorm:"not null"`
	AddedAt time.Time    `json:"added_at" gorm:"not null;default:now()"`
	List    MovieList    `json:"list" gorm:"foreignKey:ListID"`
	Movie   movies.Movie `json:"movie" gorm:"foreignKey:MovieID"`
}

type ReviewLike struct {
	ID        int        `json:"id" gorm:"primaryKey;autoIncrement"`
	ReviewID  int        `json:"review_id" gorm:"not null"`
	UserID    int        `json:"user_id" gorm:"not null"`
	CreatedAt time.Time  `json:"created_at" gorm:"not null;default:now()"`
	Review    Review     `json:"review" gorm:"foreignKey:ReviewID"`
	User      users.User `json:"user" gorm:"foreignKey:UserID"`
}

type ReviewComment struct {
	ID        int        `json:"id" gorm:"primaryKey;autoIncrement"`
	ReviewID  int        `json:"review_id" gorm:"not null"`
	UserID    int        `json:"user_id" gorm:"not null"`
	Text      string     `json:"text" gorm:"not null"`
	CreatedAt time.Time  `json:"created_at" gorm:"not null;default:now()"`
	Review    Review     `json:"review" gorm:"foreignKey:ReviewID"`
	User      users.User `json:"user" gorm:"foreignKey:UserID"`
}

type WatchlistItem struct {
	ID      int          `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID  int          `json:"user_id" gorm:"not null"`
	MovieID int          `json:"movie_id" gorm:"not null"`
	AddedAt time.Time    `json:"added_at" gorm:"not null;default:now()"`
	User    users.User   `json:"user" gorm:"foreignKey:UserID"`
	Movie   movies.Movie `json:"movie" gorm:"foreignKey:MovieID"`
}

type Follow struct {
	ID         int        `json:"id" gorm:"primaryKey;autoIncrement"`
	FollowerID int        `json:"follower_id" gorm:"not null"`
	FolloweeID int        `json:"followee_id" gorm:"not null"`
	CreatedAt  time.Time  `json:"created_at" gorm:"not null;default:now()"`
	Follower   users.User `json:"follower" gorm:"foreignKey:FollowerID"`
	Followee   users.User `json:"followee" gorm:"foreignKey:FolloweeID"`
}

type Notification struct {
	ID        int        `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID    int        `json:"user_id" gorm:"not null"`
	Type      string     `json:"type" gorm:"not null"`
	Title     string     `json:"title" gorm:"not null"`
	Message   string     `json:"message" gorm:"not null"`
	IsRead    bool       `json:"is_read" gorm:"not null;default:false"`
	Link      string     `json:"link" gorm:"not null"`
	CreatedAt time.Time  `json:"created_at" gorm:"not null;default:now()"`
	User      users.User `json:"user" gorm:"foreignKey:UserID"`
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&Review{}, &ReviewLike{}, &ReviewComment{},
		&WatchedMovie{}, &WatchlistItem{},
		&MovieList{}, &MovieListItem{},
		&Follow{}, &Notification{},
	)
}
