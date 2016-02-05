package luckyguess

// Currently working on extracting out the guessing into struct functions, leaving the http handler just calling that fn
//JS api mostly working
//trying to serve html page

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	// "html/template"
	"io/ioutil"
	"math/rand"
	// "net"
	"net/http"
	// "os"
	"strconv"
	"strings"
	"time"

	"appengine"
	"appengine/datastore"
	"appengine/urlfetch"
)

var (
	attemptsPerRound = 3
	maxBorrow        = 2
)

type Page struct {
	Title string
	Body  []byte
}

func (p *Page) save() error {
	filename := p.Title + ".txt"
	return ioutil.WriteFile(filename, p.Body, 0600)
}

func loadPage(title string) (*Page, error) {
	filename := title
	body, err := ioutil.ReadFile(filename)
	if err != nil {
		return nil, err
	}
	return &Page{Title: title, Body: body}, nil
}

type GameHint struct {
	Warmer bool `json:"warmer"`
	Colder bool `json:"colder"`
	Hot    bool `json:"hot"`
	Won    bool `json:"won"`
}

type GameState struct {
	AttemptsRemaining  int      `json:"attemptsRemaining"`
	AttemptHistory     []int    `json:"attemptHistory"`
	BonusAttempts      int      `json:"bonusAttempts"`
	BorrowableAttempts int      `json:"borrowableAttempts"`
	Choices            []int    `json:"choices"`
	AnswerKey          int      `json:"answerKey"`
	Hints              GameHint `json:"hints"`
}

/*{
  "ip": "74.125.45.100",
  "hostname": "No Hostname",
  "city": "Tulsa",
  "region": "Oklahoma",
  "country": "US",
  "loc": "36.1540,-95.9928",
  "org": "AS15169 Google Inc.",
  "postal": "74172"
}*/

type GeoLocation struct {
	City     string    `json:"city"`
	Region      string      `json:"region"`
	Country string      `json:"country"`
	Location   string    `json:"loc"`
	Postal string  `json:"postal"`
}

type HighScore struct {
	PlayerName    string    `json:"playerName"`
	Wins          int       `json:"wins"`
	Losses        int       `json:"losses"`
	Score         int       `json:"score"`
	Streak        int       `json:"streak"`
	LongestStreak int       `json:"longestStreak"`
	When          time.Time `json:"when"`
	IPAddress		string 		`json:"ipAddress"`
	GeoLocation  GeoLocation `json:"geoLocation"`
}

type LuckyGuessGame struct {
	Profile     HighScore   `json:"profile"`
	CurrentGame GameState   `json:"currentGame"`
	GameID      string      `json:"gameID"`
	HighScores  []HighScore `json:"highScores"`
}

func (gameState *GameState) totalAttemptsRemaining() int {
	return gameState.AttemptsRemaining +
		max(gameState.BorrowableAttempts, 0) +
		gameState.BonusAttempts
}

func (gameState *GameState) recordGuess(guess int) error {

	// Validate guess
	if guess < 0 || guess >= len(gameState.Choices) {
		return errors.New("Invalid choice index")
	}

	if gameState.AttemptsRemaining > 0 {
		gameState.AttemptsRemaining--

	} else if gameState.BorrowableAttempts > 0 {
		gameState.BorrowableAttempts--

	} else if gameState.BonusAttempts > 0 {
		gameState.BonusAttempts--

	} else {
		return errors.New("You have no attempts remaining")
	}

	gameState.AttemptHistory = append(gameState.AttemptHistory, guess)
	return nil
}

func (game *LuckyGuessGame) SetPlayerName(name string) {
	if len(name) > 0 {
		if len(name) > 50 {
			game.Profile.PlayerName = name[:50]
		} else {
			game.Profile.PlayerName = name
		}
	}
}

func (game *LuckyGuessGame) Guess(guess int) error {
	// Validate and record the guess
	if err := game.CurrentGame.recordGuess(guess); err != nil {
		return err
	}

	ans := game.CurrentGame.AnswerKey
	game.CurrentGame.Hints = GameHint{}

	// Winner!
	if guess == ans {
		game.CurrentGame.Hints.Won = true

		// Earn a bonus attempt if you guess 1st time, compound if several in a row
		if len(game.CurrentGame.AttemptHistory) == 1 {
			game.Profile.Streak++
			game.Profile.LongestStreak = max(game.Profile.Streak, game.Profile.LongestStreak)
			game.CurrentGame.BonusAttempts += game.Profile.Streak
		} else {
			game.Profile.Streak = 0
		}

		// Score (roughly) = winningNumber * attemptsYouDidntUse * streak^2
		scoreDif := max(1, (attemptsPerRound-len(game.CurrentGame.AttemptHistory)+1)) * game.CurrentGame.Choices[ans] * max(1, game.Profile.Streak*game.Profile.Streak)
		if borrowedTurns := abs(min(0, attemptsPerRound-len(game.CurrentGame.AttemptHistory))); borrowedTurns > 0 {
			scoreDif /= borrowedTurns + 1
		}
		game.Profile.Score += scoreDif
		game.Profile.Wins++

		// Loser
	} else if game.CurrentGame.totalAttemptsRemaining() == 0 {
		game.Profile.Losses++

		// Intermediary turn
	} else if len(game.CurrentGame.AttemptHistory) > 1 {
		ah := game.CurrentGame.AttemptHistory
		improvement := abs(ah[len(ah)-2]-ans) - abs(guess-ans)
		game.CurrentGame.Hints.Warmer = improvement >= 0
		game.CurrentGame.Hints.Colder = improvement <= 0
	}

	game.Profile.When = time.Now().UTC()
	game.CurrentGame.Hints.Hot = abs(guess-ans) == 1

	return nil
}

func (game *LuckyGuessGame) save(r *http.Request) (*datastore.Key, error) {
	c := appengine.NewContext(r)

	// Make new key if needed
	if key, err := datastore.DecodeKey(game.GameID); err != nil {
		timestamp := strconv.FormatInt(time.Now().UTC().UnixNano(), 10)
		key = datastore.NewKey(c, "LuckyGuessGame", timestamp, 0, nil)
		game.GameID = key.Encode()
		return datastore.Put(c, key, game)
	} else {
		return datastore.Put(c, key, game)
	}
	// return nil, errors.New("Error in save fn, but we should never get here")
}

func init() {
	http.HandleFunc("/", handler)
	http.HandleFunc("/guess", guessHandler)
	http.HandleFunc("/newgame", newGameHandler)
	// http.HandleFunc("/hiscore", highScores)
}

func getContent(c appengine.Context, url string) ([]byte, error) {
    client := urlfetch.Client(c)
    resp, err := client.Get(url)
    if err != nil {
        return nil, err
    }
    // fmt.Fprintf(w, "HTTP GET returned status %v", resp.Status)
    // Defer the closing of the body
    defer resp.Body.Close()
    // Read the content into a byte array
    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
      return nil, err
    }
    // At this point we're done - simply return the bytes
    // c := appengine.NewContext(nil)
    c.Infof("\n\nResponse: %s\n\n", string(body))
    return body, nil
}

// This function will attempt to get the IP record for
// a given IP. If no errors occur, it will return a pair
// of the record and nil. If it was not successful, it will
// return a pair of nil and the error.
func GetIpRecord(c appengine.Context, ip string) (*GeoLocation, error) {
    // Fetch the JSON content for that given IP
    content, err := getContent(c,
      fmt.Sprintf("http://ipinfo.io/%s/geo", ip))
    if err != nil {
        return nil, err
    }
    // Fill the record with the data from the JSON
    var record GeoLocation
    err = json.Unmarshal(content, &record)
    if err != nil {
        return nil, err
    }
	return &record, err
}

func topTen(c appengine.Context) ([]HighScore, error) {
	// w.Header().Set("Content-Type", "application/json")
	// c := appengine.NewContext(r)

	// Query Top-10 high scores
	var games []LuckyGuessGame
	q := datastore.NewQuery("LuckyGuessGame").Order("-Profile.Score").Limit(10)
	if _, err := q.GetAll(c, &games); err != nil {
		return nil, err
	}

	// Strip out just the profile info
	highScores := make([]HighScore, len(games))
	for i := range games {
		highScores[i] = games[i].Profile
	}

	return highScores, nil

	// if output, err := json.Marshal(highScores); err != nil {
	// 	http.Error(w, err.Error(), http.StatusInternalServerError)
	// 	return
	// } else {
	// 	w.Write(output)
	// }
}
func newGameHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Get the key & name from the URL
	keyURL := r.FormValue("key")
	nameURL := r.FormValue("name")
	c := appengine.NewContext(r)

	newGame := LuckyGuessGame{
		CurrentGame: GameState{
			AttemptsRemaining:  attemptsPerRound,
			BorrowableAttempts: maxBorrow,
		},
		Profile: HighScore{
			IPAddress: strings.Split(r.RemoteAddr, ":")[0],
		},
	}

	if geoLocation, err := GetIpRecord(c, newGame.Profile.IPAddress); err == nil {
		newGame.Profile.GeoLocation = *geoLocation
	} else {
		// c := appengine.NewContext(r)
		c.Infof("problem ", err)
	}

	// c.Infof("\n\nIP: %T\n\n", r.RemoteAddr)
	// if ip, _, err := net.SplitHostPort(r.RemoteAddr); err == nil {
	// newGame.Profile.IPAddress = r.RemoteAddr
	// }

	// Decode the key, load the game
	if keyURL != "" {
		if key, err := datastore.DecodeKey(keyURL); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		} else if err := datastore.Get(c, key, &newGame); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		} else if newGame.Profile.Losses > 0 {
			http.Error(w, "Cannot continue a finished game", http.StatusInternalServerError)
			return
		} else {
			// newGame.CurrentGame.AttemptsRemaining = 3
			newGame.CurrentGame.AttemptsRemaining = attemptsPerRound
			borrowableAttempts := true

			if borrowableAttempts {
				// Player borrowed at least one attempt from the last round, disallow this round
				if newGame.CurrentGame.BorrowableAttempts < maxBorrow &&
					newGame.CurrentGame.BorrowableAttempts >= 0 {
					newGame.CurrentGame.AttemptsRemaining = attemptsPerRound - (maxBorrow - newGame.CurrentGame.BorrowableAttempts)
					newGame.CurrentGame.BorrowableAttempts = -1

					// Player did not borrow last round, because they could not - reset
				} else if newGame.CurrentGame.BorrowableAttempts == -1 {
					newGame.CurrentGame.BorrowableAttempts = maxBorrow
				}
			}
			// 	// if you borrowed a turn last round, debit this round, and disallow borrowing this round
			// if false && newGame.CurrentGame.AttemptsRemaining < attemptsPerRound && len(newGame.CurrentGame.AttemptHistory) > attemptsPerRound {
			// 	newGame.CurrentGame.AttemptsRemaining = attemptsPerRound + min(0, attemptsPerRound-len(newGame.CurrentGame.AttemptHistory))

			// 	// otherwise a fresh set of guesses
			// } else {
			// 	newGame.CurrentGame.AttemptsRemaining = attemptsPerRound
			// }

			newGame.CurrentGame.AttemptHistory = []int{}
			newGame.CurrentGame.Hints = GameHint{}
		}
	}

	// If you lost your last game, or abandon your current game, pay 30
	// if newGame.Profile.Streak == 0 || (len(newGame.CurrentGame.AttemptHistory) > 0 && newGame.CurrentGame.AttemptsRemaining > 0) {
	// 	newGame.Profile.Score = max(0, newGame.Profile.Score-30)
	// }

	// Choices correspond to payouts, which increase each 'level' the player achieves
	choices := make([]int, 9+(newGame.Profile.Wins/5))
	for i := range choices {
		//choices[i] = newGame.Profile.Wins*10 + 1 + i
		//choices[i] = newGame.Profile.Wins*(newGame.Profile.Wins/5+1) + (1+i)*(newGame.Profile.Wins+1)
		choices[i] = (1 + i) * (newGame.Profile.Wins + 1)
	}

	newGame.CurrentGame.Choices = choices

	if len(nameURL) > 0 {
		if len(nameURL) > 50 {
			newGame.Profile.PlayerName = nameURL[:50]
		} else {
			newGame.Profile.PlayerName = nameURL
		}
	}

	// Random game answer
	rand.Seed(time.Now().UTC().UnixNano() / 1000000)
	newGame.CurrentGame.AnswerKey = rand.Intn(len(newGame.CurrentGame.Choices))

	c.Infof("\n\nNewgame answer: %v\n\n", newGame.CurrentGame.Choices[newGame.CurrentGame.AnswerKey])
	// Save game
	if _, err := newGame.save(r); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	// Hide answer from user
	newGame.CurrentGame.AnswerKey = -1

	if output, err := json.Marshal(newGame); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	} else {
		w.Write(output)
	}
}

func guessHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	// var output []byte

	// Get the key from the URL
	keyURL := r.FormValue("key")
	guessURL := r.FormValue("guess")
	// nameURL := r.FormValue("name")
	var guess int = -1
	c := appengine.NewContext(r)

	var game LuckyGuessGame

	// Decode the key, load the game
	if keyURL != "" && guessURL != "" {
		if key, err := datastore.DecodeKey(keyURL); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		} else if err := datastore.Get(c, key, &game); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		} else if g, err := strconv.Atoi(guessURL); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		} else {
			guess = g
		}
	} else {
		http.Error(w, errors.New("You must provide 'key' and 'guess' in querystring").Error(), http.StatusInternalServerError)
		return
	}

	if err := game.Guess(guess); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		c.Infof("\n\nBAD GUESS")
		return
	}

	// game.SetPlayerName(nameURL)

	// Save game
	if _, err := game.save(r); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
	// Hide answer from user
	if game.CurrentGame.totalAttemptsRemaining() > 0 && !game.CurrentGame.Hints.Won {
		game.CurrentGame.AnswerKey = -1
	} else if !game.CurrentGame.Hints.Won {
		game.HighScores, _ = topTen(c)
	}

	// HTTP output
	if output, err := json.Marshal(game); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	} else {
		w.Write(output)
	}
}

func abs(n int) int {
	if n < 0 {
		return -n
	}
	return n
}

func max(n, m int) int {
	if n > m {
		return n
	}
	return m
}

func min(n, m int) int {
	if n < m {
		return n
	}
	return m
}

func handler(w http.ResponseWriter, r *http.Request) {
	// buffe`r := make([]byte, 500000)
	// p2, _ := loadPage("/templates/demo.html")
	// if file, err := os.OpenFile("/templates/demo.html", os.O_RDONLY, 0666); err != nil {
	// 	http.Error(w, err.Error(), http.StatusInternalServerError)
	// 	return
	// } else if _, err := file.Read(buffer); err != nil {
	// 	http.Error(w, err.Error(), http.StatusInternalServerError)
	// 	return

	// } else {
	// 	w.Write(buffer)
	// 	return
	// }
	// http.Error(w, "this sucks", http.StatusInternalServerError)

	// w.Write(p2.Body)
	// return

	// 	page := `

	// `
	io.WriteString(w, html)

}
