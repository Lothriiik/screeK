package bookings

import (
	"time"

	"github.com/google/uuid"
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

type Transaction struct {
	ID            uuid.UUID    `json:"id"`
	UserID        uuid.UUID    `json:"user_id"`
	TotalAmount   int          `json:"total_amount"`
	Status        TicketStatus `json:"status"`
	PaymentMethod string       `json:"payment_method"`
	PaymentID     string       `json:"payment_id"`
	Tickets       []uuid.UUID    	   `json:"tickets"`
	CreatedAt     time.Time    `json:"created_at"`
}

type Ticket struct {
	ID            uuid.UUID      `json:"id"`
	TransactionID uuid.UUID      `json:"transaction_id"`
	SessionID     int            `json:"session_id"`
	SeatID        *int           `json:"seat_id"`
	Status        TicketStatus   `json:"status"`
	Type          TicketType     `json:"type"`
	PricePaid     int            `json:"price_paid"`
	QRCode        string         `json:"qr_code"`
	Transaction   Transaction    `json:"-"`
}

