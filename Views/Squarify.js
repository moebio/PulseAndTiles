Squarify.prototype = {};
Squarify.prototype.constructor = Squarify;

function Squarify(mc, listOrTable) {
	this.name = "Squarify";

	this.mc = mc;

  	this.freqTable;
  	this.recList;

  	this.showValues = true;

  	this.setData(listOrTable);
}

Squarify.prototype.setData = function(listOrTable){
	if(this.listOrTable != listOrTable && listOrTable){
		this.listOrTable = listOrTable;
		this.processData();
	}
}

//?
Squarify.prototype.getData = function(){

}

//should be a listener
Squarify.prototype.sendData = function(){
	{
		over
		lastOver
		selected
		lastSelected
		selectedIndexes
	}
}

Squarify.prototype.setCallBack = function(){

}
//


Squarify.prototype.draw = function(){
	if(this.mc==null || this.freqTable==null) return;
	var recs = _.packingRectangles(this.freqTable[2], 0, new _.Rec(0,0,this.mc.W,this.mc.H));
	
	this.mc.stroke('black', 1);
	
	recs.forEach((r,i)=>this._drawRect(this.mc, r, this.freqTable[0][i], this.freqTable[1][i]));
}

Squarify.prototype._drawRect = function(mc, r, label, value){
	mc.sRect(r.x,r.y,r.width,r.height);
	mc.clipRect(r);

	mc.setText('black', 14, null, 'center', 'middle');
	mc.fText(label, r.x+r.width*0.5,r.y+r.height*0.5);

	if(this.showValues){
		mc.setText('black', 12, null, 'center', 'middle');
		mc.fText(value, r.x+r.width*0.5,r.y+r.height*0.5+11);
	}

	mc.restore();
}

//setWindow? setArea?
Squarify.prototype.setRectangle = function(rec){
	//extended method
	//Squarify inherits from Visual
}

///////


Squarify.prototype.processData = function(){
	let sl = this.listOrTable[0]
	let nl = this.listOrTable[1]
	if(this.listOrTable["isTable"] && sl.type=="sL" && nl.type=="nL"){
		this.freqTable = new _.T();
		this.freqTable[0] = sl;
		this.freqTable[1] = nl;
		this.freqTable[2] = _.normalizeToSum(nl,1)
		this.freqTable[3] = _.stringsToColors(sl)
	} else if(this.listOrTable["isList"]){
		this.freqTable = this.listOrTable.getFrequenciesTable(true, true, true)
	}
}

Squarify.prototype.condition = function(ob){
	//ob is:
	//L
	//T with L and nL
}

Squarify.prototype.setConfiguration = function(conf_object){
}

Squarify.prototype.getConfigurationDefault = function(META){
}

