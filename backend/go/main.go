package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

type Resource struct {
	Title       string `json:"title"`
	URL         string `json:"url"`
	Description string `json:"description"`
	Type        string `json:"type"`
	WhyUseful   string `json:"why_useful"`
}

func searchResources(query string) []Resource {
	// Mocking concurrent search for now
	// In a real scenario, this would hit multiple search APIs or scrape
	var wg sync.WaitGroup
	resources := []Resource{}
	var mu sync.Mutex

	sources := []string{"Khan Academy", "Coursera", "OpenStax", "YouTube"}

	for _, source := range sources {
		wg.Add(1)
		go func(s string) {
			defer wg.Done()
			// Simulate search time
			time.Sleep(100 * time.Millisecond)
			mu.Lock()
			resources = append(resources, Resource{
				Title:       fmt.Sprintf("%s resource for %s", s, query),
				URL:         "https://example.com",
				Description: fmt.Sprintf("High quality content from %s", s),
				Type:        "article",
				WhyUseful:   "Reputable source material",
			})
			mu.Unlock()
		}(source)
	}

	wg.Wait()
	return resources
}

func main() {
	http.HandleFunc("/search", func(w http.ResponseWriter, r *http.Request) {
		// Add CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		query := r.URL.Query().Get("q")
		if query == "" {
			http.Error(w, "Missing query", http.StatusBadRequest)
			return
		}

		results := searchResources(query)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(results)
	})

	fmt.Println("Go search server running on port 5002")
	http.ListenAndServe(":5002", nil)
}
