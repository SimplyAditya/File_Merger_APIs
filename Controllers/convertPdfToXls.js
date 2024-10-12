const path = require("path");
const PdfParse = require("pdf-parse");
const fs = require("fs").promises;

// const processBatch = async (batchFiles) => {
//   try {
//     const dataExtracted = batchFiles.map(async (file) => {
//       const filePath = path.join(__dirname, '..', 'uploads', file.filename);
//       const fileBuffer = await fs.readFile(filePath);
//       const data = await PdfParse(fileBuffer);

//       return data.text;
//     });

//     return await Promise.all(dataExtracted);
//   } catch (err) {
//     console.log("Error reading data from file: ", err.message);
//     return null;
//   }
// };

const processBatch = async (batchFiles) => {
  try {
    const dataExtracted = batchFiles.map(async (file) => {
      const filePath = path.join(__dirname, '..', 'uploads', file.filename);
      const fileBuffer = await fs.readFile(filePath);
      
      const data = await PdfParse(fileBuffer);

// Split the text based on double newlines or form feed (depending on the PDF)
const pagesText = data.text.split(/\n{2,}/);

if (pagesText.length <= 2) {
  console.log("File has too few pages to extract meaningful data.");
  return [];
}

// Extract relevant pages, excluding the first and last page
const relevantPages = pagesText.slice(2, pagesText.length - 1);

// Function to identify if a line is a header
const isHeaderLine = (line) => {
  const headerKeywords = [
    "FCAGBILLDETAILT", 
    "AGENT BILLING DETAILS", 
    "UNIGLOBE", 
    "TOURS & TRAVEL", 
    "AIR", 
    "TRNC", 
    "Document",
    "Tax",
    "Fare"
  ];
  
  return headerKeywords.some(keyword => line.includes(keyword));
};

// Function to detect if the date, time, and page number are split across lines
const mergeDateTimePage = (lines) => {
  let result = [];
  let tempLine = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if it's a date, time, and page number split across lines
    if (line.match(/\d{2}-[A-Z]{3}-\d{4}/)) {  // Example for date "08-MAR-2024"
      tempLine.push(line);
    } else if (line.match(/\d{2}:\d{2}:\d{2}[AP]M/)) {  // Example for time "07:37:58PM"
      tempLine.push(line);
    } else if (line.match(/Page\s+:\s+\d{5}/)) {  // Example for page "Page : 00002"
      tempLine.push(line);
    }

    // If tempLine has 3 parts (date, time, page), add it to result
    if (tempLine.length === 3) {
      result.push(tempLine);
      tempLine = [];  // Reset temp line after adding
    } else if (!line.match(/\d{2}-[A-Z]{3}-\d{4}/) && !line.match(/\d{2}:\d{2}:\d{2}[AP]M/) && !line.match(/Page\s+:\s+\d{5}/)) {
      // Add other lines to result as normal
      result.push([line]);
    }
  }

  return result;
};

// Process the relevant pages while skipping header lines
const fileData = relevantPages.flatMap((page) => {
  const lines = page.split('\n');
  const filteredLines = lines.filter(line => !isHeaderLine(line.trim()));  // Filter out header lines
  
  // Merge date, time, and page number if split across lines
  const mergedData = mergeDateTimePage(filteredLines);
  
  // Further split remaining data by spaces
  return mergedData.map((line) => line.flatMap(item => item.trim().split(/\s+/)));  // Split remaining lines into array elements
});

// Log the extracted data
console.log("Extracted Data Without Headers and With Correct Line Merging:", fileData);

return fileData;

    });

    return (await Promise.all(dataExtracted)).flat();
  } catch (err) {
    console.log("Error reading data from file:", err.message);
    return null;
  }
};

const convertFileToData = async (files) => {
  const extractedData = [];
  const batchSize = 10;
  try {
    for (let i = 0; i < files.length; i += batchSize) {
      const batchFiles = files.slice(i, i + batchSize);
      const batchData = await processBatch(batchFiles);
      extractedData.push(...batchData);
    }
  } catch (err) {
    console.log("Error extracting files data", err.message);
  } finally {
    return extractedData;
  }
};

module.exports = convertFileToData;
