drawNode = function(node){
	let rec = new _.Rec(node.rectangle.x*kx + x0, node.rectangle.y*ky + y0, node.rectangle.width*kx, node.rectangle.height*ky)

	if(Math.min(rec.height, rec.width)<10 || rec.x>k.W || rec.y>k.H || rec.x+rec.width<0 || rec.y+rec.height<0) return

	k.fill(node.color)
	if(k.fRectM(Math.floor(rec.x)+1.5,Math.floor(rec.y)+1.5,Math.floor(rec.width)-3,Math.floor(rec.height)-3)){
		overNode = node
	}

	let textSize = 9 + 3*ky
	k.clipRect(rec.x, rec.y, rec.width-4, textSize*1.6)
	k.setText('black', textSize)
	k.fText(node.name, rec.x+2*kx, rec.y+2*ky)
	k.restore()
	
	node.to.forEach((son,i)=>{
		drawNode(son)
	})
}