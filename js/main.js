$(document).ready(function() {
	if (!localStorage) {
		return;
	}

	// Hide the error message
	$("#unsopported").hide();
	
	// Show main app
	$("#app").show();

	// Pre-fill the line name text field from local storage
	lineName = localStorage.getItem("lineName");
	if (lineName === null) {
		lineName = "";
	}
	$("input#line").val(lineName);

	// Listen for changes in the line name field & update stored value
	$("input#line").change(function(event) {
		localStorage.setItem("lineName", $("input#line").val());
	});

	// Get GPS coordinates
	window.gpsCoords = {"lat": null, "long": null, "acc": null};
	if (navigator.geolocation) {
		navigator.geolocation.watchPosition(onGPSUpdate, onGPSError);
	}
	
	// Initial update of the downloads list
	updateDownloadsList();
	
	// Add behaviour of delete button
	$("a.deletebutton").click(function(event) {
		event.preventDefault();
		if (confirm("Tutti i dati verranno eliminati permanentemente. Procedere?")) {
			localStorage.removeItem("storedEvents");
			updateDownloadsList();
		}
	});
	
	// Hide the success box when it's clicked
	$("div#success").click(function(event) {
		$("div#success").hide();
	});
	
	// Handle a click on one of the event buttons
	$(".eventbutton").click(function(event) {
		event.preventDefault();
		eventSlug = slugify(event.target.innerHTML);

		lineName = $("input#line").val();
		lineSlug = slugify(lineName);

		commentField = $("textarea#comment");
		comment = commentField.val();
		commentField.val("");
	
		eventLog = retrieveStoredData();
		if (!(lineSlug in eventLog)) {
			eventLog[lineSlug] = {"lineName": lineName, "rows": []};
		}
	
		dateTime = getDateAndTime();
		entry = {
			"eventType": eventSlug,
			"comment": comment,
			"date": dateTime.date,
			"time": dateTime.time,
			"lat": window.gpsCoords.lat,
			"long": window.gpsCoords.long,
			"acc": window.gpsCoords.acc
		};
		eventLog[lineSlug].rows.push(entry);
	
		storeData(eventLog);
		updateDownloadsList();
	
		$("div#success").show();
		$("div#success").delay(5000).fadeOut();
	});
});



/**
* Handle GPS position update.
*/
function onGPSUpdate(pos) {
	let x = $("div#geolocation");
	x.addClass("gps-success");
	x.removeClass("gps-fail");

	x.html(
		"Lat: " + pos.coords.latitude
		+"; Long: " + pos.coords.longitude
		+"; Acc: " + pos.coords.accuracy
	);

	window.gpsCoords = {
		"lat": pos.coords.latitude,
		"long": pos.coords.longitude,
		"acc": pos.coords.accuracy
	};
}


/**
* Handle GPS position error.
*/
function onGPSError(error) {
	let x = $("div#geolocation");
	x.html("GPS offline ");
	x.removeClass("gps-success");
	x.addClass("gps-fail");
	switch(error.code) {
		case error.PERMISSION_DENIED:
			x.html(x.html()+"(accesso negato)");
			break;
		case error.POSITION_UNAVAILABLE:
			x.html(x.html()+"(posizione non disponibile)");
			break;
		case error.TIMEOUT:
			x.html(x.html()+"(timeout richiesta)");
			break;
		case error.UNKNOWN_ERROR:
			x.html(x.html()+"(errore sconosciuto)");
			break;
	}

	window.gpsCoords = {
		"lat": null,
		"long": null,
		"acc": null
	};
}

/**
 * Retrieve our data structure from local storage.
 */
function retrieveStoredData() {
	storedEvents = localStorage.getItem("storedEvents");
	if (storedEvents === null) {
		storedEvents = {};
	} else {
		storedEvents = JSON.parse(storedEvents);
	}
	return storedEvents;
}

/**
 * Store our data structure in local storage.
 */
function storeData(data) {
	localStorage.setItem("storedEvents", JSON.stringify(data));
}

/**
 * Get current date and time as formatted strings.
 */
function getDateAndTime() {
	function pad(i) {
		if (i < 10) {i = "0" + i}
		return i;
	}
	dateTime = new Date();
	cDate = dateTime.getFullYear()+'-'+pad(dateTime.getMonth()+1)+'-'+pad(dateTime.getDate());
	cTime = pad(dateTime.getHours())+":"+pad(dateTime.getMinutes())+":"+pad(dateTime.getSeconds());
	return {"time": cTime, "date": cDate};
}

/**
 * Return a URL slug of the given text.
 * Source: https://gist.github.com/mathewbyrne/1280286
 */
function slugify(text)
{
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

/**
 * Update the list of downloads
 */
function updateDownloadsList() {
	eventLog = retrieveStoredData();
	ul = $("ul#downloads-list");
	ul.html("");
	for (let lineSlug in eventLog) {
		fileName = genFileName(lineSlug);
		csv = encodeURIComponent(genCSV(lineSlug));
		let html = '<li>' + fileName + ' <a href="data:text/csv;charset=utf-8,' + csv + '" download="'+fileName+'">Scarica</a>';
		ul.html(ul.html() + html);
	}

	if (ul.html() == "") {
		ul.html("<li>Nessun dato disponibile.</li>");
	}
}

/**
 * Generate file name given line slug.
 */
function genFileName(lineSlug) {
	return "linea-" + lineSlug + ".csv";
}

/**
 * Generate the CSV string for the given line.
 */
function genCSV(lineSlug) {
	eventLog = retrieveStoredData();
	let csv = '';

	if (!(lineSlug in eventLog)) {
		return csv;
	}

	function stripQuotes(str) {
		return str.replace(/"/g, '');
	}

	lineName = eventLog[lineSlug].lineName;
	csv = "Linea:,\"" + stripQuotes(lineName) + "\"\n";
	csv += "\nEvento,Data,Ora,Latitudine,Longitudine,Accuratezza,Commento\n";

	for (rowIdx in eventLog[lineSlug].rows) {
		let row = eventLog[lineSlug].rows[rowIdx];
		csv += row.eventType + "," + row.date + "," + row.time;
		csv += "," + row.lat + "," + row.long + "," + row.acc;
		csv += ",\"" + stripQuotes(row.comment) + "\"\n";
	}
	return csv;
}

