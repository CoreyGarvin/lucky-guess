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

	var newComponent = function(states) {
		var component = {};
		var states = states;

		component.enterState = function() {
			var arguments = Array.prototype.slice.call(arguments);
			var state = arguments.shift();
			if (states.hasOwnProperty(state)) {
				var p = states[state].apply(this, arguments);
				if (p instanceof Object && p.hasOwnProperty("then")) {
					return p;
				} else {
					return Promise.resolve(p);
				}
			}
			return Promise.resolve();
		};
		return component;
	};

	var appController = (function() {
		var component = {};
		var registeredComponents = [];
		var game = null;
		var currentState = null;

		var broadcastState = function() {
			var args = arguments;
			console.log("Game State: " + arguments[0]);
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
			if (existingGame.hasOwnProperty("gameID")) {
				name = existingGame.profile.name;
			}
			LuckyGuessService.newGame(undefined, name)
			.then(function(g) {
					game = g;
					return broadcastState("createdGame", game);
			})
			.then(function() {return broadcastState("presentGame", game);})
			.then(function() {return broadcastState("idle", game);});
		};

		var determineHint = function(gameState) {
			var hints = gameState.currentGame.hints;
			if (hints.won) {return "won";}
			if (hints.hot) {return "hot";}
			if (hints.colder && hints.warmer) {return "neither";}
			if (hints.warmer) {return "warmer";}
			if (hints.colder) {return "colder";}
			return "";
		};
// if (response.currentGame.attemptHistory.length == 1) enableConfetti();
// else if (false && response.profile.wins == 1 && response.profile.playerName == "") {
		component.playerGuess = function(guessIndex) {
			var guessValue = game.currentGame.choices[guessIndex];
			broadcastState("playerGuessed", guessIndex, guessValue)
			.then(function() {return game.guess(guessIndex);})
			.then(function() {return broadcastState("guessResponse",guessIndex, determineHint(game));})
			.then(function() {
				var hints = game.currentGame.hints;
				var gameOver =  hints.won || (
									game.currentGame.attemptsRemaining == 0
									&& (game.currentGame.borrowableAttempts < 1)
									&& (game.currentGame.bonusAttempts < 1));

				if (hints.won) {
					var promise = broadcastState("gameWon", guessIndex, guessValue);
					if (game.profile.wins > 0 && game.profile.playerName == "") {
						promise = promise.then(function() {return broadcastState("nameEntry");});
					}
				} else if (gameOver) {
					broadcastState("gameLost", guessIndex, guessValue)
					.then(function() {return broadcastState("highScores");})
					.then(function() {return startNewGame();});
				} else {
					broadcastState("nextTurn")
					.then(function() {return broadcastState("idle", game);});
				}
			});
		};
		return component;
	}());

	var footer = (function() {
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
			el.querySelector(".score span").textContent = gameState.profile.score;;
		};

		return newComponent(
			{
				init: init,
				intro: fadeOut,
				createdGame: updateState,
				presentGame: fadeIn,
				// guessResponse: updateState
			}
		);
	}());

	// Component - contains the circular game buttons
	var gameButtons = (function() {
		var component = {};
		var el = {};
		var buttons = [];

		var fadeOut = function() {addClass(el, "transparent");};
		var fadeIn  = function() {removeClass(el, "transparent");};
		var staggerFadeIn = function() {staggerRemoveClass(buttons, "transparent", 1000);};
		var staggerFadeOut = function() {staggerAddClass(buttons, "transparent", 1000);};
		var init = function() {el = document.getElementById("game-choices");};

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

		var guessResponseStandard = function(guessIndex, hint) {
			addClass(buttons[guessIndex], "spent");
			removeClass(buttons[guessIndex], "ajax");
			addClass(buttons[guessIndex], hint);

			removeClass(el, "ajax");
		};

	// 	var guessResponse = function(gameState) {
	// 		var hints = gameState.currentGame.hints;
	// 		var guessIndex = gameState.currentGame.attemptHistory.slice(-1)[0];
	// 		var gameOver =  hints.won || (
	// 							gameState.currentGame.attemptsRemaining == 0
	// 							&& (gameState.currentGame.borrowableAttempts < 1)
	// 							&& (gameState.currentGame.bonusAttempts < 1));

	// 		addClass(buttons[guessIndex], "spent");
	// 		removeClass(buttons[guessIndex], "ajax");

	// 		if (hints.won) {
	// 			addClass(buttons[guessIndex], "won");

	// 		} else if (hints.hot) {
	// 			addClass(buttons[guessIndex], "hot");
	// 		} else if (hints.colder && hints.warmer) {
	// 			// Neither warmer nor colder
	// 		} else if (hints.warmer) {
	// 			addClass(buttons[guessIndex], "warmer");
	// 		} else if (hints.colder) {
	// 			addClass(buttons[guessIndex], "colder");
	// 		}

	// 		if (gameOver) {
	// 			var nonWinners = buttons.filter(function(val, index) {return index != gameState.currentGame.answerKey});
	// 			var winner = buttons[gameState.currentGame.answerKey];
	// 			if (hints.won) {
	// 				staggerAddClass(nonWinners, "transparent", 500);
	// 				addClass(winner, "grow")
	// 			} else {
	// 				staggerAddClass(nonWinners, "transparent", 1500);
	// 			}
	// 			setTimeout(function(){addClass(winner, "transparent");}, 2000);
	// 		} else {
	// 			removeClass(el, "ajax");
	// 		}
	// 	};

		// component.states = {
		// 	init: init,
		// 	intro: staggerFadeOut,
		// 	createdGame: createdGame,
		// 	presentGame: staggerFadeIn,
		// 	playerGuessed: playerGuessed,
		// 	guessResponse: guessResponseStandard,
		// };
		return newComponent(
			{
				init: init,
				intro: staggerFadeOut,
				createdGame: createdGame,
				presentGame: staggerFadeIn,
				playerGuessed: playerGuessed,
				guessResponse: guessResponseStandard,
			}
		);
	}());

	// Component - Logo
	var gameLogo = (function() {
		var el = {};

		var init = function() {el = document.getElementById("logo");};
		var fadeOut = function() {addClass(el, "transparent");};
		var fadeIn = function() {removeClass(el, "transparent");};
		var intro = function(duration) {
			fadeIn();
			return new Promise(function (resolve, reject) {
				setTimeout(function() {
					resolve();
				}, duration);
			});
		};

		var presentGame = function() {
			fadeOut();
			setTimeout(function() {
				addClass(el, "moved");
			}, 2000);
		};

		return newComponent(
			{
				init: init,
				intro: intro,
				presentGame: presentGame
			}
		);
	}());


	// Component - contains the circular game buttons
	var scoreDisplay = (function() {
		el = {};

		var init = function() {el = document.getElementById("current-score");};
		var fadeOut = function() {addClass(el, "transparent");};
		var fadeIn = function() {removeClass(el, "transparent");};

		var presentGame = function() {
			fadeOut();
			setTimeout(function() {
				addClass(el, "moved");
			}, 2000);
		};

		return newComponent(
			{
				init: init,
				presentGame: fadeOut
			}
		);
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
