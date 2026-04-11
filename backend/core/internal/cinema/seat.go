package cinema

type Seat struct {
	ID         int    `json:"id"`
	RoomID     int    `json:"room_id"`
	Row        string `json:"row"`
	Number     int    `json:"number"`
	PosX       int    `json:"pos_x"`
	PosY       int    `json:"pos_y"`
	Type       string `json:"type"`
	IsOccupied bool   `json:"is_occupied"`
}
