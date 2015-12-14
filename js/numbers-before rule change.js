/**@license MIT-promiscuous-©Ruben Verborgh*/
!function(n,t){function c(n,t){return(typeof t)[0]==n}function u(o,e){return e=function f(i,h,l,a,p,s){function y(n){return function(t){p&&(p=0,f(c,n,t))}}if(a=f.q,i!=c)return u(function(n,t){a.push({p:this,r:n,j:t,1:i,0:h})});if(l&&c(n,l)|c(t,l))try{p=l.then}catch(j){h=0,l=j}if(c(n,p))try{p.call(l,y(1),h=y(0))}catch(j){h(j)}else for(e=function(t,e){return c(n,t=h?t:e)?u(function(n,c){r(this,n,c,l,t)}):o},s=0;s<a.length;)p=a[s++],c(n,i=p[h])?r(p.p,p.r,p.j,l,i):(h?p.r:p.j)(l)},e.q=[],o.call(o={then:function(n,t){return e(n,t)},"catch":function(n){return e(0,n)}},function(n){e(c,1,n)},function(n){e(c,0,n)}),o}function r(u,r,o,e,f){setTimeout(function(){try{e=f(e),f=e&&c(t,e)|c(n,e)&&e.then,c(n,f)?e==u?o(TypeError()):f.call(e,r,o):r(e)}catch(i){o(i)}})}function o(n){return u(function(t){t(n)})}Promise=u,u.resolve=o,u.reject=function(n){return u(function(t,c){c(n)})},u.all=function(n){return u(function(t,c,u,r){r=[],u=n.length||t(r),n.map(function(n,e){o(n).then(function(n){r[e]=n,--u||t(r)},c)})})}}("f","o");

var numberGame = (function(){
	var api = {}
	api.newGame = function(key) {
		return new Promise(function(resolve, reject){

			if (key == undefined) {key = "";}
			else {key = "?key=" + key;}

			callAjax("/newgame" + key, function(response){
				var gameEnv = (function(newGame){
					var game = newGame;
					game.guess = function(guess) {
						var self = this;
						return new Promise(function(resolve, reject){
							callAjax("/guess?guess=" + guess + "&key=" + self.gameID, 
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
				console.err(err);
			});
		});
	};
	return api;
}());

document.addEventListener("DOMContentLoaded", function(event) {
	console.log("DOM fully loaded and parsed");
	var gameButtons = document.querySelectorAll(".hi-icon");
	var h1 = document.querySelector("h1");
	var h2 = document.querySelector("h2");
	var hiScores = document.querySelector(".hiscore-container");
	var score = document.querySelector(".score-container");
	var playerScore = document.getElementById("player-score");
	var continueBtn = document.getElementById('btn-continue');
	var game = {};
	var prevScore = 0;

	continueBtn.addEventListener("click", function(){
		addClass(hiScores, "transparent");
		addClass(score, "transparent");
		addClass(h1, "transparent");
		addClass(h2,"transparent");
		numberGame.newGame(game.gameID).then(
			function(g){
				game = g;
				setTimeout(function(){initGame();}, 0);
			},
			function(err){}
		);
	});

	numberGame.newGame().then(
		function(g){
			game = g;
			addGameListeners(gameButtons);
			initGame(gameButtons);
		},

		function(err){}
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
		
		for (var i = 0; i < gameButtons.length; i++) {
			removeClass(gameButtons[i], "ajax");
			removeClass(gameButtons[i], "spent");
			removeClass(gameButtons[i], "hot");
			removeClass(gameButtons[i], "warmer");
			removeClass(gameButtons[i], "colder");
			removeClass(gameButtons[i], "won");

			gameButtons[i].innerText = game.currentGame.choices[i];
		}
		removeClass(gameButtons[0].parentElement, "ajax");
		addClass(score, "transparent");
		addClass(hiScores, "transparent");

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
			html += '<tr><td>' + (i + 1) + '</td><td>' + scores[i].playerName + '</td><td>' + scores[i].score + '</td><td>' + scores[i].longestStreak + '</td></tr>';
		}
		table.innerHTML = html;
	}

	var addGameListeners = function(gameButtons) {
		for (var i = 0; i < gameButtons.length; i++) {

			// Classes to identify the buttons later
			addClass(gameButtons[i],"choice-" + gameButtons[i].textContent);
			gameButtons[i].choiceIndex = i;

			gameButtons[i].addEventListener('click', function(event){
				var el = event.srcElement || event.target;
				addClass(el.parentElement, "ajax");
				addClass(el, "ajax");
				addClass(el, "spent");
				addClass(h1, "transparent");
				addClass(h2, "transparent");
				
				game.guess(el.choiceIndex).then(
					function(response) {
						console.log(response.currentGame.attemptsRemaining + " attempts left");
						playerScore.innerText = response.profile.score;
						var scoreDelta = response.profile.score - prevScore;
						prevScore = response.profile.score;

						fillScoreTable(hiScores.querySelector('table'), response.highScores);
						
						removeClass(el, "ajax")

						var hints = response.currentGame.hints;
						if (hints.won) {
							addClass(el, "won");
							h1.innerHTML = 'You <span class="won">Won</span>!';
							h2.textContent = "+ " + scoreDelta + ' points';

						} else if (hints.hot) {
							addClass(el, "hot");
							h1.innerHTML = 'You are <span class="hot">SO close!</span>';
							h2.textContent = "Try again!";

						} else if (hints.warmer && !hints.colder) {
							addClass(el, "warmer");
							h1.innerHTML = 'No, but you\'re getting <span class="warmer">warmer</span>!';
							h2.textContent = "Try again!"

						} else if (hints.colder && !hints.warmer) {
							addClass(el, "colder");
							h1.innerHTML = 'You\'re getting <span class="colder">colder</span>!';
							h2.textContent = "Try again!";

						} else if (hints.colder && hints.warmer) {
							h1.innerHTML = 'You\'re neither <span class="warmer">warmer</span> nor <span class="colder">colder</span>..';
							h2.textContent = "Try again!";

						} else {
							h1.textContent = "No, but " + response.currentGame.choices[response.currentGame.attemptHistory[response.currentGame.attemptHistory.length-1]] + " is a good start!";
							h2.textContent = response.currentGame.attemptsRemaining +  " more guesses!";
						}
						if (!hints.won &&  response.currentGame.attemptsRemaining == 0) {
							var msg = hints.hot ? 'You were <span class="hot">SO close!</span>' : "You lost!";
							h1.innerHTML = msg + '  I was thinking of <span class="won">' + response.currentGame.choices[response.currentGame.answerKey] + '</span>';
							h2.textContent = "I chose "	+ response.currentGame.choices[response.currentGame.answerKey] + " because that's how many friends I have";
							addClass(document.querySelector(".choice-" + response.currentGame.choices[response.currentGame.answerKey]), "won");
						}
						setTimeout(function(){removeClass(h1, "transparent");removeClass(h2, "transparent");}, 500);
						
						if (response.currentGame.attemptsRemaining != 0) {
							removeClass(el.parentElement, "ajax")
						} else {
							staggerAddClass(gameButtons, "transparent", 1500);

							if (!hints.won) {
								setTimeout(function(){removeClass(hiScores, "transparent");}, 1500);
							} else {
								setTimeout(function(){
									removeClass(score, "transparent");
										numberGame.newGame(response.gameID).then(
											function(g){
												game = g;
												setTimeout(function(){addClass(h1, "transparent");addClass(h2, "transparent");}, 1000);
												setTimeout(function(){initGame();}, 1500);
											},
											function(err){}
										);
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


function hasClass(elem, className) {
    return new RegExp(' ' + className + ' ').test(' ' + elem.className + ' ');
}

function addClass(elem, className) {
    if (!hasClass(elem, className)) {
        elem.className += ' ' + className;
    }
}

function removeClass(elem, className) {
    var newClass = ' ' + elem.className.replace( /[\t\r\n]/g, ' ') + ' ';
    if (hasClass(elem, className)) {
        while (newClass.indexOf(' ' + className + ' ') >= 0 ) {
            newClass = newClass.replace(' ' + className + ' ', ' ');
        }
        elem.className = newClass.replace(/^\s+|\s+$/g, '');
    }
} 

function toggleClass(elem, className) {
    var newClass = ' ' + elem.className.replace( /[\t\r\n]/g, ' ' ) + ' ';
    if (hasClass(elem, className)) {
        while (newClass.indexOf(' ' + className + ' ') >= 0 ) {
            newClass = newClass.replace( ' ' + className + ' ' , ' ' );
        }
        elem.className = newClass.replace(/^\s+|\s+$/g, '');
    } else {
        elem.className += ' ' + className;
    }
}

function callAjax(url, success, fail){
    var xmlhttp;
    // compatible with IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(){
        if (xmlhttp.readyState == 4) {
        	if (xmlhttp.status == 200){
        		success(xmlhttp.responseText);
        	} else {
        		fail(xmlhttp.responseText);
        	}
        }
    }
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

function getParameterByName(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}