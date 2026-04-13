package store

import (
	"github.com/StartLivin/screek/backend/internal/social"
)

func ToPostDomain(r *PostRecord) *social.Post {
	if r == nil {
		return nil
	}
	return &social.Post{
		ID:           r.ID,
		UserID:       r.UserID,
		PostType:     r.PostType,
		Content:      r.Content,
		IsSpoiler:    r.IsSpoiler,
		ReferenceID:  r.ReferenceID,
		ParentID:     r.ParentID,
		LikesCount:   r.LikesCount,
		RepliesCount: r.RepliesCount,
		CreatedAt:    r.CreatedAt,
		UpdatedAt:    r.UpdatedAt,
	}
}

func ToPostList(records []PostRecord) []social.Post {
	list := make([]social.Post, len(records))
	for i := range records {
		list[i] = *ToPostDomain(&records[i])
	}
	return list
}

func ToPostRecord(d *social.Post) *PostRecord {
	if d == nil {
		return nil
	}
	return &PostRecord{
		ID:           d.ID,
		UserID:       d.UserID,
		PostType:     d.PostType,
		Content:      d.Content,
		IsSpoiler:    d.IsSpoiler,
		ReferenceID:  d.ReferenceID,
		ParentID:     d.ParentID,
		LikesCount:   d.LikesCount,
		RepliesCount: d.RepliesCount,
		CreatedAt:    d.CreatedAt,
		UpdatedAt:    d.UpdatedAt,
	}
}

func ToPostLikeDomain(r *PostLikeRecord) *social.PostLike {
	if r == nil {
		return nil
	}
	return &social.PostLike{
		PostID:    r.PostID,
		UserID:    r.UserID,
		CreatedAt: r.CreatedAt,
	}
}

func ToPostLikeList(records []PostLikeRecord) []social.PostLike {
	list := make([]social.PostLike, len(records))
	for i := range records {
		list[i] = *ToPostLikeDomain(&records[i])
	}
	return list
}

func ToFollowDomain(r *FollowRecord) *social.Follow {
	if r == nil {
		return nil
	}
	return &social.Follow{
		ID:         r.ID,
		FollowerID: r.FollowerID,
		FolloweeID: r.FolloweeID,
		CreatedAt:  r.CreatedAt,
	}
}

func ToFollowList(records []FollowRecord) []social.Follow {
	list := make([]social.Follow, len(records))
	for i := range records {
		list[i] = *ToFollowDomain(&records[i])
	}
	return list
}
