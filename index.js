/*

```A Program to find meanings of words from Google's Dictionary and write necessary details in markdown format.```

API USED: https://github.com/meetDeveloper/googleDictionaryAPI
API ENDPOINT: https://api.dictionaryapi.dev/api/v2/entries/<lanuage-code>/<word>
AUTHOR: AshAwe (https://github.com/ashawe)
*/

let fs = require("fs");
const http = require('https');

// reads words from a txt file (comma separated). O/p Array of words.
function wordsFromFileToArray(fileName) {
    console.log("reading from " + fileName);
    const data = fs.readFileSync('./words1.txt', { encoding: 'utf8', flag: 'r' });
    // console.log(data);
    return data.split(',');
}

// sync function that takes a word and returns json response from dictionary API.
function findMeaningFromAPI(word) {
    return new Promise((resolve, reject) => {
        http.get('https://api.dictionaryapi.dev/api/v2/entries/en/' + word, (response) => {
            let chunks_of_data = [];
            response.on('data', (fragments) => {
                chunks_of_data.push(fragments);
            });

            response.on('end', () => {
                let response_body = Buffer.concat(chunks_of_data);
                resolve(response_body.toString());
            });

            response.on('error', (error) => {
                reject(error);
            });
        });
    });
}

// takes a json input `inputStream` from Dictionary API and `filename` as argument
// then writes word, its part of speech, definition and synonyms to `filename` in markdown.
function writeMeaningToFile(inputStream, filename) {
    let stream = fs.createWriteStream(filename, { flags: 'a' });
    let toWrite = "";
    let result = JSON.parse(inputStream);
    let synonyms = "synonyms: ";
    console.log(result[0].word);
    toWrite += "- " + result[0].word + "\n";
    result[0].meanings.forEach(meaning => {
        toWrite += "    - " + meaning.partOfSpeech + "\n";
        meaning.definitions.forEach(definition => {
            toWrite += "        - " + definition.definition + "\n";
            toWrite += "        - ex: " + definition.example + "\n";
            if (definition.synonyms !== undefined) {
                synonyms += " " + definition.synonyms[0];
                for (let i = 1; i < 5; i++) {
                    const synonym = definition.synonyms[i];
                    synonyms = synonyms + ", " + synonym;
                }
            }
        });
    });
    toWrite += "        - " + synonyms + "\n";
    console.log("ending stream");
    stream.write(toWrite);
    stream.end();
}

// a handler function to wait for the HTTP response and then call function which writes meaning to file
async function waitAndWriteMeaningToFileHandler(word, filename) {
    try {
        let http_promise = findMeaningFromAPI(word);
        let inputStream = await http_promise;
        console.log("got stream");
        writeMeaningToFile(inputStream, filename);
        console.log("wrote to file");
    }
    catch (error) {
        // Promise rejected
        console.log(error);
    }
}

// Takes a file containing words (comma separated) and output file name as arg 
// and writes meanings to outputFile in markdown
function wordMeaningToMarkdown(inputFileName, outputFileName) {
    let arrayOfWords = wordsFromFileToArray(inputFileName);
    console.log(arrayOfWords);
    arrayOfWords.forEach(word => {
        (async function () {
            // wait to http request to finish
            await waitAndWriteMeaningToFileHandler(word, outputFileName);
        })();
    });
}

wordMeaningToMarkdown("./words1.txt", "./words.md");