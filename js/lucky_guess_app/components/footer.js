appController.register(function() {
    var el = {};
    var guesses = 0;
    var score = 0;

    var init = function() {el = document.getElementById("footer");}
    var fadeOut = function() {addClass(el, "transparent");};
    var fadeIn = function() {removeClass(el, "transparent");};

    var updateState = function(gameState) {
        var tokens = el.querySelectorAll(".tokens .inner");
        for (var i = 0; i < tokens.length; i++) {
            if ((i+1) <= gameState.currentGame.attemptsRemaining) {
                removeClass(tokens[i], "exhausted");
            } else {
                addClass(tokens[i], "exhausted");
            }
        }
        if (!gameState.currentGame.hints.won) {
            el.querySelector(".score span").textContent = gameState.profile.score;
        }
    };

    return new Component("Footer",
        {
            init: init,
            intro: fadeOut,
            createdGame: updateState,
            presentGame: fadeIn,
            guessResponse: updateState,
            gameWon: fadeOut,
        }
    );
}());
