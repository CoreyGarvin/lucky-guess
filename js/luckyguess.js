/**@license MIT-promiscuous-©Ruben Verborgh*/
!function(n,t){function c(n,t){return(typeof t)[0]==n}function u(o,e){return e=function f(i,h,l,a,p,s){function y(n){return function(t){p&&(p=0,f(c,n,t))}}if(a=f.q,i!=c)return u(function(n,t){a.push({p:this,r:n,j:t,1:i,0:h})});if(l&&c(n,l)|c(t,l))try{p=l.then}catch(j){h=0,l=j}if(c(n,p))try{p.call(l,y(1),h=y(0))}catch(j){h(j)}else for(e=function(t,e){return c(n,t=h?t:e)?u(function(n,c){r(this,n,c,l,t)}):o},s=0;s<a.length;)p=a[s++],c(n,i=p[h])?r(p.p,p.r,p.j,l,i):(h?p.r:p.j)(l)},e.q=[],o.call(o={then:function(n,t){return e(n,t)},"catch":function(n){return e(0,n)}},function(n){e(c,1,n)},function(n){e(c,0,n)}),o}function r(u,r,o,e,f){setTimeout(function(){try{e=f(e),f=e&&c(t,e)|c(n,e)&&e.then,c(n,f)?e==u?o(TypeError()):f.call(e,r,o):r(e)}catch(i){o(i)}})}function o(n){return u(function(t){t(n)})}Promise=u,u.resolve=o,u.reject=function(n){return u(function(t,c){c(n)})},u.all=function(n){return u(function(t,c,u,r){r=[],u=n.length||t(r),n.map(function(n,e){o(n).then(function(n){r[e]=n,--u||t(r)},c)})})}}("f","o");

// https://bitbucket.org/bentomas/smokesignals.js/overview
smokesignals={convert:function(c,e){e={};c.on=function(d,a){(e[d]=e[d]||[]).push(a);return c};c.once=function(d,a){function b(){a.apply(c.off(d,b),arguments)}b.h=a;return c.on(d,b)};c.off=function(d,a){for(var b=e[d],f=0;a&&b&&b[f];f++)b[f]!=a&&b[f].h!=a||b.splice(f--,1);f||delete e[d];return c};c.emit=function(d){for(var a=e[d],b=0;a&&a[b];)a[b++].apply(c,a.slice.call(arguments,1));return c


// Service for interacting with server
var LuckyGuessService = (function(){
	var api = {}
	// Creates a new game, or continues a 'saved' game when the key is provided
	api.newGame = function(key, name) {
		return new Promise(function(resolve, reject){
			var queryString = encodeData({
				key: key,
				name: name || getParameterByName("name") || ""
			});
			ajax("/newgame?" + queryString, function(response){
				var gameEnv = (function(newGame){
					var game = newGame;
					game.guess = function(guess) {
						var self = this;
						return new Promise(function(resolve, reject){
							ajax("/guess?guess=" + guess + "&key=" + self.gameID, 
								function(response){
									resolve(JSON.parse(response));
								},
								function(response){
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
	console.log("DOM fully loaded and parsed");
	var gameButtons = {};
	var gameDiv = document.getElementById("game-choices");

	// Containers
	var header = document.querySelector("header");
	var logoCtn = document.getElementById("logo");
	var nameEntry = document.getElementById("name-entry");
	var hiScores = document.getElementById("highscores");
	var score = document.getElementById("current-score");

	var footer = (function(){
		var el = document.getElementById("footer");
		var guesses = 0;
		var score = 0;
		var footer = {};
		footer.el = el;
		footer.fadeOut = function() {
			addClass(el, "transparent");
		}
		footer.fadeIn = function() {
			removeClass(el, "transparent");
		}
		footer.setState = function(guesses, score) {
			var tokens = el.querySelectorAll(".tokens .inner");
			for (var i = 0; i < tokens.length; i++) {
				if ((i+1) <= guesses) {
					removeClass(tokens[i], "exhausted");
				} else {
					addClass(tokens[i], "exhausted");
				}
			}
			el.querySelector(".score span").textContent = score;
		};
		return footer;
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

	// Begin add listeners:

	// Handler - Name entry - Handle the 'return' key
	nameInput.addEventListener("keydown", function(){
		if (event.keyCode == 13) {
			document.getElementById('btn-done').click();
		}
	});

	// Handler - Name entry - handle the submit button
	document.getElementById('name-submit').addEventListener("click", function(){
		addClass(nameEntry, "transparent");
		addClass(logoCtn, "transparent");
		setTimeout(function(){
			LuckyGuessService.newGame(game.gameID, nameInput.value).then(
				function(g){
					game = g;
					addClass(h1, "transparent"); addClass(h2, "transparent");
					addGameListeners();
					initGame();
				},
				function(err){
					console.log("There was a problem!");
					console.log(err);
				}
			);
		}, 1500);
	});

	// Handler - game over continue button
	continueBtn.addEventListener("click", function(){
		addClass(hiScores, "transparent");
		addClass(score, "transparent");
		addClass(h1, "transparent");
		addClass(h2,"transparent");
		LuckyGuessService.newGame(null, game.profile.playerName).then(
			function(g){
				game = g;
				
				addGameListeners();
				initGame();
				//setTimeout(function(){}, 0);
			},
			function(err){}
		);
	});

	setTimeout(function(){
		removeClass(logoCtn, "transparent");
	}, 100);

	// First game
	LuckyGuessService.newGame().then(
		function(g){
			setTimeout(function(){
				addClass(logoCtn, "transparent");
				game = g;
				addGameListeners();
				initGame();
				// move logo into position for sign-in page
				setTimeout(function(){
					addClass(logoCtn, "moved");
				}, 2000);
			}, 0); // was 2500 before debug
		},

		function(err){
			console.log("There was a problem!");
			console.log(err);
		}
	);

	var staggerAddClass = function(els, className, ms) {
		for (var i = 0; i < els.length; i++) {
			setTimeout(function(el){
				addClass(el, className)
			}, Math.floor(Math.random() * ms), els[i]);
		}
	};

	var staggerRemoveClass = function(els, className, ms) {
		for (var i = 0; i < els.length; i++) {
			setTimeout(function(el){
				removeClass(el, className)
			}, Math.floor(Math.random() * ms), els[i]);
		}
	};

	var initGame = function() {

		console.log("wins " + game.profile.wins + " score " + game.profile.score);

		prevScore = game.profile.score;
		
		addClass(score, "transparent");
		removeClass(gameDiv, "ajax");
		addClass(score, "transparent");
		addClass(hiScores, "transparent");
		removeClass(header, "transparent");

		cupcake.className = "idle";

		staggerRemoveClass(gameButtons, "transparent", 1000);

		// Reset header text
		h1.innerHTML = 'What Number Am I Thinking Of?';
		h2.textContent = "I give you 3 guesses";

		// Fade in the header text
		removeClass(h1, "transparent");
		setTimeout(function(el){
			removeClass(el, "transparent")
		}, 800, h2);

	}

	var fillScoreTable = function(table, scores) {
		if (scores == null || scores == undefined) return

		var html = '<tr><th>Rank</th><th>Who</th><th>Score</th><th>Streak</th></tr>';
		for(var i = 0; i < scores.length; i++) {
			var classes = i % 2 == 0 ? ' class = "even"' : "";
			html += '<tr' + classes + '><td>' + (i + 1) + '</td><td><span class = "player-name">' + scores[i].playerName + '</span></td><td>' + scores[i].score + '</td><td>' + scores[i].longestStreak + '</td></tr>';
		}
		table.innerHTML = html;
	}

	var addGameListeners = function() {
		//Create game buttons
		var html = "";
		for (var i = 0; i < game.currentGame.choices.length; i++) {
			html += '<a class="choice transparent">' + game.currentGame.choices[i] + '</a>';
		}
		gameDiv.innerHTML = html;
		gameButtons = document.querySelectorAll("#game-choices .choice");

		disableConfetti();

		for (var i = 0; i < gameButtons.length; i++) {

			// Classes to identify the buttons later
			addClass(gameButtons[i],"choice-" + gameButtons[i].textContent);
			gameButtons[i].choiceIndex = i;

			gameButtons[i].addEventListener('click', function(event){
				var el = event.srcElement || event.target;
				addClass(el.parentElement, "ajax");
				cupcake.className = "ducked";
				addClass(el, "ajax");
				addClass(el, "spent");
				addClass(h1, "transparent");
				addClass(h2, "transparent");
				
				game.guess(el.choiceIndex).then(
					function(response) {
						footer.setState(response.currentGame.attemptsRemaining, response.profile.score);
						console.log(response.currentGame.attemptsRemaining + " attempts left");
						
						var scoreDelta = response.profile.score - prevScore;
						

						fillScoreTable(hiScores.querySelector('table'), response.highScores);
						
						removeClass(el, "ajax");
						// cupcake.className = "idle";
						removeClass(cupcake, "ducked");

						var hints = response.currentGame.hints;
						if (hints.won) {
							addClass(el, "won");
							h1.innerHTML = 'You <span class="won">Won</span>!';
							h2.textContent = "+ " + scoreDelta + ' points';
							h1.textContent = "1stwins=" + response.profile.wins+ ", playername=" + response.profile.playerName;
							addClass(cupcake, "hot");
							setTimeout(function(){
								addClass(header, "transparent");
							}, 500);

						} else if (hints.hot) {
							addClass(el, "hot");
							h1.innerHTML = 'You are <span class="hot">SO close!</span>';
							h2.textContent = "Try again!";
							removeClass(cupcake, "idle");
							addClass(cupcake, "hot");

						} else if (hints.warmer && !hints.colder) {
							addClass(el, "warmer");
							h1.innerHTML = 'No, but you\'re getting <span class="warmer">warmer</span>!';
							h2.textContent = "Try again!"
							addClass(cupcake, "warmer");
							setTimeout(function(){
								removeClass(cupcake,"warmer");
								addClass(cupcake, "idle");
							}, 2000);

						} else if (hints.colder && !hints.warmer) {
							addClass(el, "colder");
							addClass(cupcake, "colder");
							setTimeout(function(){removeClass(cupcake,"colder");}, 1000);
							
							h1.innerHTML = 'You\'re getting <span class="colder">colder</span>!';
							h2.textContent = "Try again!";

						} else if (hints.colder && hints.warmer) {
							h1.innerHTML = 'You\'re neither <span class="warmer">warmer</span> nor <span class="colder">colder</span>..';
							h2.textContent = "Try again!";
							setTimeout(function(){
								removeClass(cupcake,"warmer");
								addClass(cupcake, "idle");
							}, 2000);

						} else {
							addClass(cupcake, "idle");
							h1.textContent = "No, but " + response.currentGame.choices[response.currentGame.attemptHistory[response.currentGame.attemptHistory.length-1]] + " is a good start!";
							h2.textContent = response.currentGame.attemptsRemaining +  " more guesses!";
						}
						// Lost the game, no extra attempts remaining
						if (!hints.won &&  response.currentGame.attemptsRemaining == 0 && response.currentGame.borrowableAttempts < 1 && response.currentGame.bonusAttempts < 1) {
							var msg = hints.hot ? 'You were <span class="hot">SO close!</span>' : "You lost!";
							h1.innerHTML = msg + '  I was thinking of <span class="won">' + response.currentGame.choices[response.currentGame.answerKey] + '</span>';
							h2.textContent = "I chose "	+ response.currentGame.choices[response.currentGame.answerKey] + " because that's how many friends I have";
							addClass(document.querySelector(".choice-" + response.currentGame.choices[response.currentGame.answerKey]), "won");
						}
						// Fade in the header messages
						setTimeout(function(){removeClass(h1, "transparent");removeClass(h2, "transparent");}, 500);
						
						// Game is not over yet
						if (!hints.won && (response.currentGame.attemptsRemaining > 0 ||  response.currentGame.borrowableAttempts > 0 || response.currentGame.bonusAttempts > 0)) {
							removeClass(el.parentElement, "ajax")

						// Game over - fade out the buttons
						} else {
							var nonWinners = [];
							var winnner = {}
							for(b in gameButtons) {
								if (gameButtons[b].choiceIndex != response.currentGame.answerKey) {
									nonWinners.push(gameButtons[b])
								} else {
									winner = gameButtons[b];
								}
							}
							if (hints.won) {
								staggerAddClass(nonWinners, "transparent", 500);
							} else {
								staggerAddClass(nonWinners, "transparent", 1500);
							}
							addClass(winner, "grow")
							setTimeout(function(){addClass(winner, "transparent");}, 2000);
							// setTimeout(function(){addClass(gameDiv, "transparent");}, 1500);

							// debug
							h1.textContent = "wins=" + response.profile.wins+ ", playername=" + response.profile.playerName;

							// Show high scores if you lost
							if (!hints.won) {
								setTimeout(function(){removeClass(hiScores, "transparent");}, 1500);

							// Name entry at 3 wins
							} else if (false && response.profile.wins == 1 && response.profile.playerName == "") {
								// if (response.currentGame.attemptsRemaining == 2) enableConfetti();
								h1.textContent = "whats yer name partner?";
								setTimeout(function(){
									removeClass(nameEntry, "transparent");
									removeClass(logoCtn, "transparent");
									h2.textContent = "in the timeout";

								}, 2500);

							// Show your score
							} else {
								if (response.currentGame.attemptHistory.length == 1) enableConfetti();
								setTimeout(function(){
									// Show the current score
									removeClass(score, "transparent");
									// Then animate the counting up
									setTimeout(function(){
										var ps = prevScore;
										// Increment score by this amount (takes longer when you played better)
										var inc = Math.ceil(scoreDelta / 60 / (response.currentGame.attemptHistory.length));
								   		prevScore = response.profile.score;
								   		// Increment the score, and when done, start new game or show name entry
									    var timerId = setInterval(function () {
									      	if (ps < response.profile.score) {
									      		ps += inc;
									      		playerScore.innerText = Math.min(ps, response.profile.score);
									      	} else {
									      		if (response.profile.wins == 1 && response.profile.playerName == "") {
									      			
									      			setTimeout(function(){addClass(score, "transparent");}, 1500);
									      			h1.textContent = "whats yer name partner?";
													setTimeout(function(){
														removeClass(nameEntry, "transparent");
														removeClass(logoCtn, "transparent");
														h2.textContent = "in the timeout";

													}, 2000);
									      		} else {
									      			// addClass(score, "transparent");
													// Start a new game
													LuckyGuessService.newGame(response.gameID).then(
														function(g){
															game = g;
															setTimeout(function(){addClass(h1, "transparent");addClass(h2, "transparent");}, 1000);
															setTimeout(function(){addGameListeners(); initGame();}, 0);
														},
														function(err){
															console.log("There was a problem!");
															console.log(err);
														}
													);
												}
												clearInterval(timerId);
									      	}
									      	playerScore
									    }, 16);
									}, 500);
								}, 1500);
							}
						}
					},
					function(error){
						removeClass(el.parentElement, "ajax")
						h1.textContent = "There was an error....";
						h2.textContent = error;		
					}
				); // End guess
			});
		}
	}


});

function enableConfetti(){
	confettiEnabled = true;
	
	setTimeout(function(){removeClass(document.getElementById('confetti'), "transparent");}, 500);
}

function disableConfetti(){
	setTimeout(function(){confettiEnabled = false;}, 500);
	
	addClass(document.getElementById('confetti'), "transparent");
}
