drawNode = function(node){
	let rec = new _.Rec(node.rectangle.x*kx + x0, node.rectangle.y*ky + y0, node.rectangle.width*kx, node.rectangle.height*ky)

	if(Math.min(rec.height, rec.width)<10 || rec.x>k.W || rec.y>k.H || rec.x+rec.width<0 || rec.y+rec.height<0) return

	k.fill(node.color||"rgba(255,255,255,0.2)")
	k.stroke("black", 0.3)
	if(k.fsRectM(Math.floor(rec.x)+1.5,Math.floor(rec.y)+1.5,Math.floor(rec.width)-3,Math.floor(rec.height)-3)){
		overNode = node
		k.stroke("black", 1)
		k.sRect(Math.floor(rec.x)+1.5,Math.floor(rec.y)+1.5,Math.floor(rec.width)-3,Math.floor(rec.height)-3)
	}

	let textSize = node.to.length>0?rec.height*TEXT_AREA_PROPORTION*0.85:Math.sqrt(rec.width*rec.height)*TEXT_AREA_PROPORTION*0.9

	if(textSize<6) return

	//
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
	
	node.to.forEach((son,i)=>{
		drawNode(son)
	})
}