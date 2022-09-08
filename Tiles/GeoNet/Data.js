receiveData = function(dataObj){

  switch(dataObj.type){
    case "network":
      //network where (some) nodes have long, lat numeric properties
      setNetwork(dataObj.value)
      //netView.receiveData(dataObj)
      break

    case "coordinates":
      //network where (some) nodes have long, lat numeric properties
      setCoordinates(dataObj.value)
      //netView.receiveData(dataObj)
      break

    case "texts":
      //network where (some) nodes have long, lat numeric properties
      setTexts(dataObj.value)
      //netView.receiveData(dataObj)
      break

    case "configuration":
      setConfiguration(dataObj.value)
      break

    case "stop":
      //this.k.stop()
      //cycle = function(){}
  }

  //processData(dataObj)
}


setTexts = function(array){
  this.texts = array
}

setCoordinates = function(table){
  if(table==null) return
  coordinatesTable = table
  geoPoints = new _.Pol()

  let lat =  table.get("lat")??table.get("latitude")??table.get("Lat")??table.get("Latitude")??table[0]
  let long =  table.get("long")??table.get("longitude")??table.get("Long")??table.get("Longitude")??table.get("lng")??table.get("Lng")??table[1]

  let long0 = lat0 = 1000
  let long1 = lat1 = -1000

  let x0 = y0 = 10000
  let x1 = y1 = -10000

  let point

  lat.forEach((lt,i)=>{
    long0 = Math.min(long0, long[i])
    long1 = Math.max(long1, long[i])
    lat0 = Math.min(lat0, lt)
    lat1 = Math.max(lat1, lt)

    point = geoProject(lt, long[i])
    x0 = Math.min(x0, point.x)
    x1 = Math.max(x1, point.x)
    y0 = Math.min(y0, point.y)
    y1 = Math.max(y1, point.y)

    geoPoints.push(new _.P(long[i], lt))
  })

  let Dlong = long1 - long0
  let Dlat = lat1 - lat0

  let Nx = 80
  let Ny = Nx*(Dlat/Dlong)
  let dlong = Dlong/(Nx-1)
  let dlat = Dlat/(Ny-1)

  long0-=dlong*0.5
  long1+=dlong*0.5
  lat0-=dlat*0.5
  lat1+=dlat*0.5

  cornerTopLeft = new _.P(lat1, long0)
  cornerBottomRight = new _.P(lat0, long1)

  point = geoProject(lat1, long0)
  x0 = point.x
  y0 = point.y
  point = geoProject(lat0, long1)
  x1 = point.x
  y1 = point.y

  let dx = x1 - x0
  let dy = y1 - y0


  imageCoordinates = new Image()
  let canvas = document.createElement('canvas');
  canvas.width = dx
  canvas.height = dy
  let context = canvas.getContext('2d')

  _line = function (x0, y0, x1, y1) {
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.stroke();
  }
  _fCircle = function (x, y, r) {
    context.beginPath()
    context.arc(x, y, r, 0, 2*Math.PI)
    context.fill()
  }
  _fRect = function (x, y, width, height) {
    context.fillRect(x, y, width, height)
  }

  
  //points
  context.fillStyle = 'rgba(255,0,0,0.2)'
  geoPoints.forEach(p=>{
    point = geoProject(p.y, p.x)
    _fCircle( point.x-x0, point.y-y0, 8)
  })
  context.fillStyle = 'rgba(255,0,0,0.4)'
  geoPoints.forEach(p=>{
    point = geoProject(p.y, p.x)
    _fCircle( point.x-x0, point.y-y0, 4)
  })
  context.fillStyle = 'rgba(255,0,0,0.6)'
  geoPoints.forEach(p=>{
    point = geoProject(p.y, p.x)
    _fCircle( point.x-x0, point.y-y0, 1)
  })


  //heatmap
  context.strokeStyle = 'rgb(0,0,255)'
  context.lineWidth = 10
  let x,y
  let n
  for(var i=0; i<Nx; i++){
    x = geoProject(lat0, long0 + i*dlong).x-x0
    for(var j=0; j<Ny; j++){
      y = geoProject(lat0 + j*dlat, long0).y-y0

      n=0
      geoPoints.forEach(p=>{
        if(p.y>lat0 + j*dlat && p.y<lat0 + (j+1)*dlat && p.x>long0 + i*dlong && p.x<long0 + (i+1)*dlong){
          n++
        }
      })

      if(n>0){
        context.fillStyle = `rgba(255,0,${n*5},${n*0.03})`
        _fRect(x,y,dx/Nx,-dy/Ny)
      }

    }
  }

  context.stroke = 'rgb(255,0,255)'
  _fCircle(10,10,10)
  _fCircle(this.k.W-10,this.k.H-10,10)

  imageCoordinates.src = canvas.toDataURL()
}

setNetwork = function(net){
  let firstNet = this.net==null
  this.net = net

  //if(firstNet){
    let minLat = 1000
    let maxLat = -1000
    let minLong = 1000
    let maxLong = -1000

    let nGeo = 0

    let baryLat = 0
    let baryLong = 0

    this.net.nodes.forEach(nd=>{
      nd.x = Math.random()
      nd.y = Math.random()
      nd.vx = 0
      nd.vy = 0
      nd.ax = 0
      nd.ay = 0

      nd._isFixed = nd.longitude!=null
      if(nd._isFixed){
        minLat = Math.min(minLat, nd.latitude)
        maxLat = Math.max(maxLat, nd.latitude)
        minLong = Math.min(minLong, nd.longitude)
        maxLong = Math.max(maxLong, nd.longitude)

        baryLat+=nd.latitude
        baryLong+=nd.longitude

        nGeo++
      }
    })

    baryLat/=nGeo
    baryLong/=nGeo

    if(firstNet){
      this.zoom = 1
      this.map.setView(new L.LatLng(baryLat,baryLong), this.config.map.zoom)
    }

    // this.map.fitBounds([
    //     [minLat, minLong],
    //     [maxLat, maxLong]
    //   ]
    // )
    // this.map.setZoom(8)
  //}  

  let maxD = Math.max(Math.abs(maxLong-minLong), Math.abs(maxLat-minLat))

  forces.k = this.config.physics.k// 0.001
  forces.dEqSprings = 0.0004*maxD
  forces.dEqRepulsors = 0.02*maxD
  forces.forcesForNetwork(net, maxD, new _.P((maxLong+minLong)*0.5,(maxLat+minLat)*0.5))
  forces.zoom = 15
  
  let point
  this.net.nodes.forEach(nd=>{
    point = geoProject(nd.y, nd.x)
    nd.px = point.x
    nd.py = point.y
  })

  this.k.setText('', this.config.nodes.text_size)
  this.net.nodes.forEach(nd=>{
    nd._w_base = this.k.getTextW(nd.name)+this.config.nodes.box_padding*2
    nd._h_base = this.config.nodes.text_size + this.config.nodes.box_padding*2
    nd._labelAngle = Math.PI*0.5
  })
}

setConfiguration = function(config){
}

////////////////////////////////////////////////

//will be overriden by however loads the module
sendData = function(){}