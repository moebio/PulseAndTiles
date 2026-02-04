let k
let config
let map
let net
let forces

let coordinatesTable
let geoPoints
let imageCoordinates

let externalOverObject

let cornerTopLeft
let cornerBottomRight

let COORDINATES_LAYER_ACTIVE = true
//let netView

let zoom
let zooming = false

let FRAME_WIDTH = 20
let cursor_on_frame = false

let prev_mX, prev_mY

//let bogota = new L.LatLng(4.7110,-74.0721)

let labelsTiles = []
let colorsTiles = []

const closeDistance = 500
let prevClosestIndex

let last_time_down

const tilesDictionary = {
  Openstreetmap:"https://tile.openstreetmap.org/{z}/{x}/{y}.png",
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
    tile:tilesDictionary.Openstreetmap//stamen_terrain//CartoDB_DarkMatter//Esri_WorldImagery
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
    function(){},
    adjustPixelRatio:false
  })
  this.k.cycleFor(1)


  forces = new _.Forces()
  forces.zoom = 15
  
  //netView = new NetView(k, receiveDataFromNetView)

  this.k.backGroundColorRGB = null

  //in Geo.js
  leaflet()

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

  
  window.addEventListener('dblclick', (event) => {
    console.log("double window !!! !!!")
      this.k.DOUBLE_CLICK = true
      event.preventDefault()
  })


  for( var tNm in tilesDictionary){
    labelsTiles.push(tNm.replaceAll("_", " "))
  }
  colorsTiles = mapsColor//_.createDefaultCategoricalColorList(labelsTiles.length, 0.7)

}

// receiveDataFromNetView = function(){

// }



cycle=function(moving){
  //adjust map size so bottom links dissappear
  document.getElementById("map").style.height = window.innerHeight+16

  draw(moving)
}


resize = function(){
  
}


window.addEventListener("load", function() {  
  init()
})