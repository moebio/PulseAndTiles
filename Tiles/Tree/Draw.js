let DISTORTION__POWER = 7
let MINIMUM_HEIGHT = 0//5


drawNode = function(node){
	let rec = new _.Rec(node.rectangle.x*kx + x0, node.rectangle.y*ky + y0, node.rectangle.width*kx, node.rectangle.height*ky)

	if(Math.min(rec.height, rec.width)<10 || rec.x>k.W || rec.y>k.H || rec.x+rec.width<0 || rec.y+rec.height<0) return

	k.fill(node.color||"rgba(255,255,255,0.2)")
	k.stroke("black", 0.3)

	const isOver = k.fsRectM(Math.floor(rec.x)+1.5,Math.floor(rec.y)+1.5,Math.floor(rec.width)-3,Math.floor(rec.height)-3)
	
	if(isOver){
		overNode = node
		k.stroke("black", 1)
		k.sRect(Math.floor(rec.x)+1.5,Math.floor(rec.y)+1.5,Math.floor(rec.width)-3,Math.floor(rec.height)-3)
	}

	let textSize = node.to.length>0?rec.height*TEXT_AREA_PROPORTION*0.85:Math.sqrt(rec.width*rec.height)*TEXT_AREA_PROPORTION*0.9

	if(textSize<2) return

	
	if(textSize>6){
		k.setText('black', textSize)
		if(node.to.length>0){
			let w = rec.width-4
			k.clipRect(rec.x, rec.y, w, textSize*1.6)
			let wt = k.getTextW(node.name)
			if(wt>w && wt<1.5*w) k.setText('black', textSize*(w-3)/wt)
			k.fText(node.name, rec.x+rec.width*0.005+2, rec.y+textSize*0.05)
			k.restore()
			
		} else {
			k.clipRect(rec.x, rec.y, rec.width-4, rec.height-8)
			k.fTextWidth(node.name, rec.x+rec.width*0.005+4, rec.y+textSize*0.05+4, Math.floor(rec.width*0.99)-8, textSize)
			k.restore()
		}
	}
	
	node.to.forEach(drawNode)
}


let nodes_color="rgba(255,200,100,0.4)"
let text_color="rgb(0,0,0)"

pX = function(x,x0,w,mx,power=DISTORTION__POWER){
    var k = (x-x0)/(mx-x0);

    if(k<1){
      return Math.pow(k,power)*(mx-x0)+x0;
    }
  
    k = (w-(x-x0))/(w-(mx-x0));
    return w - Math.pow(k,power)*(w-(mx-x0))+x0;
}

let externalOverNode

setOverNode = function(node){
	externalOverNode = overNode = node
}

drawNodeNavigation = function(node, y0, h){
	let x = x0+node.level*dx
    let x1 = x+dx
    
    x = pX(x,x0,k.W,k.mX)
    x1 = pX(x1,x0,k.W,k.mX)

    const w = x1 - x

    var over = mouse_in_tile?(k.mY>y0-1 && k.mY<y0+h+2 && k.mX>x && k.mX<x+w):externalOverNode==node

    if(h<MINIMUM_HEIGHT){
		node.fW = 0.9*node.fW + 0.1*((over?7:1)*(node.descentWeight+5))
		let _isOverMeOrSOn = function(nd){
			if(nd==externalOverNode) return true
			let overSon = false
			nd.to.forEach(son=>{
				if(_isOverMeOrSOn(son)){
					overSon = true
				}
			})
			return overSon
		}
		return _isOverMeOrSOn(node)
	}
	//let rec = node.rectangle// new _.Rec(node.rectangle.x*kx + x0, node.rectangle.y*ky + y0, node.rectangle.width*kx, node.rectangle.height*ky)
	
    //let rec = new _.Rec(x, y0, w, h)

    //k.setText(text_color, 12, null, null, "middle")
    k.context.font = "12px "+this.fontName
    let wt = k.getTextW(node.name)
	let textSize =  Math.min(12*(w-4)/wt, h-2)



	const overThisNode = mouse_in_tile?k.mX>=x && k.mX<=x1 && k.mY>=y0 && k.mY<=y0+h:externalOverNode==node

	if(w>3 && h>3){
		k.fill(node.color||nodes_color)
		k.fRect(x+1,y0+1,w-2,h-2)
		
		if(overThisNode){
			overNode = node
			k.stroke(text_color, 1)
			k.sRect(Math.floor(x),Math.floor(y0),Math.ceil(w),Math.ceil(h))
		}

		if(textSize>5){
			k.setText(text_color, textSize, null, null, "middle")
			k.context.font = textSize+"px "+this.fontName
			k.clipRect(x, y0, w, h)
			k.fText(node.name, x+w*0.005+2, y0+h*0.5)
			k.restore()
		}
	}

	var tW = 0
	var y0_son = y0
	var h_son

    node.to.forEach(son=>tW+=son.fW)

    var expandsSomSon = false

	node.to.forEach((son,i)=>{
		h_son = h*son.fW/tW;
		expandsSomSon = drawNodeNavigation(son, y0_son, h_son)||expandsSomSon
		y0_son+=h_son;
	})

	const expands = overThisNode || expandsSomSon
	node.fW = 0.9*node.fW + 0.1*(((overThisNode || expandsSomSon)?7:1)*(node.descentWeight+5))

	return expands
}