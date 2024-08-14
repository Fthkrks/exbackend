const xlsx = require("node-xlsx");
const CustomError = require("./error");
const { HTTP_CODES } = require("../config/enum");

class Import {
  constructor() {}

  fromExcel(filePath) {
    let workSheets = xlsx.parse(filePath);

    if (!workSheets || workSheets.length === 0)
      throw new CustomError(
        HTTP_CODES.BAD_REQUEST,
        "Invalid Excel Format",
        "Invalid Excel Format"
      );

    let rows = workSheets[0].data;

    if (rows?.length === 0)
      throw new CustomError(
        HTTP_CODES.NOT_ACCEPTABLE,
        "File is empty",
        "Excel file is empty"
      );

    return rows;
  }
  importExcel() {}
}

module.exports = new Import();
