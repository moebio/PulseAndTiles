const shift_n_api = ""
const moebio_api = ""//
const dw_api = ""// ""// ""
const manu_api = ""
const kohka_api = ""
const dw2_api = ""

let CHAT_GPT_API_KEY = ""
let CHAT_GPT_API_MODEL = "gpt-4o-mini"//"gpt-3.5-turbo"//"gpt-4o"// "gpt-4"//"simulate"
let CHAT_GPT_EMBEDDING_API_MODEL = "text-embedding-3-small"//"text-embedding-ada-002"//

let nomic_api = ""
let llm_api_urlCompletions = 'https://api.openai.com/v1/chat/completions'

let date_last_llm_response


const PROMPT_MEMO = {}
const PROMPTS_STACK = []//only used for stacking requests if prompt_stack is true

////////parameters
let use_prompt_memory = false
let use_prompt_memory_local_storage = false
let delete_prompt_memory_local_storage = false
let delay_in_completion = 200
let continue_if_text_seems_incomplete = false
let n_times_continue = 3
let simplify_embedding_numbers = true
let SIMULATE_RESPONSE_TIME = 1000
let build_LLM_Activities_Report = false
let prompt_stack = false //used to stack prompt requests (FIFO), with delay_in_completion delay between them
//////


let delay_in_completion_timer
let n_times_continue_already = 0
let delayEmbedding

//setter
let PREPARED_QUESTIONS_ARRAY//array with multiple objects: {question:"…", answers:["…", "…",…]}

//getter
let WAITING_RESPONSE = false
let WAITING_RESPONSE_complete = false
let WAITING_RESPONSE_embedding = false
let LAST_COMPLETION_PROMPT
let lastCompletionActivityDate
const LLM_ACTIVITIES_REPORT = []
let lastPromptObject

let nPromptsActive = 0


////////////////////////

//////////object structure:
//{
//   prompt
//   model
//   temperature
//   system_message
//}
let llm_completion = function(promptObject){//, onLoad, onError){
	//console.log("[LLM] llm_completion, promptObject:", promptObject)

	if(use_prompt_memory){
		const promptObjectHash = _hashFromObject(promptObject)
		if(PROMPT_MEMO[promptObjectHash]){
			promptObject.onLoad(PROMPT_MEMO[promptObjectHash])
			return
		}
	}

	if(use_prompt_memory_local_storage){
		const promptObjectHash = _hashFromObject(promptObject)
		if(localStorage.getItem(promptObjectHash)){
			promptObject.onLoad(JSON.parse(localStorage.getItem(promptObjectHash)))
			return
		}
	}


	nPromptsActive++
	
	//places prompt object on stack
	if(prompt_stack && WAITING_RESPONSE_complete){
		PROMPTS_STACK.push(promptObject)
		//console.log("[LLM] busy right now, stacking the prompt, PROMPTS_STACK.length:", PROMPTS_STACK.length)
		return
	}



	lastPromptObject = promptObject

	WAITING_RESPONSE = true
	WAITING_RESPONSE_complete = true

	const model_used = promptObject.model||CHAT_GPT_API_MODEL

	//let messages = (object.system_message && !model_used.includes("claude"))?[{role:"system", content:object.system_message}, {role:"user", content:object.prompt}]:[{role:"user", content:object.prompt}]
	messages = [{role:"user", content:promptObject.prompt}]

	const headers = {
	  'Content-Type': 'application/json',
	}

	let llm_api_key
	if(promptObject.use_moebio_proxy){
		llm_api_key = CHAT_GPT_API_KEY
	} else if(model_used.includes("claude")){
		llm_api_key = null
		headers["x-api-key"] = ""
		headers["anthropic-version"] = "2023-06-01"
		headers["anthropic-dangerous-direct-browser-access"] = "true"
		llm_api_urlCompletions = "https://api.anthropic.com/v1/messages"
	} else {
		llm_api_key = CHAT_GPT_API_KEY
		llm_api_urlCompletions = 'https://api.openai.com/v1/chat/completions'
	}

	if(llm_api_key) headers.Authorization = "Bearer "+llm_api_key
	
	const date = new Date()

	let body = {
	    model:model_used,
	    temperature:promptObject.temperature||0.3,
		messages
	}

	if(model_used.includes("claude")){//} && !promptObject.model.model_bedrock){
		if(model_used=="claude-3-opus-20240229"){
			body.max_tokens = 4096
		} else {
			body.max_tokens = 8192
		}
	}

	//console.log("[LLM] CHAT_GPT_API_MODEL:", CHAT_GPT_API_MODEL)
	//console.log("[LLM] body:", body)
	//console.log("[LLM] headers:", headers)
	//console.log("[LLM] completion -> fetch, messages:", messages)

	body = JSON.stringify(body)

	lastCompletionActivityDate = new Date()

	let errorMessage


	let objectToSend = {
	  method: 'POST',
	  headers,
	  body
	}


	if(promptObject.use_bedrock){
		llm_api_urlCompletions = "https://staging.confluencemethod.com/.netlify/functions/bedrock-proxy"
		
		body = {
		  "model": promptObject.model,
		  "messages": [
		    {
		      "role": "user",
		      "content": [
		        {
		          "type": "text",
		          "text": promptObject.prompt
		        }
		      ]
		    }
		  ],
		  "max_tokens": 1000,
		  "temperature": promptObject.temperature
		}

		body = JSON.stringify(body)

		objectToSend = {
		  method: 'POST',
		  body
		}

	}

	if(promptObject.response_format) body.response_format=promptObject.response_format

	//console.log("[LLM] objectToSend:", objectToSend)
	//console.log("[LLM] n tokens~:", promptObject.prompt.split(" ").length/0.7)


	fetch(llm_api_urlCompletions, objectToSend)
	  .then(response => response.json())
	  .then(data => {
	  	//console.log("[LLM] response arrived, data:", data)
	  	lastCompletionActivityDate = new Date()
	  	errorMessage = data.error

	  	nPromptsActive--
	  	
	  	if(data.type=="error"){
	  		console.log("[LLM][!] error on completion (detected via data.type):", data.error)
	  		console.log("[LLM][promptObject:", promptObject)
	  		//if(promptObject.onError){
	  			//promptObject.onError({content:"", error:data.error, promptObject:promptObject})//data.error)
	  			if(promptObject.onError){
					  	promptObject.onError({content:"error generating content", error:data.error, prompt:promptObject})
					} else {
							console.log("[LLM][!] ---> promptObject.onLoad (error generating content)", promptObject.onLoad)
					  	promptObject.onLoad({content:"error generating content", error:data.error, promptObject})
					}
	  		//}
	  		
	  		return
	  	}

	  	//_completionAnswerProcess(data, object.prompt, onLoad, onError, object.mode, date, object.temperature)
	  	_llm_completionAnswerProcess(data, date, promptObject)
	  }).catch(error => {
	  	console.log("[LLM][!] error on completion (detected via catch):", error)
	  	console.log("[LLM][promptObject:", promptObject)
	  	//console.log(query.split(" ").length+" words")
	  	//console.log("data:",data_response)

	  	timeSinceLastResponse = date_last_llm_response?Math.round(((new Date()).getTime()-(date_last_llm_response.getTime()))/1000):null
	  	const elapsed_time = Math.round(((new Date()).getTime() - date.getTime())/1000)
	  	
	  	LLM_ACTIVITIES_REPORT.push({
				model:model_used,
				temperature:body.temperature,
				use_bedrock:promptObject.use_bedrock,
				time_query:_.dateToString(date, 10),
				time_response:_.dateToString(new Date(), 10),
				elapsed_time,
				timeSinceLastResponse,
				query_tokens:Math.round(promptObject.prompt.split(" ").length*4/3),
				content_tokens:0,
				complete_tokens:0,
				error:true,
				prompt:promptObject.prompt,
				content:"ERROR: "+(errorMessage||String(error)),
			})

			nPromptsActive--
	  	
	  	if(promptObject.onError){
		  	promptObject.onError({content:"error generating content", error, promptObject})
		  } else {
		  	promptObject.onLoad({content:"error generating content", error, promptObject})
		  }
    })
}



let _llm_completionAnswerProcess = function(data, date, object){
	//console.log("[LLM] _llm_completionAnswerProcess, data:", data)
	
	const content = (data.content && data.content[0] && data.content[0].text)?data.content[0].text:data.choices[0].message.content

	if(!object.onLoad){
		//console.log(content)
		return
	}

	WAITING_RESPONSE_complete = false
	if(WAITING_RESPONSE_embedding) WAITING_RESPONSE = false

	let reponse_object = {
		prompt:object.prompt,
		data,
		content,
		promptObject:object
	}

	if(object.onLoad) {
		if(use_prompt_memory){
			const promptObjectHash = _hashFromObject(object)
			PROMPT_MEMO[promptObjectHash] = reponse_object
		}
		if(use_prompt_memory_local_storage){
			const promptObjectHash = _hashFromObject(object)
			try{
				localStorage.setItem(promptObjectHash, JSON.stringify(reponse_object))
			} catch(e){
				localStorage.clear()
			}
		}
		object.onLoad(reponse_object)
	}

	if(build_LLM_Activities_Report){
		//console.log("[LLM] model for LLM_ACTIVITIES_REPORT:", object.model)

		timeSinceLastResponse = date_last_llm_response?Math.round(((new Date()).getTime()-(date_last_llm_response.getTime()))/1000):null
		const elapsed_time = Math.round(((new Date()).getTime() - date.getTime())/1000)

		LLM_ACTIVITIES_REPORT.push({
			model:object.model,
			temperature:object.temperature,
			use_bedrock:object.use_bedrock,
			description:object.description,
			time_query:_.dateToString(date, 10),
			time_response:_.dateToString(new Date(), 10),
			elapsed_time,
			timeSinceLastResponse,
			prompt:object.prompt,
			content:reponse_object.content,
			query_tokens:Math.round(object.prompt.split(" ").length*4/3),
			content_tokens:Math.round(reponse_object.content.split(" ").length*4/3),
			complete_tokens:Math.round((object.prompt+reponse_object.content).split(" ").length*4/3)
		})
	}

	date_last_llm_response = new Date()
	

	if(prompt_stack && PROMPTS_STACK.length>0){
		const nextPrompt = PROMPTS_STACK.shift()
		//console.log("[LLM] more on the stack! new PROMPTS_STACK.length:", PROMPTS_STACK.length+" | wait")
		setTimeout(t=>{
			//console.log("[LLM] --> llm_completion, nextPrompt:", nextPrompt)
			nPromptsActive--
			llm_completion(nextPrompt)
		}, delay_in_completion)
	}
}




let embedding = function(text, onLoad){
	if(!text) onLoad({embedding:null, text}, {})

	WAITING_RESPONSE = true
	WAITING_RESPONSE_embedding = true

	if(delay_in_completion>0){
		let _delay_in_completion = delay_in_completion
		delay_in_completion = 0
		if(delayEmbedding) clearTimeout(delayEmbedding)
		delayEmbedding = setTimeout(e=>{
			embedding(text, onLoad)
			delay_in_completion = _delay_in_completion
		}, _delay_in_completion)
		return
	}

	let data_response

	fetch('https://api.openai.com/v1/embeddings', {
	  method: 'POST',
	  headers: {
	    'Content-Type': 'application/json',
	    'Authorization' :"Bearer "+CHAT_GPT_API_KEY
	  },
	  body: JSON.stringify({
	    input: text,
	    model: CHAT_GPT_EMBEDDING_API_MODEL,
	  }),
	})
	  .then(response => response.json())
	  .then(data => {
	  	data_response = data
	  	WAITING_RESPONSE_embedding = false
	  	if(!WAITING_RESPONSE_complete) WAITING_RESPONSE = false

	  	let embeddingArray = data.data[0].embedding.tonL()
	  	if(simplify_embedding_numbers){
	  		embeddingArray = embeddingArray.map(num=>Math.round(num*1000)).tonL()
	  	}

	  	onLoad({embedding:embeddingArray, text, data}, data)
	})
	  .catch(error => {
	    console.error('Error on completion:', error);
	    console.log("text: ["+text+"]")
	    console.log("data", data_response)
	});
}



let embeddingManyParallel = function(texts, onEmbeddEach, onEmbeddAll){
}


let embeddingMany = function(texts, onEmbeddEach, onEmbeddAll){
	let nText = 0
	const embeddingsList = new _.L()

	let onEmbed = function(response){
		response.nText = nText
		embeddingsList.push(response)
		if(onEmbeddEach) onEmbeddEach(response, nText, embeddingsList, texts.length)
		nText++
		if(nText==texts.length){
			onEmbeddAll(embeddingsList)
			return
		}
		embedding(texts[nText], onEmbed)
	}

	embedding(texts[0], onEmbed)
}



function _hashFromObject(object) {
    // Convert object to string
    const str = JSON.stringify(object);
    
    // Simple but fast hashing algorithm
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36); // Convert to base36 string
}


//https://docs.nomic.ai/reference/endpoints/nomic-embed-text
//multiple texts embedding
// function nomicEmbedding(texts, callback) {
//     const url = "https://api-atlas.nomic.ai/v1/embedding/text/"//'https://api-atlas.nomic.ai/v1/embedding/text';
//     const headers = {
//         'Authorization': `Bearer ${nomic_api}`,
//         'Content-Type': 'application/json'
//     }

//     const body = JSON.stringify({
//         model: 'nomic-embed-text-v1',
//         texts
//     })

//     console.log("url", url)

//     fetch(url, {
//         method: 'POST',
//         headers: headers,
//         body: body
//     })
//     .then(response => {
//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }
//         return response.json();
//     })
//     .then(data => {
//     	console.log("data.embeddings.length:", data.embeddings.length)
//     	console.log("data:", data)
//         callback(data);
//     })
//     .catch(error => {
//     	console.log("error nomicEmbedding:",error)
//         //callback(error, null);
//     })
// }



/*
takes an array of objects that have these properties:
	text
	embedding
	title (optional)
checks if any of the values is null and fills it, until it doesn't find any missing value
finally it prints on console the completed array
*/
// let updateEmbeddingsAndTitles = function(objectsArray, onComplete, checkEmbedding=true, checkTitle=true, textPropertyName="text"){

// 	let complete = true

// 	objectsArray.forEach((object,i)=>{
// 		if(!complete) return

// 		if(checkEmbedding && object.embedding==null){
// 			console.log("++ embedding "+i+"/"+objectsArray.length)
// 			embedding(object[textPropertyName], embeddResponse=>{
// 				object.embedding = embeddResponse.embedding
// 				updateEmbeddingsAndTitles(objectsArray)
// 			})
// 			complete = false
// 		}
// 		if(complete && checkTitle && !object.title){
// 			console.log("++ title "+i+"/"+objectsArray.length)
// 			completion("write a short title (in the original language) for this text: <"+object[textPropertyName]+">", completionResponse=>{
// 				object.title = completionResponse.content
// 				updateEmbeddingsAndTitles(objectsArray)
// 			})
// 			complete = false
// 		}
// 	})

// 	if(complete){
// 		console.log("////////////////////////////////////////////////////////")
// 		console.log(JSON.stringify(objectsArray))
// 		console.log("////////////////////////////////////////////////////////")
// 		onComplete()
// 	}
// }


function generateImage(prompt, callBack, width=256, height=256, model='dall-e-3') {
  const url = 'https://api.openai.com/v1/images/generations';

  model = width<1024?'dall-e-2':model
  
  const data = {
    model,
    prompt: prompt,
    n: 1,
    size:  `${width}x${height}`,
    response_format:"b64_json"
  }

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CHAT_GPT_API_KEY}`
    },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(result => {
  	const image = createImageFromB64(result.data[0].b64_json)
  	callBack({
  			query:prompt,
  			content:image
  	})
  })
  .catch(error => callBack(error));
}


function getLLActivitiesReport(){
	return LLM_ACTIVITIES_REPORT
}


///////////////////////////////////////////////////////////////////////helpers

function createImageFromB64(b64Data) {
  const img = new Image();
  img.src = 'data:image/png;base64,' + b64Data;
  return img;
}

// let buildDataQuery = function(obj){
// 	let subs = extractSubstrings2(obj.body, "[", "]")
// 	let query = obj.body

// 	subs.forEach(sub=>{
// 		query = query.replaceAll("["+sub+"]", obj.params[sub])
// 	})

// 	switch(obj.type){
// 		case "json":
// 			query+=", in json format, with the following keys:\n"
// 			obj.features.forEach(feature=>{
// 				query+="\n" + feature.name + (feature.indication?" ("+feature.indication+")":"")
// 			})
// 			break
// 		case "tsv":
// 			//TBD
// 			break
// 	}

// 	query += "\n\npay special attention to verify that the json is correctly formatted"

// 	return query
// }

function repairJsonString(jsonString) {

	let lines = jsonString.split("\n")
	lines = lines.map(line=>line[0]=="`"?"":line)

	jsonString = lines.join("\n")

  // Replace single quotes with double quotes
  //jsonString = jsonString.replace(/'/g, '"');

  // Wrap keys in double quotes
  jsonString = jsonString.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

  // Wrap values in double quotes
  jsonString = jsonString.replace(/:\s*(?!true|false|null)[a-zA-Z0-9_]+/g, function(match) {
    return match.replace(/([a-zA-Z0-9_]+)/g, '"$1"');
  });

  // Add missing commas
  jsonString = jsonString.replace(/([^\s,{}]+)(\s*}):/g, '$1,$2');

  // Remove any trailing commas after the last key-value pair
  jsonString = jsonString.replace(/,\s*}/g, '}');

  // Replace single quotes within double quotes
  jsonString = jsonString.replace(/"([^"]*)'([^"]*)"/g, '"$1\'$2"');

  //"0".21 --> "0.21"
  const regexIssueNumbers = /"\s*\.\s*([^"]*?)\s*"/g;
  jsonString = jsonString.replace(regexIssueNumbers, '": "$1"');

  jsonString = jsonString.replaceAll(",\"", "\",");

  // Return the repaired JSON string
  return jsonString;
}

// let netFromTable = function(table){
// 	let net = new _.Net()

// 	table[0].forEach((name0,i)=>{
// 		let name1 = table[1][i]
// 		if(name0 == "" || name1 == "") return
// 		let rel = net.createRelation(name0, name1)
// 		rel.description = table[2][i]
// 		rel.node0.color = rel.node1.color = "rgba(255, 255, 255, 0.7)"
// 	})

// 	return net
// }

// let buildTable = function(response){
// 	response = response.replace(/\d+\.\s+/, "").replace(/\s{2,}/g, /\t/).replace(/\\t/g, /\t/).replace(/\/\/\t\/\//g, /\t/).replaceAll("//\\t//","	").replaceAll("//\t//","	").replaceAll("//\\\t//","	")
// 	let table = parseTSVAndGetArrays(response, "|")
// 	table.forEach((col,i)=>{
// 		// if(obj.columns[i]=="number"){
// 		// 	let name = table[i].name
// 		// 	table[i] = table[i].map(v=>Number(parseQuantitativeLiteral(v)))
// 		// 	table[i].name = name
// 		// } else if(obj.columns[i]=="category" || obj.columns[i]=="name"){
// 			let name = table[i].name
// 			table[i] = table[i].map(v=>{
// 			    v = (v||"").replace(/\d+\.\s+/, "").toLowerCase().replaceAll(" and ", ", ").replaceAll(" or ", ", ").replaceAll("-","")
// 			    if(v.includes("|")) v = v.split("|")[0].trim()
// 			    v = v.replaceAll("|", "")
// 			    return v
// 			})
// 			let allPotentialNumbers = true
// 			let numbersCol = table[i].map(v=>{
// 				let num = Number(v.replace(",","."))
// 				if(isNaN(num)) allPotentialNumbers = false
// 				return num
// 			})
// 			if(allPotentialNumbers) table[i] = numbersCol
// 			//table[i].forEach(v=>{if(v) allPotentialNumbers=false})
// 			table[i] = table[i].toL()
// 			table[i].name = name
// 		//}
// 	})

// 	let hasValuesIn0 = false

// 	table[0].forEach(v=>{
// 		if(v!="") hasValuesIn0 = true
// 	})

// 	if(!hasValuesIn0) table = table.slice(1)

// 	return table
// }


// let extractSubstrings = function(str, startChar, endChar) {
//   let substrings = [];
//   let startIndex = str.indexOf(startChar);
//   while (startIndex !== -1) {
//     let endIndex = str.indexOf(endChar, startIndex + 1);
//     if (endIndex !== -1) {
//       let substring = str.substring(startIndex + 1, endIndex);
//       substrings.push(substring);
//       startIndex = str.indexOf(startChar, endIndex + 1);
//     } else {
//       break;
//     }
//   }
//   return substrings;
// }

// let parseQuantitativeLiteral = function(literal) {
// 	literal = (literal||"").toLowerCase()
// 	literal = literal.replaceAll("eur", "").replaceAll("usd", "").replaceAll("$", "").replaceAll("€", "").replaceAll("<", "").replaceAll(">", "")
  
// 	literal = literal.replace("million", "*1000000")
// 	literal = literal.replace("billion", "*1000000000")
// 	literal = literal.replace("trillion", "*1000000000000")

// 	literal = literal.replace("m", "*1000000")
// 	literal = literal.replace("b", "*1000000000")
// 	literal = literal.replace("t", "*1000000000000")

// 	literal = literal.replace("%", "")

// 	literal = literal.replace("na", "0")

// 	literal = literal.replace(/\s+/g, "")

// 	if(literal.match(/\d+-\d+/)) {
// 		const parts = literal.split("-")
// 		literal = 0.5*(Number(parts[0])+Number(parts[1]))
// 	}

// 	// console.log(".......literal:["+literal+"]")
// 	// console.log(".............literal:", eval(literal))

// 	try{
// 		literal = eval(literal)
// 	}catch(err){
// 		console.log("error trying to eval:["+literal+"]")
// 		literal = 0
// 	}

// 	return literal||0
// }

// function parseTSVAndGetArrays(tsvString, separator) {
// 	if(tsvString.includes("\n\n")) tsvString = tsvString.split("\n\n")[0]
		
// 	separator = separator||"\t"
//   const rows = tsvString.trim().split("\n").map(row => row.trim().split(separator));
//   const table = []
//   rows[0].forEach((name,i)=>{
//   	let column = []
//   	column.name = (name||"").toLowerCase()
//   	table[i] = column
//   	rows.slice(1).forEach(v=>{
//   		if(v[i][0]=="-") return
//   		column.push(v[i].trim())
//   	})
//   })
//   return table;
// }

// deleteChatgptStorageMemory = function(){
// 	for (let i = 0; i < localStorage.length; i++) {
// 		if(localStorage.key(i).indexOf("chatgpt_localstorage_memory:")==0){
// 			localStorage.removeItem(localStorage.key(i))
// 			i--
// 		}
//   }
// }
///////

