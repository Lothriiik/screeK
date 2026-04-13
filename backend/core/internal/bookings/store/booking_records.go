package store

import (
	"time"

	cinemastore "github.com/StartLivin/screek/backend/internal/cinema/store"
	userstore "github.com/StartLivin/screek/backend/internal/users/store"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TicketType string

const (
	TicketTypeStandard TicketType = "STANDARD"
	TicketTypeHalf     TicketType = "HALF"
	TicketTypeFree     TicketType = "FREE"
)

type TicketStatus string

const (
	TicketStatusPending   TicketStatus = "PENDING"
	TicketStatusPaid      TicketStatus = "PAID"
	TicketStatusCancelled TicketStatus = "CANCELLED"
)

type TransactionRecord struct {
	ID            uuid.UUID            `json:"id" gorm:"type:uuid;primaryKey"`
	UserID        uuid.UUID            `json:"user_id" gorm:"type:uuid;not null;index:idx_tx_user_status,composite:user"`
	TotalAmount   int                  `json:"total_amount" gorm:"not null"`
	Status        TicketStatus         `json:"status" gorm:"type:varchar(20);not null;index:idx_tx_user_status,composite:status"`
	PaymentMethod string               `json:"payment_method" gorm:"not null"`
	PaymentID     string               `json:"payment_id" gorm:"index"`
	User          userstore.UserRecord `json:"user" gorm:"foreignKey:UserID"`
	Tickets       []TicketRecord       `json:"tickets" gorm:"foreignKey:TransactionID"`
	CreatedAt     time.Time            `json:"created_at" gorm:"not null;default:now()"`
}
type TicketRecord struct {
	ID            uuid.UUID                 `json:"id" gorm:"type:uuid;primaryKey"`
	TransactionID uuid.UUID                 `json:"transaction_id" gorm:"type:uuid;not null;index"`
	SessionID     int                       `json:"session_id" gorm:"not null;index:idx_tickets_session_seat_status,composite:session"`
	SeatID        *int                      `json:"seat_id" gorm:"index:idx_tickets_session_seat_status,composite:seat"`
	Status        TicketStatus              `json:"status" gorm:"type:varchar(20);not null;index:idx_tickets_session_seat_status,composite:status"`
	Type          TicketType                `json:"type" gorm:"type:varchar(20);not null;default:'STANDARD'"`
	PricePaid     int                       `json:"price_paid" gorm:"not null;default:0"`
	QRCode        string                    `json:"qr_code" gorm:"not null;unique"`
	Transaction   TransactionRecord         `json:"-" gorm:"foreignKey:TransactionID"`
	Session       cinemastore.SessionRecord `json:"session" gorm:"foreignKey:SessionID"`
	Seat          *cinemastore.SeatRecord   `json:"seat" gorm:"foreignKey:SeatID"`
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&TransactionRecord{}, &TicketRecord{},
	)
}
