package events

import (
	"github.com/google/uuid"
)

type TicketPurchasedEvent struct {
	TransactionID uuid.UUID
	UserID        uuid.UUID
	UserName      string
	UserEmail     string
	IsFree        bool
	PaymentID     string
	Tickets       []TicketPurchasedItem
}

type TicketPurchasedItem struct {
	TicketID uuid.UUID
	QRCode   string
}

type PostLikedEvent struct {
	PostID    uint      `json:"post_id"`
	OwnerID   uuid.UUID `json:"owner_id"`
	LikerID   uuid.UUID `json:"liker_id"`
	LikerName string    `json:"liker_name"`
}

type UserFollowedEvent struct {
	FollowerID   uuid.UUID `json:"follower_id"`
	FollowerName string    `json:"follower_name"`
	FolloweeID   uuid.UUID `json:"followee_id"`
}

type CommentAddedEvent struct {
	PostID        uint      `json:"post_id"`
	ParentID      uint      `json:"parent_id"`
	UserID        uuid.UUID `json:"user_id"`
	UserName      string    `json:"user_name"`
	ParentOwnerID uuid.UUID `json:"parent_owner_id"`
}

type SessionScheduledEvent struct {
	SessionID int    `json:"session_id"`
	MovieID   int    `json:"movie_id"`
	RoomID    int    `json:"room_id"`
	StartTime string `json:"start_time"`
}
