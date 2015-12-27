var Component = function(name, states) {
    var states = states;

    return {
        name: name,
        /*
        Contact point between the controller and a component.  Components
        whose 'states' var contains a function(keyed by state name) are
        effectively 'listening' to state changes broadcasted from the
        controller.  State change handlers may return a Promise, enabling
        them to effectively take as much time as they need to "return";
        @param {String} arguments[0]
        @param {(any)}  (all other args)
        @return {Promise}
         */
        enterState: function() {
            var arguments = Array.prototype.slice.call(arguments);
            var state = arguments.shift();
            if (states.hasOwnProperty(state)) {
                var msg = ("\tACCEPTED:\t" + this.name);
                var p = states[state].apply(this, arguments);
                if (p instanceof Object && p.hasOwnProperty("then")) {
                    log(msg + "success(Promise)");
                    return p;
                } else {
                    log(msg + "\tsuccess(" + (p == null ? "" : p) + ")");
                    return Promise.resolve(p);
                }
            }
            log("\tIGNORED :\t" + this.name);
            return Promise.resolve();
        }
    };
};

var appController = (function() {
    var component = {};
    var registeredComponents = [];
    var game = null;
    var currentState = null;

    // Notifies all registered components of the new game state ()
    var broadcastState = function() {
        var args = arguments;
        log("\n" + arguments[0]);
        return Promise.all(registeredComponents.map(
            function(component) {
                // return component.enterState(currentState, arg);
                return component.enterState.apply(component, args);
            })
        );
    };

    component.register = function() {
        for (var i = 0; i < arguments.length; i++) {
            if (!arguments[i].hasOwnProperty("enterState")) {
                arguments[i].enterState = enterState;
            }
            registeredComponents.push(arguments[i]);
        }
    };

    component.unRegister = function() {
        for (var i = 0; i < arguments.length; i++) {
            registeredComponents.pop(arguments[i]);
        }
    };

    component.begin = function() {
        broadcastState("init")
        .then(function() {return broadcastState("intro", 200);})
        .then(startNewGame);
    };

    var startNewGame = function(existingGame) {
        var name = undefined;
        var gameID = undefined;
        if (existingGame != null && existingGame.hasOwnProperty("gameID")) {
            gameID = existingGame.gameID;
            name = existingGame.profile.name;
        }
        LuckyGuessService.newGame(gameID, name)
        .then(function(g) {
                game = g;
                return broadcastState("createdGame", game);
        })
        .then(function() {return broadcastState("presentGame", game);})
        .then(function() {return broadcastState("idle", game);});
    };

// if (response.currentGame.attemptHistory.length == 1) enableConfetti();
// else if (false && response.profile.wins == 1 && response.profile.playerName == "") {
    component.playerGuess = function(guessIndex) {
        var guessValue = game.currentGame.choices[guessIndex],
            oldScore = game.profile.score,
            newScore = game.profile.score;
        broadcastState("playerGuessed", guessIndex, guessValue)
        .then(function() {return game.guess(guessIndex);})
        .then(function() {return broadcastState("guessResponse", game);})
        .then(function() {
            var hints = game.currentGame.hints;
            var gameOver =  hints.won || (
                                game.currentGame.attemptsRemaining == 0
                                && (game.currentGame.borrowableAttempts < 1)
                                && (game.currentGame.bonusAttempts < 1));

            if (hints.won) {
                newScore = game.profile.score;
                // Duration of the score proportional to player's performance
                var scoreDuration = Math.max(1, 4 - game.currentGame.attemptHistory.length) * 700;
                broadcastState("gameWon", guessIndex, guessValue, game.currentGame.attemptHistory.length)
                .then(function() {return broadcastState("showScore", oldScore, newScore, scoreDuration);})
                .then(function() {
                    // Name Entry
                    if (game.profile.wins > 0 && game.profile.playerName == "") {
                        return broadcastState("nameEntry")
                        .then(function(names) {
                            return new Promise(function (resolve) {
                                for(i = 0; i < names.length; i++) {
                                    if (names[i] != null) {game.profile.name = names[i]; break;}
                                }
                                resolve();
                            });
                        });
                    }
                    // Bypass
                    return Promise.resolve();
                })
                .then(function() {startNewGame(game);});
            } else if (gameOver) {
                broadcastState("gameLost", guessIndex, guessValue)
                .then(function() {return broadcastState("highScores", game.highScores);})
                .then(function() {return startNewGame();});
            } else {
                broadcastState("nextTurn")
                .then(function() {return broadcastState("idle", game);});
            }
        });
    };
    return component;
}());