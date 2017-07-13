  // Scratch project downloader by EDX
// Make sure you include these using script tags in HTML
// https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.3/jquery.min.js JQuery
// https://cdnjs.cloudflare.com/ajax/libs/jszip/2.5.0/jszip.min.js JZip
// https://cdn.rawgit.com/Stuk/jszip-utils/dfdd631c4249bc495d0c335727ee547702812aa5/dist/jszip-utils.min.js JZip Utilities
// https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2014-11-29/FileSaver.min.js File saver
// Without these it won't work
// Uses JSZip and stuff
var jszip = null; // Imported in HTML
  var project = null; 
  var id = null; // Stores the project ID for grabbing stuff

// Get around assets problem 1
// Incremental
  var soundId = 0; // Current sound ID
  var costumeId = 0; // Current Asset
// Lists holding assets to grab from the Scratch servers. This data is in the MD5 tag.
  var soundsToDownload = [
  ];
// COSTUMES ARE A BIT DIFFERENT
  var costumesToDownload = [
  ];

  var totalAssets = 0; // Counts the total asssets
  var completeAssets = 0; // Counts how many assets have been processed.

// Main Script
  function startDownload(projectId) {
    logMessage('Fetching project: ' + projectId); // See function
       // Setup
    soundId = 0;
    costumeId = 0;
    totalAssets = 0;
    completeAssets = 0;
    soundsToDownload = [
    ];
    costumesToDownload = [
    ];
    id = projectId;
       // Import JSZip ( MUST BE ADDED IN HTML )
    jszip = new JSZip();
       // Add watermark
    jszip.comment = 'EDX\'s scratchdownload on GitHub.';
       // Use JQuery to send a GET request to get the project JSON
    $.get('https://cdn.projects.scratch.mit.edu/internalapi/project/' + projectId + '/get/', function (data) {
      logMessage('Loaded JSON'); // See function
      project = data; // Sets it to the JSON
      processSoundsAndCostumes(project); // See function - Proccess the main assets for the stage because of scratch's weird JSON ಠ‿ಠ
    // Process sprites
         if (project.hasOwnProperty('children')) { // If it has sprites - they put them as "children" in this case
        for (var child in project.children) { // For each sprite
          processSoundsAndCostumes(project.children[child]); // Download the asset
        }
      }
      console.log("done"); // Log
      logMessage('Found ' + totalAssets + ' assets'); // See function
      jszip.file('project.json', JSON.stringify(project)); // Write project JSON - Which has been modified from the original with asset ID's and that
      downloadCostume(); // Download assets needed - Download costume calls download sound
    }).fail(perror); // Call perror() on error
  }

// ASSETS

//Download costumes
  function downloadCostume() {
       
    if (costumesToDownload.length > 0) { // Check there are any remaining assets to download
      var current = costumesToDownload.pop();
      logMessage('Loading costume ' + current.costumeName + ' (' + completeAssets + ' of ' + totalAssets + ')');
         // Use JSZipUtils ( MUST BE INCLUDED IN HTML ) to grab the data stream
      JSZipUtils.getBinaryContent('https://cdn.assets.scratch.mit.edu/internalapi/asset/' + current.baseLayerMD5 + '/get/', function (err, data) {
        // Check for errors
           if (err) {
          error();
          return;
        }
           // Sort out the asset problem with an ID
        var ext = current.baseLayerMD5.match(/\.[a-zA-Z0-9]+/) [0]; // Replace the MD5 bit without the file extension
        jszip.file(current.baseLayerID + ext, data, { // Replace the ID from -1 to the current
          binary: true
        });
        completeAssets++; // Change the complete assets
        downloadCostume(); // Do it again
      });
    } else { // When all the costumes have been downloaded
      downloadSound(); // Download sounds
    }
  }
// Pretty much the same thing again.
  function downloadSound() {
    if (soundsToDownload.length > 0) {
      var current = soundsToDownload.pop();
      logMessage('Loading sound ' + current.soundName + ' (' + completeAssets + ' of ' + totalAssets + ')');
      JSZipUtils.getBinaryContent('https://cdn.assets.scratch.mit.edu/internalapi/asset/' + current.md5 + '/get/', function (err, data) {
        if (err) {
          perror();
          return;
        }
        var ext = current.md5.match(/\.[a-zA-Z0-9]+/) [0];
        jszip.file(current.soundID + ext, data, {
          binary: true
        });
        completeAssets++;
        downloadSound();
      });
    } else { // When that's done

 // Generate the SB2 file
        logMessage('Compiling SB2 file...');
        var content = jszip.generate({
          type: 'blob'
        });
        logMessage('Saving...');
         // Download it!
        saveAs(content, 'projectdownload.sb2');
        logMessage('Complete');
         //All done!
        psuccess();
   
    }
  }
// Process the asset ID's
  function processSoundsAndCostumes(node) {
    if (node.hasOwnProperty('costumes')) { // If it's a costume
      for (var i = 0; i < node.costumes.length; i++) {
        var current = node.costumes[i];
        current.baseLayerID = costumeId; // Set the costume ID incementaly
        costumeId++;
        totalAssets++;
        costumesToDownload.push(current); // Do this again
      }
    }
    if (node.hasOwnProperty('sounds')) { // If it's a sound, do pretty much the same thing.
      for (var i = 0; i < node.sounds.length; i++) {
        var current = node.sounds[i];
        current.soundID = soundId;
        soundId++;
        totalAssets++;
        soundsToDownload.push(current);
      }
    }
  }
// NATIVE FUNCTIONS ( In HTML )
// For implimentation, change these!
  function perror() {
    logMessage('Download error');
    $("#opense").fadeIn();
  }
  function psuccess() {

    $("#opense").fadeIn();
  }
  function logMessage(msg) {
    console.log(msg);
   document.getElementById("noti").innerText = msg;
  }
