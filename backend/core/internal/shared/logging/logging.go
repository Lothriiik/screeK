package logging

import (
	"log/slog"
	"os"
)

func Setup() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))
}
