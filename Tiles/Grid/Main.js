let hot
let TABLE

let selectedValue
let filteredTABLE
let currenTable

//https://github.com/handsontable/handsontable?tab=readme-ov-file

init=function(){
	
}

receiveData = function(dataObj){
  switch(dataObj.type){
    case "data":
    	buildTable(dataObj.value)
      break
    case "configuration":
      setConfiguration(dataObj.value)
      break
  }
}

setConfiguration = function(conf){

}

buildTable = function(table){
	TABLE = currenTable = table
	const data = buildDataFromTable(table)
	let colors_dictionaries = buildColorsDictionaries(table)

	let cellColor = function(col, row, value){
		return colors_dictionaries[col][value]
	}

	const container = document.querySelector('#example');

	hot = new Handsontable(container, {
	  data,
	  columnSorting:true,
	  rowHeaders: true,
	  colHeaders: table.getNames(),
	  height: 100,
	  cells: function (row, col, prop) {
	    var cellProperties = {
	    	readOnly:true
	    };
	    cellProperties.renderer = function (instance, td, row, col, prop, value, cellProperties) {
	      td.style.fontSize = '11px';  // set the size as per your requirement
	      td.innerHTML = value;

	      td.style.backgroundColor = cellColor(col, row, value);
	    };
	    return cellProperties;
	  },
	  afterOnCellMouseDown: function(event, coords, TD) {
        clickOnCell(coords.col, coords.row)
    },
	  licenseKey: 'non-commercial-and-evaluation' // for non-commercial use only
	})

	resize()
}



buildDataFromTable = function(table){
	const data = []

	table[0].forEach((val, i)=>{
		const row = []
		table.forEach((col,j)=>{
			val = table[j][i]
			if(typeof val=="string" && val.length>150) val = val.substr(0,139)+"…"
			row.push(val)
		})
		data.push(row)
	})

	return data
}



clickOnCell = function(nCol, nRow){
	if(nRow==-1 && nCol>=0) return

	const column = currenTable[nCol]

	if( (nCol==-1 && nRow==-1) || column[nRow]==selectedValue){
		filteredTABLE = TABLE
		selectedValue = null
	} else {
		selectedValue = column[nRow]
		filteredTABLE = _.filterTable(currenTable, "==", selectedValue, column)
	}

	if(currenTable == filteredTABLE) return

	currenTable = filteredTABLE

	const data = buildDataFromTable(currenTable)

	hot.loadData(data)

	if(nCol==-1 || nRow==-1) hot.deselectCell()
}


buildColorsDictionaries = function(table){
	let colors_dictionaries = []


	console.log(table)

	table.forEach(col=>{
		
		let colorDicitionary = {}
		colors_dictionaries.push(colorDicitionary)

		let colorList
		switch(col.type){
			case "nL":
				break
			case "L":
			case "sL":
				colorList = _.createCategoricalColorListForList(col)[0].value
				break
		}
		
		colorList = (colorList||col.toColorList(false, _.blueToRed))
		console.log(colorList)
		colorList = colorList.getInterpolated("white", col.type=="nL"?0.7:0.9)

		col.forEach((val,i)=>{
			if(val==null || val=="") colorList[i] = "white"
			if(typeof val=="string" && val.length>150) val = val.substr(0,139)+"…"
			colorDicitionary[val] = colorList[i]
		})
		
	})

	return colors_dictionaries
}

cycle=function(){
	k.stroke('red', 2)
	k.line(k.mX,k.mY,Math.random()*k.W,Math.random()*k.H)
}

/////

resize = function(){
	hot.updateSettings({
	  height: window.innerHeight
	});
}


///////////////////////////////////////////////////////////////

window.addEventListener("load", function() {
	init()
})
window.addEventListener("resize", function() {
	resize()
})

window.addEventListener("mousedown", function() {
	
})

window.parent.addEventListener("mousedown", function() {
	hot.deselectCell()
})
