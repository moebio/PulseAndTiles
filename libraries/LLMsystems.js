/**
 * requires pulse.js and ChatGPTApi.js
**/


/**
 * prompt -> chainFunctions[0](answer) -> chainFunctions[1](answer) ->…
**/
llm_chain = function(prompt,  chainFunctions, onLoadAll, onLoadEach){
	let nStep = 0
	const answers = []
	const prompts = []

	const next = prevAnswer=>{
		if(prevAnswer) console.log("   __applies function:", chainFunctions[nStep-1])
		const nextPrompt = prevAnswer?chainFunctions[nStep-1](prevAnswer):prompt
		prompts.push(nextPrompt)

		// console.log("\n\n\n__nextPrompt, nStep:", nStep)
		// console.log(nextPrompt)
		// console.log("__")

		nStep++
		completion(nextPrompt, ob=>{
			const answer = ob.content
			answers.push(answer)

			// console.log("__answer")
			// console.log(answer)
			// console.log("__")
			
			//ob.nPrompt = nPrompt
			onLoadEach?.(answer)

			console.log(nStep+"/"+chainFunctions.length)
			if(nStep==chainFunctions.length){
				onLoadAll(chainFunctions[nStep-1](answer))
			} else {
				next(answer)
			}
		})
	}

	next()
}



_chukenizerForEntitiesRelations = function(text, sizeChunk){
	let chunks

	if(sizeChunk){
		console.log("sizeChunk", sizeChunk)
		console.log("text.length", text.length)
		console.log("n chunks", text.length/sizeChunk)
		chunks = []
		for(let i = 0; i< text.length; i+=sizeChunk){
			chunks.push(text.substr(i, sizeChunk))
		}
	} else {
		chunks = text.split("\n")
		if(chunks.length==1){
			const nChunks = Math.ceil(text.length/500)
			for(let i=0; i<nChunks; i++){
				chunks[i] = text.substr(i*500, 520)
			}
		}
	}

	chunks = chunks.map(chunk=>chunk.trim())
	chunks = chunks.filter(chunk=>chunk)

	return chunks
}

/**
 * Extracts entities from a text or chunks, and returns a JSON Object
 * @param {array|string} array - textOrChunks from which entities will be extracted
 * @param {Function} onLoad - Callback function to be called with the result entities array.
 * @param {Boolean} addEmoji - set to true for emojis to be adde as entities property
 */
entities = function(textOrChunks, onLoad, addEmoji){
	console.log("* entities")
	if(typeof textOrChunks == "string") textOrChunks = _chukenizerForEntitiesRelations(textOrChunks)

	const emojiText =  addEmoji?`and emoji (find the best possible emoji for the entity)`:""
	const entitiesHeader = `This is a text I want to analyze and extract its entities:

`
	const entitiesFooter = `

Please provide a long and rich list, in JSON format, for all important entities (persons, cities, organizations, events…) present in the previous text, with properties type, name, description ${emojiText}

Please provide an answer without headers (like \`\`\`json), footers or comments, I need to be able to directly parse the answer
`

    const entitiesInitiator = `[
   {
      "type":"person",
      "name":"`

    let entities = []
    let nEntities = 0

	textOrChunks.forEach(chunk=>{
		console.log("* completion for chunk of length:", chunk.length)
		//completion([entitiesHeader + chunk + entitiesFooter, entitiesInitiator], ob=>{
		completion(entitiesHeader + chunk + entitiesFooter, ob=>{
			console.log("* result completion:", ob)

			const content = ob.content
			entities = entities.concat(repairAndParseJSON(content))

			//consolide: remove repetitions
			console.log("   __entities.length, nEntities:", entities.length, nEntities+"/"+textOrChunks.length)
			nEntities++
			if(nEntities==textOrChunks.length) onLoad(entities)
		})
	})
}




_areSameEntity = function(entity1, entity2){
	if(entity1.type!=entity2.type) return false
	if(entity1.name==entity2.name) return true
	if(entity2.name.indexOf(entity1.name)==0 && entity2.name.indexOf(entity1.name+"'")!=0) return true
	if(entity1.name.indexOf(entity2.name)==0 && entity1.name.indexOf(entity2.name+"'")!=0) return true
	return false
}
_areSameEntityName = function(entity1Name, entity2Name){
	if(entity1Name==entity2Name) return true
	if(entity2Name.indexOf(entity1Name)==0 && entity2Name.indexOf(entity1Name+"'")!=0) return true
	if(entity1Name.indexOf(entity2Name)==0 && entity1Name.indexOf(entity2Name+"'")!=0) return true
	return false
}


/**
 * Extracts entities from a text or chunks, and returns a JSON Object
 * @param {array|string} array - textOrChunks from which entities will be extracted
 * @param {array} entitiesList - Optional list of previously gathered entities.
 * @param {Boolean} addEmoji - set to true for emojis to be adde as entities property
 */
relations = function(textOrChunks, entitiesList, onLoad){
	const relationsHeader = `This is a text I want to analyze and extract its relations:

`
	const entities = entitiesList?"\n\nThese are the previously extracted entities:\n"+entitiesList.map(entity=>entity.name).join("\n"):""
	const relationsFooter = `

Please provide a JSON array with a comprehensive and detailed list of relations present in the previous text, each Object in the array has the properties entity1, entity2 and description. Every relation between people, events, objects… is important, don't leave anything out.
Please provide an answer without headers (like \`\`\`json), footers or comments, I need to be able to directly parse the answer
`
	const relationsInitiator = `[
   {
      "entity1":"`

    let relations = []
    let nRelations = 0

	textOrChunks.forEach(chunk=>{
		//completion([relationsHeader + chunk + entities + relationsFooter, relationsInitiator], ob=>{
		completion(relationsHeader + chunk + entities + relationsFooter, ob=>{
			relations = relations.concat(repairAndParseJSON(ob.content))

			//consolide: remove repetitions
			console.log("   __relations.length, nRelations:", relations.length, nRelations+"/"+textOrChunks.length)
			nRelations++
			if(nRelations==textOrChunks.length) onLoad(relations)
		})
	})

}

/**
 * Extracts entities and relations from a text, and returns a JSON Object
 * @param {string} text - text from which it extracts a list of entities and relations.
 * @param {Function} onLoad - Callback function to be called with the result object.
 * @param {Boolean} addEmoji - set to true for emojis to be adde as entities property
 */
entitiesRelations = function(text, onLoad, addEmoji){
	const chunks = _chukenizerForEntitiesRelations(text, 8000)

	console.log("__chunks:")
	console.log(chunks)

	const adjustEntityInRelation = (entityName, entitiesNamesDic)=>{
		if(entityName==null || entitiesNamesDic==null) return
		if(entitiesNamesDic[entityName]) return entityName
		for(let existingEntityName in entitiesNamesDic){
			if(_areSameEntityName(entityName.toLowerCase(), existingEntityName.toLowerCase())) {
				//console.log("   __ found and adjusted entity name: ", entityName, "->", existingEntityName)
				return existingEntityName
			}
		}
		return entityName
	}

	entities(chunks, entitiesList=>{
		console.log("__ # entities received:", entitiesList.length)

		entitiesList = entitiesList.filter((entity,i)=>{
			let repeated = false
			for(let j=0; j<i; j++){
				if(_areSameEntity(entitiesList[j], entity)){
					entitiesList[j].description+=" | "+entity.description
					repeated = true
				}
			}
			return !repeated
		}).toL()

		console.log(entitiesList)

		const entitiesNamesDic = {}
		entitiesList.forEach(entity=>entitiesNamesDic[entity.name]=true)

		console.log("     __entitiesNamesDic", entitiesNamesDic)

		relations(chunks, entitiesList, relationsList=>{
			console.log("__ # relations received:", relationsList.length)
			console.log(relationsList)

			relationsList = relationsList.filter(relation=>relation.entity1 && relation.entity2)

			relationsList.forEach(relation=>{
				relation.entity1 = adjustEntityInRelation(relation.entity1, entitiesNamesDic)
				relation.entity2 = adjustEntityInRelation(relation.entity2, entitiesNamesDic)
			})

			const net = _.jsonToNet({entitiesList, relationsList})

			onLoad({entitiesList, relationsList, net})
		})

	}, addEmoji)

}


dataCrawler = function(description, nExpansions=1, onBuild){
	let accumulated = []

	const headersPrompt = "This is a description for a dataset: \n\n<"+description+">\n\nProvide a list of feature descriptions, as a JSON array, for such dataset. Each object should have the following properties: name and data type (type could be number, category, text…)\n\n[\n   {\n      \"name\":\""
	
	const datasetFromHeadersFunction = answer => {
		const json = repairAndParseJSON(answer)
		//const headers = json.map(ob=>ob.name).join("	")
		return "This is a description for a dataset: \n\n<"+description+">\n\n Please assemble such dataset as a JSON array. Please provide an answer without headers (like \`\`\`json), footers or comments\n\n[\n   {\n      \""+json[0].name+"\":\""
	}

	const expansionFunction = answer => {
		const json = repairAndParseJSON(answer)
		accumulated = [...accumulated, ...json]
		let string = JSON.stringify(accumulated, null, "   ")
		string = "Please continue adding datapoints to this JSON array:\n\n" + string.substr(0,string.length-1).trim()+","
		return string
	}

	const accumulationFunction = answer => {
		if(!answer.includes("[") || (answer.indexOf("{")>0 && answer.indexOf("{")<answer.indexOf("[")) ) answer = "[{"+answer.split("{").slice(1).join("{")
		console.log("   --accumulationFunction | prev reparared:")
		console.log(answer)
		const json = repairAndParseJSON(answer)
		accumulated = [...accumulated, ...json]
		let string = JSON.stringify(accumulated, null, "   ")
		string = "Please continue adding datapoints to this JSON array:\n\n" + string.substr(0,string.length-1).trim()+","
		return string
	}

	const endFunction = answer => {
		if(!answer.includes("[") || (answer.indexOf("{")>0 && answer.indexOf("{")<answer.indexOf("[")) ) answer = "[{"+answer.split("{").slice(1).join("{")
		//console.log("   --endFunction | prev reparared:")
		//console.log(answer)
		const json = repairAndParseJSON(answer)
		accumulated = [...accumulated, ...json]
		return accumulated
	}


	//assemble functions
	const functions = [
		datasetFromHeadersFunction,
		expansionFunction
	]

	for(let i=0; i<nExpansions; i++){
		functions.push(accumulationFunction)
	}

	functions.push(endFunction)


	

	//receives answers
	const onLoadEach=ob=>{
		// console.log("step loaded:")
		// console.log(ob)
	}

	const buildsTable = description.toLowerCase().match(/\btable\b/)

	const onLoadAll=dataset=>{
		// console.log("dataset built:")
		// console.log(dataset)
		// console.log(JSON.stringify(dataset, null, "  "))

		if(buildsTable) dataset = _.jsonToTable(dataset)

		onBuild(dataset)
	}
	
	llm_chain(headersPrompt, functions, onLoadAll, onLoadEach)

}



////////////////////////////////helper functions

//to be moved to pulse
let repairAndParseCSV = function(csvText){
	console.log("repairAndParseCSV")
	
	console.log(csvText)
	console.log(csvText.split("\n"))
	csvText = csvText.split("\n").filter(line=>line.includes(",")).join("\n")
	console.log(csvText)

	return _.CSVToTable(csvText, true, ",")
}

//to be moved to pulse
let repairAndParseJSON = function(jsonText){
	jsonText = jsonText.trim()

	// console.log("__partial 0__")
	// console.log(jsonText)
	// console.log("____")

	if(jsonText.at(0)!="[" && jsonText.includes("[")) jsonText = "["+jsonText.split("[").slice(1).join("[")

	let last = jsonText.at(-1)


	// console.log("__partial 1__")
	// console.log(jsonText)
	// console.log("____")
	// console.log("last:<"+last+">")

	switch(last){
		case "]":
			break
		case "}":
			jsonText+="]"
			break
		case "\"":
			if(jsonText.at(-2)==":"){
				jsonText+="\"}]"
			} else {
				jsonText+="}]"
			}
			break
		default:
			if(jsonText.includes("]")){
				const lastIndex = jsonText.lastIndexOf("]")
				jsonText = jsonText.substr(0,lastIndex+1)// jsonText.split("]")[0]+"]"
			} else {
				jsonText+="\"}]"
			}
			
			break
	}

	// console.log("__partial 2__")
	// console.log(jsonText)
	// console.log("____")

	let json

	try{
		json = JSON.parse(jsonText)
	} catch(e){
		try{
			json = JSON.parse(repairJsonString(jsonText))
		} catch(e){
			console.log("\n\n---[:(] couldn't parse json")
			console.log(json)
			console.log("---")
			json = []
		}
	}
	
	return json
}