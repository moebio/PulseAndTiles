//api documentation: https://github.com/dataarts/dat.gui/blob/master/API.md#Controller+listen


buildGuiFromObject = function(object, callBack){
	let gui = new dat.GUI({autoPlace:false})

	const meta_sufixes = ["_VALUES","_MIN","_MAX","_STEP","_LABEL","_TYPE","_IS_COLOR"]
	const valid_types = ["number", "string", "boolean", "array"]
	const basicTypes = ['number', 'string', 'boolean']

	gui.setObject = function(object){
		let ob = Object.assign(object)

		this._removeControllers()

		var _changeFunction = function(val, control){
			let changesParamName
			let changedParamValue
			let newValue
			let arrayValues = []

			let property = labels_dictionary[control.property]??control.property
			if(labels_dictionary[control.property]) ob[labels_dictionary[control.property]] = ob[control.property]

			this.changedObject = ob

			callBack({
				changedObject:ob,
				changesParamName:property,
				changedParamValue:val,
				arrayValues:_getValuesArray()
			})
		}

		var _getValuesArray = function(){
			let values = []
			for(var propName in ob){
				let type = _type(ob[propName])
				if(!valid_types.includes(type)) continue
				let isMeta = meta_sufixes.some(sfx=>propName.endsWith(sfx))
				if(!isMeta) values.push(ob[propName])
			}
			return values
		}
		
		//adapt to old syntax
		for(var propName in ob){
			let metaObject = ob[propName+"_META"]
			if(metaObject){
				for(var propNameMeta in metaObject){
					let metaProperty = "_"+propNameMeta.toUpperCase()
					if(meta_sufixes.includes(metaProperty)) ob[propName+metaProperty] = metaObject[propNameMeta]
				}
			}
		}

		//labels dictionary
		let labels_dictionary = {}
		for(var propName in ob){
			let label = ob[propName+"_LABEL"]
			if(label){
				labels_dictionary[label] = propName
			}
		}

		//build controls
		for(var propName in ob){
			let isMeta = meta_sufixes.some(sfx=>propName.endsWith(sfx))
			if(isMeta) continue

			let isAnnotation = propName.startsWith("_")
			if(isAnnotation) continue

			let type = _type(ob[propName])

			label = ob[propName+"_LABEL"]??propName
			ob[label] = ob[propName]

			let control
			switch(type){
				case 'number':
					control = this.add(ob, label)
					if(ob[propName+"_MIN"]!=null) control = control.min(ob[propName+"_MIN"])
					if(ob[propName+"_MAX"]!=null) control = control.max(ob[propName+"_MAX"])
					if(ob[propName+"_STEP"]!=null) control = control.step(ob[propName+"_STEP"])
					if(ob[propName+"_VALUES"]) control = control.options(ob[propName+"_VALUES"])
					break
				case 'string':
					if(ob[propName+"_IS_COLOR"]!=null){
						control = this.addColor(ob, label)
					} else {
						control = this.add(ob, label)
						if(ob[propName+"_VALUES"]) control = control.options(ob[propName+"_VALUES"])
					}
					break
				case 'boolean':
					control = this.add(ob, label)
					break
				case 'function':
				case 'array':
					if(ob[propName+"_IS_COLOR"]!=null){
						control = gui.addColor(ob, label)
					} else {
					}
					break
			}

			if(control!=null) control.onChange(ch => _changeFunction(ch, control))
		}
	}

	gui.setDimensions = function(x,y,w=300,h){
		if(h){
			if(!gui.onDiv){
				document.body.removeChild(gui.domElement)
				gui.divContainer.appendChild(gui.domElement)
				document.body.appendChild(gui.divContainer)
				gui.closeParent.removeChild(gui.__closeButton)
				gui.onDiv = true
			}
		} else {
			if(gui.onDiv){
				gui.divContainer.removeChild(gui.domElement)
				document.body.removeChild(gui.divContainer)
				document.body.appendChild(gui.domElement)
				gui.closeParent.addChild(gui.__closeButton)
				gui.onDiv = false
			}
		}

		gui.width = w

		if(h){
			let hText = `height:${h}px;`
			gui.divContainer.style=`position: absolute; left:${x}px; top:${y}px; ${hText} width:${w}px; overflow: auto; background-color:black`
			
		} else {
			gui.domElement.style=`position: absolute; left:${x}px; top:${y}px; width:${w}px;`
		}
	}

	gui.getHeight = function(){
		return this.domElement.clientHeight
	}

	gui.getChangedObject = function(){
		return this.changedObject
	}


	

	gui._removeControllers= function(object){
		while(this.__controllers.length>0) this.remove(this.__controllers[0])
	}

	let _type = function(obj){
		if(Array.isArray(obj)) return "array"
		return typeof obj
	}

	

	
	
	gui.setObject(object)
	
	let div = document.createElement('div')
	document.body.appendChild(gui.domElement)
	
	gui.divContainer = div
	gui.onDiv = false

	gui.closeParent = gui.__closeButton.parentElement
	
	return gui
}