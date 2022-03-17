
let k

let TABLE


let actionsDimensionsMatrix
let matrixCategories
let matrixCategoriesNums
let wordsSums, categoriesSums, maxCellTexts
let zoomx = zoomy = 1, x0 = y0 = 0
let textToColorDic
let inputX, inputY
let HEIGHT_FIELDS = 120
let MIN_SIZE_CLUSTER = 7
let NET_THRESHOLD_MATRIX = 0.24
let NET_THRESHOLD_NET = TABLE_URL==tableFileActionPoints?0.2:0.18
let SORTING_MODE = 1 //-1:no (as value come), 0:category size, 1:alphabetic, 2:original order
let SHOW_ONLY_INTERSECTION_SIZE = false
let DISAGGREGATE = true


let CHANGING_TEXT_WIDTH = false

init=function(){
	_.loadData(TABLE_URL, r=>{TABLE = r.result; processTable()}, "csv")
}

processTable=function(){
	
		k = new _.MetaCanvas({cycle:cycleForMatrix, resize})
		k.setBackgroundColor("white")

		buildMatrix(TABLE.get("Dimension"), TABLE.get("Region"))

		textToColorDic = getTextToColorDictionary("Dimension")

  resize()
}


/***interesting words

training resources



***/

cycleForMatrix=function(){

	let nWords = actionsDimensionsMatrix.length
	let ncategories = actionsDimensionsMatrix[0].length

	console.log(nWords, ncategories)

	let m = 40
	let dx = (k.W-2*m)
	let dy = (k.H-2*m)

	let x=m
	let y=m*2

	let w, h

	if(k.WHEEL_CHANGE!=0){
		let zoomChange = 1 + 0.3*k.WHEEL_CHANGE
		if(k.mX>2*m) zoomx *= zoomChange
		if(k.mY>2*m) zoomy *= zoomChange
		zoomx = Math.min(Math.max(zoomx, 1), 10)
		zoomy = Math.min(Math.max(zoomy, 1), 10)
		if(k.mX>2*m) x0 = (x0 - (k.mX-2*m) )*zoomChange + (k.mX-2*m)
		if(k.mY>2*m) y0 = (y0 - (k.mY-2*m) )*zoomChange + (k.mY-2*m)
	}

	if(k.MOUSE_PRESSED){
     x0+=k.DX_MOUSE_PRESSED
     y0+=k.DY_MOUSE_PRESSED
  }

  x0=Math.min(x0,0)
  y0=Math.min(y0,0)

	k.setText("black", 18, null, "right", "middle")
	y=2*m+y0
	x=m
	matrixCategories.forEach((cat,i)=>{
		h = dy*categoriesSums[i]*zoomy
		if((y+h*0.5)>2*m) k.fText(cat, x+m-6, y+h*0.5)
		y+=h
	})


	k.setText("black", 18, null, "left", "middle")
	x=2*m + x0
	y=m
	actionsDimensionsMatrix.forEach((wordL,i)=>{
		w = dx*wordsSums[i]*zoomx
		if(x+8>2*m) k.fTextRotated(wordL.name, x + 8, y+m-10, -Math.PI*0.15)
		x+=w
	})
	

	k.clipRect(2*m,2*m,k.W-2*m,k.H-2*m)
	x=2*m + x0
	actionsDimensionsMatrix.forEach((wordL,i)=>{
		y=2*m+y0
		w = dx*wordsSums[i]*zoomx
		wordL.forEach((texts,j)=>{
			//if(i==0) k.line(m*0.5,y,k.W-m*0.5,y)
			h = dy*categoriesSums[j]*zoomy
			if(actionsDimensionsMatrix[i][j].length==0) {
				y+=h
				return
			}
			drawTexts(actionsDimensionsMatrix[i][j], x, y, w, h)
			y+=h
		})
		//k.line(x, m*0.5, x, k.H-m*0.5)
		x+=w
	})

	k.restore()


	k.context.setLineDash([6, 8])
	k.stroke("black", 0.5)

	x=2*m + x0
	y=m
	actionsDimensionsMatrix.forEach((wordL,i)=>{
		y=2*m+y0
		w = dx*wordsSums[i]*zoomx
		wordL.forEach((texts,j)=>{
			if(i==0 && y>2*m-2) k.line(m*0.5,y,k.W-m*0.5,y)
				h = dy*categoriesSums[j]*zoomy
			y+=h
		})
		if(x>2*m-2) k.line(x, m*0.5, x, k.H-m*0.5)
		x+=w
	})
}

let y0mem = 0
drawTexts = function(texts, x, y, w, h){
	k.clipRect(x+2,y+2,w-4,h-8)
	let ht
	let yt = y+6
	let hTexts = 0
	let tetSize = 14*Math.sqrt( (zoomx+zoomy)*0.5 )
	let y0 = 0

	if(!SHOW_ONLY_INTERSECTION_SIZE){
		if(k.mX>x && k.mX<x+w && k.mY>y && k.mY<y+h){
			k.setText("black", tetSize)
			texts.forEach(text=>{
				ht = k.nLines(text, w-19)
				hTexts+=ht*tetSize+8
			})
			let deltaText = (hTexts-h)+h*0.25
			let posY = (k.mY-y)/h
			let y0Destiny = -deltaText*posY
			y0mem = Math.max(y0mem,-deltaText)
			y0mem = y0mem*0.9 + y0Destiny*0.1
			y0 = y0mem
		}

		yt = y+6+y0
		texts.forEach(text=>{
			ht = k.nLines(text, w-19)
			k.fill(textToColorDic[text])
			k.fRect(x+6,yt-2, w-11,ht*tetSize+4)
			k.setText("black", tetSize)
			k.fTextWidth(text, x+10,yt, w-19, tetSize)
			yt+=ht*tetSize+8
		})
	}

	if(SHOW_ONLY_INTERSECTION_SIZE){
		drawCircleNum(texts.length, x+w-19, y+19, 28)
	} else {
		drawCircleNum(texts.length, x+w-10, y+10, 11)
	}
	

	k.restore()
}

drawCircleNum = function(num, x, y, size){
	k.fill("rgba(0,0,0,"+(num/maxCellTexts)+")")
	k.fCircle(x,y,2+size/2)
	k.setText("white", size, null, "center", "middle")
	k.fText(num,x,y)
}


receiveDataFromView = function(ob){
	
}

////

createNote = function(txt, x, y){
	let newInput = new InputText(ob=>{})
	if(txt) newInput.setData(txt)
	newInput.textArea.placeholder="note"
	note_inputs.push(newInput)
	newInput.x = x
	newInput.y = y
}

////

enableFileDropping = function(element, callBack){
  cancel = function(e) {
    if (e.preventDefault) { e.preventDefault(); }
    return false;
  }

  element.addEventListener("dragover" , cancel );
  element.addEventListener("dragenter", cancel );
  element.addEventListener("drop", _dropIntercept, false );

  element = document
  element.addEventListener("dragover" , cancel );
  element.addEventListener("dragenter", cancel );
  element.addEventListener("drop", _dropIntercept, false );





  function _dropIntercept(ev) {
    ev.stopPropagation();
    ev.preventDefault();

    var files = ev.dataTransfer.files;

    console.log("files.length", files.length)

    console.log(ev)

    for(var i=0; i < files.length; i++) {
      var file = files[i];
      var ext = file.name.split('.').pop();
      var fileType = file.type;
      if(ext == 'txt') fileType = 'text/plain';
      if(ext == 'csv') fileType = 'text/csv';
      if(ext == 'json') fileType = 'application/json';
      if(fileType == "text/plain" || fileType == "text/csv" || fileType == "application/json"){
        var reader = new FileReader();
        // reader.readAsDataURL(file);
        reader.addEventListener('loadend', function(e, f) {
          //console.log(e.target.result)
          callBack(e.target.result)
        });
        reader.readAsText(file);
      }
    }
    var items = ev.dataTransfer.items;
    for(var i=0; i < items.length; i++) {
      var item = items[i];
      if(item.type == 'text/plain')
        item.getAsString(function(s){
          callBack(s)
        });
    }
  }
}

/////

resize = function(){
  		k?.setDimensions(0,0,window.innerWidth, window.innerHeight)
}

window.addEventListener("resize", resize)

///////////////////////////////////////////////////////////////

window.addEventListener("load", function() {
  init()
})


