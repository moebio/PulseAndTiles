import '../../pulse.js'
export default class Layouts{

	constructor(view) {
		this.view = view
		this.k = view.k
		this.drawMethods = view.drawMethods
	}

	placeNodesInSpanningTree(selectedNode){
		var tree = _.spanningTree(this.view.net, selectedNode)
		this.N_LEVELS_TREE = tree.nLevels

		var dr = this.view.config.layout.r_spanning_circles
		var level
		var nd
		var r

		selectedNode.xF = this.drawMethods.invfX(this.k.cX)//selectedNode.x;
		selectedNode.yF = this.drawMethods.invfY(this.k.cY)//selectedNode.y;
		var __mark = Math.random();
		var current_angles;
		for(var i=0; i<this.N_LEVELS_TREE; i++){
			level = tree.getLevel(i);
			current_angles = new _.nL()
			level.forEach((n,j)=>{nd = this.view.net.get(level[j].id); current_angles[j]=Math.atan2(nd.y-selectedNode.y, nd.x-selectedNode.x)});
			level = level.getSortedByList(current_angles);

			var da = Math.PI*2/level.length;
			r = i*dr;
			for(let j=0; j<level.length; j++){
				nd = this.view.net.get(level[j].id);
				if(nd==null) continue
				nd.xF = selectedNode.xF + r*Math.cos(da*j+da*0.5-Math.PI)
				nd.yF = selectedNode.yF + r*Math.sin(da*j+da*0.5-Math.PI)
				nd.__mark = __mark
				nd._level = i
			}
		}

		let out = this.view.net.nodes.filter(n=>n.__mark!=__mark)
		da = Math.PI*2/out.length;
		r = (i+1)*dr;
		out.forEach((nd,j)=>{let r2 = r + Math.random()*dr; nd.xF = selectedNode.xF + r2*Math.cos(da*j+da*0.5); nd.yF = selectedNode.yF + r2*Math.sin(da*j+da*0.5)})
		
		this.view.net.relations.forEach(r=>{r._onTree=Math.abs(r.node0._level-r.node1._level)==1; r._minLevelOnTree = Math.min(r.node0._level, r.node1._level)})
	}

	placeNodesInImpact(selectedNode){
		var dx = 180
		var dy = 50
		var level

		this.view.net.relations.forEach(r=>r._thickFactor = 0)

		let direction_to = this.view.config.layout.selection_mode=="impact_to"
		let influenceObject = _.influenceLevels(this.view.net, selectedNode, direction_to)

		let levelsTableMain = influenceObject.levelsTableMain
		let levelsTableSecondary = influenceObject.levelsTableSecondary
		let notImpacted = influenceObject.notImpacted
		let influenceRelations = influenceObject.influenceRelations
		let extendedInfluenceRelations = influenceObject.extendedInfluenceRelations
		

		this.view.net.relations.forEach(r=>{if(r.node0==selectedNode || r.node1==selectedNode) r._thickFactor = 0.6})
		extendedInfluenceRelations.forEach(r=>r._thickFactor = 1.2)
		influenceRelations.forEach(r=>r._thickFactor = 2.2)
		
		selectedNode.xF = this.drawMethods.invfX(direction_to?this.k.W*0.2:this.k.W*0.8)
		selectedNode.yF =  this.drawMethods.invfY(this.k.cY)

		let i, j
		let direction = direction_to?1:-1
		for(i=0; i<levelsTableMain.length; i++){
			for(j=0; j<levelsTableMain[i].length; j++){
				levelsTableMain[i][j].xF = selectedNode.xF + dx*i*direction
				levelsTableMain[i][j].yF = selectedNode.yF + dy*(j-(levelsTableMain[i].length-1)*0.5)
			}
		}
		
		for(i=0; i<levelsTableSecondary.length; i++){
			for(j=0; j<levelsTableSecondary[i].length; j++){
				levelsTableSecondary[i][j].xF = selectedNode.xF - (dx*i + dx*0.5)*direction
				levelsTableSecondary[i][j].yF = selectedNode.yF + dy*(j-(levelsTableSecondary[i].length-1)*0.5)
			}
		}

		for(i=0; i<notImpacted.length; i++){
			notImpacted[i].xF = selectedNode.xF - (levelsTableSecondary.length+1)*dx*direction
			notImpacted[i].yF = selectedNode.yF + dy*(i-(notImpacted.length-1)*0.5)*0.5
		}
	}

	placeNodesInShortestPaths = function(node0, node1, paths){
		
		let nPaths = paths.length
		let lPaths = paths[0].length

		let DY = this.k.H*0.1 + Math.min(nPaths, 10)*this.k.H*0.05
		let DX = this.k.W*0.3 + Math.min(lPaths, 10)*this.k.W*0.05

		this.view.net.nodes.forEach(n=>n._inPath=false)
		paths.forEach((p,i)=>{
			p.forEach((n,j)=>{
				n._inPath = true
				n._iPath = i
				n._posInPath = j
				n._lPath = p.length
			})
		})

		let xCenter = this.drawMethods.invfX(this.k.cX)
		let yCenter = this.drawMethods.invfY(this.k.cY)

		this.view.net.nodes.forEach(n=>{
			if(n._inPath){
				n.xF = xCenter - DX*0.5 + DX*n._posInPath/n._lPath
				n.yF = yCenter - DY*0.5 + DY*n._iPath/nPaths
			} else {
				n.xF = n._px
				n.yF = n._py<yCenter?n._py-DY*0.5:n._py+DY*0.5
			}
		})

		node0.xF = xCenter-DX*0.5
		node0.yF = yCenter
		node1.xF = xCenter+DX*0.5
		node1.yF = yCenter
	}

	
	placeNodesInClusters = function(propertyName){
		this.view.layoutClusters = true
		this.view._FORCES_ACTIVE = false
		let clusters
		if(propertyName){
			clusters = this.view.net.clustersFromProperty?this.view.net.clustersFromProperty[propertyName]:null
			if(clusters==null){
				clusters = _.groupElementsByPropertyValue(this.view.net.nodes, propertyName)
				this.view.net.clustersFromProperty = {}// {propertyName:clusters}
				this.view.net.clustersFromProperty[propertyName] = clusters
			}
		} else {
			clusters = this.view.net.clusters
			if(clusters==null){
				clusters = _.buildNetworkClusters(this.view.net, 0, null, null, false, 0)
				clusters = clusters.getSortedByProperty("length", false)
				this.view.net.clusters = clusters
			}
		}

		let bigWeights = new _.nL()

		for(let i=0; i<clusters.length; i++){
			bigWeights[i] = clusters[i].length
		}

		if(propertyName) {
			clusters = clusters.getSortedByList(bigWeights, false)
			bigWeights = bigWeights.getSorted(false)
		}

		this.view.net.lastClusters = clusters

		//this.view.net.clusters = clusters

		let cx = this.drawMethods.invfX(this.k.cX)
		let cy = this.drawMethods.invfY(this.k.cY)
		let s = this.k.H*0.5*Math.sqrt(this.view.net.nodes.length/50)
		let rec = new _.Rec(cx-s, cy-s, s*2, s*2)

		let bigCircles = _.packingCircles(bigWeights, rec, this.view.config.layout.clusters_circles_margin)
		let bigRecs = bigCircles.map(c=>new _.Rec(c.x-c.z, c.y-c.z, c.z*2, c.z*2))

		clusters.circles = bigCircles

		for(let i=0; i<clusters.length; i++){
			bigWeights[i] = clusters.length
			let weights = new _.nL()
			for(let j=0; j<clusters[i].length; j++){
				weights[j] = clusters[i][j]._size
			}
			clusters[i] = clusters[i].getSortedByList(weights, false)
			//weights = weights.getSorted(false)
			//clusters[i].weights = weights
			//clusters[i].circles = _.packingCircles(weights, bigRecs[i])

			let recs = new _.L()
			clusters[i].forEach((node,j)=>{
				// node.xF = clusters[i].circles[j].x
				// node.yF = clusters[i].circles[j].y
				//this.drawMethods._dimensionsNode(node)
				recs.push(new _.Rec(0, 0, node._w_base*node._size, node._h_base*node._size))
			})

			let newRecs = recs.length==1?[bigRecs[i]]:_.packingRectangles(recs, bigRecs[i])

			//console.log(i, _.packingRectangles(recs, bigRecs[i]))

			clusters[i].forEach((node,j)=>{
				node.xF = newRecs[j].x +  0.5*newRecs[j].width
				node.yF = newRecs[j].y +  0.5*newRecs[j].height
			})

			
		}
	}

	placeNodesInCloud = function(){
		//use the type category (all nodes have same value)
		//so there will be only one cluster
		this.placeNodesInClusters("type")
	}

	/**
	 * assumes nodes have property position_x
	 */
	_nodesPropertyInterval = function(propName){

	}
	_fixedAxis = function(propertyName, y_axis=false, fixed){
		let interval = _.getPropertyValuesInterval(this.view.net.nodes, propertyName)
		if(isNaN(interval.x) || isNaN(interval.y) || interval.x==interval.y) return null

		let amp = interval.getAmplitude()
		let k = Math.sqrt(this.view.net.nodes.length/50)*this.k.H/amp
		let x0 = !fixed && interval.x>0 && amp>interval.x?0:interval.x

		let large_amp = interval.y - x0
		let order = Math.ceil(Math.log10(large_amp))
		let dx = Math.pow(10,order-1)
		if(large_amp/dx<5) dx*=0.1
		let x1 = Math.ceil(interval.y/dx)*dx
		let projection
		let inv_projection

		let fix_x0
		let dxP = (y_axis?this.drawMethods.invfY(this.k.cY):this.drawMethods.invfX(this.k.cX))
		
		if(fixed){
			fix_x0 = interval.x + amp*0.5 - dxP
			projection = x=>x - fix_x0
			inv_projection = x=>x + fix_x0
		} else {
			fix_x0 = amp*0.5*k - dxP
			projection = y_axis? x=>(interval.y-x)*k - fix_x0 : x=>(x-interval.x)*k - fix_x0
			inv_projection = y_axis? x=> interval.y - ((x+fix_x0)/k) : x=> ((x+fix_x0)/k)+interval.x
		}

		let axis = {
			interval,
			amp,
			x0,
			x1,
			dx,
			projection,
			inv_projection
		}

		return axis
	}
	placeNodesInX = function(fixed){
		this.view.fixedX = this._fixedAxis("position_x", false, fixed)
		if(this.view.fixedX==null) return
		this.view.net.nodes.forEach(n=>{
			if(n.position_x!=null) n.fixed_x = this.view.fixedX.projection(n.position_x)
		})
		this._FORCES_ACTIVE = true
		this.view.forces.friction = this.view.config.physics.friction
	}
	placeNodesInY = function(fixed){
		this.view.fixedY = this._fixedAxis("position_y", true, fixed)
		if(this.view.fixedY==null) return
		this.view.net.nodes.forEach(n=>{
			if(n.position_y!=null) n.fixed_y = this.view.fixedY.projection(n.position_y)
		})
		this._FORCES_ACTIVE = true
		this.view.forces.friction = this.view.config.physics.friction
	}
	placeNodesInXY = function(){
		this.placeNodesInX()
		this.placeNodesInY()
	}
	freeNodesInX = function(){
		this.view.fixedX = null
		this.view.net.nodes.forEach(n=>n.fixed_x=null)
		this._FORCES_ACTIVE = true
		this.view.forces.friction = this.view.config.physics.friction
	}
	freeNodesInY = function(){
		this.view.fixedY = null
		this.view.net.nodes.forEach(n=>n.fixed_y=null)
		this._FORCES_ACTIVE = true
		this.view.forces.friction = this.view.config.physics.friction
	}
	freeNodesInXY = function(){
		this.view.fixedX = null
		this.view.fixedY = null
		this.view.net.nodes.forEach(n=>n.fixed_x=null)
		this.view.net.nodes.forEach(n=>n.fixed_y=null)
		this._FORCES_ACTIVE = true
		this.view.forces.friction = this.view.config.physics.friction
	}

	fitInWindow = function(){
		let x0 = 999999
		let y0 = 999999
		let x1 = -999999
		let y1 = -999999

		this.view.net.nodes.forEach(n=>{
			x0 = Math.min(x0, n.x)
			x1 = Math.max(x1, n.x)
			y0 = Math.min(y0, n.y)
			y1 = Math.max(y1, n.y)
		})

		let ampx = x1-x0
		let ampy = y1-y0

		this.view.net.nodes.forEach(n=>{
			n.xF = this.k.W*(n.x-x0)/ampx
			n.yF = this.k.H*(n.y-y0)/ampy
			if(n.fixed_x) n.fixed_x = n.xF
			if(n.fixed_y) n.fixed_y = n.yF
		})

	}

	center = function(){
		let barx = 0
		let bary = 0

		this.view.net.nodes.forEach(n=>{
			barx+=(n.x+this.drawMethods.x0)
			bary+=(n.y+this.drawMethods.y0)
		})

		barx/=this.view.net.nodes.length
		bary/=this.view.net.nodes.length

		this.drawMethods.x0 -= barx - this.k.cX
		this.drawMethods.y0 -= bary - this.k.cY
	}
}
