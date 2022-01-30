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

		//var node;
		//var nNodes = this.view.net.nodes.length;
		// for(var i=0; i<nNodes; i++){
		// 	node= network.nodes[i];
		// 	node.xS = node.x;
		// 	node.yS = node.y;
		// 	//node.placed=true;
		// }

		var dr = this.view.config.layout.r_spanning_circles
		var level
		var nd
		var r

		// selectedNode.xF = this.k.invfX(this.k.cX)//selectedNode.x;
		// selectedNode.yF = this.k.invfY(this.k.cY)//selectedNode.y;
		selectedNode.xF = this.drawMethods.invfX(this.k.cX)//selectedNode.x;
		selectedNode.yF = this.drawMethods.invfY(this.k.cY)//selectedNode.y;
		var __mark = Math.random();
		var current_angles;
		for(var i=0; i<this.N_LEVELS_TREE; i++){
			level = tree.getLevel(i);
			current_angles = new _.nL()
			level.forEach((n,j)=>{nd = this.view.net.get(level[j].id); current_angles[j]=Math.atan2(nd.y-selectedNode.y, nd.x-selectedNode.x) /*;console.log("<level[j].id>", level[j].id); console.log("<nd>", nd.y,nd.x); console.log("<selectedNode>", selectedNode.y,selectedNode.x);*/ });
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
				//console.log(i, level[j].name, nd.xF, nd.yF);
			}
		}

		let out = this.view.net.nodes.filter(n=>n.__mark!=__mark)
		da = Math.PI*2/out.length;
		r = (i+1)*dr;
		out.forEach((nd,j)=>{let r2 = r + Math.random()*dr; nd.xF = selectedNode.xF + r2*Math.cos(da*j+da*0.5); nd.yF = selectedNode.yF + r2*Math.sin(da*j+da*0.5)})
		
		this.view.net.relations.forEach(r=>{r._onTree=Math.abs(r.node0._level-r.node1._level)==1; r._minLevelOnTree = Math.min(r.node0._level, r.node1._level)})
		//this.view.net.relations.forEach(r=> {if(Math.abs(r.node0._level-r.node1._level)==1) r._onTree=true}  )
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
		

		// selectedNode.xF = this.k.invfX(direction_to?this.k.W*0.2:this.k.W*0.8)
		// selectedNode.yF =  this.k.invfY(this.k.cY)
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

		// let xCenter = this.k.invfX(this.k.cX)
		// let yCenter = this.k.invfY(this.k.cY)
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

	placeNodesInClusters = function(){
		this.view.layoutClusters = true
		this.view._FORCES_ACTIVE = false

		let clusters = this.view.net.clusters
		if(clusters==null){
			clusters = _.buildNetworkClusters(this.view.net, 0, null, null, false, 0)
			clusters = clusters.getSortedByProperty("length", false)
			this.view.net.clusters = clusters
		}
		let bigWeights = new _.nL()

		for(let i=0; i<clusters.length; i++){
			bigWeights[i] = clusters[i].length
		}

		let bigCircles = _.packingCircles(bigWeights, new _.Rec(-this.k.W*0.75, -this.k.H*0.75, this.k.W*2.5, this.k.H*2.5))
		let bigRecs = bigCircles.map(c=>new _.Rec(c.x-c.z,c.y-c.z,c.z*2, c.z*2))

		clusters.circles = bigCircles

		for(let i=0; i<clusters.length; i++){
			bigWeights[i] = clusters.length
			clusters[i].weights = new _.nL()
			for(let j=0; j<clusters[i].length; j++){
				clusters[i].weights[j] = clusters[i][j].weight
			}
			clusters[i].circles = _.packingCircles(clusters[i].weights, bigRecs[i])

			clusters[i].forEach((node,j)=>{
				node.xF = clusters[i].circles[j].x
				node.yF = clusters[i].circles[j].y
			})
		}


	}
}
