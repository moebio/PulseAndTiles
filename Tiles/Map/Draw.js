function draw(moving){
  const mouseMoved = this.k.mX!=prev_mX || this.k.mY!=prev_mY
  if(mouseMoved) externalOverObject = null
  prev_mX = this.k.mX
  prev_mY = this.k.mY
  //_nSearch = 0
  this.k.context.clearRect(0, 0, this.k.W, this.k.H)
  //forces.zoom = this.zoom
  //forces.calculateAndApplyForces()
  moving = moving && !zooming

  const zoomSpeed = 0.5//this.k.mY/this.k.H
  this.k.fill("rgba(255,0,0,0.5)")

  let closest = {point:null, d:999999}

  geoPoints.forEach((point,i)=>{
    if(this.colors) this.k.fill(colors[i%geoPoints.length])
    const projectedPoint = geoProject(point.y, point.x)
    if(zooming){
      point.x_p = point.x_p*zoomSpeed + projectedPoint.x*(1-zoomSpeed)
      point.y_p = point.y_p*zoomSpeed + projectedPoint.y*(1-zoomSpeed)
    } else {
      point.x_p = projectedPoint.x
      point.y_p = projectedPoint.y
    }

    if(point.x_p<0 || point.x_p>this.k.W || point.y_p<0 || point.y_p>this.k.H) return

      point.weight = 0.9*point.weight + 0.1*point.finalWeight

    this.k.fCircle(point.x_p, point.y_p, 1.5*Math.sqrt(this.map._zoom)*point.weight)
    
    const d = ((point.x_p-this.k.mX)**2+(point.y_p-this.k.mY)**2)/(0.5 + 0.5*point.weight)
    if(d<closest.d){
      closest.point = point
      closest.d = d
      closest.index = i
      if(this.colors) closest.color = colors[i%geoPoints.length]
    }
  })

  closest = externalOverObject || (closest.d<(closeDistance*this.map._zoom)?closest:null)

  if(closest){
    const outsideFrame = closest.point.x_p < 0 || closest.point.x_p > this.k.W || closest.point.y_p < 0 || closest.point.y_p > this.k.H
    if(outsideFrame){
      let x, y
      const dx = closest.point.x_p-this.k.cX
      const dy = closest.point.y_p-this.k.cY
      const angle = Math.atan2(dy, dx)
      if(angle<this.k.windowDiagonalAngle && angle>-this.k.windowDiagonalAngle){
        x = this.k.W - 15
        y = this.k.cY + dy*this.k.cX/dx
      } else if(angle<=-this.k.windowDiagonalAngle && angle>-Math.PI+this.k.windowDiagonalAngle){
        x = this.k.cX - dx*this.k.cY/dy
        y = 15
      } else if(angle>=this.k.windowDiagonalAngle && angle<Math.PI-this.k.windowDiagonalAngle){
        x = this.k.cX + dx*this.k.cY/dy
        y = this.k.H - 15
      } else {
        x = 15
        y = this.k.cY - dy*this.k.cX/dx
      }

      this.k.stroke("balck",2)
      this.k.drawArrow(x, y, 10, angle)
    } else {
      this.k.stroke("black", 2)
      this.k.sCircle(closest.point.x_p, closest.point.y_p, 1.5*Math.sqrt(this.map._zoom)*closest.point.weight+3)

      if(closest.color){
        this.k.fill(closest.color)
        this.k.fCircle(closest.point.x_p, closest.point.y_p, 1.5*Math.sqrt(this.map._zoom)*closest.point.weight)
      }
    }
  }

  if(prevClosestIndex!=closest?.index) sendData({type:'over', value:closest?.index})
  prevClosestIndex = closest?.index

  interaction(closest, mouseMoved)


  // if(this.texts){
  //   this.texts.forEach(text=>{
  //     let point = geoProject(text.lat, text.lon)
  //     this.k.setText("rgba(255,255,255,0.6)", 68*this.map.zoom, null, "center", "middle")
  //     this.k.fText(text.text, point.x, point.y)
  //   })
  // }
}

function interaction(closest, mouseMoved){
  if(this.k.MOUSE_DOWN){
    last_time_down = new Date().getTime()
    this.k.MOUSE_DOWN = false
  }

  if(this.k.MOUSE_UP && new Date().getTime()-last_time_down<200){
    if(closest){
      sendData({type:'select', value:closest.index})
    } else {
      sendData({type:'unselect', value:null})
    }
    this.k.MOUSE_UP = false
  } else if(mouseMoved && closest){
    sendData({type:'over', value:closest.index})
  }

  if(this.k.DOUBLE_CLICK && closest){
    sendData({type:'select_double', value:closest.index})
  }

  this.k.DOUBLE_CLICK = false
}
