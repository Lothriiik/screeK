package store

type SeatRecord struct {
	ID         int    		`json:"id" gorm:"primaryKey;autoIncrement"`
	RoomID     int    		`json:"room_id" gorm:"not null;index:idx_seats_room_row_number,composite:room"`
	Row        string 		`json:"row" gorm:"not null;index:idx_seats_room_row_number,composite:row"`
	Number     int    		`json:"number" gorm:"not null;index:idx_seats_room_row_number,composite:number"`
	PosX       int    		`json:"pos_x" gorm:"not null"`
	PosY       int    		`json:"pos_y" gorm:"not null"`
	Type       string 		`json:"type" gorm:"not null"`
	Room       RoomRecord   `json:"-" gorm:"foreignKey:RoomID"`
	IsOccupied bool   		`json:"is_occupied" gorm:"-"`
}


