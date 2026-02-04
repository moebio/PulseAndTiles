const shift_n_api = ""
const moebio_api = ""//
const dw_api = ""// ""// ""
const manu_api = ""

let CHAT_GPT_API_KEY = ""
let CHAT_GPT_API_MODEL = "gpt-4o-mini"//"gpt-3.5-turbo"//"gpt-4o"// "gpt-4"//"simulate"
let CHAT_GPT_EMBEDDING_API_MODEL = "text-embedding-3-small"//"text-embedding-ada-002"//

let nomic_api = ""

let urlCompletions = 'https://06d2-93-176-157-56.ngrok-free.app/v1/chat/completions'// 'https://api.openai.com/v1/chat/completions'




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
const LLM_ACTIVITIES_REPORT = []

let completion = function (query, onLoad, type, system_message, temperature = 0.5, onError, question) {
	//you can pass an array with two texts, the second being an initiator that sets the tone and structure of the answer
	//and that's added as part of the answer

	if (Array.isArray(query) && query.length > 1) {
		completion(query[0] + "\n\n" + query[1], ob => {
			ob.content = query[1] + ob.content
			onLoad(ob)
		}, type, system_message, temperature = 0.5, onError, question)
		return
	}

	if (PREPARED_QUESTIONS_ARRAY && question) {
		let simplified_question = _.cleanText(question, true, true, "", true, true, true, true, true)
		let preparedQuestion = PREPARED_QUESTIONS_ARRAY.find(q_and_a => simplified_question == _.cleanText(q_and_a.question, true, true, "", true, true, true, true, true))

		//console.log("+> preparedQuestion", preparedQuestion)

		if (preparedQuestion != null) {
			let answer = preparedQuestion.answers.toL().getRandomElement()
			//console.log("++> prepared answer:",answer)
			sendAnswer = function () {
				WATING_ANSWER = false
				WAITING_RESPONSE_complete = false
				onCompletion({
					content: answer
				})
				//console.log("++> prepared answer sent/")
			}
			WAITING_RESPONSE_complete = true
			setTimeout(sendAnswer, 4000)
			return
		}
	}

	// let query_object
	// if(typeof query!="string" && query?.body) {
	// 	query_object = query
	// 	query = buildDataQuery(query)
	// }

	//console.log("[CHGPT] delay_in_completion", delay_in_completion)
	if (delay_in_completion > 0) {
		//console.log("[CHGPT] wait")
		setTimeout(e => {
			//WAITING_RESPONSE_complete = true
			let _delay_in_completion = delay_in_completion
			delay_in_completion = 0
			//console.log("[CHGPT]       end wait")
			completion(query, onLoad, type, system_message, temperature)
			delay_in_completion = _delay_in_completion
		}, delay_in_completion)
		return
	}

	//console.log("\n\n[CHGPT]. . . send completion query:")
	//console.log("[CHGPT]__________________________________")
	//console.log(query.slice(0,400)+"…")
	//console.log(query)
	//console.log("[CHGPT]__________________________________")
	//console.log("    [CHGPT] completion # words:", query.split(" ").length)

	if (use_prompt_memory && PROMPT_MEMO[query]) {
		console.log("[CHGPT]found on PROMPT_MEMO")
		if (!WAITING_RESPONSE_embedding) WAITING_RESPONSE = false
		WAITING_RESPONSE_complete = false
		onLoad(PROMPT_MEMO[query])
		return
	}
	if (use_prompt_memory_local_storage) {
		let foundObject = localStorage.getItem("chatgpt_localstorage_memory:" + query)

		//console.log("found on LocalStorage")
		//console.log("found on LocalStorage:", foundObject)

		if (foundObject && foundObject != null && foundObject != "null") {
			if (!WAITING_RESPONSE_embedding) WAITING_RESPONSE = false
			WAITING_RESPONSE_complete = false
			onLoad(JSON.parse(localStorage.getItem("chatgpt_localstorage_memory:" + query)))
			return
		}

	}


	LAST_COMPLETION_PROMPT = query



	//if(system_message) console.log("[CHGPT]**>", messages)


	//console.log("******* temperature", temperature)

	//let data_response


	if (CHAT_GPT_API_MODEL == "simulate") {
		setTimeout(event => {
			WAITING_RESPONSE_complete = false
			if (WAITING_RESPONSE_embedding) WAITING_RESPONSE = false

			onLoad({
				query,
				type,
				content: "simulated content"
			})
		}, SIMULATE_RESPONSE_TIME)
		return
	}

	_completionRequest(query, onLoad, onError, temperature, system_message)
}


let _completionRequest = function (query, onLoad, onError, temperature, system_message) {
	console.log("[ChatGPTApi] completion -> fetch")

	let messages = [{ role: "user", content: query }]
	if (system_message) messages = [{ role: "system", content: system_message }, { role: "user", content: query }]


	if (WAITING_RESPONSE_complete) {
		PROMPTS_STACK.push({ query, onLoad, onError, temperature, system_message })
		console.log("[ST] busy right now, stacking the prompt, PROMPTS_STACK.length:", PROMPTS_STACK.length)
		return
	}

	WAITING_RESPONSE = true
	WAITING_RESPONSE_complete = true

	console.log("[ST] not busy, go!", (new Date()).getHours() + ":" + (new Date()).getMinutes() + ":" + (new Date()).getSeconds())


	// const headers = {
	//   'Content-Type': 'application/json',
	//   'Authorization' :"Bearer "+CHAT_GPT_API_KEY
	// }
	const headers = {
		'Content-Type': 'application/json',
		'accept': 'application/json'
	}

	// const body = JSON.stringify({
	//     model:CHAT_GPT_API_MODEL,
	//     temperature,
	// 		messages
	//  })
	const body = JSON.stringify({
		"messages": [
			{
				"content": "You are a helpful assistant.",
				"role": "system"
			},
			{
				"content": query,
				"role": "user"
			}
		],
		"model": "llama3-70b-8192",// "llama3-8b-instruct",
		"stream": false,
		"max_tokens": 2048,
		"stop": [
			"hello"
		],
		"frequency_penalty": 0,
		"presence_penalty": 0,
		"temperature": 0.7,
		"top_p": 0.95
	})


	fetch(urlCompletions, {
		method: 'POST',
		headers,
		body
	})
		.then(response => response.json())
		.then(data => {
			console.log("data", data)
			_completionAnswerProcess(data, query, onLoad, onError)
		}).catch(error => {
			console.log("[CHGPT][!] error on completion:", error)
			console.log({ query })
			console.log(query.split(" ").length + " words")
			//console.log("data:",data_response)

			if (onError) {
				onError({ content: "", error })
			} else {
				onLoad({ content: "" })
			}
		})

}

let _completionAnswerProcess = function (data, query, onLoad, onError, date) {
	let data_response = data
	const content = data.choices[0].message.content

	if (!onLoad) {
		console.log(content)
		return
	}

	WAITING_RESPONSE_complete = false
	if (WAITING_RESPONSE_embedding) WAITING_RESPONSE = false


	let obj = {
		query,
		//query_object,
		data,
		//type,
		content
	}

	if (use_prompt_memory) PROMPT_MEMO[query] = obj
	if (use_prompt_memory_local_storage) {
		try {
			localStorage.setItem("chatgpt_localstorage_memory:" + query, JSON.stringify(obj))
		} catch (e) {
			console.log("local storage failed, e:", e)
			//console.log("use this to empty prompt memory storage:\ndeleteChatgptStorageMemory()")
			deleteChatgptStorageMemory()
			localStorage.setItem("chatgpt_localstorage_memory:" + query, JSON.stringify(obj))
		}
	}
	if (delete_prompt_memory_local_storage) localStorage.setItem("chatgpt_localstorage_memory:" + query, null)

	//console.log("[CHGPT]. . . content arrived:")
	//console.log(obj.content.slice(0,100)+"…")

	if (!data.choices || !data.choices.length) {
		console.log("[CHGPT][!] error on completion, data:", data)
		if (onError) {
			obj.error = "no choices in data"
			onError(obj)
			return
		}
	}


	// switch(type){
	// 	case "table":
	// 		obj.structured = buildTable(obj.content)
	// 		break
	// 	case "net":
	// 		let table = buildTable(obj.content)
	// 		console.log(". . . table:")
	// 		console.log(table)

	// 		obj.structured = netFromTable(table)
	// 		console.log(". . . structured (table):")
	// 		console.log(obj.structured)
	// 		break
	// 	case "javascript":
	// 		//eval the function…
	// 		//obj.structured = 
	// 		break
	// 	case "json":

	// 		try {
	// 			obj.structured = JSON.parse(obj.content)
	// 		} catch(e){
	// 			console.log("[CHGPT][!] original json requires repairment")
	// 			try {
	// 				obj.structured = JSON.parse(repairJsonString(obj.content))
	// 			} catch(e2){
	// 				console.log("[CHGPT][!] failed after repairment")
	// 				console.log(obj.content)
	// 			}
	// 		}

	// 		// let repairedJsonString = obj.content// repairJsonString(obj.content)
	// 		// console.log("repaired json:", repairedJsonString)


	// 		console.log("[CHGPT]. . . structured (json):")
	// 		console.log("[CHGPT]", obj.structured)
	// 		break
	// }

	// console.log("\n\n\n\n\nquery+++++++++++++++++++++++++++++*******************************")
	// console.log(query)
	// console.log("content+++++++++++++++++++++++++++++*******************************")
	// console.log(obj.content)
	// console.log("+++++++++++++++++++++++++++++*******************************")

	const lastChar = obj.content.trim().at(-1)
	const finalChars = [".", "!", "?", "\"", ")"]
	//const incomplete = type==null && !finalChars.includes(lastChar) && continue_if_text_seems_incomplete && n_times_continue_already<n_times_continue
	const incomplete = !finalChars.includes(lastChar) && continue_if_text_seems_incomplete && n_times_continue_already < n_times_continue

	if (incomplete) {
		console.log("[CHGPT]!!!!! INCOMPLETE | last char:[" + lastChar + "]")
		n_times_continue_already++
		completion("complete the following text:\n\n" + obj.content, responseComplete => {
			responseComplete.content = obj.content + responseComplete.content
			onLoad(responseComplete)
		}, null, system_message, temperature)
	} else {
		n_times_continue_already = 0
		onLoad(obj)

		if (build_LLM_Activities_Report) {
			LLM_ACTIVITIES_REPORT.push({
				query,
				content: obj.content,
				query_tokens: Math.round(query.split(" ").length * 4 / 3),
				content_tokens: Math.round(obj.content.split(" ").length * 4 / 3),
				complete_tokens: Math.round((query + obj.content).split(" ").length * 4 / 3)
			})
		}
	}

	if (prompt_stack && PROMPTS_STACK.length > 0) {
		console.log("[ST] more on the stack!")
		const nextPrompt = PROMPTS_STACK.shift()
		console.log("[ST] PROMPTS_STACK.length", PROMPTS_STACK.length)
		setTimeout(t => {
			console.log("[ST] --> _completionRequest")
			_completionRequest(...Object.values(nextPrompt))
		}, delay_in_completion)
	}

}



let completionManyParallel = function (queries, onLoadEach, onLoadAll, type, system_message, temperature = 1) {
	let nText = 0
	const completionsList = new _.L()

	queries.forEach(query => {

	})
}


let completionMany = function (queries, onLoadEach, onLoadAll, type, system_message, temperature = 1) {
	let nText = 0
	const completionsList = new _.L()

	let onCompletion = function (response) {
		completionsList.push(response)
		if (onLoadEach) onLoadEach(response, nText, completionsList)
		console.log("completionMany | ", nText, queries.length)
		nText++
		if (nText == queries.length) {
			//console.log("completionMany | onLoadAll")
			onLoadAll(completionsList)
			return
		}
		completion(queries[nText], onCompletion, type, system_message, temperature = 1)
	}

	completion(queries[0], onCompletion, type, system_message, temperature = 1)
}


let embedding = function (text, onLoad) {
	console.log("completion ")

	if (!text) onLoad({ embedding: null, text }, {})

	WAITING_RESPONSE = true
	WAITING_RESPONSE_embedding = true

	if (delay_in_completion > 0) {
		let _delay_in_completion = delay_in_completion
		delay_in_completion = 0
		if (delayEmbedding) clearTimeout(delayEmbedding)
		delayEmbedding = setTimeout(e => {
			embedding(text, onLoad)
			delay_in_completion = _delay_in_completion
		}, delay_in_completion)
		return
	}

	// console.log("embedding!!!!!")
	// console.trace()

	let data_response

	fetch('https://api.openai.com/v1/embeddings', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': "Bearer " + CHAT_GPT_API_KEY
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
			if (!WAITING_RESPONSE_complete) WAITING_RESPONSE = false

			let embeddingArray = data.data[0].embedding.tonL()
			if (simplify_embedding_numbers) {
				embeddingArray = embeddingArray.map(num => Math.round(num * 1000)).tonL()
			}

			onLoad({ embedding: embeddingArray, text, data }, data)
		})
		.catch(error => {
			console.error('Error on completion:', error);
			console.log("text: [" + text + "]")
			console.log("data", data_response)
		});
}



let embeddingManyParallel = function (texts, onEmbeddEach, onEmbeddAll) {
}


let embeddingMany = function (texts, onEmbeddEach, onEmbeddAll) {
	let nText = 0
	const embeddingsList = new _.L()

	let onEmbed = function (response) {
		response.nText = nText
		embeddingsList.push(response)
		if (onEmbeddEach) onEmbeddEach(response, nText, embeddingsList, texts.length)
		nText++
		if (nText == texts.length) {
			onEmbeddAll(embeddingsList)
			return
		}
		embedding(texts[nText], onEmbed)
	}

	embedding(texts[0], onEmbed)
}


//https://docs.nomic.ai/reference/endpoints/nomic-embed-text
//multiple texts embedding
function nomicEmbedding(texts, callback) {
	const url = "https://api-atlas.nomic.ai/v1/embedding/text/"//'https://api-atlas.nomic.ai/v1/embedding/text';
	const headers = {
		'Authorization': `Bearer ${nomic_api}`,
		'Content-Type': 'application/json'
	}

	const body = JSON.stringify({
		model: 'nomic-embed-text-v1',
		texts
	})

	console.log("url", url)

	fetch(url, {
		method: 'POST',
		headers: headers,
		body: body
	})
		.then(response => {
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response.json();
		})
		.then(data => {
			console.log("data.embeddings.length:", data.embeddings.length)
			console.log("data:", data)
			callback(data);
		})
		.catch(error => {
			console.log("error nomicEmbedding:", error)
			//callback(error, null);
		})
}



/*
takes an array of objects that have these properties:
	text
	embedding
	title (optional)
checks if any of the values is null and fills it, until it doesn't find any missing value
finally it prints on console the completed array
*/
let updateEmbeddingsAndTitles = function (objectsArray, onComplete, checkEmbedding = true, checkTitle = true, textPropertyName = "text") {

	let complete = true

	objectsArray.forEach((object, i) => {
		if (!complete) return

		if (checkEmbedding && object.embedding == null) {
			console.log("++ embedding " + i + "/" + objectsArray.length)
			embedding(object[textPropertyName], embeddResponse => {
				object.embedding = embeddResponse.embedding
				updateEmbeddingsAndTitles(objectsArray)
			})
			complete = false
		}
		if (complete && checkTitle && !object.title) {
			console.log("++ title " + i + "/" + objectsArray.length)
			completion("write a short title (in the original language) for this text: <" + object[textPropertyName] + ">", completionResponse => {
				object.title = completionResponse.content
				updateEmbeddingsAndTitles(objectsArray)
			})
			complete = false
		}
	})

	if (complete) {
		console.log("////////////////////////////////////////////////////////")
		console.log(JSON.stringify(objectsArray))
		console.log("////////////////////////////////////////////////////////")
		onComplete()
	}
}


function generateImage(prompt, callBack, width = 256, height = 256, model = 'dall-e-3') {
	const url = 'https://api.openai.com/v1/images/generations';

	model = width < 1024 ? 'dall-e-2' : model

	const data = {
		model,
		prompt: prompt,
		n: 1,
		size: `${width}x${height}`,
		response_format: "b64_json"
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
				query: prompt,
				content: image
			})
		})
		.catch(error => callBack(error));
}


function getLLActivitiesReport() {
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
	// Replace single quotes with double quotes
	jsonString = jsonString.replace(/'/g, '"');

	// Wrap keys in double quotes
	jsonString = jsonString.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

	// Wrap values in double quotes
	jsonString = jsonString.replace(/:\s*(?!true|false|null)[a-zA-Z0-9_]+/g, function (match) {
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

let netFromTable = function (table) {
	let net = new _.Net()

	table[0].forEach((name0, i) => {
		let name1 = table[1][i]
		if (name0 == "" || name1 == "") return
		let rel = net.createRelation(name0, name1)
		rel.description = table[2][i]
		rel.node0.color = rel.node1.color = "rgba(255, 255, 255, 0.7)"
	})

	return net
}

let buildTable = function (response) {
	response = response.replace(/\d+\.\s+/, "").replace(/\s{2,}/g, /\t/).replace(/\\t/g, /\t/).replace(/\/\/\t\/\//g, /\t/).replaceAll("//\\t//", "	").replaceAll("//\t//", "	").replaceAll("//\\\t//", "	")
	let table = parseTSVAndGetArrays(response, "|")
	table.forEach((col, i) => {
		// if(obj.columns[i]=="number"){
		// 	let name = table[i].name
		// 	table[i] = table[i].map(v=>Number(parseQuantitativeLiteral(v)))
		// 	table[i].name = name
		// } else if(obj.columns[i]=="category" || obj.columns[i]=="name"){
		let name = table[i].name
		table[i] = table[i].map(v => {
			v = (v || "").replace(/\d+\.\s+/, "").toLowerCase().replaceAll(" and ", ", ").replaceAll(" or ", ", ").replaceAll("-", "")
			if (v.includes("|")) v = v.split("|")[0].trim()
			v = v.replaceAll("|", "")
			return v
		})
		let allPotentialNumbers = true
		let numbersCol = table[i].map(v => {
			let num = Number(v.replace(",", "."))
			if (isNaN(num)) allPotentialNumbers = false
			return num
		})
		if (allPotentialNumbers) table[i] = numbersCol
		//table[i].forEach(v=>{if(v) allPotentialNumbers=false})
		table[i] = table[i].toL()
		table[i].name = name
		//}
	})

	let hasValuesIn0 = false

	table[0].forEach(v => {
		if (v != "") hasValuesIn0 = true
	})

	if (!hasValuesIn0) table = table.slice(1)

	return table
}


let extractSubstrings = function (str, startChar, endChar) {
	let substrings = [];
	let startIndex = str.indexOf(startChar);
	while (startIndex !== -1) {
		let endIndex = str.indexOf(endChar, startIndex + 1);
		if (endIndex !== -1) {
			let substring = str.substring(startIndex + 1, endIndex);
			substrings.push(substring);
			startIndex = str.indexOf(startChar, endIndex + 1);
		} else {
			break;
		}
	}
	return substrings;
}

let parseQuantitativeLiteral = function (literal) {
	literal = (literal || "").toLowerCase()
	literal = literal.replaceAll("eur", "").replaceAll("usd", "").replaceAll("$", "").replaceAll("€", "").replaceAll("<", "").replaceAll(">", "")

	literal = literal.replace("million", "*1000000")
	literal = literal.replace("billion", "*1000000000")
	literal = literal.replace("trillion", "*1000000000000")

	literal = literal.replace("m", "*1000000")
	literal = literal.replace("b", "*1000000000")
	literal = literal.replace("t", "*1000000000000")

	literal = literal.replace("%", "")

	literal = literal.replace("na", "0")

	literal = literal.replace(/\s+/g, "")

	if (literal.match(/\d+-\d+/)) {
		const parts = literal.split("-")
		literal = 0.5 * (Number(parts[0]) + Number(parts[1]))
	}

	// console.log(".......literal:["+literal+"]")
	// console.log(".............literal:", eval(literal))

	try {
		literal = eval(literal)
	} catch (err) {
		console.log("error trying to eval:[" + literal + "]")
		literal = 0
	}

	return literal || 0
}

function parseTSVAndGetArrays(tsvString, separator) {
	if (tsvString.includes("\n\n")) tsvString = tsvString.split("\n\n")[0]

	separator = separator || "\t"
	const rows = tsvString.trim().split("\n").map(row => row.trim().split(separator));
	const table = []
	rows[0].forEach((name, i) => {
		let column = []
		column.name = (name || "").toLowerCase()
		table[i] = column
		rows.slice(1).forEach(v => {
			if (v[i][0] == "-") return
			column.push(v[i].trim())
		})
	})
	return table;
}

deleteChatgptStorageMemory = function () {
	for (let i = 0; i < localStorage.length; i++) {
		if (localStorage.key(i).indexOf("chatgpt_localstorage_memory:") == 0) {
			localStorage.removeItem(localStorage.key(i))
			i--
		}
	}
}
///////

