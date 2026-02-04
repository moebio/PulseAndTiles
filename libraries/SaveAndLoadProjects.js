
//save

addSaveShortCut = function(getProjectFunction, defaultname = "project.json"){
    document.addEventListener('keydown', function(event) {
    // Check if the key pressed is 'S' and if either Command (on macOS) or Control (on Windows/Linux) is also pressed
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault(); // Prevent the default browser action (e.g., opening the save dialog)
      saveFile(getProjectFunction(), defaultname); // Call the save file function
    }
  });
}


saveFile = function(projectData, defaultname = "project.json"){
    const fileName = prompt("Enter the file name:", defaultname);
    if (fileName) {
        saveStringAsFile( (typeof projectData)=="string"?projectData:JSON.stringify(projectData, null, "\t"), fileName )
    }
}


//open

const fileInput = document.createElement('input');
let fileOpenSetupReady = false

function openFileDialog() {
    fileInput.click();
}

function prepareOpenFileFunction(callback) {
    if(fileOpenSetupReady) return
    console.log("prepareOpenFileFunction")
    // Create a hidden file input element
    
    fileInput.type = 'file';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // Handle file input change event
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                // Call the callback function with the file content
                callback(e.target.result);
            };
            reader.readAsText(file);
        }
    });

    // Function to trigger the file input
    

    // Optional: Clean up when not needed anymore
    function cleanup() {
        document.body.removeChild(fileInput);
    }

    fileOpenSetupReady = true

    return { openFileDialog, cleanup };
}

function addOpenShortcut(callback) {

    // Create a hidden file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // Handle file input change event
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                // Call the callback function with the file content
                callback(e.target.result);
            };
            reader.readAsText(file);
        }
    });

    // Handle keyboard shortcuts
    function handleKeyboardShortcut(event) {
        // Check if Command (Mac) or Ctrl (Windows/Linux) key and 'o' key are pressed
        if ((event.metaKey || event.ctrlKey) && (event.key === 'o' || event.key === 'O') ) {
            event.preventDefault(); // Prevent default browser behavior

            // To ensure the file input click is triggered correctly
            setTimeout(() => fileInput.click(), 0); // Delay to ensure the preventDefault() has taken effect
        }
    }

    window.addEventListener('keydown', handleKeyboardShortcut);

    // Optional: Clean up when not needed anymore
    return function cleanup() {
        window.removeEventListener('keydown', handleKeyboardShortcut);
        document.body.removeChild(fileInput);
    };
}

enableFileDropping = function(dropCallBack, dragOverCallBack, dragLeaveCallBack) {
  cancel = function(e) {
    if (e.preventDefault) { e.preventDefault(); }
    return false;
  };

  const elements = [window]

  elements.forEach(element => {
    element.addEventListener("dragover", function(e) {
      cancel(e);
      dragOverCallBack && dragOverCallBack(e); // Trigger dragOverCallBack if provided
    });
    element.addEventListener("dragenter", cancel);
    element.addEventListener("dragleave", function(e) {
      dragLeaveCallBack && dragLeaveCallBack(e); // Trigger dragLeaveCallBack if provided
    });
    element.addEventListener("drop", _dropIntercept, false);
  });

  function _dropIntercept(ev) {
    ev.stopPropagation();
    ev.preventDefault();

    var files = ev.dataTransfer.files;

    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      var ext = file.name.split('.').pop();
      var fileType = file.type;
      if (ext == 'txt') fileType = 'text/plain';
      if (ext == 'csv') fileType = 'text/csv';
      if (ext == 'json') fileType = 'application/json';
      if (fileType == "text/plain" || fileType == "text/csv" || fileType == "application/json") {
        var reader = new FileReader();
        reader.addEventListener('loadend', function(e, f) {
          dropCallBack(e.target.result)
        });
        reader.readAsText(file);
      }
    }
    var items = ev.dataTransfer.items;
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (item.type == 'text/plain')
        item.getAsString(function(s) {
          dropCallBack(s)
        });
    }
  }
}

