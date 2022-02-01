import '../../pulse.js'
export default class Draw{

	constructor(view) {
		this.view = view
		this.k = view.k

		this.zoom = 1
		this.nodes_zoom = 1//static, given by configuration
		this.nodesSize = 1//dynamic, affected by zoom
		this.x0 = 0
		this.y0 = 0

		this.iCircle
	}

	///////GENERAL

	draw(){
		//console.log("[NV Dr]")
		let view = this.view
		if(this.k==null || view.net==null) return


		this.k.fill(view.config.view.background)
		//this.k._fRect(0,0,this.k.W,this.k.H)
		this.k.fRect(0,0,this.k.W,this.k.H)

		if(view._FORCES_ACTIVE){
			if(view.forces.friction>0.2){
				view.forces.friction*=0.995
				view.forces.calculateAndApplyForces()
			}
		}
		
		if(view.selectedNode || view.pairSelected || view.layoutClusters) view.net.nodes.forEach(n=>{n.x=0.95*n.x+0.05*n.xF; n.y=0.95*n.y+0.05*n.yF})

		let cursor_level
		if(view.selectedNode && view.config.layout.selection_mode=="spanning_tree") cursor_level = this._drawSpanningCircles()

		if(view.layoutClusters) this._drawClustersCircles()

		//view.recMap.width /= (view.recMap.width/this.k.W)/(view.recMap.height/this.k.H)
		//this.k.mapCanvas(view.recMap)
		//view.zoom = this.k.W/view.recMap.width

		//view.nodesSize = view.nodes_zoom*(view.NODES_DYNAMIC_ZOOM?view.zoom:1)
		this.nodesSize = this.nodes_zoom*(view.NODES_DYNAMIC_ZOOM?this.zoom:1)

		let prevNodeOver = view.overNode
		let prevRelationOver = view.overRelation
		view.overNode = null
		view.overRelation = null
		view.d2MinToCursor = 99999999
		view.closestNode = null
		view.drawTooltip = false


		///////////projection and draw
		
		//projection
		view.net.nodes.forEach(nd=>this.projectAndPrepareNode(nd))

		if(view.pairSelected){
			this.drawSuperPressedNode(view.pairSelected.node0, view.pairSelected.node1)
		} else if(this.superPressedNode0){
			this.drawSuperPressedNode(this.superPressedNode0, this.superPressedNode1)
		}

		view.net.relations.forEach(r=>this.drawRelation(r, prevNodeOver, cursor_level))
		view.net.nodes.forEach(nd=>{if(nd._visible) this.drawNode(nd)})

		if(view.overNode) view.overRelation = null

		if(view.OVER_CLOSEST){
			view.overNode = view.closestNode
		}

		if(view.overNode){
			this.drawNodeOver(view.overNode)
			if(view.config.nodes.tooltip){
				this.k.setCursor('pointer')
				view.tooltip.setData(view.overNode[view.config.nodes.tooltip_property])
				view.drawTooltip = true
			}
		}
		if(view.selectedNode) this.drawNodeSelected(view.selectedNode)

		//interaction 1
		if(this.pressedNode && (this.k.SHIFT_PRESSED || view.config.nodes.draggable) ){
			// this.pressedNode.x = this.k.invfX(this.k.mX)
			// this.pressedNode.y = this.k.invfY(this.k.mY)
			this.pressedNode.x = this.invfX(this.k.mX)
			this.pressedNode.y = this.invfY(this.k.mY)
			
			this.pressedNode.vx = 0
			this.pressedNode.vy = 0
			view._FORCES_ACTIVE = true
			view.forces.friction = 0.9
		} else {
			if(this.superPressedNode0){
				if(!view.overNode) this.superPressedNode1 = null
				//this.drawSuperPressedNode(this.superPressedNode0, this.superPressedNode1)
			} else {
				// var expansion = (!view.config.interaction.shift_nodes_zoom || !this.k.SHIFT_PRESSED)?Math.max(1-this.k.WHEEL_CHANGE*0.1, 0.1):1// !!!! expansion > 1 zoom decreases 
				
				// if(expansion!=1 && !(expansion<1 && view.zoom>view.ZOOM_MAX) && !(expansion>1 && view.zoom<view.ZOOM_MIN)){
				// 	view.recMap = view.recMap.expand(expansion, view.zoomPoint)
				// }
				// view.recMap.x-=this.k.DX_MOUSE_PRESSED*view.recMap.width/this.k.W
				// view.recMap.y-=this.k.DY_MOUSE_PRESSED*view.recMap.height/this.k.H
			}
		}

		// view.zoomPoint.x = view.ZOOM_TO_CURSOR?this.k.invfX(this.k.mX):this.k.invfX(this.k.cX)
		// view.zoomPoint.y = view.ZOOM_TO_CURSOR?this.k.invfY(this.k.mY):this.k.invfY(this.k.cY)
		// view.zoomPoint.x = view.ZOOM_TO_CURSOR?this.invfX(this.k.mX):this.invfX(this.k.cX)
		// view.zoomPoint.y = view.ZOOM_TO_CURSOR?this.invfY(this.k.mY):this.invfY(this.k.cY)

		//interaction 2
		if(view.overNode && this.k.MOUSE_DOWN){
			this.pressedNode = view.overNode
			this.pressedNode._xWhenPressed = this.k.mX
			this.pressedNode._yWhenPressed = this.k.mY
		}

		//super pressing a node for connecting with another
		if(this.pressedNode && view.overNode && this.k.T_MOUSE_PRESSED>200){
			let dx_sincepressed = Math.abs(this.pressedNode._xWhenPressed - this.k.mX)
			let dy_sincepressed = Math.abs(this.pressedNode._yWhenPressed - this.k.mY)
			if(dx_sincepressed<2 && dy_sincepressed<2){
				this.superPressedNode0 = this.pressedNode
				this.pressedNode = null
			}
		}
		//console.log(this.superPressedNode0!=null, view.overNode!=null, this.k.T_MOUSE_PRESSED>100, this.k.DX_MOUSE_DRAGGED<20,this.k.DY_MOUSE_DRAGGED<20)
		if(this.superPressedNode0 && view.overNode && view.overNode!=this.superPressedNode0) this.superPressedNode1 = view.overNode

		if(this.k.MOUSE_UP){
			this.pressedNode = null
			if(this.superPressedNode1){
				view.selectPair(this.superPressedNode0, this.superPressedNode1)
			}
			this.superPressedNode0 = null
			this.superPressedNode1 = null
			
		}

		if(this.k.MOUSE_UP_FAST){
			if(view.overRelation){
				view.relationSelected(view.overRelation)
				view.selectPair(view.overRelation.node0, view.overRelation.node1, false)
			} else if(view.selectedNode && view.config.interaction.node_unselection=="anywhere" && (!view.overNode || view.overNode==view.selectedNode)){
				view.nodeUnSelected()
			} else if(view.overNode && view.overNode == view.selectedNode && view.config.interaction.node_unselection=="over_selected"){
				view.nodeUnSelected()
			} else if(view.overNode){
				view.nodeSelected(view.overNode)
			} else if(view.pairSelected){
				view.pairUnSelected()
			} else if(view.layoutClusters){
				view._FORCES_ACTIVE = true
				view.forces.friction = 0.9
				view._resetThickFactor()
			}
			view.layoutClusters = false
		}

		if(this.k.WHEEL_CHANGE && !this.k.SHIFT_PRESSED){
			this.MIN_ZOOM = 0.01
			this.MAX_ZOOM = 100

			 let zoomChange = 1 + 0.3*this.k.WHEEL_CHANGE
			 //console.log("this.zoom, zoomChange", this.zoom, this.k.WHEEL_CHANGE, zoomChange)
		   if(this.zoom*zoomChange>=this.MAX_ZOOM || this.zoom*zoomChange<=this.MIN_ZOOM) zoomChange = 1;
		   this.zoom *= zoomChange;
		   this.zoom = Math.max(Math.min(this.zoom, this.MAX_ZOOM), this.MIN_ZOOM);
		   this.x0 = (this.x0 - this.k.mX)*zoomChange + this.k.mX;
		   this.y0 = (this.y0 - this.k.mY)*zoomChange + this.k.mY

		   //console.log("this.zoom, ", this.zoom, this.nodesSize, this.nodes_zoom)
		}
		if(!this.pressedNode && !this.superPressedNode0 && this.k.MOUSE_PRESSED){
       this.x0+=this.k.DX_MOUSE_PRESSED
       this.y0+=this.k.DY_MOUSE_PRESSED
    }

		//if(this.k.SHIFT_PRESSED && view.config.interaction.shift_nodes_zoom) view.nodes_zoom*=(1+this.k.WHEEL_CHANGE*0.1)
		if(this.k.SHIFT_PRESSED && view.config.interaction.shift_nodes_zoom) this.nodes_zoom*=(1+this.k.WHEEL_CHANGE*0.1)
		
		
		if(view.overNode!=prevNodeOver && view.overNode) view.nodeOver(view.overNode)
		if(view.overRelation!=prevRelationOver && view.overRelation) view.relationOver(view.overRelation)
		if(view.drawTooltip) view.tooltip.draw()
	}

	///////NODES
	drawNodeBeforeRelations(nd){
		//if(Math.random()<0.1) console.log("[NV Dr] drawNodeBeforeRelations")
	}

	drawNode(nd){
		let view = this.view
		let k = this.k

		switch(view.config.nodes.color_mode){
			case 'text':
				if(nd._ts*view.zoom<5) return
				k.setText(nd.color??view.config.nodes.text_color, nd._ts, null, 'center', 'middle')
				k.stroke(view.config.nodes.text_border_color, 3)
				k.context.font = nd._ts+"px "+view.config.nodes.font
				k.fsText(nd.name, nd._px, nd._py, 3)
				return
			case 'box':
				k.setText(nd.color??view.config.nodes.text_color, nd._ts, null, 'center', 'middle')
				if(view.config.nodes.useColorsTable && nd.colorsTable[0].length>1){
					let x = nd._px-nd._w*0.5
					let w
					//console.log(nd.colorsTable[0].length)
					nd.colorsTable[0].forEach((color,i)=>{
						k.fill(color)
						w = nd._w*nd.colorsTable[1][i]
						//k._fRect(x, nd._py-nd._h*0.5, w, nd._h)
						k.fRect(x, nd._py-nd._h*0.5, w, nd._h)
						x+=w
					})
				} else {
					//k._fRect(nd._px-nd._w*0.5, nd._py-nd._h*0.5, nd._w, nd._h)
					k.fRect(nd._px-nd._w*0.5, nd._py-nd._h*0.5, nd._w, nd._h)
				}
				
				k.fill(view.config.nodes.box_color)
				if(nd._ts*view.zoom<5) return
				k.context.font = nd._ts+"px "+view.config.nodes.font
				k.fText(nd.name, nd._px, nd._py, 3)
				return
		}

	}

	projectAndPrepareNode(nd){
		this._projectionNode(nd)
		if(!nd._visible) return

		let view = this.view
		
		if(view.NODES_CLOSE_ZOOM || view.OVER_CLOSEST){
			var d2 = (this.k.mX-nd._px)**2 + (this.k.mY-nd._py)**2
			nd._distanceToCursor2 = d2
		}

		this._dimensionsNode(nd)
		
		if(view.OVER_CLOSEST){
			if(d2<view.d2MinToCursor){
				view.closestNode = nd
				view.d2MinToCursor = d2
			}
		} else {
			if(this.isOverNode(nd)) view.overNode = nd
		}

		this.drawNodeBeforeRelations(nd)
	}

	isOverNode(nd){
		return this.k.mY>nd._py-nd._h*0.5 && this.k.mY<nd._py+nd._h*0.5 && this.k.mX>nd._px-nd._w*0.5 && this.k.mX<nd._px+nd._w*0.5
	}

	fX = function(x){
		return x*this.zoom + this.x0
	}
	fY = function(y){
		return y*this.zoom + this.y0
	}

	invfX = function(x){
		return (x - this.x0)/this.zoom
	}
	invfY = function(y){
		return (y - this.y0)/this.zoom
	}
	

	_projectionNode(nd){
		// nd._px = this.k.fX(nd.x)
		// nd._py = this.k.fY(nd.y)
		nd._px = this.fX(nd.x)
		nd._py = this.fY(nd.y)
		nd._visible = nd._py>=-this.view.config.layout.margin_for_visibility && nd._py<=this.k.H+this.view.config.layout.margin_for_visibility && nd._px>=-this.view.config.layout.margin_for_visibility && nd._px<=this.k.W+this.view.config.layout.margin_for_visibility
		
		// nd.ax += -0.001*nd.x
		// nd.ay += -0.001*nd.y
	}

	_dimensionsNode(nd){
		nd._s = this.nodes_zoom*nd._size*(this.view.NODES_CLOSE_ZOOM?(0.5 + 0.6*5000/(4000+nd._distanceToCursor2))*this.nodesSize:this.nodesSize)
		nd._w = nd._w_base*nd._s
		nd._h = (this.view.config.nodes.text_size+this.view.config.nodes.box_padding*2)*nd._s
		nd._ts = 12*nd._s
	}

	drawNodeOver(nd, color, thick){
		this.drawNode(nd)//, dim)
		this.k.stroke(color?color:this.view.config.nodes.box_border_color, thick?thick:2*this.nodesSize)
		//this.k._sRect(nd._px-nd._w*.5, nd._py-nd._h*.5, nd._w, nd._h)
		this.k.sRect(nd._px-nd._w*.5, nd._py-nd._h*.5, nd._w, nd._h)
	}

	drawNodeSelected(nd){
	}

	drawSuperPressedNode(spNd, spNd2){
     	this.drawNodeOver(spNd, 'black', 8)

      this.k.stroke('rgba(0,0,0,0.3)', 2)
			this.k.context.setLineDash([5, 10])

      if(spNd2){
      	this.k.line(spNd._px, spNd._py, spNd2._px, spNd2._py)
      	this.k.context.setLineDash([])
        this.drawNodeOver(spNd2, 'black', 6)
      } else {
      	//this.k._line(spNd._px, spNd._py, this.k.mX, this.k.mY)
      	this.k.line(spNd._px, spNd._py, this.k.mX, this.k.mY)
      	this.k.context.setLineDash([])
      }

      
	}


	///////RELATIONS

	drawRelation(rel, prevNodeOver, cursor_level){
		//console.log(!rel.node0._visible, !rel.node1._visible, rel._thickFactor==0)
		/////////relation visibility

		//nodes are not visible
		if( (!rel.node0._visible && !rel.node1._visible) || rel._thickFactor==0 ) return
		
		let view = this.view
	
		//over node not in relation
		
		
		if(view.selectedNode){

			switch(view.config.layout.selection_mode){
				case "spanning_tree":
					//relation not in spanning tree
					if(view.selectedNode && !rel._onTree) return
					//cursor out of level in spanning tree
					if(view.config.relations.show_mode_on_layout=="context" && cursor_level!=null && Math.abs(rel._minLevelOnTree-cursor_level)>1 ) return
					break
				case "impact_to":
					//relation not in impact to
					if(!rel._onImpactTo && (rel.node0!=prevNodeOver && rel.node1!=prevNodeOver)) return
					break
			}
			
		} else if(view.DRAW_ONLY_NODE_RELATIONS_ON_ROLLOVER && prevNodeOver && prevNodeOver!=rel.node0 && prevNodeOver!=rel.node1) return

		/////////


		if(view.DRAW_RELATION_CENTER){
			rel._pcenterx = (rel.node0._px+rel.node1._px)*0.5
			rel._pcentery = (rel.node0._py+rel.node1._py)*0.5
		}
		
		let weight = 0.5*rel._size

		if(view.DRAW_CLOSE_RELATIONS){
			let minDistance2 = Math.min(rel.node0._distanceToCursor2, rel.node1._distanceToCursor2)
			if(view.DRAW_RELATION_CENTER) minDistance2 = Math.min(minDistance2, (this.k.mX-rel._pcenterx)**2 + (this.k.mY-rel._pcentery)**2)
			weight*=(0.2 + 0.8*7000/(500+minDistance2))
		}
		
		//projected position pre-calculated in nodes

		//weight different if this.DRAW_RELATION_CENTER
		
		if(view.config.relations.show_mode=='close_few' && weight<0.25) return 

		let color = rel.color??view.config.relations.color??'black'
		this.k.stroke(color, weight*rel._thickFactor)
		let over
		if(view.config.relations.curvature>0){
			let a = Math.atan2(rel.node1._py-rel.node0._py, rel.node1._px - rel.node0._px) + 1.5708;
			let r = view.config.relations.curvature*Math.sqrt(Math.pow(rel.node0._px-rel.node1._px, 2)+Math.pow(rel.node0._py-rel.node1._py, 2));
			let pMx = (rel.node0._px+rel.node1._px)*0.5 + r*Math.cos(a);
			let pMy = (rel.node0._py+rel.node1._py)*0.5 + r*Math.sin(a);
			this._drawArc(rel.node0._px, rel.node0._py, pMx, pMy, rel.node1._px, rel.node1._py)
			if(view.config.relations.arrow_size>0){
				this.k.fill(color)
				var triangleCenter = this._drawTriangleOnArc(
					rel.node0._px, rel.node0._py,
					pMx, pMy,
					pMx, pMy,
					rel.node1._px, rel.node1._py,
					a-1.5708,
					(view.config.relations.arrow_size*view.zoom*rel._thickFactor*0.8+2)*rel._size
				)
			}
			if(view.config.relations.tooltip){
				over = (triangleCenter.x-this.k.mX)**2+(triangleCenter.y-this.k.mY)**2<80
				if(over){
					this._drawTriangleOnArc(
						rel.node0._px, rel.node0._py,
						pMx, pMy,
						pMx, pMy,
						rel.node1._px, rel.node1._py,
						a-1.5708,
						(view.config.relations.arrow_size*view.zoom*rel._thickFactor*0.8+4)*rel._size
					)
				}
			}
		} else {
			
			if(view.config.relations.tooltip){
				over = this.k.lineM(rel.node0._px, rel.node0._py, rel.node1._px, rel.node1._py);
				//let line_center = new _.P((rel.node0._px+rel.node1._px)*0.5, (rel.node0._py+rel.node1._py)*0.5)
				//over = (line_center.x-this.k.mX)**2+(line_center.y-this.k.mY)**2<80
				if(over){ // this should be done after drawing all relations
					this.k.stroke(color, weight*rel._thickFactor*3)
					this.k.line(rel.node0._px, rel.node0._py, rel.node1._px, rel.node1._py)
				}
			} else {
				this.k.line(rel.node0._px, rel.node0._py, rel.node1._px, rel.node1._py)
			}
			if(view.config.relations.arrow_size>0){
				//TBD: straight lines with arrows
			}
		}

		if(view.DRAW_RELATION_CENTER && weight>0.8){
			this.k.fill(color)
			over = this.k.fCircleM(rel._pcenterx, rel._pcentery, Math.min(weight*2,7))
		}
		if(over && view.config.relations.tooltip){
			this.k.setCursor('pointer')
			view.tooltip.setData(rel[view.config.relations.tooltip_property])
			view.drawTooltip = true
			view.overRelation = rel
		}
	}


	///////OTHER

	_drawArc(x0, y0, pMx, pMy, x1, y1){
		this.k.bezier(
			x0, y0,
			pMx, pMy,
			pMx, pMy,
			x1, y1
		);
	}

	_drawTriangleOnArc(x0, y0, c0x, c0y, c1x, c1y, x1, y1, angle, scale){
		var p = _.bezierCurvePoints(x0, y0, c0x, c0y, c1x, c1y, x1, y1, 0.5);
		this.k.fEqTriangle(p.x, p.y, angle, scale)
		return p
	}

	_drawSpanningCircles(){

		for(let i=1; i<this.view.layouts.N_LEVELS_TREE; i++){
			this._drawDashedCircle(this.view.selectedNode._px, this.view.selectedNode._py, this.zoom*this.view.config.layout.r_spanning_circles*i)
		}
		let r_cursor = Math.sqrt((this.k.mX-this.view.selectedNode?._px)**2+(this.k.mY-this.view.selectedNode?._py)**2)/this.view.zoom

		return Math.floor(r_cursor/this.view.config.layout.r_spanning_circles)
	}

	_drawClustersCircles(){
		if(!this.view.net.clusters) this.view.layouts.placeNodesInClusters()
			let prev_iCircle = this.iCircle
		this.iCircle=-1
		let x, y, r
		let inCluster
		this.view.net.clusters.circles.forEach((circle,i)=>{
			//console.log(this.fX(circle.x), this.fY(circle.y), circle.z*this.zoom)
			x = this.fX(circle.x)
			y = this.fY(circle.y)
			r = circle.z*this.zoom
			this._drawDashedCircle(x, y, r)
			if((this.k.mX-x)**2+(this.k.mY-y)**2<r**2){
				this.iCircle=i
				inCluster = this.view.net.clusters[i]
			}
		})

		//change relations thickness
		if(prev_iCircle!=this.iCircle){
			this.view.net.relations.forEach(r=>r._thickFactor=0)
			inCluster?.forEach(n=>{
				n.relations.forEach(r=>r._thickFactor=this.view.config.relations.max_thick)
			})
		}
	}

	_drawDashedCircle(x, y, r){
		//console.log("this.view.config.relations.color", this.view.config.relations.color)
		this.k.stroke(this.view.config.relations.color||'black', 1)
		this.k.context.setLineDash([5, 10])
		//for(let i=0; i<this.view.layouts.N_LEVELS_TREE; i++){
			this.k.sCircle(x, y, r);
		//}
		this.k.context.setLineDash([]);
	}

}