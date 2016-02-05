var debug = false;
var log = function(msg) { if (debug) console.log(msg);}

var hintsToString = function(hints) {
    if (hints.won) {return "won";}
    if (hints.hot) {return "hot";}
    if (hints.colder && hints.warmer) {return "neither";}
    if (hints.warmer) {return "warmer";}
    if (hints.colder) {return "colder";}
    return "";
};

function hasClass(el, className) {
    return new RegExp(' ' + className + ' ').test(' ' + el.className + ' ');
}

function addClass(el, className) {
    if (!hasClass(el, className)) {
        el.className += ' ' + className;
    }
}

function removeClass(el, className) {
    var newClass = ' ' + el.className.replace( /[\t\r\n]/g, ' ') + ' ';
    if (hasClass(el, className)) {
        while (newClass.indexOf(' ' + className + ' ') >= 0 ) {
            newClass = newClass.replace(' ' + className + ' ', ' ');
        }
        el.className = newClass.replace(/^\s+|\s+$/g, '');
    }
} 

function toggleClass(el, className) {
    var newClass = ' ' + el.className.replace( /[\t\r\n]/g, ' ' ) + ' ';
    if (hasClass(el, className)) {
        while (newClass.indexOf(' ' + className + ' ') >= 0 ) {
            newClass = newClass.replace( ' ' + className + ' ' , ' ' );
        }
        el.className = newClass.replace(/^\s+|\s+$/g, '');
    } else {
        el.className += ' ' + className;
    }
}

// Adds a class to a list of elements, at random differing times
// over the course of ms
var staggerAddClass = function(els, className, ms) {
    for (var i = 0; i < els.length; i++) {
        setTimeout(function(el){
            addClass(el, className)
        }, Math.floor(Math.random() * ms), els[i]);
    }
};

// Removes a class to a list of elements, at random differing times
// over the course of ms
var staggerRemoveClass = function(els, className, ms) {
    for (var i = 0; i < els.length; i++) {
        setTimeout(function(el){
            removeClass(el, className)
        }, Math.floor(Math.random() * ms), els[i]);
    }
};

function ajax(url, success, fail){
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

// Returns a url querystring created from an object's key/val pairs
// Excludes null or undefined values
function encodeData(data) {
    return Object.keys(data).filter(function(key){
        return data[key] != undefined;
    }).map(function(key) {
        return [key, data[key]].map(encodeURIComponent).join("=");
    }).join("&");
}   