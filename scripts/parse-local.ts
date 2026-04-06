const fs = require('fs');
const pdf = require('pdf-parse');

async function parse() {
  const dataBuffer = fs.readFileSync('income.pdf');
  try {
    const data = await pdf(dataBuffer);
    console.log("=========== PDF TEXT ===========");
    console.log(data.text);
    console.log("================================");
  } catch (e) {
    console.error("Failed to parse PDF:", e);
  }
}

parse();
