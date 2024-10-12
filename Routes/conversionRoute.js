const express = require("express");
const multer = require("multer");
const ExcelJS = require("exceljs");
const convertFileToData = require("../Controllers/convertPdfToXls");
const Router = express.Router();
const fs = require("fs").promises;
const path = require("path");

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 200,
  },
});

Router.post("/convertfile", upload.array(`pdfs`, 200), async (req, res) => {
  try {
    const data = await convertFileToData(req.files);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data");

    data.map((singleData) => {
      worksheet.addRow(singleData);
    });
    const formatDate = (date) => {
      return date.toISOString().replace(/:/g, "-");
    };

    const fileName = `data_${formatDate(new Date())}.xlsx`;
    const filePath = path.join(__dirname, fileName);
    await workbook.xlsx.writeFile(filePath);

    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error("Error while sending the file:", err);
      }
      fs.unlink(path.join(__dirname, fileName));
    });
  } catch (err) {
    console.log(`Error in data transformation ${err.message}`);
  } finally {
    await Promise.all(
      req.files.map((file) => {
        fs.unlink(path.join(__dirname, "..", "uploads", file.filename));
      })
    );
  }
});

module.exports = Router;
