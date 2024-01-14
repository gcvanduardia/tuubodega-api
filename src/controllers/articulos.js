const sql = require("mssql");

exports.all = async (req, res) => {
    const request = new sql.Request();
    sql_str = 'SELECT * FROM vw_EncArticulos';
    request.query(sql_str)
        .then((object) => {
            res.status(200).json(object.recordset);
        })
        .catch((err) => {
            console.log('Articulos all: ',err);
            res.status(500).send({ Error: true, Message: err });
        });
}



exports.search = async (req, res) => {
    const search = req.body.search || req.query.search;
    const pageNumber = req.body.pageNumber || req.query.pageNumber || 1;
    const pageSize = req.body.pageSize || req.query.pageSize || 12;
    const request = new sql.Request();

    let sql_str = '';
    if(search == undefined || search == ''){
        sql_str = `
            SELECT Resultados=COUNT(Id)
            FROM vw_EncArticulos
    
            SELECT Id, Nombre, PrecioUnit, ImagenPrin
            FROM vw_EncArticulos
            ORDER BY Id
            OFFSET ${pageSize} * (${pageNumber} - 1) ROWS
            FETCH NEXT ${pageSize} ROWS ONLY;`;
    }else{
        sql_str = `
            SELECT Resultados = COUNT(Id)
            FROM vw_EncArticulos
            WHERE clave COLLATE Latin1_General_CI_AI LIKE '%${search}%'
    
            SELECT Id, Nombre, PrecioUnit, ImagenPrin
            FROM vw_EncArticulos
            WHERE clave COLLATE Latin1_General_CI_AI LIKE '%${search}%'
            ORDER BY CHARINDEX('${search}', clave COLLATE Latin1_General_CI_AI), nombre
            OFFSET ${pageSize} * (${pageNumber} - 1) ROWS
            FETCH NEXT ${pageSize} ROWS ONLY;`;
    }
    console.log('Articulos search: ',sql_str);
    request.query(sql_str)
        .then((object) => {
            res.status(200).json(object.recordsets);
        })
        .catch((err) => {
            console.log('Articulos search: ',err);
            res.status(500).send({ Error: true, Message: err });
        });
}