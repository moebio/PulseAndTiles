//import * as _ from '../../assembled.js'
import '../../pulse.js'
import Draw from './Draw.js'
import Layouts from './Layouts.js'

export default class NetView{

	constructor(k, callBackSendData, config) {//extends View
		//super(...args) //when extending View

		this.k = k

		this.drawMethods = new Draw(this)
		this.layouts = new Layouts(this)

		this.callBackSendData = callBackSendData

		this.forces = new _.Forces()
  
		this.config = config?Object.assign(NetView.defaultConfig, config):NetView.defaultConfig
		this.setConfiguration(this.config)

		////params
		
  
		this.OVER_CLOSEST = false
		this._FORCES_ACTIVE = true
		this.ZOOM_TO_CURSOR = true
  		
		////
		//this.recMap = new _.Rec(0,0,k.W,k.H)
		//k.mapCanvas(this.recMap)
		//this.zoom = 1;
		//this.nodes_zoom = 1;
  
		this.zoomPoint = new _.P(k.cX, k.cY)
  
		// this.overNode
		// this.pressedNode
		// this.selectedNode
		// this.superPressedNode0
		// this.superPressedNode1
		this.pairSelected
  
		this.N_LEVELS_TREE
  
		this.net
  }

	static defaultConfig ={
		nodes:{
			text_size:14,
			text_color:'white',
			text_border_color:'white',
			box_color:'black',
			box_border_color:'black',
			box_padding:3,
			color_mode:'box',//text, box
			font:"Arial",
			size_property:"weight",
			draggable:true,
			tooltip:false,
			tooltip_property:'description',
			useColorsTable:false,
			maxSize:1
		},
		relations:{
			//draw:'node_over',//node_over,always
			show_mode:'over',//all,over,close_all,close_few
			show_mode_on_layout:'context',//all,
			curvature:0,//inactive if 0
			arrow_size:0,//inactive if 0
			color:null,
			size_property:"weight",
			tooltip:false,
			tooltip_property:'name',
			max_thick:2
		},
		physics:{
			friction:0.9,
			k:0.01,
			dEqSprings:130,
			dEqRepulsors:220
		},
		view:{
			background:'white',
			zoom_min:0.1,
			zoom_max:15,
		},
		interaction:{
			nodes_zoom:'dynamic',//static,close
			shift_nodes_zoom:true,
			node_unselection:"anywhere"//"over_selected"
		},
		layout:{
			selection_mode:'spanning_tree',//impact_from,impact_to,spanning_tree, (center)
			r_spanning_circles:120,
			margin_for_visibility:170,
			savesNodesPositionsOnBrowser:false
		}
	}

	draw(){
		this.drawMethods.draw()
	}

	receiveData(dataObj){
		//console.log("Net | dataObj", dataObj)
		switch(dataObj.type){
			case "network":
			case "data":
				this.setNetwork(dataObj.value)
				break
			case "configuration":
				this.setConfiguration(dataObj.value)
				break
			case "select":
				this.nodeSelected(dataObj.value)
				break
			case "over":
				/**
				To Be Done
				these are just tests
				**/

				let node = typeof(dataObj.value)=="string"?this.net.get(dataObj.value):dataObj.value

				//this.overNode = dataObj.value
				this.k.mX = node._px+2
				this.k.mY = node._py+2

				console.log(">>>>> node, node._px, node._py, this.k.mX, this.k.mY", node, node._px, node._py, this.k.mX, this.k.mY)
				this.drawMethods.draw(true)
				this.k.stop()

				console.log("this.overNode?.name", this.overNode?.name)
				break
			case "unselect":
				this.nodeUnSelected()
				break
			case "new_drawNode":
				this.setNewDrawNodeFunction(dataObj.value)
				break
			case "layout":
				switch(dataObj.value){
					case "clusters":
						this.layouts.placeNodesInClusters()
						break
				}
		}
	}

	setNetwork(net){
		if(this.net != net && net){
			var previous = this.net;
			var previousSelected = this.selectedNode

			this.net = net
			this.nodeUnSelected()

			let nodesHaveCoordinates = true
			let allCoordinatesZero = true
			net.nodes.forEach(nd=>{
				if(!nd._fixed){
					nd.x = null
					nd.y = null
				}
				if(nd.x==null || nd.y==null) nodesHaveCoordinates = false
				if(nd.x || nd.y) allCoordinatesZero = false

				nd._size = this.config.nodes.maxSize*(nd[this.config.nodes.size_property]||1)
			})

			net.relations.forEach(r=>r._size = r[this.config.relations.size_property]||1)

			if(allCoordinatesZero) nodesHaveCoordinates=false

			this.forces.forcesForNetwork(net, nodesHaveCoordinates?0:200, new _.P(500,400))
			//console.log("this.forces", this.forces)
			//this.k.setText('', 12)//this.config.nodes.text_size)
			this.k.context.font = "12px "+this.config.nodes.font
			this.net.nodes.forEach(nd=>nd._w_base = this.k.getTextW(nd.name)+this.config.nodes.box_padding*2)

			if(!previous && !nodesHaveCoordinates){

				if(this.config.savesNodesPositionsOnBrowser && localStorage.NetViewNodesPositions){
					console.log(">+ RETRIEVE positions")//, localStorage.NetViewNodesPositions)

					let array = localStorage.NetViewNodesPositions.split("|")

					array.forEach(ndpos=>{
						if(ndpos.length==0) return
						let parts = ndpos.split("#")
						let node = this.net.nodes.get(parts[0])
						//console.log(parts[0], node, Number(parts[1]), Number(parts[2]))
						if(node){
							node.x = node.xF = Number(parts[1])
							node.y = node.yF = Number(parts[2])
						}
					})

				} else {
					//console.log("this.forces.iterate", this.forces.iterate)
					this.forces.iterate(200)
					if(this.config.savesNodesPositionsOnBrowser){
						console.log(">+ SAVE positions")
						localStorage.NetViewNodesPositions = ''
						this.net.nodes.forEach(n=>{
							localStorage.NetViewNodesPositions += "|"+n.id+"#"+n.x.toFixed(2)+"#"+n.y.toFixed(2)
						})
					}
				}
				
			}

			if(!previous){
				//sets view center in the center of the net
				let bar_x = 0
				let bar_y = 0
				net.nodes.forEach(nd=>{
					bar_x+=nd.x/net.nodes.length
					bar_y+=nd.y/net.nodes.length
				})
				// this.recMap.x+=bar_x-this.k.W*0.5
				// this.recMap.y+=bar_y-this.k.H*0.5
			}


			if(previousSelected){
				let selectedInNewNet = net.get(previousSelected.id)
				if(selectedInNewNet) this.nodeSelected(selectedInNewNet)
			}
		}
	}

	_resetThickFactor = function(thickness=1){
		//console.log("this.net", this.net)
		//_thickFactor is used to draw thicker relations in special cases
		this.net.relations.forEach(r=>{r._thickFactor=thickness*this.config.relations.max_thick})
	}


	setConfiguration(config){
		if(config.physics?.friction) this._FORCES_ACTIVE = true

		let change_in_nodes_size_property = (this.config.nodes.size_property!=config.nodes?.size_property||this.config.nodes.maxSize!=config.nodes?.maxSize)
		let change_in_relations_size_property = this.config.relations.size_property!=config.relations?.size_property

		this.config = Object.assign(NetView.defaultConfig)//config?Object.assign(NetView.defaultConfig, config):NetView.defaultConfig
		_.deepAssign(this.config, config)

		if(change_in_nodes_size_property && this.net) this.net.nodes.forEach(n=>n._size = this.config.nodes.maxSize*(n[this.config.nodes.size_property]||1) )
		if(change_in_relations_size_property && this.net) this.net.relations.forEach(r=>r._size = r[this.config.relations.size_property])
		
		this.ZOOM_MIN = this.config.view.zoom_min
		this.ZOOM_MAX = this.config.view.zoom_max

		this.forces.k = this.config.physics.k
		this.forces.friction = this.config.physics.friction
		this.forces.dEqSprings = this.config.physics.dEqSprings
		this.forces.dEqRepulsors = this.config.physics.dEqRepulsors
		//NetView._deepAssign(this.config, config)
		
		this.NODES_DYNAMIC_ZOOM = this.config.interaction.nodes_zoom=='dynamic' || this.config.interaction.nodes_zoom=='close'
		this.NODES_CLOSE_ZOOM = this.config.interaction.nodes_zoom=='close'

		this.DRAW_ONLY_NODE_RELATIONS_ON_ROLLOVER = this.config.relations.show_mode=='over'
		this.DRAW_CLOSE_RELATIONS = this.config.relations.show_mode=='close_few' || this.config.relations.show_mode=='close_all'
		this.DRAW_RELATION_CENTER = this.config.relations.tooltip && !this.config.relations.curvature>0
		
		if(this.forces && this.config?.physics){
			this.forces.dEqSprings = this.config.physics.dEqSprings
			this.forces.dEqRepulsors = this.config.physics.dEqRepulsors
		}

		if( (this.config.relations.tooltip || this.config.nodes.tooltip) && this.tooltip==null) this.tooltip = new Tooltip(this.k)

		//unselect and select to trigger changes such as layout
		if(this.selectedNode){
			let prevSelected = this.selectedNode
			this.nodeUnSelected()
			this.nodeSelected(prevSelected)
		}
	}

	setNewDrawNodeFunction(drawNodeFunction){
		this.drawMethods.drawNode = drawNodeFunction
	}


	//actions that send data

	nodeSelected(selectedNode){
		

		if(typeof(selectedNode)=="string" ){
			selectedNode=this.net.get(selectedNode)
		}
		this._FORCES_ACTIVE = false
		if(this.pairSelected){
			this.pairSelected = null
			this._resetThickFactor()
		}
		this.selectedNode = selectedNode
		switch(this.config.layout.selection_mode){
			case 'spanning_tree':
				this.layouts.placeNodesInSpanningTree(selectedNode)
				break
			case 'impact_to':
			case 'impact_from':
				this.layouts.placeNodesInImpact(selectedNode)
				break
		}

		if(this.pairSelected) this.pairUnSelected()
		
		this.callBackSendData({type:'selected', value:selectedNode})
	}
	nodeUnSelected(){
		this._FORCES_ACTIVE = true
		this.forces.friction = 0.9

		this.selectedNode = null
		this.callBackSendData({type:'unselected', value:""})
		this._resetThickFactor()
	}
	nodeOver(overNode){
		this.callBackSendData({type:'over', value:overNode})
	}

	relationOver(overRelation){
		this.callBackSendData({type:'over relation', value:overRelation})
	}

	relationSelected(selectedRelation){
		this.callBackSendData({type:'selected relation', value:selectedRelation})
	}

	selectPair(node0, node1, sendData=true){
		

		let path = _.shortestPath(this.net, node0, node1, true)
		this.selectedNode = null

		this.pairSelected = {
			node0:node0,
			node1:node1,
			path,
			path_relations:_.getRelationsBetweenNodeLists(this.net, path, path, false)||[]
		}

		this.net.relations.forEach(r=>r._thickFactor=0.5)

		let paths = _.shortestPaths(this.net, node0, node1)||[]
		console.log("paths", paths)
		let paths_combined = new _.ndL()
		paths.forEach(nl=>paths_combined = paths_combined.concat(nl))
		_.getRelationsBetweenNodeLists(this.net, paths_combined, paths_combined, false).forEach(r=>r._thickFactor=1.2)
		
		this.pairSelected.path_relations.forEach(r=>r._thickFactor=3.2)

		this._FORCES_ACTIVE = false

		this.layouts.placeNodesInShortestPaths(node0, node1, paths)

		if(this.selectedNode) this.nodeUnSelected()

		if(sendData) this.callBackSendData({type:'selected pair', value:{node0, node1}})
	}

	pairUnSelected(){
		this.pairSelected = null
		this._FORCES_ACTIVE = true
		this.forces.friction = 0.9
		this._resetThickFactor()
	}



	//verifiers

	// nodeIsVisible(nd){
	// 	nd._visible = nd._py>=-170 && nd._py<=this.k.H+170 && nd._px>=-170 && nd._px<=this.k.W+170
	// }


	//nodes placement

	


	///////

	resize(k){
	}


	static description = function(){
	}

	static instructions = function(){
	}

	static condition = function(data){
		//data is:
		//Nt
		//T with two L
		//T with L and nLs
		//T with L and tags
	}
}
