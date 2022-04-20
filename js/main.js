
/** TODO:
 * [x] Option to download stored data as CSV
 * [x] Mobile test
 * [ ] Safari test
 * [x] Chrome test
 * [x] JS to generate event list
 * [x] Feedback on successfully saved event
 * [ ] GPS tracking
 */

// Hide the error message
$("#unsopported").hide();

// Show main app
$("#app").show();

// Initial update of the downloads list
updateDownloadsList();

// Create the event buttons
populateEventButtons([
	"Inizio corsa",
	"Apertura porte",
	"Chiusura porte",
	"Immissione in corsia",
	"Semaforo: arresto",
	"Semaforo: partenza",
	"Precedenza: arresto",
	"Precedenza: partenza",
	"Fine corsa",
]);

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
	eventName = event.target.id;
	lineName = $("input#line").val();
	lineSlug = slugify(lineName);
	commentField = $("textarea#comment");
	comment = commentField.val();

	eventLog = retrieveStoredData();
	
	if (!(lineSlug in eventLog)) {
		eventLog[lineSlug] = {"lineName": lineName, "rows": []};
	}

	dateTime = getCurrentTime();
	entry = {
		"eventType": eventName,
		"comment": comment,
		"date": dateTime.date,
		"time": dateTime.time
	};
	eventLog[lineSlug].rows.push(entry);

	storeData(eventLog);

	updateDownloadsList();

	commentField.val("");

	$("div#success").show();
	$("div#success").delay(5000).fadeOut();
});





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
function getCurrentTime() {
	function padZero(i) {
		if (i < 10) {i = "0" + i}
		return i;
	}
	dateTime = new Date();
	cDate = dateTime.getFullYear() + '-' + padZero(dateTime.getMonth() + 1) + '-' + padZero(dateTime.getDate());
	cTime = padZero(dateTime.getHours()) + ":" + padZero(dateTime.getMinutes()) + ":" + padZero(dateTime.getSeconds());
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
	csv += "\nEvento,Data,Ora,Commento\n";

	for (rowIdx in eventLog[lineSlug].rows) {
		let row = eventLog[lineSlug].rows[rowIdx];
		csv += row.eventType + "," + row.date + "," + row.time;
		csv += ",\"" + stripQuotes(row.comment) + "\"\n";
	}
	return csv;
}

/**
 * Given a list of event names, generate the buttons for them.
 */
function populateEventButtons(eventList) {
	div = $("div#buttons");
	div.html("");
	for (let e in eventList) {
		let eventName = eventList[e];
		let eventSlug = slugify(eventName);
		let html = '<a href="#" class="eventbutton" id="'+eventSlug+'">'+eventName+'</a>';
		div.html(div.html() + html);
	}
}
