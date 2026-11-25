package movies

import (
	"bytes"
	"context"
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"math"
	"net/http"
	"net/url"
	"time"
)

const maxPosterBytes = 8 << 20

var posterHTTPClient = &http.Client{Timeout: 5 * time.Second}

type posterRGB [3]uint8

type posterColorBucket struct {
	color      posterRGB
	count      int
	saturation float64
	lightness  float64
}

// ExtractPosterPalette downloads a TMDB poster and derives the card colors once.
// Unsupported formats, remote errors, and invalid URLs are non-fatal: callers can
// still return the movie without a palette and retry when it is requested again.
func ExtractPosterPalette(ctx context.Context, posterURL string) (*PosterPalette, error) {
	parsedURL, err := url.Parse(posterURL)
	if err != nil || parsedURL.Scheme != "https" || parsedURL.Hostname() != "image.tmdb.org" {
		return nil, fmt.Errorf("URL de pôster inválida")
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodGet, parsedURL.String(), nil)
	if err != nil {
		return nil, err
	}
	request.Header.Set("Accept", "image/jpeg,image/png,image/gif")

	response, err := posterHTTPClient.Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		return nil, fmt.Errorf("download do pôster retornou %s", response.Status)
	}

	posterData, err := io.ReadAll(io.LimitReader(response.Body, maxPosterBytes+1))
	if err != nil {
		return nil, err
	}
	if len(posterData) > maxPosterBytes {
		return nil, fmt.Errorf("pôster excede o limite de tamanho")
	}
	config, _, err := image.DecodeConfig(bytes.NewReader(posterData))
	if err != nil {
		return nil, fmt.Errorf("não foi possível ler dimensões do pôster: %w", err)
	}
	if config.Width <= 0 || config.Height <= 0 || config.Width > 5000 || config.Height > 7000 || int64(config.Width)*int64(config.Height) > 20_000_000 {
		return nil, fmt.Errorf("dimensões do pôster excedem o limite")
	}
	decoded, _, err := image.Decode(bytes.NewReader(posterData))
	if err != nil {
		return nil, fmt.Errorf("não foi possível decodificar pôster: %w", err)
	}
	return paletteFromImage(decoded), nil
}

func paletteFromImage(source image.Image) *PosterPalette {
	bounds := source.Bounds()
	if bounds.Empty() {
		return nil
	}
	stepX := max(1, bounds.Dx()/48)
	stepY := max(1, bounds.Dy()/72)
	buckets := make(map[[3]uint8]*posterColorBucket)

	for y := bounds.Min.Y; y < bounds.Max.Y; y += stepY {
		for x := bounds.Min.X; x < bounds.Max.X; x += stepX {
			red, green, blue, alpha := source.At(x, y).RGBA()
			if alpha < 0xb000 {
				continue
			}
			color := posterRGB{uint8(red >> 8), uint8(green >> 8), uint8(blue >> 8)}
			quantized := posterRGB{
				uint8(math.Round(float64(color[0])/32) * 32),
				uint8(math.Round(float64(color[1])/32) * 32),
				uint8(math.Round(float64(color[2])/32) * 32),
			}
			key := [3]uint8{quantized[0] / 32, quantized[1] / 32, quantized[2] / 32}
			_, saturation, lightness := hsl(color)
			if bucket := buckets[key]; bucket != nil {
				bucket.count++
			} else {
				buckets[key] = &posterColorBucket{color: quantized, count: 1, saturation: saturation, lightness: lightness}
			}
		}
	}

	var dominant posterRGB
	var dominantCount int
	var vivid *posterColorBucket
	for _, bucket := range buckets {
		if bucket.count > dominantCount {
			dominant = bucket.color
			dominantCount = bucket.count
		}
		if bucket.lightness > 0.18 && bucket.lightness < 0.86 && bucket.saturation > 0.35 {
			if vivid == nil || bucket.saturation*math.Sqrt(float64(bucket.count)) > vivid.saturation*math.Sqrt(float64(vivid.count)) {
				vivid = bucket
			}
		}
	}
	if dominantCount == 0 {
		return nil
	}

	accent := dominant
	if vivid != nil {
		accent = vivid.color
	}
	frame := darkenPosterColor(dominant, 0.28)
	title := darkenPosterColor(dominant, 0.62)
	rating := accent
	for _, candidate := range []posterRGB{frame, title} {
		if colorDistance(candidate, dominant) > colorDistance(rating, dominant) {
			rating = candidate
		}
	}

	return &PosterPalette{
		Frame:    cssColor(frame),
		Accent:   cssColor(accent),
		OnAccent: colorTextColor(accent),
		Title:    cssColor(title),
		OnTitle:  colorTextColor(title),
		Panel:    cssPanelColor(dominant),
		OnPanel:  colorTextColor(darkenPosterColor(dominant, 0.12)),
		Rating:   cssColor(rating),
		OnRating: colorTextColor(rating),
	}
}

func hsl(color posterRGB) (float64, float64, float64) {
	red, green, blue := float64(color[0])/255, float64(color[1])/255, float64(color[2])/255
	maximum := math.Max(red, math.Max(green, blue))
	minimum := math.Min(red, math.Min(green, blue))
	lightness := (maximum + minimum) / 2
	if maximum == minimum {
		return 0, 0, lightness
	}
	delta := maximum - minimum
	saturation := delta / (1 - math.Abs(2*lightness-1))
	return 0, saturation, lightness
}

func darkenPosterColor(color posterRGB, amount float64) posterRGB {
	return posterRGB{
		uint8(math.Round(float64(color[0]) * (1 - amount))),
		uint8(math.Round(float64(color[1]) * (1 - amount))),
		uint8(math.Round(float64(color[2]) * (1 - amount))),
	}
}

func colorDistance(first, second posterRGB) float64 {
	distance := 0.0
	for index := range first {
		delta := float64(first[index]) - float64(second[index])
		distance += delta * delta
	}
	return math.Sqrt(distance)
}

func cssColor(color posterRGB) string {
	return fmt.Sprintf("rgb(%d %d %d)", color[0], color[1], color[2])
}

func cssPanelColor(color posterRGB) string {
	return fmt.Sprintf("rgb(%d %d %d / 0.88)", color[0], color[1], color[2])
}

func colorTextColor(color posterRGB) string {
	luminance := func(channel uint8) float64 {
		value := float64(channel) / 255
		if value <= 0.04045 {
			return value / 12.92
		}
		return math.Pow((value+0.055)/1.055, 2.4)
	}
	brightness := 0.2126*luminance(color[0]) + 0.7152*luminance(color[1]) + 0.0722*luminance(color[2])
	if brightness > 0.42 {
		return "rgb(25 2 7)"
	}
	return "rgb(233 216 200)"
}
