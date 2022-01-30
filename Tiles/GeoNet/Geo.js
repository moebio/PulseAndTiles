leaflet = function(){
    this.map = L.map('map').setView([0.0, -40.0], 2);

    this.tileLayer = L.tileLayer(this.config.map.tile, {
      maxZoom: 18,
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery <a href="http://stamen.com">Stamen</a>'
    }).addTo(this.map);

    let k = this.k

    this.map.addEventListener('mousemove', function(e) {
       k.mX = e.containerPoint.x
       k.mY = e.containerPoint.y
       k.mLat = e.latlng.lat
       k.mLong = e.latlng.lng
    });

    this.map.addEventListener('mousedown', function(e) {
      k.MOUSE_DOWN = true
      k.MOUSE_UP = false
    })

    this.map.addEventListener('mouseup', function(e) {
      k.MOUSE_UP = true
      k.MOUSE_DOWN = false
    })
    

    let _callCycle = function(moving){
      cycle(moving)
    }

    
    this.map.on('move', function(ev) {
      _callCycle(true)
    })
    /*
    map.on('mousemove', function(ev) {
      //k.context.clearRect(0, 0, k.W, k.H)
      _callCycle()
    })
    */
    this.map.on('zoom', function(ev) {
      _callCycle()
    })

    this.map.on('viewreset', function(ev) {
      _callCycle()
    })

    this.map.on('zoomstart', function(ev) {
      //console.log("zoom start:", ev)
      zooming = true
    })
    
    let configDefault = this.configDefault
    this.map.on('zoomend', zoomEnd)

    setInterval(_callCycle, 1000/24)

    //zoom buttons
    let container = this.map.zoomControl.getContainer()
    container.style.position = 'absolute';
    container.style.left = "20px";
    container.style.top = "18px";
}

zoomEnd = function(ev){
  zooming = false
  this.zoom = Math.pow(2, this.getZoom())/Math.pow(2, configDefault.map.zoom)
  //console.log("new zoom:", this.zoom)
  cycle()
}

geoProject = function(lat, long){
  return this.map.latLngToContainerPoint( new L.LatLng(lat, long) )
}

panToCoordinates = function(lat, lng){
  //let MAX_DIRECT_D = 0.035
  let MAX_DIRECT_D = 0.05

  let center = this.map.getCenter()
  let dLat = lat - center.lat
  let dLng = lng - center.lng
  let d = Math.sqrt( dLat**2 + dLng**2 )

  if(d<MAX_DIRECT_D){
    console.log(" direct jump")
    this.map.panTo(new L.LatLng(lat, lng), {animate:true, duration: 3.0});
  } else {
    let proportion = 0.9*MAX_DIRECT_D/d
    let nLat = center.lat + proportion*dLat
    let nLng = center.lng + proportion*dLng
    console.log(" small jump, proportion:", proportion)
    this.map.panTo(new L.LatLng( nLat , nLng), {animate:true, duration: 3.0});
    setTimeout( ()=>{panToCoordinates(lat, lng)}, 600)
  }
}

setLayer = function(tile){
  this.tileLayer.setUrl(tile)
}
