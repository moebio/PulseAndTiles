draw = function(){
	let prevOverIndex = overIndex
	overIndex = -1

	drawCircles()

	if(overIndex!=prevOverIndex) sendData({
		type:'over',
		value:overIndex==-1?null:overIndex
	})
}

drawCircles = function(){
	let dx = k.W - configuration.margin*2
	let dy = k.H - configuration.margin*2

	valuesXN.forEach((xn, i)=>{
		let yn = valuesYN[i]
		k.fill(colors?colors[i]:"gray")
		let over = k.fCircleM(configuration.margin+xn*dx, k.H-configuration.margin-yn*dy, 4)
		if(over) overIndex = i
	})

	if(overIndex!=-1){
		let xn = valuesXN[overIndex]
		let yn = valuesYN[overIndex]
		let x = configuration.margin+xn*dx
		let y = k.H-configuration.margin-yn*dy
		k.stroke('black', 2)
		k.sCircle(x, y, 4)
		if(labels) drawLabel(x, y, labels[overIndex])

		k.setText("rgb(50,50,50)", 12, null, "left", "top")
		k.fText(valuesX[overIndex]+", "+valuesY[overIndex], x+4, y+2)
	}

	drawAxes()
	
}

drawAxes = function(){
	k.setText("rgb(50,50,50)", 12, null, "right", "top")
	k.fText(valuesX.name, k.W-configuration.margin, k.H-configuration.margin)

	k.setText("rgb(50,50,50)", 12, null, "right", "bottom")
	k.fTextRotated(valuesY.name, configuration.margin, configuration.margin, -Math.PI*0.5)
}

drawLabel = function(x, y, label){
	k.setText('black', 14)
	let wt = k.getTextW(label)
	let xt = Math.max(Math.min(x-wt*0.5, k.W-wt-4), 4)
	let yt = y-22

	//label
	k.fill('rgb(50,50,50)')
	k.fRect(xt-2, yt-2, wt+4, 16)
	k.fill('white')
	k.fText(label, xt, yt)
}


