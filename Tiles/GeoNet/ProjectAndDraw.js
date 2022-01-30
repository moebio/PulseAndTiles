attractionToFixed = function(){
  let dx, dy, distance, destinyX, destinyY
  this.net.nodes.forEach(nd=>{
    if(nd._visible && nd._isFixed){
      if(nd._distanceToCursor>300) return
      let attraction = Math.min( (0.18*100/(15+nd._distanceToCursor))**2, 0.9)
      //if(nd._distanceToCursor<50) console.log(nd.name, nd._distanceToCursor, attraction, nd.nodes.length)

      let angles = []
      let minAngle = 2*Math.PI
      let angle

      nd.nodes.forEach(nd2=>{
        //console.log("  <", ((nd2.px-nd.px)**2 + (nd2.py-nd.py)**2)<400)

        nd2.__dx = nd2.x-nd.x
        nd2.__dy = nd2.y-nd.y

        angle = Math.atan2(nd2.__dy, nd2.__dx)
        //if(angle<0) angle+=2*Math.PI
        angles.push(angle)
        minAngle = Math.min(minAngle, angle)

      })

      //let rCircle = 0.0006
      let rCircle = 0.01/this.map.zoom
      let sortedNodes = nd.nodes.getSortedByList(angles)
      let dAngle = 2*Math.PI/sortedNodes.length
      angle = dAngle*0.5-Math.PI//minAngle
      sortedNodes.forEach(nd2=>{
        //distance = Math.sqrt(nd2.__dx**2+nd2.__dy**2)
        destinyX = nd.x + rCircle*Math.cos(angle)
        destinyY = nd.y + rCircle*Math.sin(angle)

        nd2.x = (1-attraction)*nd2.x + attraction*destinyX
        nd2.y = (1-attraction)*nd2.y + attraction*destinyY

        angle+=dAngle
      })

    }
  })
}

projectNode = function(nd, moving){
   if(nd._isFixed){
      nd.x = 0.85*nd.x + 0.15*nd.longitude
      nd.y = 0.85*nd.y + 0.15*nd.latitude
      nd.vx = nd.vy = nd.ax = nd.ay = 0
    }

    //in Geo.js
    let point = geoProject(nd.y, nd.x)
    
    if(moving){
      nd.px = point.x
      nd.py = point.y
    } else {
      nd.px = 0.8*nd.px + 0.2*point.x
      nd.py = 0.8*nd.py + 0.2*point.y
    }

    nd._visible = nd.px>-5 && nd.px<this.k.W+5 && nd.py>-5 && nd.py<this.k.H+5
    if(!nd._visible) return

    if(nd._isFixed){
      point = geoProject(nd.latitude, nd.longitude)
      nd.px_fixed = point.x
      nd.py_fixed = point.y
    }

    //if(nd._isFixed){
    nd._distanceToCursor = Math.sqrt( (nd.px-this.k.mX)**2 + (nd.py-this.k.mY)**2 )
}

drawNode = function(nd){
  if(!nd._visible) {
    if(nd._isFixed){
      let dx = nd.px-this.k.cX
      let dy = nd.py-this.k.cY
      let angle = Math.atan2(dy, dx)
      if(angle<this.k.windowDiagonalAngle && angle>-this.k.windowDiagonalAngle){
        x = this.k.W - 10
        y = this.k.cY + dy*this.k.cX/dx
      } else if(angle<=-this.k.windowDiagonalAngle && angle>-Math.PI+this.k.windowDiagonalAngle){
        x = this.k.cX - dx*this.k.cY/dy
        y = 10
      } else if(angle>=this.k.windowDiagonalAngle && angle<Math.PI-this.k.windowDiagonalAngle){
        x = this.k.cX + dx*this.k.cY/dy
        y = this.k.H - 10
      } else {
        x = 10
        y = this.k.cY - dy*this.k.cX/dx
      }

      d = dx**2+dy**2
      
      this.k.stroke(nd.color,2)
      this.k.drawArrow(x, y, Math.min(Math.max(10000000/d,4),20), angle)
      
      return {x,y}
      //}
    }
    return
  }

  let zoomNode = this.zoom*100/(70+0.4*nd._distanceToCursor)
  let over = false

  if(nd._isFixed){
    this.k.fill('rgba(255,255,255,0.4)')
    if(this.k.fCircleM(nd.px_fixed, nd.py_fixed, 6, 8)) this.overNode = nd

    this.k.fill(nd.color)
    this.k.fCircle(nd.px_fixed, nd.py_fixed, 4)

    let angle = Math.atan2(this.k.mY-nd.py, this.k.mX-nd.px)
    if(angle-nd._labelAngle>Math.PI) angle-=2*Math.PI
    if(angle-nd._labelAngle<-Math.PI) angle+=2*Math.PI
    nd._labelAngle = 0.98*nd._labelAngle + 0.02*angle

    let xl = nd.px - 0.6*nd._w_base*Math.cos(nd._labelAngle)
    let yl = nd.py - 1.2*nd._h_base*Math.sin(nd._labelAngle)

    let angle90 = nd._labelAngle + Math.PI*0.5

    this.k.fLines(
      xl+nd._h_base*0.6*Math.cos(angle90)*zoomNode, yl+nd._h_base*0.6*Math.sin(angle90)*zoomNode,
      //nd.px, nd.py,
      nd.px_fixed, nd.py_fixed,
      xl-nd._h_base*0.6*Math.cos(angle90)*zoomNode, yl-nd._h_base*0.6*Math.sin(angle90)*zoomNode
    )

    // this.k.stroke(nd.color, 2)
    // this.k.line(nd.px, nd.py,nd.px_fixed, nd.py_fixed)

    over = drawRectAndLabel(xl, yl, nd._w_base*zoomNode, nd._h_base*zoomNode, nd.color, nd.name, this.config.nodes.text_size*zoomNode)
    if(over) this.overNode = nd
    
    return
  }
  over = drawRectAndLabel(nd.px, nd.py, nd._w_base*zoomNode, nd._h_base*zoomNode, nd.color, nd.name, this.config.nodes.text_size*zoomNode)
  if(over) this.overNode = nd
}

drawRectAndLabel = function(x, y, w, h, color, label, textSize){
  this.k.fill('rgba(255,255,255,0.4)')
  this.k.fRect(x-w*0.5-2, y-h*0.5-2, w+4, h+4)
  this.k.fill(color)
  this.k.fRect(x-w*0.5, y-h*0.5, w, h)
  this.k.setText('black', textSize, null, 'center', 'middle')
  this.k.fText(label, x, y)

  return this.k.mY>y-h*0.5 && this.k.mY<y+h*0.5 && this.k.mX>x-w*0.5 && this.k.mX<x+w*0.5
}

drawRelation = function(r){
  if(!r.node0._visible || !r.node1._visible) return
  let relationsVisibilityFactor = (0.05/2500)*this.net.relations.length// 0.05 //0.05 high, 0.01 low
  let thick = (this.overNode==r.node0 || this.overNode==r.node1)?3:(2/(0.5 + relationsVisibilityFactor*Math.min(r.node0._visible?r.node0._distanceToCursor:1000, r.node1._visible?r.node1._distanceToCursor:1000)))
  if(thick<0.3) return
  //if(!( (r.node0._visible && r.node0.longitude!=null) || (r.node1._visible && r.node1.longitude!=null) ) ) return
  this.k.stroke(r.color?r.color:this.config.relations.color, thick)
  this.k.line(r.node0.px, r.node0.py, r.node1.px, r.node1.py)
}

drawFrameForArrowsForFixed = function(){
  //this.k.fill('rgba(255,255,255,0.7)')
  this.k.fill('rgba(0,0,0,0.5)')
  this.k.fRect(this.k.W-FRAME_WIDTH,0,FRAME_WIDTH,this.k.H)
  this.k.fRect(0,0,FRAME_WIDTH,this.k.H)
  this.k.fRect(FRAME_WIDTH,0,this.k.W-FRAME_WIDTH*2,FRAME_WIDTH)
  this.k.fRect(FRAME_WIDTH,this.k.H-FRAME_WIDTH,this.k.W-FRAME_WIDTH*2,FRAME_WIDTH)
}

///

drawCoordinates = function(){
  if(!COORDINATES_LAYER_ACTIVE) return
  
  let c0 = geoProject(cornerTopLeft.x, cornerTopLeft.y)
  let c1 = geoProject(cornerBottomRight.x, cornerBottomRight.y)

  //console.log(imageCoordinates?.height)
  this.k.drawImage(imageCoordinates,c0.x,c0.y,c1.x-c0.x,c1.y-c0.y)
  
  //geoPoints.forEach(p=>drawPoint(p))
}

drawPoint = function(p){
  let point = geoProject(p.y, p.x)
  this.k.fill("red")
  this.k.fCircle(point.x, point.y, 3)
}
