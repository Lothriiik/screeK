package bookings

import (
	"time"

	"github.com/StartLivin/cine-pass/backend/internal/movies"
	"github.com/StartLivin/cine-pass/backend/internal/users"
	"gorm.io/gorm"
)

type RoomType string

const (
	RoomTypeStandard RoomType = "STANDARD"
	RoomTypeIMAX     RoomType = "IMAX"
	RoomTypeVIP      RoomType = "VIP"
)

type SessionType string

const (
	SessionTypeRegular    SessionType = "REGULAR"
	SessionTypePremiere   SessionType = "PREMIERE"
	SessionTypeRescreen   SessionType = "RESCREENING"
	SessionTypeFestival   SessionType = "FESTIVAL"
	SessionTypeUniversity SessionType = "UNIVERSITY"
	SessionTypeShowcase   SessionType = "SHOWCASE"
)

type TicketStatus string

const (
	TicketStatusPending   TicketStatus = "PENDING"
	TicketStatusPaid      TicketStatus = "PAID"
	TicketStatusCancelled TicketStatus = "CANCELLED"
)

type Cinema struct {
	ID      int    `json:"id" gorm:"primaryKey;autoIncrement"`
	Name    string `json:"name" gorm:"not null"`
	Address string `json:"address" gorm:"not null"`
	City    string `json:"city" gorm:"not null"`
	Phone   string       `json:"phone" gorm:"not null"`
	Email   string       `json:"email" gorm:"not null"`
	Rooms   []Room       `json:"rooms" gorm:"foreignKey:CinemaID"`
	Managers []users.User `json:"managers" gorm:"many2many:cinema_managers;"`
}

type Room struct {
	ID       			int    `json:"id" gorm:"primaryKey;autoIncrement"`
	CinemaID 			int    `json:"cinema_id" gorm:"not null"`
	Name     			string `json:"name" gorm:"not null"`
	Capacity         	int      `json:"capacity" gorm:"not null"`
	Type             	RoomType `json:"type" gorm:"type:varchar(20);not null"`
	HasNumberedSeats 	bool   `json:"has_numbered_seats" gorm:"default:true"`
	Cinema           	Cinema `json:"cinema" gorm:"foreignKey:CinemaID"`
	Seats    			[]Seat `json:"seats" gorm:"foreignKey:RoomID"`
}

type Seat struct {
	ID         int    `json:"id" gorm:"primaryKey;autoIncrement"`
	RoomID     int    `json:"room_id" gorm:"not null"`
	Row        string `json:"row" gorm:"not null"`
	Number     int    `json:"number" gorm:"not null"`
	PosX       int    `json:"pos_x" gorm:"not null"`
	PosY       int    `json:"pos_y" gorm:"not null"`
	Type       string `json:"type" gorm:"not null"`
	Room       Room   `json:"room" gorm:"foreignKey:RoomID"`
	IsOccupied bool   `json:"is_occupied" gorm:"-"`
}

type Session struct {
	ID        	int          `json:"id" gorm:"primaryKey;autoIncrement"`
	MovieID  	int          `json:"movie_id" gorm:"not null"`
	RoomID    	int          `json:"room_id" gorm:"not null"`
	StartTime   time.Time    `json:"start_time" gorm:"not null"`
	Price       int			 `json:"price" gorm:"not null"`
	SessionType SessionType  `json:"session_type" gorm:"type:varchar(20);not null;default:'REGULAR'"`
	IsFree      bool         `json:"is_free" gorm:"default:false"`
	Movie       movies.Movie `json:"movie" gorm:"foreignKey:MovieID"`
	Room      	Room         `json:"room" gorm:"foreignKey:RoomID"`
}

type Transaction struct {
	ID            int        	`json:"id" gorm:"primaryKey;autoIncrement"`
	UserID        int        	`json:"user_id" gorm:"not null"`
	TotalAmount   int      		`json:"total_amount" gorm:"not null"`
	Status        TicketStatus 	`json:"status" gorm:"type:varchar(20);not null"`
	PaymentMethod string     	`json:"payment_method" gorm:"not null"`
	User          users.User 	`json:"user" gorm:"foreignKey:UserID"`
	Tickets       []Ticket   	`json:"tickets" gorm:"foreignKey:TransactionID"`
	CreatedAt     time.Time 	 `json:"created_at" gorm:"not null;default:now()"`
}

type Ticket struct {
	ID            int         `json:"id" gorm:"primaryKey;autoIncrement"`
	TransactionID int         `json:"transaction_id" gorm:"not null"`
	SessionID     int         `json:"session_id" gorm:"not null"`
	SeatID        *int        `json:"seat_id"`
	QRCode        string       `json:"qr_code" gorm:"not null"`
	Status        TicketStatus `json:"status" gorm:"type:varchar(20);not null"`
	Transaction   Transaction `json:"transaction" gorm:"foreignKey:TransactionID"`
	Session       Session     `json:"session" gorm:"foreignKey:SessionID"`
	Seat          *Seat       `json:"seat" gorm:"foreignKey:SeatID"`
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&Cinema{}, &Room{}, &Seat{}, &Session{},
		&Transaction{}, &Ticket{},
	)
}
