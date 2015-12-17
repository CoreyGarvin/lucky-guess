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
				initGame(g);
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



	var initGame = function(gameState) {

		console.log("wins " + game.profile.wins + " score " + game.profile.score);

		prevScore = game.profile.score;
		
		addClass(score, "transparent");
		removeClass(gameDiv, "ajax");
		addClass(score, "transparent");
		addClass(hiScores, "transparent");
		removeClass(header, "transparent");

		cupcake.className = "idle";

		gameButtons.init(gameState);
		gameButtons.staggerFadeIn();
		// staggerRemoveClass(gameButtons, "transparent", 1000);

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