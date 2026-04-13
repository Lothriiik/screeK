package store

import (
	"github.com/StartLivin/screek/backend/internal/bookings"
	"github.com/google/uuid"
)

func ToTransactionDomain(r *TransactionRecord) *bookings.Transaction {
	if r == nil {
		return nil
	}

	var ticketIDs []uuid.UUID
	for _, ticketRecord := range r.Tickets {
		ticketIDs = append(ticketIDs, ticketRecord.ID)
	}

	return &bookings.Transaction{
		ID:            r.ID,
		UserID:        r.UserID,
		TotalAmount:   r.TotalAmount,
		Status:        bookings.TicketStatus(r.Status),
		PaymentMethod: r.PaymentMethod,
		PaymentID:     r.PaymentID,
		Tickets:       ticketIDs,
		CreatedAt:     r.CreatedAt,
	}
}

func ToTransactionRecord(d *bookings.Transaction) *TransactionRecord {
	if d == nil {
		return nil
	}

	var ticketRecords []TicketRecord
	for _, id := range d.Tickets {
		ticketRecords = append(ticketRecords, TicketRecord{ID: id})
	}

	return &TransactionRecord{
		ID:            d.ID,
		UserID:        d.UserID,
		TotalAmount:   d.TotalAmount,
		Status:        TicketStatus(d.Status),
		PaymentMethod: d.PaymentMethod,
		PaymentID:     d.PaymentID,
		Tickets:       ticketRecords,
		CreatedAt:     d.CreatedAt,
	}
}

func ToTicketDomain(r *TicketRecord) *bookings.Ticket {
	if r == nil {
		return nil
	}

	var transaction bookings.Transaction
	if r.Transaction.ID != uuid.Nil {
		cleanTx := ToTransactionDomain(&r.Transaction)
		if cleanTx != nil {
			transaction = *cleanTx
		}
	}

	return &bookings.Ticket{
		ID:            r.ID,
		TransactionID: r.TransactionID,
		SessionID:     r.SessionID,
		SeatID:        r.SeatID,
		Status:        bookings.TicketStatus(r.Status),
		Type:          bookings.TicketType(r.Type),
		PricePaid:     r.PricePaid,
		QRCode:        r.QRCode,
		Transaction:   transaction,
	}
}

func ToTicketRecord(d *bookings.Ticket) *TicketRecord {
	if d == nil {
		return nil
	}

	var txRecord TransactionRecord
	cleanTx := ToTransactionRecord(&d.Transaction)
	if cleanTx != nil {
		txRecord = *cleanTx
	}

	return &TicketRecord{
		ID:            d.ID,
		TransactionID: d.TransactionID,
		SessionID:     d.SessionID,
		SeatID:        d.SeatID,
		Status:        TicketStatus(d.Status),
		Type:          TicketType(d.Type),
		PricePaid:     d.PricePaid,
		QRCode:        d.QRCode,
		Transaction:   txRecord,
	}
}

func ToTransactionList(records []TransactionRecord) []bookings.Transaction {
	list := make([]bookings.Transaction, len(records))
	for i, r := range records {
		list[i] = *ToTransactionDomain(&r)
	}
	return list
}

func ToTicketList(records []TicketRecord) []bookings.Ticket {
	list := make([]bookings.Ticket, len(records))
	for i, r := range records {
		list[i] = *ToTicketDomain(&r)
	}
	return list
}
