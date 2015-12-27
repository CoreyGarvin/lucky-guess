appController.register(function() {
    var el = null,
        cupcake = null;
        h1 = null;
        h2 = null;

    var init = function() {
        el = document.querySelector("header");
        h1 = el.querySelector("h1");
        h2 = el.querySelector("h2");
        cupcake = document.getElementById("cupcake");
        // Reset header text
        h1.innerHTML = 'What Number Am I Thinking Of?';
        h2.textContent = "I give you 3 guesses";
    }

    var fadeOut = function() {addClass(el, "transparent");};
    var fadeIn = function() {removeClass(el, "transparent");};

    var createdGame = function() {
        // Reset header text
        h1.innerHTML = 'What Number Am I Thinking Of?';
        h2.textContent = "I give you 3 guesses";
    };

    var presentGame = function() {
        fadeIn();
        setTimeout(function() {
            removeClass(h1, "transparent");
        }, 500);
        setTimeout(function() {
            removeClass(h2, "transparent");
        }, 1000);

    };

    var playerGuessed = function() {
        return new Promise(function(resolve) {
            addClass(h1, "transparent");
            addClass(h2, "transparent");
            setTimeout(function() {
                resolve();
            }, 300);
        });

        // removeClass(h2, "transparent");
    };

    var guessResponse = function(gameState) {
        removeClass(cupcake, "warmer");
        removeClass(cupcake, "colder");
        removeClass(cupcake, "hot");
        if (!gameState.currentGame.hints.won) {
            switch (hintsToString(gameState.currentGame.hints)) {
                case "warmer":
                    h1.innerHTML = 'No, but you\'re getting <span class="warmer">warmer</span>!';
                    h2.textContent = "Try again!"
                    addClass(cupcake, "warmer");
                    setTimeout(function() {
                        removeClass(cupcake, "warmer");
                    }, 1000);
                    break;
                case "colder":
                    addClass(cupcake, "colder");
                    h1.innerHTML = 'You\'re getting <span class="colder">colder</span>!';
                    h2.textContent = "Try again!";
                    break;
                case "won":
                case "hot":
                    h1.innerHTML = 'You are <span class="hot">SO close!</span>';
                    h2.textContent = "Try again!";
                    addClass(cupcake, "hot");
                    break;
                case "neither":
                    h1.innerHTML = 'You\'re neither <span class="warmer">warmer</span> nor <span class="colder">colder</span>..';
                    h2.textContent = "Try again!";
                    break;
                default:
                    h1.textContent = "No, but " + gameState.currentGame.choices[gameState.currentGame.attemptHistory[gameState.currentGame.attemptHistory.length-1]] + " is a good start!";
                    h2.textContent = gameState.currentGame.attemptsRemaining +  " more guesses!";
                    break;
            }

            setTimeout(function() {
                removeClass(h1, "transparent");
            }, 200);
            setTimeout(function() {
                removeClass(h2, "transparent");
            }, 400);
        }
    };

    return new Component("Header",
        {
            init: init,
            createdGame: createdGame,
            presentGame: presentGame,
            playerGuessed: playerGuessed,
            guessResponse: guessResponse,
            gameWon: fadeOut,
        }
    );
}());
