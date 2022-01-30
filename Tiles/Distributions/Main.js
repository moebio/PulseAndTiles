var g;
var ORIGINAL_TABLE;
var TABLE;
var FREQ_TABLE_List;
var HISTOGRAMS;
var MAX_ELEMENTS;
var GRAY_GROUP_VALUES = 'rgb(220,220,220)';
var FILTERED_TABLE;

var IFRAME_IMAGES;


var SAMPLE_SIZE = 3000;
var SAMPLE_PROPORTION;

var N = 50; //num bins histograms

var dataFrom_data_channel



//////data////////

receiveData = function(dataObj){
  switch(dataObj.type){
    case "data":
      setData(dataObj.value)
      break
    case "configuration":
      setConfiguration(dataObj.value)
      break
  }
}

setData = function(table){
  TABLE = _.getRandomRows(table, SAMPLE_SIZE)
  ORIGINAL_TABLE = TABLE
  SAMPLE_PROPORTION = SAMPLE_SIZE/TABLE[0].length

  preprocessTable();
  drawFirst();
}

setConfiguration = function(confObject){

}

//to be overriden by however loads the module
sendData = function(){
};

//////----////////



init=function(){
  
  g = new _.MetaCanvas({
    cycle: cycle,
    resize: resizeWindow
  });

  g.stop();
  g.cycleOnMouseMovement(3000);

  //drawFirst();
  //setTimeout(drawFirst, 200);

	draw();

  // testing loading images
  // IFRAME_IMAGES = document.createElement('iframe');
  // IFRAME_IMAGES.src = "https://moebio.protozoo.com/TreeNavigation_thumb.png";
  // var main = document.getElementById('maindiv');
  // main.appendChild(IFRAME_IMAGES);

  // IFRAME_IMAGES.setAttribute('style', 'position:absolute; top:20px; left:-20px; width:0px; height:0px; display:inline');
};

cycle=function(){
	draw();
};



resizeWindow = function(){
  drawFirst();
}


window.addEventListener("load", function() {  
  init();
});