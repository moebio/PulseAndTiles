let k
let config
let map
let net
let forces

let coordinatesTable
let geoPoints
let imageCoordinates

let cornerTopLeft
let cornerBottomRight

let COORDINATES_LAYER_ACTIVE = true
//let netView

let zoom
let zooming = false

let FRAME_WIDTH = 20
let cursor_on_frame = false

let bogota = new L.LatLng(4.7110,-74.0721)

let labelsTiles = []
let colorsTiles = []

const tilesDictionary = {
  Esri_WorldImagery:"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  stamen_watercolor:"http://{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.jpg",
  stamen_toner:"http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png",
  stamen_terrain:"https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png",
  //wmflabs_bw_mapnik:"https://tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png",
  CartoDB_DarkMatter:"https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
  //Stadia_AlidadeSmoothDark:"https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
}
let relationsColor = ['white','black','red','black','white']
let mapsColor = ['green','pink','white','rgb(120,255,120)','black']
let iTile = 0

let configDefault = {
  nodes:{
    text_size:12,
    box_padding:3
  },
  relations:{
    color:'white'
  },
  physics:{
    k:0.001
  },
  interaction:{
  },
  map:{
    zoom:15,
    tile:tilesDictionary.Esri_WorldImagery
  },
  coordinates:{
    mode:'grid_heatmap',
    gridSize:50
  }
}

init=function(){
  this.configDefault = configDefault
  this.config = configDefault

  this.k = new _.MetaCanvas({
    function(){},
    function(){}
  })
  this.k.cycleFor(1)

  forces = new _.Forces()
  forces.zoom = 15
  
  //netView = new NetView(k, receiveDataFromNetView)

  this.k.backGroundColorRGB = null

  //in Geo.js
  leaflet()

  console.log("##document.body map", document.getElementById("map"))

  //k.canvas.addEventListener("mousewheel", e=>document.getElementById("maindiv").dispatchEvent(e));//TEST as per Dani's request

  _resize = function(e){
    this.k.canvas.width = window.innerWidth
    this.k.canvas.height = window.innerHeight
    this.k.W = window.innerWidth
    this.k.H = window.innerHeight
    this.k.cX = 0.5*this.k.W
    this.k.cY = 0.5*this.k.H
    this.k.windowDiagonalAngle = Math.atan2(this.k.cY, this.k.cX)
  }
  
  window.addEventListener('resize', _resize)
  _resize()

  this.k._startCycle = null
  this.k._onCycle = null
  this.k.cycleFor = function(){}

  this.k.drawArrow = function(x, y, size, angle){
    this.sLines(
      x - 0.5*size*Math.cos(angle),
      y - 0.5*size*Math.sin(angle),
      x + 0.5*size*Math.cos(angle),
      y + 0.5*size*Math.sin(angle),
      x + 0.5*size*Math.cos(angle)-0.55*size*Math.cos(angle+1),
      y + 0.5*size*Math.sin(angle)-0.55*size*Math.sin(angle+1)
    )
    this.line(x + 0.5*size*Math.cos(angle),
      y + 0.5*size*Math.sin(angle),
      x + 0.5*size*Math.cos(angle)-0.55*size*Math.cos(angle-1),
      y + 0.5*size*Math.sin(angle)-0.55*size*Math.sin(angle-1))
  }

  let tiles_array = []
  for(tileMapname in tilesDictionary){
    tiles_array.push(tilesDictionary[tileMapname])
  }

  window.addEventListener('keypress', e=>{
    let _isNumber = s=>String(Number(s))==s
    if(_isNumber(e.key)) setLayer(tiles_array[ ((Number(e.key)-1)+tiles_array.length)%tiles_array.length ])
    if(e.key=="a") COORDINATES_LAYER_ACTIVE = !COORDINATES_LAYER_ACTIVE
  })

  //k.setDimensions(0,0,1000, 700)
  //setInterval(cycle, 1000/24)


  ////revamp Forces
  _.Forces.prototype.calculate=function() {
   var i;
   var node0, node1;
   var type;
   var force;
   var dx, dy, d;
   var eqDistance;

   //console.log("2 this.map.zoom", this.map.zoom)

   var factor = this.k*this.zoom/15
    // 1. reset accelerations
   //this._resetAccelerations(); //TODO: this can be removed if accelerations are resetd in applyForces [!]
    // 2. calculate new accelerations from forces

   for(i = 0; this.forcesList[i] != null; i++) {
     node0 = this.from[i];
     //if(!node0._visible) continue
     node1 = this.to[i];
      if(!node0._visible && !node1._visible) continue
      if(node0._isFixed && !node0._visible) continue
      if(node1._isFixed && !node1._visible) continue

     type = this.forcesTypeList[i];
     dx = node1.x - node0.x + 0.000001;
     dy = node1.y - node0.y + 0.000001;
     d = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2))
     eqDistance = this.equilibriumDistances[i]

     if(type == 'Repulsor' && d > eqDistance) continue;
     if(type == 'Attractor' && d < eqDistance) continue;
      switch(type) {
       case "Spring":
       case "Repulsor":
       case "Attractor":
         force = factor * (d - eqDistance) / d;
         node0.ax += force * dx;
         node0.ay += force * dy;
         node1.ax -= force * dx;
         node1.ay -= force * dy;
         break;
       case "DirectedSpring":
         force = factor * (d - eqDistance) / d;
         node1.ax -= force * dx;
         node1.ay -= force * dy;
         break;
       case "DirectedRepulsor":
         if(d < eqDistance) {
           force = factor * (d - eqDistance) / d;
           node1.ax -= force * dx;
           node1.ay -= force * dy;
         }
         break;
     }
   }
  }


  // let callBackMenuTiles = function(ob){
  //   console.log("callBackMenuTiles, ob", ob)
  // }
  // this.tilesMenu = new Menu(this.k, callBackMenuTiles)
  // this.tilesMenu.setMode(1)
  // let labelsTiles = []
  // let colorsTiles = []
  // let colorsNonSelected = []
  // for( var tNm in tilesDictionary){
  //   labelsTiles.push(tNm)
  //   colorsTiles.push('orange')
  //   colorsNonSelected.push('white')
  // }
  // this.tilesMenu.setData(labelsTiles, colorsTiles, labelsTiles, colorsNonSelected, "single")
  for( var tNm in tilesDictionary){
    labelsTiles.push(tNm.replaceAll("_", " "))
  }
  colorsTiles = mapsColor//_.createDefaultCategoricalColorList(labelsTiles.length, 0.7)
}

// receiveDataFromNetView = function(){

// }



cycle=function(moving){
  //adjust map size so bottom links dissappear
  document.getElementById("map").style.height = window.innerHeight+16;


  if(!this.net) return // [!] change this: GeoNet could draw points and no net
    _nSearch = 0
  this.k.context.clearRect(0, 0, this.k.W, this.k.H)
  forces.zoom = this.zoom
  forces.calculateAndApplyForces()
  moving = moving && !zooming
  this.net.nodes.forEach(nd=>projectNode(nd,moving))
  attractionToFixed()

  if(geoPoints) drawCoordinates()

  drawFrameForArrowsForFixed()

  //draw relations
  this.net.relations.forEach(drawRelation)

  
  cursor_on_frame = this.k.mX<FRAME_WIDTH || this.k.mY<FRAME_WIDTH || this.k.mX>this.k.W-FRAME_WIDTH || this.k.mY>this.k.H-FRAME_WIDTH
  
  let prevOverNode = this.overNode
  this.overNode = null
  let overArrowNode
  let arrowPosition
  let arrowPositionMin

  if(cursor_on_frame){
    let dMinArrow = 120
    this.net.nodes.forEach(n=>{
      arrowPosition = drawNode(n)
      if(arrowPosition){
        let dArrow = (arrowPosition.x-this.k.mX)**2+(arrowPosition.y-this.k.mY)**2
        if(dArrow<dMinArrow){
          overArrowNode = n
          dMinArrow = dArrow
          arrowPositionMin = arrowPosition
        }
      }
    })
  } else {
    this.net.nodes.forEach(drawNode)
  }

  if(this.overNode) drawNode(this.overNode)
  if(this.overNode && prevOverNode!=this.overNode) sendData({type:"over", value:this.overNode})


  if(overArrowNode){
    this.k.setCursor('pointer')
    let label = "→ "+overArrowNode.name

    this.k.setText('black', 16)
    let wt = this.k.getTextW(label)+4
    
    if(this.k.mX<FRAME_WIDTH){
      drawRectAndLabel(FRAME_WIDTH+5+wt*0.5, arrowPositionMin.y, wt, 20, overArrowNode.color, label, 16)
    } else if(this.k.mY<FRAME_WIDTH){
      drawRectAndLabel(arrowPositionMin.x, FRAME_WIDTH+12, wt, 20, overArrowNode.color, label, 16)
    } else if(this.k.mX>this.k.W-FRAME_WIDTH){
      drawRectAndLabel(this.k.W - FRAME_WIDTH-5-wt*0.5, arrowPositionMin.y, wt, 20, overArrowNode.color, label, 16)
    } else {
      drawRectAndLabel(arrowPositionMin.x, this.k.H - FRAME_WIDTH - 12, wt, 20, overArrowNode.color, label, 16)
    }
    if(this.k.MOUSE_UP){
      console.clear()
      console.log("|||||||||||||||||||||||||||||||||pan to ", overArrowNode.latitude, overArrowNode.longitude)
      panToCoordinates(overArrowNode.latitude, overArrowNode.longitude);
    }
  }

  //tiles menu
  let xTM = 43
  let yTM = 100
  let dYTM = 20
  
  this.k.setText('white', 18)
  labelsTiles.forEach((l, i)=>{
    
    if(iTile==i){
      this.k.stroke('white',5)
      this.k.sCircle(xTM, yTM, 8)
      this.k.stroke('black',3)
      this.k.sCircle(xTM, yTM, 8)
    }

    this.k.fill(colorsTiles[i])
    if(this.k.fCircleM(xTM, yTM, 8, 5)){
      this.k.fill('rgba(50,50,50,0.7)')
      this.k.fRect(xTM+18, yTM-dYTM*0.5-4, this.k.getTextW(l)+8, dYTM+4)
      this.k.setText('white', 18, null, 'left', 'middle')
      this.k.fText(l, xTM + 23, yTM-1)
      this.k.setCursor('pointer')
      if(this.k.MOUSE_UP){
        setLayer(tilesDictionary[l.replace(" ", "_")])
        iTile = i
        this.net.relations.forEach(r=>r.color = relationsColor[i])
      }
    }
    
    yTM+=dYTM
  //   labelsTiles.push(tNm)
  //   colorsTiles.push('orange')
  //   colorsNonSelected.push('white')
  })

  this.k.MOUSE_UP = false
}


resize = function(){
  
}


window.addEventListener("load", function() {  
  init()
})