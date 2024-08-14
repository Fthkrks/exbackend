const xlsx = require("node-xlsx");
class Export {
    constructor() {};

    /**
     * 
     * @param {Array} titles Excel tablosunun başlıkları 
     * @param {Array} colums Excel tablosuna yazılacak verilerin isimleri
     * @param {Array} data Excel tablosuna yazılacak veriler
     */

    /*
        [
    
            [ID, CATEGORY NAME, IS_ACTIVE],
            [1, HAYVAN, false ]
        ]
    */

    toExcel(titles, colums, data = []) {
        let rows = [];

        rows.push(titles);

        for(let i = 0; i < data.length; i++) {
            let item = data[i];
            let cols = [];

            for (let j = 0; j < colums.length; j++) { // i yerine j olmalı
                cols.push(item[colums[j]]);
            };

            rows.push(cols);
        };

        return xlsx.build([{name: "Sheet", data: rows}]);
    }
};



module.exports = new Export();