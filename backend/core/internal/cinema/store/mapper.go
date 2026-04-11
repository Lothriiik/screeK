package store

import (
	"github.com/StartLivin/screek/backend/internal/cinema"
)

func ToCinemaDomain(r *CinemaRecord) *cinema.Cinema {
	if r == nil {
		return nil
	}

	var rooms []cinema.Room

	for i := range r.Rooms{
		roomRecord := &r.Rooms[i]

		cleanRoom := ToRoomDomain(roomRecord)

		if cleanRoom != nil {
			rooms = append(rooms, *cleanRoom)
		}
	}

	return &cinema.Cinema{
		ID: 		r.ID,
		Name:       r.Name,
		Address:    r.Address,
		City:   	r.City,
		Phone:   	r.Phone,
		Email:   	r.Email,
		CreatedAt:  r.CreatedAt,
		UpdatedAt:  r.UpdatedAt,
		Rooms:      rooms,
	}
}

func ToCinemaRecord(d *cinema.Cinema) *CinemaRecord {
	if d == nil {
		return nil
	}

	var rooms []RoomRecord

	for i := range d.Rooms{
		roomRecord := &d.Rooms[i]

		cleanRoom := ToRoomRecord(roomRecord)

		if cleanRoom != nil {
			rooms = append(rooms, *cleanRoom)
		}
	}

	return &CinemaRecord{
		ID: 		d.ID,
		Name:       d.Name,
		Address:    d.Address,
		City:   	d.City,
		Phone:   	d.Phone,
		Email:   	d.Email,
		CreatedAt:  d.CreatedAt,
		UpdatedAt:  d.UpdatedAt,
		Rooms:      rooms,
	}
}

func ToRoomDomain(r *RoomRecord) *cinema.Room {
	if r == nil {
		return nil
	}

	var seats []cinema.Seat

	for i := range r.Seats{
		seatRecord := &r.Seats[i]

		cleanSeat := ToSeatDomain(seatRecord)

		if cleanSeat != nil {
			seats = append(seats, *cleanSeat)
		}
	}

	return &cinema.Room{
		ID: 		r.ID,
		CinemaID: 	r.CinemaID,
		Name:       r.Name,
		Capacity:   r.Capacity,
		Type:       cinema.RoomType(r.Type), 
		Seats:      seats,
	}
}

func ToRoomRecord(d *cinema.Room) *RoomRecord {
	if d == nil {
		return nil
	}
	
	var seats []SeatRecord
	
	for i := range d.Seats{
		seatRecord := &d.Seats[i]

		cleanSeat := ToSeatRecord(seatRecord)

		if cleanSeat != nil {
			seats = append(seats, *cleanSeat)
		}
	}

	return &RoomRecord{
		ID: 		d.ID,
		CinemaID: 	d.CinemaID,
		Name:       d.Name,
		Capacity:   d.Capacity,
		Type:       RoomType(d.Type), 
		Seats:      seats,
	}
}

func ToSeatDomain(r *SeatRecord) *cinema.Seat {
	if r == nil {
		return nil
	}

	return &cinema.Seat{
		ID: 		r.ID,
		RoomID: 	r.RoomID,
		Row:        r.Row,
		Number:     r.Number,
		PosX:       r.PosX,
		PosY:       r.PosY,
		Type:       r.Type,
		IsOccupied: r.IsOccupied,
	}
}

func ToSeatRecord(d *cinema.Seat) *SeatRecord {
	if d == nil {
		return nil
	}
	
	return &SeatRecord{
		ID: 		d.ID,
		RoomID: 	d.RoomID,
		Row:        d.Row,
		Number:     d.Number,
		PosX:       d.PosX,
		PosY:       d.PosY,
		Type:       d.Type,
		IsOccupied: d.IsOccupied,
	}
}


func ToSessionDomain(r *SessionRecord) *cinema.Session {
	if r == nil {
		return nil
	}

	var room cinema.Room

	roomRecord := &r.Room

	cleanRoom := ToRoomDomain(roomRecord)
	if cleanRoom != nil {
		room = *cleanRoom
	}

	return &cinema.Session{
		ID: 		r.ID,
		RoomID: 	r.RoomID,
		MovieID:        r.MovieID,
		StartTime:     r.StartTime,
		Price:       r.Price,
		SessionType:  cinema.SessionType(r.SessionType),
		IsFree:       r.IsFree,
		Room: room,
	}
}
func ToSessionRecord(d *cinema.Session) *SessionRecord {
	if d == nil {
		return nil
	}

	var room RoomRecord

	roomRecord := &d.Room

	cleanRoom := ToRoomRecord(roomRecord)
	if cleanRoom != nil {
		room = *cleanRoom
	}

	return &SessionRecord{
		ID: 		d.ID,
		RoomID: 	d.RoomID,
		MovieID:        d.MovieID,
		StartTime:     d.StartTime,
		Price:       d.Price,
		SessionType:  SessionType(d.SessionType),
		IsFree:       d.IsFree,
		Room: room,
	}
}

func ToManagerDomain(r *CinemaManagerRecord) *cinema.CinemaManager {
	if r == nil {
		return nil
	}

	return &cinema.CinemaManager{
		UserID: 	r.UserID ,
		CinemaID: 	r.CinemaID,
		CreatedAt:  r.CreatedAt,
	}
}

func ToManagerRecord(d *cinema.CinemaManager) *CinemaManagerRecord {
	if d == nil {
		return nil
	}

	return &CinemaManagerRecord{
		UserID: 	d.UserID ,
		CinemaID: 	d.CinemaID,
		CreatedAt:  d.CreatedAt,
	}
}
