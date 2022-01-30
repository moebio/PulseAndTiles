draw = function(){
	let prevOverIndex = overIndex
	overIndex = -1

	selecting = k.MOUSE_PRESSED && x0Selection

	if(selecting) indexesSelected = new _.nL()

	switch(configuration.mode){
	    case 0:
	      drawStripes()
	      break
	    case 1:
	      drawCircles()
	      break
	}

	if(overIndex!=prevOverIndex && !x0Selection) sendData({
		type:'over',
		value:overIndex==-1?null:overIndex
	})

	selectionInteraction()
	drawSelection()
}

selectionInteraction = function(){
	if(k.MOUSE_DOWN && k.mX>configuration.margin && k.mX<k.W-configuration.margin){
		x0Selection = k.mX
		x1Selection = x0Selection
	}
	if(selecting){
		x1Selection = Math.min(Math.max(k.mX, configuration.margin), k.W-configuration.margin)
		minSelection = Math.min(x0Selection, x1Selection)
		maxSelection = Math.max(x0Selection, x1Selection)
		changeSelection()
	}

	if(k.MOUSE_UP_FAST){
		x0Selection = x1Selection = 0
		indexesSelected = null
		changeSelection()
	}
}

changeSelection = function(){
	sendData({
		type:'selected',
		value:indexesSelected
	})
}

drawSelection = function(){
	if(!x0Selection) return

	k.fill("rgba(0,0,0,0.3)")
	k.fRect(0,0,minSelection,k.H)
	k.fRect(maxSelection,0,k.W-maxSelection,k.H)
}

drawStripes = function(){
	let m = configuration.margin
	let dx = k.W-m*2
	
	let dMin = 9999
	let d, xOver
	valuesN.forEach((v,i)=>{
		let x = m+v*dx
		k.stroke(colors?colors[i]:"black", 2)
		k.line(x,m,x,k.H-m)
		d = Math.abs(k.mX-x)
		if(k.mY>m && k.mY<k.H-m && d<5 && d<dMin){
			overIndex = i
			dMin = d
			xOver = x
		}
		if(selecting && x>=minSelection && x<=maxSelection) indexesSelected.push(i)
	})

	if(overIndex!=-1){
		k.fill("black")
		k.fCircle(xOver, k.H-m+2, 2)
	}


}

drawCircles = function(){
	k.stroke('black', 0.1)
	circles.forEach((c,i)=>{
		//||'rgb(100,100,100)'
		k.fill(colors?colors[i]:"gray")
		let over = k.fsCircleM(c.x, c.y+k.cY, c.r)
		if(over) overIndex = i
		if(selecting && c.x>=minSelection && c.x<=maxSelection) indexesSelected.push(i)
	})

	if(overIndex!=-1){
		let circle = circles[overIndex]
		k.stroke('black', 2)
		k.sCircle(circle.x, circle.y+k.cY, circle.r)
		if(labels) drawLabel(circle, labels[overIndex])
	}
	
}

drawLabel = function(circle, label){
	k.setText('black', 14)
	let wt = k.getTextW(label)
	let x = Math.max(Math.min(circle.x-wt*0.5, k.W-wt-4), 4)
	let y = circle.y+k.cY-configuration.rCircles-15

	//label
	k.fill('rgb(50,50,50)')
	k.fRect(x-2, y-2, wt+4, 16)
	k.fill('white')
	k.fText(label, x, y)

	//date
	if(dates){
		k.fill('rgb(100,100,100)')
		k.fRect(x-2, y-14, wt+4, 12)
		k.setText('white', 12)
		k.fText(_.dateToString(dates[overIndex]), x, y-13)
	}
}


