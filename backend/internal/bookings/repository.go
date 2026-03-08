package bookings

type BookingsRepository interface {
	GetCinemaByID(id int) (*Cinema, error)
	GetSessionsByMovie(movieID int, city string, date string) ([]Session, error)
	GetSeatsBySession(sessionID int) ([]Seat, error)
	ReserveSeats(userID, sessionID int, seatIDs []int) (*Transaction, error)
	PayTransaction(transactionID int, method string) error
	CancelTicket(ticketID int) error
}