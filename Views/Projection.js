Projection.prototype = {};
Projection.prototype.constructor = Projection;


//data:
//coordinates
//labels
//weights
//colors


//public params:
//min size
//max size
//frame
//
//drawElement function
//space transformation


//config:
//draw element mode (text, circle with text…)
//back color
//grid, points…
//axis
//fish-eye


function Projection(data, frame) {
	
  	this.xL;
  	this.yL;
  	this.labels;

  	if(data) this.setData(data, frame);
}


Projection.prototype.setData = function(data, frame){
	if(data==null || !data.isTable || data.length<=1) return;

	if(data[0].type=="nL" && data[1].type=="nL"){
		this.x = data[0];
		this.y = data[1];
	}

	if(data[1]) this.label = data[1];
	this.processData();
}


Projection.prototype.draw = function(mc){
	if(mc==null || this.net==null) return;

	var dx = mc.cW/(this.net.nodeList.length+1);

	mc.setText('black', 10, null, 'center');
	this.net.nodeList.forEach((n,i)=>{
		mc.fText(n.name, dx + i*dx, mc.cH*0.8 - 12 - mc.cH*0.6*(1+Math.cos(i)));
		mc.fCircle(dx + i*dx, mc.cH*0.8 - 0 - mc.cH*0.6*(1+Math.cos(i)), 3);
		//mc.fCircle(dx + i*dx, mc.cH*0.8, 3);
	})
}

///////

Projection.prototype.processData = function(){
}

Projection.prototype.condition = function(ob){
	//ob is:
	//T
	//…
}