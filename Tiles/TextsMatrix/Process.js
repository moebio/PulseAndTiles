
getWordsTable = function(n_words){
	CLEAN_ACTIONS = _.cleanTexts(TABLE[0], true, true, " ", true, true, true, true, true)

	let text = CLEAN_ACTIONS.join(" ")
	let onegrams = _.getWords(text, false)
	let bigrams = _.getBigrams(text, false)

	NGRAMS = _.tosL(onegrams.concat(bigrams))
	FREQTABLE = NGRAMS.getFrequenciesTable()

	FREQWORDS_DIC = {}
	FREQTABLE[0].forEach((word,i)=>{
		FREQWORDS_DIC[word] = FREQTABLE[1][i]
	})
	

	WORDS = new _.sL()
	WORDS.name = "words"
	TABLE.push(WORDS)

	let frequentWords = FREQTABLE[0].slice(0, n_words)
	
	CLEAN_ACTIONS.forEach((action,i)=>{
		WORDS[i]=""
		frequentWords.forEach(word=>{
			if(action.includes(word)) WORDS[i]+=(WORDS[i]==""?"":",")+word
		})
	})
}

getTextToColorDictionary = function(categoryName){
	let category = TABLE.get(categoryName)
	let categories = category.getWithoutRepetitions()
	let colorDic={}
	let textToColor = {}

	colors = _.createDefaultCategoricalColorList(categories.length).getInterpolated("white", 0.8)
	categories.forEach((cat,i)=>colorDic[cat]=colors[i])

	TABLE[0].forEach((text,i)=>{
		let color = colorDic[category[i]]
		textToColor[text] = color
	})

	return textToColor
}

createWordsCategory = function(words, name){
	let newCategory = new _.sL()
	newCategory.name = name
	let blocks = words.split("|")

	TABLE[0].forEach(text=>{
		value = "none"
		blocks.forEach((block, j)=>{
			versions = block.split(",")
			let foundVersion = false
			versions.forEach(word=>{
				if(foundVersion || word=="") return
				if(text.toLowerCase().includes(word)){
					value = versions[0]
				}
			})
		})
		if(value!="") newCategory.push(value)
	})
	return newCategory
}

buildMatrix = function(x_category, y_category){

	let {matrix, categories_x, columnsSums, rowsSums, maxCell} = getCategoryWordsMatrix(category_x, category_y, false)//"category_x", "category_y")
	actionsDimensionsMatrix = matrix

	matrixCategories = categories_x
	
	wordsSums = columnsSums.add(9).getNormalizedToSum()
	categoriesSums = rowsSums.add(4).getNormalizedToSum()//.getNormalized()

	maxCellTexts = maxCell
}

getCategoryWordsMatrix = function(category_x, category_y, includeNones){

	let table = _.toT(TABLE.slice())

	console.log("table", table)

	if(!table.get(category_x.name)) table.push(category_x)
	if(!table.get(category_y.name)) table.push(category_y)

	if(DISAGGREGATE){
		table = _.disAggregateTable(table, table.getWithoutElement(table.get(category_x.name)).getNames(), category_x.name)//.slice(0,table.length-1))
		table = _.disAggregateTable(table, table.getWithoutElement(table.get(category_y.name)).getNames(), category_y.name)//.slice(0,table.length-1))
	}

	let categories_x = table.get(category_x.name).getWithoutRepetitions()// category_x.getWithoutRepetitions()
	categories_x.name = category_x.name
	let categories_y = table.get(category_y.name).getWithoutRepetitions()// category_y.getWithoutRepetitions()
	categories_y.name = category_y.name
	let catPosition_x = {}
	let catPosition_y = {}
	if(!includeNones){
		categories_x = _.toL(categories_x.filter(cat=>cat!="none"))
		categories_y = _.toL(categories_y.filter(cat=>cat!="none"))
	}
	categories_x.forEach((cat,i)=>catPosition_x[cat]=i)
	categories_y.forEach((cat,i)=>catPosition_y[cat]=i)

	console.log("table", table)

	let matrix = new _.T()
	let matrixNums = new _.nT()
	let columnsSums
	let rowsSums

	categories_y.forEach((cat_y,i)=>{
		matrix[i]=new _.sL()
		matrix[i].name = cat_y
		categories_x.forEach(cat_x=>matrix[i].push([]))
	})

	category_x = table.get(category_x.name)
	category_y = table.get(category_y.name)
	
	table[0].forEach((text, i)=>{
		let catValue_x = category_x[i]
		let catPos_x = catPosition_x[catValue_x]
		let catValue_y = category_y[i]
		let catPos_y = catPosition_y[catValue_y]

		if(!includeNones && (catValue_x=="none" || catValue_y=="none") ) return
		matrix[catPos_y][catPos_x].push(text)
	})


	columnsSums = new _.nL()
	matrix.forEach(col=>{
		let sum=0
		col.forEach(texts=>sum+=texts.length)
		columnsSums.push(sum)
	})
	let maxCell=0
	rowsSums = new _.nL()
	matrix[0].forEach((texts,j)=>{
		let sum=0
		for(let i=0; i<matrix.length; i++){
			sum+=matrix[i][j].length
			maxCell = Math.max(maxCell, matrix[i][j].length)
		}
		rowsSums.push(sum)
	})

	console.log("matrix", matrix)

	switch(SORTING_MODE){
		case 0://category size
			matrix = matrix.getSortedByList(columnsSums, false)
			columnsSums = columnsSums.getSorted(false)

			matrix = matrix.sortRowsByList(rowsSums, false)
			categories_x = categories_x.getSortedByList(rowsSums, false)
			rowsSums = rowsSums.getSorted(false)

			break
		case 1://alphabetic
			columnsSums = columnsSums.getSortedByList(matrix.getNames(), true)
			matrix = matrix.getSortedByProperty("name", true)

			matrix = matrix.sortRowsByList(categories_x, true)
			rowsSums = rowsSums.getSortedByList(categories_x, true)
			categories_x = categories_x.getSorted(true)
			break
	}
	

	columnsSums.sum = columnsSums.getSum()
	rowsSums.sum = rowsSums.getSum()

	return {matrix, categories_x, columnsSums, rowsSums, maxCell}
}
