var COLORS_IMAGE;
var SELECTED_DICTIONARY = {};
var addsWhileDrags;

var overRect = new _.Rec(0,0,0,0);

var recStart;//when pressing and dragging, the first rec to be pressed
var SELECTED_DICTIONARY_ON_MOUSE_DOWN;

draw = function(){
  if(TABLE==null || COLORS_IMAGE==null || COLORS_IMAGE.width==0) return;

  //IFRAME_IMAGES.setAttribute('style', 'position:absolute; top:0px; left:-2000px; width:100px; height:100px; display:inline');

  g.drawImage(COLORS_IMAGE,0,0);

  var prevOverRect = overRect;
  overRect = null;
  var x, y, h, over, freqTable, elements, count;
  var vN, xV;
  var dx = g.W/TABLE.length;
  var dy = g.H/MAX_ELEMENTS;

  var currentCol;

  for(var i=0; i<TABLE.length; i++){
    x = i*dx;
    if(g.mX<x || g.mX>x+dx) continue;

    currentCol = i;

    freqTable = FREQ_TABLE_List[i];
    elements = freqTable[0];//TABLE[i];
    count = freqTable[1];
    
    y=0;

    for(var j=0; j<elements.length; j++){
      h = count[j]*dy;

      over = g.mY>=y && g.mY<y + h;

      if(over){
        overRect = {x:x-1, y:y-1, w:dx+1, h:h+2, type:'categories', value:elements[j], frequency:count[j], i:i, j:j, id:i+"_"+j};
        if(freqTable[5] && freqTable[5][j]) overRect.img = freqTable[5][j];
      }

      y+=h;
    }
  }



  var changeInOverRect = overRect.x!=prevOverRect.x || overRect.y!=prevOverRect.y || overRect.width!=prevOverRect.width || overRect.height!=prevOverRect.height

  //mouse behavior
  if(g.MOUSE_DOWN){
    if(g.KEY_PRESSED=="Shift") unselectColumn(overRect.i);
    addsWhileDrags = !isSelected(overRect);
    recStar = overRect;
    SELECTED_DICTIONARY_ON_MOUSE_DOWN = _.cloneObject(SELECTED_DICTIONARY);
  } else if(g.MOUSE_PRESSED){
    if(addsWhileDrags){
      if(prevOverRect!=overRect){
        addSectionToSelection(SELECTED_DICTIONARY_ON_MOUSE_DOWN, recStar, overRect);
        changeInFilter();
      }
      // if(!isSelected(overRect)){
      //   selectValue(overRect);
      //   changeInFilter();
      // }
    } else {
      if(changeInOverRect){
        removeSectionToSelection(SELECTED_DICTIONARY_ON_MOUSE_DOWN, recStar, overRect);
        changeInFilter();
      }
      // if(isSelected(overRect)){
      //   unselectValue(overRect);
      //   changeInFilter();
      // }
    }
  }


  //draw numbers graph
  for(var i=0; i<TABLE.length; i++){
    x = i*dx;
    if(g.mX<x || g.mX>x+dx) continue;

    freqTable = FREQ_TABLE_List[i];
    elements = freqTable[0];//TABLE[i];
    if(elements.type!="nL") continue;

    count = freqTable[1];
    
    y=0;

    for(var j=0; j<elements.length; j++){
      h = count[j]*dy;
      
      if(j==0) console.log("-")
      g.stroke('black', over?3:2);
      vN = (freqTable[0][j]-freqTable.min)/freqTable.amp;
      xV = x+2+(dx-4)*vN;
      g.line(xV,y,xV,y+h);

      y+=h;
    }
  }



  //keys
  if(g.KEY_JUST_PRESSED){
    switch(g.KEY_JUST_PRESSED){
      case "Backspace":
        unselectColumn(currentCol);
        changeInFilter();
        break;
      case "-":
        inverseSelectionColumn(currentCol);
        changeInFilter();
        break;
      case "Escape":
        unExecuteFilters();
        unselectAll();
        changeInFilter();
        break;
      case "Enter":
        executeFilters();
        changeInFilter();
        break;
    }
  }

  //draw frame selected
  for(id in SELECTED_DICTIONARY){
    drawRectFilter(SELECTED_DICTIONARY[id]);
  }

  //draw over
  if(overRect) drawRectInfo(overRect);

  if(changeInOverRect) sendData({
    type:"over_cell",
    value:overRect
  })
}

drawRectFilter = function(rect){
  g.stroke('black', 3);
  if( isSelected(rect.i+"_"+(rect.j-1)) && isSelected(rect.i+"_"+(rect.j+1)) ){
    g.line(rect.x+1, rect.y+1, rect.x+1, rect.y+rect.h-1);
    g.line(rect.x+rect.w-1, rect.y+1, rect.x+rect.w-1, rect.y+rect.h-1);
  } else if(isSelected(rect.i+"_"+(rect.j-1))){
    g.sLines(
      rect.x+1, rect.y+1, 
      rect.x+1, rect.y+rect.h-1,
      rect.x+rect.w-1, rect.y+rect.h-1,
      rect.x+rect.w-1, rect.y+1
    );
  } else if(isSelected(rect.i+"_"+(rect.j+1))){
    g.sLines(
      rect.x+1, rect.y+1+rect.h-1, 
      rect.x+1, rect.y+1,
      rect.x+rect.w-1, rect.y+1,
      rect.x+rect.w-1, rect.y+rect.h-1
    );
  } else {
    g.sRect(rect.x+1, rect.y+1, rect.w-2, rect.h-2);
  }
}


drawRectInfo = function(overRect){
  g.stroke('black', 5);
  g.sRect(overRect.x-2, overRect.y-2, overRect.w+4, overRect.h+4);

  var onLeft = (overRect.x+overRect.w)>g.W*0.8;
  var x = onLeft?overRect.x-9:overRect.x+overRect.w+9;
  var y = Math.min(Math.max(g.mY, 64), g.H-25);
  var orientation = onLeft?'right':'left';

  var textList1 = (orientation=='right'?" ":"") + TABLE[overRect.i].name + (orientation=='left'?" ":"");
  var textList2 = "("+FREQ_TABLE_List[overRect.i][0].length+" diff.)";
  var text = overRect.value==null?null:(String(overRect.value).length>50?String(overRect.value).substr(0,50)+"…":String(overRect.value));
  var textFreq = overRect.frequency + " ("+(100*overRect.frequency/TABLE[overRect.i].length).toFixed(2)+"%)";

  var w;

  switch(overRect.type){
    case 'numbers':
    case 'categories':
      g.context.lineJoin = 'round';
      if(orientation=='right'){
        w = drawSuperText(textList1, 22, x, y-35, orientation, 'bottom');
        drawSuperText(textList2, 14, x - w, y-38, orientation, 'bottom');
      } else {
        w = drawSuperText(textList1, 22, x, y-35, orientation, 'bottom');
        drawSuperText(textList2, 14, x + w, y-38, orientation, 'bottom');
      }
      if(overRect.img){
        y+=80;
      } else {
        drawSuperText(text, 30, x, y-2, orientation, 'bottom', text==null?'italic':null);
      }
      drawSuperText(textFreq, 18, x, y+2, orientation, 'top');
      break;
  }

  if(overRect.img){
    //IFRAME_IMAGES.src = overRect.img;
    w = 100*overRect.img.width/overRect.img.height
    if(w>0) g.drawImage(overRect.img, x+(onLeft?-(w+2):0), y-110,w,100);
    
    //IFRAME_IMAGES.setAttribute('style', 'position:absolute; top:'+(y-110)+'px; left:'+(x+(onLeft?-(100+2):0))+'px; width:100px; height:100px; display:inline');
  }
}

drawSuperText = function(text, size, x, y, horizontal, vertical, style){
  g.setText('black', size, null, horizontal, vertical, style);
  g.stroke('rgba(255,255,255,0.3)', size/2);
  g.fsText(text, x, y);
  g.stroke('white', size/5);
  return g.fsTextW(text, x, y);
}



drawFirst = function(){
  console.log("g.W", g.W)
  g.fill('white');
  g.fRect(0,0,g.W,g.H);
  COLORS_IMAGE = null;
  drawColors();
  COLORS_IMAGE = g.captureCanvas();
}

drawColors = function(){
  var dx = g.W/TABLE.length;
  var dy = g.H/MAX_ELEMENTS;
  var y, h;

  for(var i=0; i<TABLE.length; i++){
    drawCategory(TABLE[i], FREQ_TABLE_List[i], i*dx, dx, dy); //ALL are categories for now
  }
}



drawCategory = function(list, freqTable, x, dx, dy){
  var y, h, w;
  var elements = freqTable[0];
  var count = freqTable[1];
  var colors = freqTable[3];
  var proportions = freqTable[4];

  dx+=1;
  y=0;

  for(var j=0; j<elements.length; j++){
    h = count[j]*dy;
    w = dx*proportions[j];
    if(freqTable[5] && freqTable[5][j]){
      //g.drawImage(freqTable[5][j], x+(dx-w)*0.5, y, w, Math.ceil(h))
      g.fill(colors[j]);
      g.fRect(x+(dx-w)*0.5, y, w, Math.ceil(h));
    } else {
      g.fill(colors[j]);
      g.fRect(x+(dx-w)*0.5, y, w, Math.ceil(h));
    }

    y+=h;
  }
}

//not used
drawNumbers = function(list, histogram, x, dx, dy){
  console.log("histogram.length", histogram.length)
  const cS = _.grayToOrange;//blueToRed;
  let over, overRect;
  let vN;
  let y
  g.stroke('black', 2);

  for(let j=0; j<histogram.length; j++){
    y = j*dy;
    vN = histogram[j]/histogram.max;
    g.fill(histogram[j]==0?'black':cS(vN));
    over = g.fRectM(x,y,dx,dy+0.5);
    if(over) overRect = {x:x-1, y:y-1, w:dx+1, h:dy+2, type:'numbers', value:histogram[j], min:(histogram.min + j*histogram.delta), max:(histogram.min + (j+1)*histogram.delta)};
    console.log(x+dx*vN,y)
    g.line(x+dx*vN,y,x+dx*vN,y+dy);
  }
  return overRect;
}