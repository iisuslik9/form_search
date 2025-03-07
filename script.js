let loadedOkvedData = [];

fetch('okved_2.json')
    .then(response => response.json())
    .then(data => {
        loadedOkvedData = data;
        clearResults();
    })
    .catch(error => console.error('Error loading JSON:', error));

function organizeResults(results) {
    const organized = {};

    for (const item of results) {
        const codeParts = item.code.split('.');
        let currentLevel = organized;
        let currentCode = "";

        for (let i = 0; i < codeParts.length; i++) {
            currentCode += (i > 0 ? "." : "") + codeParts[i];

            if (!currentLevel[currentCode]) {
                currentLevel[currentCode] = {
                    code: currentCode,
                    name: null,
                    children: {}
                };
            }

            if (i === codeParts.length - 1) {
                currentLevel[currentCode].name = item.name;
            } else {
                currentLevel = currentLevel[currentCode].children;
            }
        }
    }
    return organized;
}


function searchOkved(query) {
    const results = [];

    function traverse(data) {
        for (const item of data) {
            if (item.code.startsWith(query)) {
                results.push({ code: item.code, name: item.name });
            }
            if (item.subgroups) {
                for (const subgroup of item.subgroups) {
                    if (subgroup.code.startsWith(query)) {
                        results.push({ code: subgroup.code, name: subgroup.name });
                    }
                    if (subgroup.types) {
                        traverse(subgroup.types)
                    }
                }
            }
            if (item.types) {
                traverse(item.types);
            }
            if (item.subclasses) {
                traverse(item.subclasses)
            }
            if (item.groups) {
                traverse(item.groups)
            }
        }
    }
    traverse(loadedOkvedData)

    return results;
}

function displayResults(organizedData, level = 0) {
    const resultsDiv = document.getElementById("results");

    if (Object.keys(organizedData).length === 0) {
        resultsDiv.innerHTML = "<p>No results found.</p>";
        return;
    }
    const ul = document.createElement("ul");
    ul.style.marginLeft = `${level * 20}px`;

    for (const key in organizedData) {
        const item = organizedData[key];
        const li = document.createElement("li");
        li.textContent = `${item.code}: ${item.name || ''}`;

        if (Object.keys(item.children).length > 0) {
            const childUl = displayResults(item.children, level + 1);
            li.appendChild(childUl);
        }

        ul.appendChild(li);
    }

    resultsDiv.appendChild(ul);
    return ul
}

function clearResults() {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";
    displayResults({});

}

const okvedCodeInput = document.getElementById("okvedCode");

okvedCodeInput.addEventListener("input", () => {
    const query = okvedCodeInput.value.trim();

    const results = searchOkved(query);
    const organizedResults = organizeResults(results);
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";
    displayResults(organizedResults);
});

///===========================
function displayResultsW(itemsDictionary) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";
    
    if (!itemsDictionary || Object.keys(itemsDictionary).length === 0) {
        resultsDiv.innerHTML = "<p>No results found.</p>";
        return;
    }

    const ul = document.createElement("ul");
    
    const allItems = Object.values(itemsDictionary);

    
    const topLevelItems = allItems;
    for (const item of topLevelItems) {
        addItemToUl(ul, item);
    }
    resultsDiv.appendChild(ul);
}

function addItemToUl(ul, item) {
    const li = document.createElement("li");
    li.textContent = `${item.code}: ${item.name || ''}`;
    li.classList.add('main-li');
    ul.appendChild(li);
}

function clearResultsW() {
    displayResultsW(searchOkvedByWord("")); 
}

 
function searchOkvedByWord(query) {
    const results = {};
    for (const item of loadedOkvedData){
         if (item.name.toLowerCase().includes(query.toLowerCase())) {
            results[item.code] = item;
        }
        if(item.subgroups){
            item.subgroups.forEach(subgroup => traverseChildren(subgroup, item, query));
        }
        if (item.types){
            item.types.forEach(type => traverseChildren(type, item, query));
        }
        if (item.subclasses){
            item.subclasses.forEach(subclass => traverseChildren(subclass, item, query));
        }
        if (item.groups){
            item.groups.forEach(group => traverseChildren(group, item, query));
        }
    }
    return results
}
function traverseChildren(itemData, parent, query){

    const item = { code: itemData.code, name: itemData.name, children: [] };
    if (item.name.toLowerCase().includes(query.toLowerCase())){
        
        if (parent) {
            parent.children.push(item)
        }
        if(itemData.subgroups){
            itemData.subgroups.forEach(subgroup => traverseChildren(subgroup, item, query));
        }
        if (itemData.types){
            itemData.types.forEach(type => traverseChildren(type, item, query));
        }
        if (itemData.subclasses){
            itemData.subclasses.forEach(subclass => traverseChildren(subclass, item, query));
        }
        if (itemData.groups){
            itemData.groups.forEach(group => traverseChildren(group, item, query));
        }
    }
}
clearResultsW();
const okvedName = document.getElementById("okvedName");
okvedName.addEventListener("input", () => {    
    const query = okvedName.value.trim();    
    displayResultsW(searchOkvedByWord(query));
})




// JSON Loading:

// Added fetch('okved_data.json') at the beginning of main.js to load the JSON data.
// The .then(response => response.json()) part parses the JSON response.
// loadedOkvedData = data; now stores the data from the JSON file.
// clearResults() is called to initialize the display after data is loaded.
// Error handling (.catch) added for robustness.
// searchOkved Modification:

// The traverse function inside searchOkved now receives the loadedOkvedData as its argument.
// traverse function now only needs to be called once.
// The call to traverse okvedData at the end of searchOkved function was deleted.
// Removed okvedData Array:

// The original okvedData array was completely removed.