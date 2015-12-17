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
									resolve(self);
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
		var self = {};
		var registeredComponents = [];
		var game = null;
		var currentState = null;


		self.register = function() {
			for (var i = 0; i < arguments.length; i++) {
				registeredComponents.push(arguments[i]);
			}
		};

		self.unRegister = function() {
			for (var i = 0; i < arguments.length; i++) {
				registeredComponents.pop(arguments[i]);
			}
		};

		var broadcastState = function(state, arg) {
			currentState = state;
			for (i = 0; i < registeredComponents.length; i++) {
				if (registeredComponents[i].hasOwnProperty("enterState")) {
					registeredComponents[i].enterState(currentState, arg);
				}
			}
		};						

		self.begin = function() {
			broadcastState("intro", null);
			LuckyGuessService.newGame().then(
				// New game created successfully
				function(g) {
					game = g;
					broadcastState("createdGame", game);
					setTimeout(function() {
						broadcastState("presentGame", game);
						broadcastState("idle", game);
					}, 200); // was 2500 before debug
				},

				function(err) {
					console.log("There was a problem!");
					console.log(err);
				}
			);
		};

		self.playerGuess = function(guessIndex) {
			broadcastState("playerGuessed", guessIndex);
			game.guess(guessIndex).then(
				function() {
					broadcastState("guessResponse", game);
					var hints = response.game.hints;
					var gameOver = response.currentGame.attemptsRemaining == 0
									&& (response.currentGame.borrowableAttempts < 1)
									&& (response.currentGame.bonusAttempts < 1);

					if (hints.won) {

					} else if (hints.hot) {

					} else if (hints.colder && hints.warmer) {
						// Neither warmer nor colder
					} else if (hints.warmer) {

					} else if (hints.colder) {

					} else if (!gameOver) {
						addClass(cupcake, "idle");
					}

					// Player loses
					if (!hints.won) {
						if (gameOver) {
							// gameover
						} else {
							//next turn
						}

					}

				},

				function(err) {
					console.log("There was a problem!");
					console.log(err);
				}
			);
		};

		self.startNewGame = function() {
			// First game
			LuckyGuessService.newGame().then(
				function(g) {
					setTimeout(function() {
						addClass(logoCtn, "transparent");
						game = g;
						addGameListeners();
						initGame(g);
						// move logo into position for sign-in page
						setTimeout(function() {
							addClass(logoCtn, "moved");
						}, 2000);
					}, 0); // was 2500 before debug
				},

				function(err) {
					console.log("There was a problem!");
					console.log(err);
				}
			);
		};

		self.presentGame = function() {
			// self.emit("game present");
		};

		// self.on("game button clicked", log);
		return self;
	}());

	var footer = (function() {
		var self = {};
		var el = document.getElementById("footer");
		var guesses = 0;
		var score = 0;

		self.enterState = function(state, arg) {
			if (states.hasOwnProperty(state)) {
				states[state](arg);
				return true;
			}
			return false;
		};

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

		var states = {
			intro: fadeOut,
			createdGame: updateState,
			presentGame: fadeIn
		};

		return self;
	}());

	// Component - contains the circular game buttons
	var gameButtons = (function() {
		var self = {};
		var el = document.getElementById("game-choices");
		var buttons = [];
		
		self.enterState = function(state, arg) {
			if (states.hasOwnProperty(state)) {
				states[state](arg);
				return true;
			}
			return false;
		};

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
			buttons = el.querySelectorAll(".choice");

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



		// self.present = function() {

		// };

		var states = {
			intro: staggerFadeOut,
			createdGame: init,
			presentGame: staggerFadeIn,
			playerGuessed: playerGuessed,
		};


		return self;
	}());

	// Component - contains the circular game buttons
	var gameLogo = (function() {
		el = document.getElementById("logo");
		var self = {};

		self.enterState = function(state, arg) {
			if (self.states.hasOwnProperty(state)) {
				self.states[state](arg);
				return true;
			}
			return false;
		};

		var fadeOut = function() {addClass(el, "transparent");};
		var fadeIn = function() {removeClass(el, "transparent");};

		var presentGame = function() {
			fadeOut();
			setTimeout(function() {
				addClass(el, "moved");
			}, 2000);
		};

		self.states = {
			intro: fadeIn,
			presentGame: presentGame
		};
		return self;
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
