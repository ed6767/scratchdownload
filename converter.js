     var jszip = null;
  var project = null;
  var id = null;
  var soundId = 0;
  var costumeId = 0;
  var soundsToDownload = [
  ];
  var costumesToDownload = [
  ];
  var totalAssets = 0;
  var completeAssets = 0;
  function startDownload(projectId) {
    logMessage('Downloading project: ' + projectId);
    soundId = 0;
    costumeId = 0;
    totalAssets = 0;
    completeAssets = 0;
    soundsToDownload = [
    ];
    costumesToDownload = [
    ];
    id = projectId;
    jszip = new JSZip();
    jszip.comment = 'EDX\'s scratchdownload on GitHub.';
    $.get('https://cdn.projects.scratch.mit.edu/internalapi/project/' + projectId + '/get/', function (data) {
      logMessage('Loaded JSON');
      project = data;
      processSoundsAndCostumes(project);
      if (project.hasOwnProperty('children')) {
        for (var child in project.children) {
          processSoundsAndCostumes(project.children[child]);
        }
      }
      console.log("done");
      logMessage('Found ' + totalAssets + ' assets');
      jszip.file('project.json', JSON.stringify(project));
      downloadCostume();
    }).fail(perror);
  }
  function downloadCostume() {
    if (costumesToDownload.length > 0) {
      var current = costumesToDownload.pop();
      logMessage('Loading costume ' + current.costumeName + ' (' + completeAssets + ' of ' + totalAssets + ')');
      JSZipUtils.getBinaryContent('https://cdn.assets.scratch.mit.edu/internalapi/asset/' + current.baseLayerMD5 + '/get/', function (err, data) {
        if (err) {
          error();
          return;
        }
        var ext = current.baseLayerMD5.match(/\.[a-zA-Z0-9]+/) [0];
        jszip.file(current.baseLayerID + ext, data, {
          binary: true
        });
        completeAssets++;
        downloadCostume();
      });
    } else {
      downloadSound();
    }
  }
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
    } else {
      logMessage('Loading project title...');
      $.get('https://scratch.mit.edu/api/v1/project/' + id + '/?format=json', function (data) {
        logMessage('Generating ZIP...');
        var content = jszip.generate({
          type: 'blob'
        });
        console.log(content);
        logMessage('Saving...');
        try {
          saveAs(content, data.title + '.sb2');
        } catch (e) {
          saveAs(content, 'project.sb2');
        }
        logMessage('Complete');
        psuccess();
      }).fail(function () {
        logMessage('Failed to load project title');
        logMessage('Generating ZIP...');
        var content = jszip.generate({
          type: 'blob'
        });
        logMessage('Saving...');
        saveAs(content, 'projectdownload.sb2');
        logMessage('Complete');
        psuccess();
      });
    }
  }
  function processSoundsAndCostumes(node) {
    if (node.hasOwnProperty('costumes')) {
      for (var i = 0; i < node.costumes.length; i++) {
        var current = node.costumes[i];
        current.baseLayerID = costumeId;
        costumeId++;
        totalAssets++;
        costumesToDownload.push(current);
      }
    }
    if (node.hasOwnProperty('sounds')) {
      for (var i = 0; i < node.sounds.length; i++) {
        var current = node.sounds[i];
        current.soundID = soundId;
        soundId++;
        totalAssets++;
        soundsToDownload.push(current);
      }
    }
  }
  function perror() {
    logMessage('Download error');
    $("#opense").fadeIn();
  }
  function psuccess() {
    // yay, done!
    $("#opense").fadeIn();
  }
  function logMessage(msg) {
    console.log(msg);
   document.getElementById("noti").innerText = msg;
  }
