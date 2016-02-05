// Component - contains the circular game buttons
appController.register(function() {
    var el = null,
        buttons = null,
        lastStep = null,
        animationEnabled = false;

    var fadeOut = function() {addClass(el, "transparent");};
    var fadeIn  = function() {removeClass(el, "transparent");};
    var staggerFadeIn = function() {staggerRemoveClass(buttons, "transparent", 2000);};
    var staggerFadeOut = function() {staggerAddClass(buttons, "transparent", 2000);};
    var init = function() {
        el = document.getElementById("game-choices");
        window.requestAnimationFrame = (function() {
          return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
            return window.setTimeout(callback, 1000 / 60);
          };
        })();
    };

    var presentGame = function() {
        fadeIn();
        staggerFadeIn();
        startAnimating();
    };

    var startAnimating = function() {
        animationEnabled = true;
        requestAnimationFrame(animationStep);
    };

    var stopAnimating = function() {
        animationEnabled = false;
    };

    var animationStep = function(timestamp) {
        if (!animationEnabled) return;

        // if (!lastStep) lastStep = timestamp;
        setTimeout(function() {
            return requestAnimationFrame(animationStep);
        }, 400);

        // if (timestamp - lastStep < 500)
        for (i = 0; i < buttons.length; i++) {
            var r = Math.cos(timestamp/1500 + (100*i)) * 10;
            var x = Math.cos(timestamp/1000 + (10*i)) * 1;
            var y = Math.sin(timestamp/700 + (10*i)) * 1;
            var css = "rotate(" + r +"deg) translate(" + x + "px," + y + "px)";
            buttons[i].style.webkitTransform = css;
        }
        // lastStep = timestamp;
    };

    var gameOver = function() {
        staggerFadeOut();
        return new Promise(function (resolve, reject) {
            setTimeout(function() {
                fadeOut();
                resolve();
            }, 2000);
        });
    };

    var gameWon = function(winningIndex) {
        var winner = buttons[winningIndex];
        var nonWinners = buttons.filter(function(val, index) {return index != winningIndex});
        staggerAddClass(nonWinners, "transparent", 1500);
        addClass(winner, "grow")

        return new Promise(function (resolve, reject) {
            setTimeout(function() {
                staggerFadeOut();
                fadeOut();
                resolve();
            }, 2000);
        });
    };

    var createdGame = function(gameState) {
        // Create game buttons HTML
        var html = "";
        for (var i = 0; i < gameState.currentGame.choices.length; i++) {
            html += '<a class="choice transparent choice-' + gameState.currentGame.choices[i] + '">' + gameState.currentGame.choices[i] + '</a>';
        }
        el.innerHTML = html;
        // So that our result is an Array
        buttons = Array.prototype.slice.call(el.querySelectorAll(".choice"));

        // Add Listener - btn click should submit guess
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].choiceIndex = i;
            buttons[i].addEventListener('click', function(event) {
                var btn = event.srcElement || event.target;
                appController.playerGuess(btn.choiceIndex);
            });
        }
    };

    var playerGuessed = function(guessIndex) {
        addClass(el, "ajax");
        addClass(buttons[guessIndex], "ajax");
    };

    var guessResponse = function(gameState) {
        var guessIndex = gameState.currentGame.attemptHistory.slice(-1)[0];
        addClass(buttons[guessIndex], "spent");
        removeClass(buttons[guessIndex], "ajax");
        removeClass(buttons[guessIndex], "active");
        addClass(buttons[guessIndex], hintsToString(gameState.currentGame.hints));
    };

    var idle = function() {
        removeClass(el, "ajax");
    }

    return new Component("GameButtons",
        {
            init: init,
            // intro: fadeOut,
            createdGame: createdGame,
            presentGame: presentGame,
            playerGuessed: playerGuessed,
            guessResponse: guessResponse,
            idle: idle,
            gameLost: gameOver,
            gameWon: gameWon,
            // nameEntry: fadeOut
        }
    );
}());