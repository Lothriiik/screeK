package store

import (
	"context"
	"testing"

	"github.com/StartLivin/screek/backend/internal/shared/testutil"
	"github.com/StartLivin/screek/backend/internal/social"
	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_Store_ToggleFollow(t *testing.T) {
	db := testutil.SetupTestDB(t)
	users.AutoMigrate(db)
	social.AutoMigrate(db)
	testutil.CleanupDB(t, db)
	store := NewStore(db)

	followerID := uuid.New()
	followeeID := uuid.New()

	require.NoError(t, db.Create(&users.User{ID: followerID, Username: "follower", Email: "f@test.com", Password: "h"}).Error)
	require.NoError(t, db.Create(&users.User{ID: followeeID, Username: "followee", Email: "fe@test.com", Password: "h"}).Error)

	t.Run("Seguir primeira vez", func(t *testing.T) {
		following, err := store.ToggleFollow(context.Background(), followerID, followeeID)
		assert.NoError(t, err)
		assert.True(t, following)

		var count int64
		db.Table("follows").Where("follower_id = ? AND followee_id = ?", followerID, followeeID).Count(&count)
		assert.Equal(t, int64(1), count)
	})

	t.Run("Deixar de seguir", func(t *testing.T) {
		following, err := store.ToggleFollow(context.Background(), followerID, followeeID)
		assert.NoError(t, err)
		assert.False(t, following)

		var count int64
		db.Table("follows").Where("follower_id = ? AND followee_id = ?", followerID, followeeID).Count(&count)
		assert.Equal(t, int64(0), count)
	})
}

func Test_Store_ToggleLike(t *testing.T) {
	db := testutil.SetupTestDB(t)
	users.AutoMigrate(db)
	social.AutoMigrate(db)
	testutil.CleanupDB(t, db)
	store := NewStore(db)

	userID := uuid.New()
	user := users.User{ID: userID, Username: "testuser", Email: "test@test.com", Password: "hashedpassword"}
	require.NoError(t, db.Create(&user).Error)

	post := social.Post{
		UserID:   userID,
		Content:  "Post Like Test",
		PostType: social.PostTypeText,
	}
	require.NoError(t, db.Create(&post).Error)

	liked, err := store.ToggleLike(context.Background(), userID, post.ID)
	assert.NoError(t, err)
	assert.True(t, liked)

	var check social.Post
	db.First(&check, post.ID)
	assert.Equal(t, 1, check.LikesCount)
}
