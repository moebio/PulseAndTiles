/////////// selection functions

toggleValueSelection = function(rectObjectOrId){
  if(isSelected(rectObjectOrId)){
    unselectValue(rectObjectOrId);
  } else {
    selectValue(rectObjectOrId);
  }
}

isSelected = function(rectObjectOrId){
  var id = typeof(rectObjectOrId)=="string"?rectObjectOrId:rectObjectOrId.id;
  return SELECTED_DICTIONARY[id]!=null;
}

selectValue = function(rectObject){
  SELECTED_DICTIONARY[rectObject.id] = rectObject;
};

unselectValue  = function(rectObjectOrId){
  var id = typeof(rectObjectOrId)=="string"?rectObjectOrId:rectObjectOrId.id;
  SELECTED_DICTIONARY[id] = null;
  delete SELECTED_DICTIONARY[id];
};

unselectColumn = function(i){
  for(id in SELECTED_DICTIONARY){
    if(SELECTED_DICTIONARY[id].i==i){
      unselectValue(id);
    }
  }
}

addSectionToSelection = function(SELECTED_DICTIONARY_ON_MOUSE_DOWN, recStart, overRect){
  if(recStart.i != overRect.i) return SELECTED_DICTIONARY_ON_MOUSE_DOWN;

  var j0 = Math.min(recStart.j, overRect.j);
  var j1 = Math.max(recStart.j, overRect.j);
  SELECTED_DICTIONARY = _.cloneObject(SELECTED_DICTIONARY_ON_MOUSE_DOWN);

  var freqTable = FREQ_TABLE_List[recStart.i];
  var elements = freqTable[0];//TABLE[i];
  var count = freqTable[1];

  var dy = g.H/MAX_ELEMENTS;
  var y = Math.min(recStart.y, overRect.y);
  
  var id, rec;

  for(var j=j0; j<=j1; j++){
    h = count[j]*dy;
    id = recStart.i+"_"+j;
    rec = {x:recStart.x, y:y-1, w:recStart.w, h:h+2, type:'categories', value:elements[j], frequency:count[j], i:recStart.i, j:j, id:id};
    SELECTED_DICTIONARY[id] = rec;
    y+=h;
  }
}
removeSectionToSelection = function(SELECTED_DICTIONARY_ON_MOUSE_DOWN, recStart, overRect){
  if(recStart.i != overRect.i) return SELECTED_DICTIONARY_ON_MOUSE_DOWN;

  var j0 = Math.min(recStart.j, overRect.j);
  var j1 = Math.max(recStart.j, overRect.j);
  SELECTED_DICTIONARY = _.cloneObject(SELECTED_DICTIONARY_ON_MOUSE_DOWN);

  var id, rec;

  for(var j=j0; j<=j1; j++){
    id = recStart.i+"_"+j;
    unselectValue(id);
  }
}

unselectAll = function(){
  SELECTED_DICTIONARY = {};
}

inverseSelectionColumn = function(i){
  var freqTable = FREQ_TABLE_List[i];
  var elements = freqTable[0];//TABLE[i];
  var count = freqTable[1];
  var id, overRect;
  var dx = g.W/TABLE.length;
  var dy = g.H/MAX_ELEMENTS;
  var x, y=0;

  for(var j=0; j<elements.length; j++){
    h = count[j]*dy;
    id = i+"_"+j;
    x = i*dx;

    if(isSelected(id)){
      unselectValue(id);
    } else {
      overRect = {x:x-1, y:y-1, w:dx+1, h:h+2, type:'categories', value:elements[j], frequency:count[j], i:i, j:j, id:i+"_"+j};
      selectValue(overRect);
    }

    y+=h;
  }
}

////////////


executeFilters = function(){
  TABLE = FILTERED_TABLE;
  unselectAll();
  preprocessTable();
  drawFirst();
}

unExecuteFilters = function(){
  TABLE = ORIGINAL_TABLE;
  preprocessTable();
  drawFirst();
}

preprocessTable = function(){
  FREQ_TABLE_List = new _.T();
  HISTOGRAMS = new _.T();
  MAX_ELEMENTS = 0;
  var freqTable;

  for(var i=0; i<TABLE.length; i++){
    freqTable = TABLE[i].getFrequenciesTable(true, true, TABLE[i].type!="nL");

    if(TABLE[i].type=="nL"){
      freqTable = freqTable.sortRowsByList(freqTable[0], true);

      var nl = freqTable[0].getNormalized();
      freqTable[3] = nl.toColorList(false, _.blueToRed).getInterpolated('white',0.5);

      freqTable.min = TABLE[i].getMin();
      freqTable.max = TABLE[i].getMax();
      freqTable.amp = freqTable.max - freqTable.min;

    } else {
      //black in nulls
      for(var j=0; j<freqTable[0].length; j++){
        freqTable[3][j] = freqTable[0][j]==null?'black':freqTable[3][j];
        //console.log(freqTable[0][j]);
        
        if(typeof(freqTable[0][j])=='string' && (freqTable[0][j].substr(-4)==".png" || freqTable[0][j].substr(-4)==".jpg" || freqTable[0][j].substr(-5)==".jpeg")){
          if(freqTable[5]==null) freqTable[5] = new _.L();
          var newImg = new Image;
          newImg.crossOrigin = "Anonymous";
          //newImg.src = "https://cors-anywhere.herokuapp.com/"+freqTable[0][j];
          //newImg.src = "https://moebio.protozoo.com/data/TreeNavigation_thumb.png";//freqTable[0][j];
          newImg.src = "http://moebio.com/clients/Idartes/Colmenas/imagenes/Obras/"+freqTable[0][j]
          freqTable[5][j] = newImg;
        }
        
      }
    }

    //for filtering proportions, starts with all values 1
    freqTable[4] = _.createListWithSameElement(freqTable[0].length, 1);

    FREQ_TABLE_List[i] = freqTable;

    MAX_ELEMENTS = Math.max(TABLE[i].length, MAX_ELEMENTS);
  }
}

changeInFilter = function(){
  newProportions();
  drawFirst();
  if(!dataFrom_data_channel) localStorage.setItem('data_channel', _.TableToCSV(FILTERED_TABLE, ",", true));
};

newProportions = function(){
  FILTERED_TABLE = TABLE;
  var filter, list, value, indexes;

  var filters = new _.L();

  for(id in SELECTED_DICTIONARY){
    if(filters[SELECTED_DICTIONARY[id].i]==null){
      filters[SELECTED_DICTIONARY[id].i]=[SELECTED_DICTIONARY[id]];
    } else {
      filters[SELECTED_DICTIONARY[id].i].push(SELECTED_DICTIONARY[id]);
    } 
  }

  for(var i=0; i<filters.length; i++){
    if(filters[i]==null) continue;
    filter = filters[i][0];
    list = FILTERED_TABLE[filter.i];

    if(filters[i].length==1){
      value = filter.value;
      FILTERED_TABLE = _.filterTable(FILTERED_TABLE, "=", value, list);
    } else {
      //values = new _.L();
      indexes = new _.nL();

      for(var j=0; j<filters[i].length; j++){
        filter = filters[i][j];
        value = filter.value;
        indexes = indexes.concat(list.indexesOf(value));
        //values.push(value);
      }

      FILTERED_TABLE = FILTERED_TABLE.getRows(indexes);
    }
  }


  var freqTable, newFreqs, proportions, index;
  for(var i=0; i<TABLE.length; i++){
    freqTable = FREQ_TABLE_List[i];
    proportions = freqTable[4];
    newFreqs = FILTERED_TABLE[i].getFrequenciesTable(true, false, false);

    for(var j=0; j<proportions.length; j++){
      index= newFreqs[0].indexOf(freqTable[0][j]);
      if(index<0){
        proportions[j] = 0;
      } else {
        proportions[j] = newFreqs[1][index]/freqTable[1][j];
      }
    }
  }

}