cross-domain-events
===================

An event-like interface to postMessage for cross domain communication.

[![Build Status](https://travis-ci.org/finn-no/cross-domain-events.png)](https://travis-ci.org/finn-no/cross-domain-events)

postMessage was implemented in Internet Explorer 8, but only supports sending text strings. Modern browsers can send objects, but if you want to listen for different kind of objects you have to implement your own delegation.

Example
=======

	// notify parent about page size
	xde.sendTo(window.top, "resize", {
		width: iframe.clientWidth,
		height: iframe.clientHeight
	});

	// parent page
	xde.on("resize", function (evt) {
		var iframe = document.getElementById("theiframe");
		iframe.style.width = evt.data.width;
		iframe.style.height = evt.data.height;
	});

Works in IE8 & IE9 as long as you have ES5-shim (for Array.prototype.filter) and JSON.js already.

License
=======

MIT
