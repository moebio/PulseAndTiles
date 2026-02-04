const SCAN_DIR_PATH = "";
const CORS_PATH = "";// "https://cors-anywhere.herokuapp.com/";
const BASE_PATH = "";

const COLOR_BACK_NORMAL = "151520";
const COLOR_BACK_LOADING = "442233";

var LOADING = false;

//var matchEngine, viewEngine;

var TREE
var HTML
var DIV
var DATA_OBJECT
var MATCH_OBJECT

var CURRENT_PATH



init = function () {

  GET(SCAN_DIR_PATH, function (scan) {
    TREE = buildTree(scan, CORS_PATH, BASE_PATH); //without cors path, maybe it should be used for external files
    HTML = buildHtml(TREE);

    DIV = buildHtmlDIV(HTML, "datasets");
    DIV_VIEWS = buildHtmlDIV("…views…", "views");

    resizeWindow();


    var lastFile = localStorage.getItem('last_file');
    lastFile = (lastFile == null || lastFile == "null") ? "" : lastFile;

    GET(lastFile, dataLoaded);
  });

  window.addEventListener("resize", resizeWindow);
};

receiveData = function (dataObj) {
}

cycle = function () {
}

resizeWindow = function () {
  var sStyle = 'position: absolute; top: ' + 10 + 'px; left: ' + 10 + 'px; width: ' + (window.frameElement.clientWidth - 20) + 'px; height: ' + (window.frameElement.clientHeight - 30) + 'px; overflow-x: hidden; overflow-y: auto;';
  if (DIV && DIV.style.cssText != sStyle) DIV.setAttribute('style', sStyle);
}



/////

dataLoaded = function (data, url) {
  LOADING = false;

  var dataInfoObject = { content: data, path: url };

  document.body.style.backgroundColor = COLOR_BACK_NORMAL;

  DATA_OBJECT = dataInfoObject

  CURRENT_PATH = url;

  DIV.innerHTML = buildHtml(TREE)
  //DIV_VIEWS.innerHTML = buildSelectionViewsHtml(MATCH_OBJECT.candidates);

  localStorage.setItem('last_file', url)

  if (url.endsWith('.csv')) {
    data = _.CSVToTable(data, 2)
  }

  console.log("dataLoaded::::", url)

  sendData({
    type: "data",
    value: {
      data,
      url
    }
  })
}


clickLink = function (linkInfo) {
  if (linkInfo == "•data_channel") {
    // var data = localStorage.getItem("data_channel");
    // dataLoaded(data, "data_channel");
    //window.addEventListener('storage', onDataChannelUpdate);
  } else if (linkInfo.includes("$")) {//folder to open/close
    DIV.innerHTML = buildHtml(TREE, linkInfo);
  } else if (linkInfo[0] == "#") {//view selected

  } else {//dataset to load
    //window.removeEventListener('storage', onDataChannelUpdate);

    linkInfo = linkInfo.replace("•", "");

    LOADING = true;
    document.body.style.backgroundColor = COLOR_BACK_LOADING;
    var node = TREE.nodeFromPath[linkInfo];

    GET(linkInfo, dataLoaded, linkInfo == CURRENT_PATH);
  }
}


buildHtml = function (tree, folder_to_swing) {

  if (folder_to_swing && folder_to_swing.includes("$")) {
    folder_to_swing = folder_to_swing.split("$")[0];
    var nodeToSwing = tree.get(folder_to_swing);
    if (nodeToSwing) nodeToSwing.data.open = !nodeToSwing.data.open;
    setPathInMemory(nodeToSwing.data.path, nodeToSwing.data.open);
  }

  var html = "<fcWhite><ffArial><fs14>";

  var sps = function (n) {
    var txt = "";
    for (var i = 0; i < n; i++) {
      txt += "&nbsp;&nbsp;&nbsp;&nbsp;";
    }
    return txt;
  }

  var line = function (node, lvl) {
    var arrow;
    if (node.to.length == 0) {
      arrow = (CURRENT_PATH && node.data.path == CURRENT_PATH) ? " ←" : "";

      html += sps(lvl) + "<e•" + node.data.path + "*" + node.name + ">" + arrow + "<br>";
    } else {
      html += sps(lvl) + "<b><e" + node.id + "$" + Math.random() + "*" + (node.data.open ? "- " : "+ ") + node.name + "></b><br>";

      if (node.data.open) {
        for (var i = 0; i < node.to.length; i++) {
          line(node.to[i], lvl + 1);
        }
      }
    }
  }

  line(tree.nodes[0], 0);

  html += "</f></f></f>";
  html = _.expandFastHtml(html, function () { });

  return html;
}


buildHtmlDIV = function (html, id) {
  var main = document.getElementById('maindiv');
  var div = document.createElement('container');
  div.setAttribute('class', 'customScroll');
  div.isLichenScrollable = true;
  main.appendChild(div);

  div.innerHTML = html;
  div.id = id;

  return div;
}

buildTree = function (scan, cors, path_base) {
  var memory_open_folders = getPathsMemory();

  var superiorNodeName = "data";
  var identationCharacter = " ";
  var lines = scan.split("\n");


  var id, name, type, url, size;

  var tree = new _.Tr();

  tree.nodeFromPath = {};


  var nLines = lines.length;

  if (nLines === 0 || (nLines == 1 && (lines[0] == null || lines[0] === ""))) return null;


  var i;
  var j;

  var line, completeLine, parts, path;
  var lineLength;
  var name;
  var level;

  var node;
  var parent;
  var superiorNode;

  if (superiorNodeName !== "" && superiorNodeName != null) {
    superiorNode = new _.Nd(superiorNodeName, superiorNodeName);
    superiorNode.data = {
      size: 0,
      path: "",
      fileType: "dir"
    }

    tree.addNodeToTree(superiorNode, null);
  }

  for (var i = 0; i < nLines; i++) {
    completeLine = lines[i];
    if (completeLine.trim() == "" || !completeLine.includes(",")) continue;

    parts = completeLine.split(",");

    line = parts[0];
    if (line.trim() == "") continue;
    if (line.trim() == "Icon") continue;

    lineLength = line.length;

    for (j = 0; j < lineLength; j++) {
      if (line.charAt(j) != identationCharacter) {
        name = line.substr(j);
        break;
      }
    }

    path = null;
    if (name.includes("|")) {
      path = cors + name.split("|")[1];
      name = name.split("|")[0];
    }

    node = new _.Nd(line, name);
    node.data = {};
    node.data.path = path;

    tree.nodeFromPath[path] = node;

    node.data.size = Number(parts[1]);
    node.data.fileType = parts[2];

    if (j === 0) {
      if (superiorNode != null) {
        tree.addNodeToTree(node, superiorNode);
      } else {
        tree.addNodeToTree(node, null);
      }
    } else {
      level = j + 1 - Number(superiorNode == null);
      if (tree.getLevel(level - 1) != null && tree.getLevel(level - 1).length > 0) {
        parent = tree.getLevel(level - 1)[tree.getLevel(level - 1).length - 1];
      } else {
        parent = null;
      }

      tree.addNodeToTree(node, parent);
    }
  }

  tree.assignDescentWeightsToNodes();

  tree.nodes[0].data.open = memory_open_folders[tree.nodes[0].data.path];

  for (var i = 0; i < tree.nodes.length; i++) {
    node = tree.nodes[i];
    //console.log(node.name);

    if (node.data.path) {
      continue;
    }

    txt = getPathFromNode(node);

    node.data.path = path_base + txt;
    tree.nodeFromPath[node.data.path] = node;

    if (node.to.length > 0) {
      node.data.open = memory_open_folders[node.data.path];
    }
  }


  //adds data_channel
  node = new _.Nd("data_channel", "data_channel");
  node.data = {
    path: "data_channel",
    size: 0,
    fileType: "data_channel"
  }
  tree.addNodeToTree(node, superiorNode);

  return tree;
}

getPathFromNode = function (node) {
  var txt = node.name;
  while (node.parent && node.parent.parent) {
    txt = node.parent.name + "/" + txt;
    node = node.parent;
  }
  return txt;
}


getPathsMemory = function () {
  var memory_open_folders = localStorage.getItem('open_folders');

  if (memory_open_folders == null || memory_open_folders == "null") {
    memory_open_folders = "{}";
    localStorage.setItem('open_folders', memory_open_folders);
  }
  return JSON.parse(memory_open_folders);
}

setPathInMemory = function (path, open) {
  memory_open_folders = getPathsMemory();
  var change = memory_open_folders[path] != open;

  if (change) {
    memory_open_folders[path] = open;
    localStorage.setItem('open_folders', JSON.stringify(memory_open_folders));
  }
}



GET = function (url, callFunction, noCache) {

  function reqListener() {
    var rUrl = this.responseURL;
    rUrl = noCache ? rUrl.split("?")[0] : rUrl;
    callFunction(this.responseText, rUrl);
  }

  var oReq = new XMLHttpRequest();
  oReq.addEventListener("load", reqListener);
  oReq.open("GET", url + (noCache ? "?rnd=" + Math.floor(10000 * Math.random()) : ""));
  oReq.send();
}

window.addEventListener("load", function () {
  init();
})