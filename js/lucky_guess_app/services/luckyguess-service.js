// Service for interacting with game server
var LuckyGuessService = (function() {
    var api = {}
    // Creates a new game, or continues a 'saved' game when the key is provided
    api.newGame = function(key, name) {
        return new Promise(function(resolve, reject) {
            var queryString = encodeData({
                key: key,
                name: name || getParameterByName("name") || undefined
            });
            ajax("/newgame?" + queryString, function(response) {
                var gameEnv = (function(newGame) {
                    var game = newGame;
                    game.guess = function(guess) {
                        var self = this; // 'this' refers to 'game'
                        return new Promise(function(resolve, reject) {
                            ajax("/guess?guess=" + guess + "&key=" + self.gameID,
                                function(response) {
                                    // Update the state of the game internally
                                    var newGameState = JSON.parse(response);
                                    self.gameID = newGameState.gameID;
                                    self.currentGame = newGameState.currentGame;
                                    self.profile = newGameState.profile;
                                    self.highScores = newGameState.highScores
                                    resolve();
                                },
                                function(response) {
                                    reject(response);
                                }
                            );
                        });
                    };
                    return game;
                }(JSON.parse(response)));
                resolve(gameEnv);
            },
            function(err) {
                console.error(err);
            });
        });
    };
    return api;
}());