/**@license MIT-promiscuous-©Ruben Verborgh*/
!function(n,t) {function c(n,t) {return(typeof t)[0]==n}function u(o,e) {return e=function f(i,h,l,a,p,s) {function y(n) {return function(t) {p&&(p=0,f(c,n,t))}}if(a=f.q,i!=c)return u(function(n,t) {a.push({p:this,r:n,j:t,1:i,0:h})});if(l&&c(n,l)|c(t,l))try{p=l.then}catch(j) {h=0,l=j}if(c(n,p))try{p.call(l,y(1),h=y(0))}catch(j) {h(j)}else for(e=function(t,e) {return c(n,t=h?t:e)?u(function(n,c) {r(this,n,c,l,t)}):o},s=0;s<a.length;)p=a[s++],c(n,i=p[h])?r(p.p,p.r,p.j,l,i):(h?p.r:p.j)(l)},e.q=[],o.call(o={then:function(n,t) {return e(n,t)},"catch":function(n) {return e(0,n)}},function(n) {e(c,1,n)},function(n) {e(c,0,n)}),o}function r(u,r,o,e,f) {setTimeout(function() {try{e=f(e),f=e&&c(t,e)|c(n,e)&&e.then,c(n,f)?e==u?o(TypeError()):f.call(e,r,o):r(e)}catch(i) {o(i)}})}function o(n) {return u(function(t) {t(n)})}Promise=u,u.resolve=o,u.reject=function(n) {return u(function(t,c) {c(n)})},u.all=function(n) {return u(function(t,c,u,r) {r=[],u=n.length||t(r),n.map(function(n,e) {o(n).then(function(n) {r[e]=n,--u||t(r)},c)})})}}("f","o");

// Service for interacting with game server
var LuckyGuessService = (function() {
	var api = {}
	// Creates a new game, or continues a 'saved' game when the key is provided
	api.newGame = function(key, name) {
		return new Promise(function(resolve, reject) {
			var queryString = encodeData({
				key: key,
				name: name || getParameterByName("name") || ""
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

document.addEventListener("DOMContentLoaded", function(event) {
	console.log("DOMContentLoaded");
	var gameButtons = {};
	var gameDiv = document.getElementById("game-choices");

	// Containers
	var header = document.querySelector("header");

	var nameEntry = document.getElementById("name-entry");
	var hiScores = document.getElementById("highscores");
	var score = document.getElementById("current-score");

	var appController = (function() {
		var component = {};
		var registeredComponents = [];
		var game = null;
		var currentState = null;

		var enterState = function(state, arg) {
			if (this.hasOwnProperty("states") && this.states.hasOwnProperty(state)) {
				this.states[state](arg);
				return true;
			}
			return false;
		};

		var broadcastState = function(state, arg) {
			currentState = state;
			for (i = 0; i < registeredComponents.length; i++) {
				if (registeredComponents[i].hasOwnProperty("enterState")) {
					registeredComponents[i].enterState(currentState, arg);
				}
			}
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
			broadcastState("intro", null);
			setTimeout(function() {
				startNewGame();
			}, 100); // was 2500 before debug
		};

		var startNewGame = function() {
			LuckyGuessService.newGame().then(
				// New game created successfully
				function(g) {
					game = g;
					broadcastState("createdGame", game);
					broadcastState("presentGame", game);
					broadcastState("idle", game);
				},

				function(err) {
					console.log("There was a problem!");
					console.log(err);
				}
			);
		};

		component.playerGuess = function(guessIndex) {
			broadcastState("playerGuessed", guessIndex);
			game.guess(guessIndex).then(
				function() {
					broadcastState("guessResponse", game);
				},

				function(err) {
					console.log("There was a problem!");
					console.log(err);
				}
			);
		};
		return component;
	}());

	var footer = (function() {
		var component = {};
		var el = document.getElementById("footer");
		var guesses = 0;
		var score = 0;

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
			el.querySelector(".score span").textContent = gameState.profile.score;;
		};

		component.states = {
			intro: fadeOut,
			createdGame: updateState,
			presentGame: fadeIn,
			guessResponse: updateState
		};

		return component;
	}());

	// Component - contains the circular game buttons
	var gameButtons = (function() {
		var component = {};
		var el = document.getElementById("game-choices");
		var buttons = [];

		var fadeOut = function() {addClass(el, "transparent");};
		var fadeIn  = function() {removeClass(el, "transparent");};
		var staggerFadeIn = function() {staggerRemoveClass(buttons, "transparent", 1000);};
		var staggerFadeOut = function() {staggerAddClass(buttons, "transparent", 1000);};

		var init = function(gameState) {
			// Create game buttons HTML
			var html = "";
			for (var i = 0; i < gameState.currentGame.choices.length; i++) {
				html += '<a class="choice transparent choice-' + gameState.currentGame.choices[i] + '">' + gameState.currentGame.choices[i] + '</a>';
			}
			el.innerHTML = html;
			// So that our result is an Array
			buttons = Array.prototype.slice.call(el.querySelectorAll(".choice"));
			// buttons = el.querySelectorAll(".choice");

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
			var hints = gameState.currentGame.hints;
			var guessIndex = gameState.currentGame.attemptHistory.slice(-1)[0];
			var gameOver =  hints.won || (
								gameState.currentGame.attemptsRemaining == 0
								&& (gameState.currentGame.borrowableAttempts < 1)
								&& (gameState.currentGame.bonusAttempts < 1));

			addClass(buttons[guessIndex], "spent");
			removeClass(buttons[guessIndex], "ajax");

			if (!gameOver) {
				removeClass(el, "ajax");
			}

			if (hints.won) {
				addClass(buttons[guessIndex], "won");

			} else if (hints.hot) {
				addClass(buttons[guessIndex], "hot");
			} else if (hints.colder && hints.warmer) {
				// Neither warmer nor colder
			} else if (hints.warmer) {
				addClass(buttons[guessIndex], "warmer");
			} else if (hints.colder) {
				addClass(buttons[guessIndex], "colder");
			} else if (!gameOver) {
				addClass(cupcake, "idle");
			}

			if (gameOver) {
				var nonWinners = buttons.filter(function(val, index) {return index != gameState.currentGame.answerKey});
				var winner = buttons[gameState.currentGame.answerKey];
				if (hints.won) {
					staggerAddClass(nonWinners, "transparent", 500);
					addClass(winner, "grow")
				} else {
					staggerAddClass(nonWinners, "transparent", 1500);
				}
				setTimeout(function(){addClass(winner, "transparent");}, 2000);
			}
		};

		component.states = {
			intro: staggerFadeOut,
			createdGame: init,
			presentGame: staggerFadeIn,
			playerGuessed: playerGuessed,
			guessResponse: guessResponse,
		};
		return component;
	}());

	// Component - contains the circular game buttons
	var gameLogo = (function() {
		el = document.getElementById("logo");
		var component = {};

		var fadeOut = function() {addClass(el, "transparent");};
		var fadeIn = function() {removeClass(el, "transparent");};

		var presentGame = function() {
			fadeOut();
			setTimeout(function() {
				addClass(el, "moved");
			}, 2000);
		};

		component.states = {
			intro: fadeIn,
			presentGame: presentGame
		};
		return component;
	}());



	// Components
	var playerScore = document.getElementById("player-score");
	var continueBtn = document.getElementById('btn-continue');
	var nameInput = document.getElementById("name-input");
	var cupcake = document.getElementById('cupcake');
	var h1 = document.querySelector("h1");
	var h2 = document.querySelector("h2");

	var game = {};
	var prevScore = 0;

	// Start the app
	appController.register(gameLogo, gameButtons, footer);
	appController.begin();
});

function enableConfetti() {
	confettiEnabled = true;

	setTimeout(function() {removeClass(document.getElementById('confetti'), "transparent");}, 500);
}

function disableConfetti() {
	setTimeout(function() {confettiEnabled = false;}, 500);

	addClass(document.getElementById('confetti'), "transparent");
}
