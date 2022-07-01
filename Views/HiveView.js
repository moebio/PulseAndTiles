import NetView from '../Views/NetView/NetView.js'

export default class HiveView extends NetView{

  /////////////////////////////////////////constructor
  constructor(k, callBackSendData, config){
    super(k, callBackSendData, config) //try ...args

    this.ZOOM_MIN = 1

    //this goes out
    this.OVER_CLOSEST = true
    this.GEO_ACTIVE = false// X
  


    /////////////////////////////////////////override
    this.drawMethods.drawRelation = function(){}
    this.drawMethods.nodeIsVisible = function(){}
    //this.drawMethods.drawNode = function(){}

    this.drawMethods.superDraw = this.drawMethods.draw

    this.drawMethods.draw = function(){
      var k = this.k
      var view = this.view

      if(view.selectedNode){
        //this.FORCES_ACTIVE = false
        // view.recMap.x = view.recMap.x + (view.selectedNode.x - k.invfX(k.cX))*0.1
        // view.recMap.y = view.recMap.y + (view.selectedNode.y - k.invfY(k.cY))*0.1
        
        //no longer needed?
        // view.recMap.x = view.recMap.x + (view.selectedNode.x - this.drawMethods.invfX(k.cX))*0.1
        // view.recMap.y = view.recMap.y + (view.selectedNode.y - this.drawMethods.invfY(k.cY))*0.1

      } else {
        //this.FORCES_ACTIVE = true
        // if(this.GEO_ACTIVE){
        //   this.net.nodes.forEach(n=>{if(n.kind=="espacio") {n.x = 0.9*n.x + 0.1*(k.cX + n.geo.x*3000); n.y = 0.9*n.y + 0.1*(k.cY + n.geo.y*3000); n.vx=0; n.vy=0} })
        // } else if(this.TIME_ACTIVE){
        //   this.net.nodes.forEach(n=>{if(n.kind=="obra" && n.year) {n.x = 0.9*n.x + 0.1*( Math.log((n.year - 1970)/50)*2000 - 300); n.vx=0} })
        // }
      }

      view._addCellsToNodes()

      this.superDraw()
      //logNode(view.selectedNode??this.overNode)

      
      // if(k.KEY_JUST_PRESSED=="g"){
      //   this.GEO_ACTIVE = !this.GEO_ACTIVE
      //   this.TIME_ACTIVE = false
      // } else if(k.KEY_JUST_PRESSED=="t"){
      //   this.TIME_ACTIVE = !this.TIME_ACTIVE
      //   this.GEO_ACTIVE = false
      // }
    }

    this.drawMethods.superdrawNodeBeforeRelations = this.drawMethods.drawNodeBeforeRelations
    //this.drawMethods.superdrawNode = this.drawMethods.drawNode


    
    this.drawMethods.drawNodeBeforeRelations = function(nd){
      //if(Math.random()<0.01) console.log("[HV] nd.cell?.length", nd.cell?.length)

      this.superdrawNodeBeforeRelations(nd)
      if(!nd._visible) return

      //if(nd.kind=="tag"){this._drawNode(nd); return}

      var hasImage = nd.image?.width

      this.k.stroke('black',0.5)
      this.k.fill(hasImage?'black':nd.color)//Back)
      this.k.context.save()
      //console.log(nd.cell.length)
      if(nd.cell?.length>=3){
        this.k.fsPolygon(nd.cell)
      } else {
        this.k.fRect(0,0,this.k.W,this.k.H)
      }
      this.k.context.clip()

      if(hasImage){
        let scale = (nd.image.width>this.k.W?(this.k.W/nd.image.width):1)
        scale *= (scale*nd.image.height>this.k.H?(this.k.H/nd.image.height):1)
        let w = scale*nd.image.width
        let h = scale*nd.image.height

        // let x = this.k.fX(nd.x)-w*0.5
        // let y = this.k.fY(nd.y)-h*0.5
        let x = nd._px-w*0.5// this.drawMethods.fX(nd.x)-w*0.5
        let y = nd._py-h*0.5//this.drawMethods.fY(nd.y)-h*0.5

        this.k.drawImage(nd.image, x, y, w, h)
      } else {
        this.drawLabel(nd)
        //this.k.fill(_.addAlpha(_.invertColor(nd.color), 0.2))
        // this.k.fill(nd.colorBack)
        // this.k._fRect(0,0,this.k.W,this.k.H)
      }
      //this.superdrawNode(nd)

      //relations
      // this.k.stroke('black', 1);
      // nd.nodes.forEach(nd2=>this.k.line(nd.x, nd.y, nd2.x, nd2.y));

      this.k.restore()
    }

    this.drawMethods.drawLabel = function(nd){
      var size = (nd.kind=='tag' || nd.kind=="medio")?32:24
      var color = 'black';// nd.color;//nd.kind=='tag'?'black':nd.color
      //this.k.setText(nd.kind=='tag'?'red':'black', size, null, 'center', 'middle')
      this.k.setText(color, size, undefined, 'center', 'middle', nd.kind=='tag'?'bold':undefined)
      //this.k.stroke('white', 2)
      var label = (nd.kind=='tag' || nd.kind=="medio")?nd.name.toUpperCase():nd.name
      this.k.fText(nd.name, nd._px, nd._py, 3)
    }

    this.drawMethods.drawNode = function(nd){
      return
      // console.log("[HV] drawLabel", nd.name)
      //   if(nd.image) return;
      //   //this.k.setText(nd.color, 12, null, 'center', 'middle')
      //   var size = (nd.kind=='tag' || nd.kind=="medio")?32:24
      //   var color = 'black';// nd.color;//nd.kind=='tag'?'black':nd.color
      //   //this.k.setText(nd.kind=='tag'?'red':'black', size, null, 'center', 'middle')
      //   this.k.setText(color, size, undefined, 'center', 'middle', nd.kind=='tag'?'bold':undefined)
      //   //this.k.stroke('white', 2)
      //   var label = (nd.kind=='tag' || nd.kind=="medio")?nd.name.toUpperCase():nd.name
      //   this.k.fText(nd.name, nd._px, nd._py, 3)
    }
    //this.drawMethods.drawNode = this.drawMethods.drawLabel


    this.drawMethods.isOverNode = function(nd){
        return false
    }

    this.drawMethods.drawNodeSelected = function(nd){
      this.k.stroke('black', 12)
      if(nd.cell?.length>=3) this.k.sPolygon(nd.cell, true)
    }

    this.drawMethods.drawNodeOver = function(nd){
      if(!nd.cell) return

        if(nd.cell.length>=3){
          if(nd.image){
            this.k.stroke(nd.color, 10)
            this.k.sPolygon(_.expandFromBarycenter(nd.cell, 1 - 0.12/Math.max(this.zoom*this.zoom, 1.5)  ), true)
          }
          this.k.stroke('black', 8)
          this.k.sPolygon(nd.cell, true)
        }

        this.k.stroke('black', 5)
        nd.nodes.forEach(nd2=>{if(nd2.visible) this.k.sPolygon(nd2.cell, true)})
    }
  }


  nodeSelected(selectedNode){
    super.nodeSelected(selectedNode)
    this._loadImageForNode(selectedNode)
    selectedNode.nodes.forEach(n=>this._loadImageForNode(n))
    this.ZOOM_TO_CURSOR = false
  }
  nodeUnSelected(){
    super.nodeUnSelected()
    this.ZOOM_TO_CURSOR = true;
  }


  /////////////////////////////////////////private
  _addCellsToNodes(){
    var k = this.k

    let pol = new _.Pol()
    let sortedNodes = this.net.nodes.getSortedByProperty('_py')
    // let fr = new _.Rec(k.invfX(0)-50,k.invfY(0)-50,0, 0)
    // let x1 = k.invfX(k.W)+50
    // let y1 = k.invfY(k.H)+50
    
    // let fr = new _.Rec(this.drawMethods.invfX(0)-50,this.drawMethods.invfY(0)-50,0, 0)
    // let x1 = this.drawMethods.invfX(k.W)+50
    // let y1 = this.drawMethods.invfY(k.H)+50

    let fr = new _.Rec(-50,-50,0, 0)
    let x1 = k.W+50
    let y1 = k.H+50

    let zoomFactor = 1 + 0.35*this.drawMethods.zoom
    let margin = 150*zoomFactor;

    sortedNodes = sortedNodes.filter(n=>{
      //if(n.kind=="tag") return false
      // let px = k.fX(n.x)
      // let py = k.fY(n.y)
      // let px = this.drawMethods.fX(n._px)
      // let py = this.drawMethods.fY(n._py)
      let px = n._px
      let py = n._py
      fr.x = Math.min(fr.x, n._px-50)
      x1 = Math.max(x1, n._px+50)
      fr.y = Math.min(fr.y, n._py-50)
      y1 = Math.max(y1, n._py+50)
      n.visible = py>=-margin && py<=k.H+margin && px>=-margin && px<=k.W+margin
      return n.visible
    })

    fr.width = x1-fr.x
    fr.height = y1-fr.y

    sortedNodes.forEach(n=>{pol.push(new _.P(n._px, n._py))})

    //console.log("[HV] pol:", pol)

    //testing for errors
    var mem = {}
    pol.forEach(p=>{let id = p.x+"_"+p.y; if(mem[id]){console.log("[HV] REPEATED POINT", p.x, p.y); p.x+=Math.random()}; mem[id]=true})

    //console.log("pol.length", pol.length)

    if(pol?.length>2){
      var errorOnVoronoi = false;
      try{
        var vor = voronoi(pol, fr)
        //console.log("voronoi.length", voronoi.length)
        //if() console.log("voronoi[0].length"voronoi[0].length)
      } catch(e){
        //console.log("voronoi error:", e)
        errorOnVoronoi = true;
      }
      if(!errorOnVoronoi) sortedNodes.forEach((n,i)=>n.cell=vor[i].length>2?vor[i]:n.cell)
    }

  //console.log(this.net.nodes.getPropertyValues("cell").getPropertyValues("length").join(","))
  }

  _loadImageForNode(nd){
    if(!nd.urlImage || nd.imgLoadStarted) return
      nd.imgLoadStarted=true
      //console.log("[HV] _loadImageForNode nd.urlImage:", nd.urlImage)
      _.loadImage(nd.urlImage, o=>{nd.image=o.result; console.log("   image loaded:", nd.name, nd.image.width)})
  }
}









