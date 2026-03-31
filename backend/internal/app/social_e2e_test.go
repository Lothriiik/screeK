package app

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/StartLivin/screek/backend/internal/notifications"
	"github.com/StartLivin/screek/backend/internal/social"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_E2E_Social_Follow_Notification(t *testing.T) {

	app, _, _ := SetupTestApp(t)

	tokenA := loginHelper(t, app, "follower_user", "pass123")
	
	tokenB := loginHelper(t, app, "target_user", "pass123")

	rr := executeRequest(app.router, "POST", "/users/target_user/follow", nil, tokenA)
	require.Equal(t, http.StatusOK, rr.Code)

	var followResp social.ToggleFollowResponse
	json.Unmarshal(rr.Body.Bytes(), &followResp)
	assert.True(t, followResp.IsFollowing)
	assert.Equal(t, "Ok", followResp.Message)

	rr = executeRequest(app.router, "GET", "/notifications", nil, tokenB)
	require.Equal(t, http.StatusOK, rr.Code)

	var userNotifications []notifications.Notification
	json.Unmarshal(rr.Body.Bytes(), &userNotifications)

	require.NotEmpty(t, userNotifications, "O usuário B deveria ter recebido uma notificação")
	
	var followNotif *notifications.Notification
	for i := range userNotifications {
		if userNotifications[i].Type == "FOLLOW" {
			followNotif = &userNotifications[i]
			break
		}
	}

	require.NotNil(t, followNotif, "Notificação do tipo FOLLOW não encontrada")
	assert.Equal(t, "Novo Seguidor", followNotif.Title)
	assert.Contains(t, followNotif.Message, "follower_user")
	assert.Contains(t, followNotif.Message, "começou a seguir você!")
	assert.Equal(t, "/profile/follower_user", followNotif.Link)
}
