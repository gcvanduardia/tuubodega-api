const sql = require("mssql");

exports.searchAdmin = async (req, res) => {
    const search = req.body.search || req.query.search;
    const pageNumber = req.body.pageNumber || req.query.pageNumber || 1;
    const pageSize = req.body.pageSize || req.query.pageSize || 12;
    const order = req.body.order || req.query.order || 'masRelevante';

    const request = new sql.Request();
    let sql_searchInfo = '';
    let sql_str = '';
    if(search == undefined || search == ''){
        if(pageNumber == 1){
            sql_searchInfo = `
            SELECT Resultados = COUNT(Id), PageZise = ${pageSize}
            FROM vw_EncArticulosAdmin`;
        }
        sql_str = `
            SELECT Id, Nombre, PrecioUnit, ImagenPrin, IdProveedor, Proveedor, ArticuloEn, CategoriaEn, ProveedorEn
            FROM vw_EncArticulosAdmin
            ORDER BY Id DESC
            OFFSET ${pageSize} * (${pageNumber} - 1) ROWS
            FETCH NEXT ${pageSize} ROWS ONLY;
            
            ${sql_searchInfo}`;
    }else{
        if(pageNumber == 1){
            sql_searchInfo = `
            SELECT Resultados = COUNT(Id), PageZise = ${pageSize}
            FROM vw_EncArticulosAdmin
            WHERE clave COLLATE Latin1_General_CI_AI LIKE '%${search}%'`;
        }
        let sqlOrder = '';
        switch (order) {
            case 'masRelevante':
                sqlOrder = `ORDER BY CHARINDEX('${search}', clave COLLATE Latin1_General_CI_AI), nombre`;
                break;
            case 'menorPrecio':
                sqlOrder = `ORDER BY PrecioUnit ASC`;
                break;
            case 'mayorPrecio':
                sqlOrder = `ORDER BY PrecioUnit DESC`;
                break;
            default:
                sqlOrder = `ORDER BY Id DESC`;
                break;
        }
        sql_str = `
            SELECT Id, Nombre, PrecioUnit, ImagenPrin, IdProveedor, Proveedor, ArticuloEn, CategoriaEn, ProveedorEn
            FROM vw_EncArticulosAdmin
            WHERE clave COLLATE Latin1_General_CI_AI LIKE '%${search}%'
            ${sqlOrder}
            OFFSET ${pageSize} * (${pageNumber} - 1) ROWS
            FETCH NEXT ${pageSize} ROWS ONLY;
            
            ${sql_searchInfo}`;
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
    const order = req.body.order || req.query.order || 'masRelevante';
    const categories = req.body.categories || req.query.categories;

    const request = new sql.Request();
    let sql_searchInfo = '';
    let sql_str = '';
    let sqlOrder = '';
    let sqlCategories1 = '';
    let sqlCategories2 = '';
    let sqlCategories3 = '';
    if(categories != undefined && categories != ''){
        sqlCategories1 = `AND IdCategoria IN (${categories})`;
        sqlCategories2 = `WHERE IdCategoria IN (${categories})`;
        sqlCategories3 = `UNION SELECT Id, Nombre FROM CategoriasArticulos WHERE Id IN (${categories})`;
    }
    switch (order) {
        case 'masRelevante':
            if(search == undefined || search == ''){
                sqlOrder = `ORDER BY Id DESC`;
            } else {    
                sqlOrder = `ORDER BY CHARINDEX('${search}', clave COLLATE Latin1_General_CI_AI), nombre`;
            }
            break;
        case 'menorPrecio':
            sqlOrder = `ORDER BY PrecioUnit ASC`;
            break;
        case 'mayorPrecio':
            sqlOrder = `ORDER BY PrecioUnit DESC`;
            break;
        default:
            sqlOrder = `ORDER BY Id DESC`;
            break;
    }
    if(search == undefined || search == ''){
        if(pageNumber == 1){
            sql_searchInfo = `
            SELECT Resultados = COUNT(Id), PageZise = ${pageSize}
            FROM vw_EncArticulos
            ${sqlCategories2}
            
            SELECT a.IdCategoria, c.Nombre
            FROM vw_EncArticulos a
            INNER JOIN CategoriasArticulos c ON a.IdCategoria = c.Id
            GROUP BY a.IdCategoria, c.Nombre;
            `;
        }
        sql_str = `
            SELECT Id, Nombre, PrecioUnit, ImagenPrin
            FROM vw_EncArticulos
            ${sqlCategories2}
            ${sqlOrder}
            OFFSET ${pageSize} * (${pageNumber} - 1) ROWS
            FETCH NEXT ${pageSize} ROWS ONLY;
            
            ${sql_searchInfo}`;
    }else{
        if(pageNumber == 1){
            sql_searchInfo = `
            SELECT Resultados = COUNT(Id), PageZise = ${pageSize}
            FROM vw_EncArticulos
            WHERE clave COLLATE Latin1_General_CI_AI LIKE '%${search}%'
            ${sqlCategories1}
            
            SELECT a.IdCategoria, c.Nombre
            FROM vw_EncArticulos a
            INNER JOIN CategoriasArticulos c ON a.IdCategoria = c.Id
            WHERE a.clave COLLATE Latin1_General_CI_AI LIKE '%${search}%' 
            GROUP BY a.IdCategoria, c.Nombre
            ${sqlCategories3}`;
        }
        sql_str = `
            SELECT Id, Nombre, PrecioUnit, ImagenPrin
            FROM vw_EncArticulos
            WHERE clave COLLATE Latin1_General_CI_AI LIKE '%${search}%' ${sqlCategories1}
            ${sqlOrder}
            OFFSET ${pageSize} * (${pageNumber} - 1) ROWS
            FETCH NEXT ${pageSize} ROWS ONLY;
            
            ${sql_searchInfo}`;
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


exports.presearch = async (req, res) => {
    const search = req.body.search || req.query.search;
    const pageNumber = req.body.pageNumber || req.query.pageNumber || 1;
    const pageSize = req.body.pageSize || req.query.pageSize || 12;
    const order = req.body.order || req.query.order || 'masRelevante';
    const categories = req.body.categories || req.query.categories;

    const request = new sql.Request();
    let sql_str = '';
    let sqlOrder = '';
    let sqlCategories1 = '';
    let sqlCategories2 = '';
    let sqlCategories3 = '';
    if(categories != undefined && categories != ''){
        sqlCategories1 = `AND IdCategoria IN (${categories})`;
        sqlCategories2 = `WHERE IdCategoria IN (${categories})`;
        sqlCategories3 = `UNION SELECT Id, Nombre FROM CategoriasArticulos WHERE Id IN (${categories})`;
    }
    switch (order) {
        case 'masRelevante':    
            sqlOrder = `ORDER BY CHARINDEX('${search}', clave COLLATE Latin1_General_CI_AI), nombre`;
            break;
        case 'menorPrecio':
            sqlOrder = `ORDER BY PrecioUnit ASC`;
            break;
        case 'mayorPrecio':
            sqlOrder = `ORDER BY PrecioUnit DESC`;
            break;
        default:
            sqlOrder = `ORDER BY Id DESC`;
            break;
    }
    if(search == undefined || search == ''){
        sql_str = `
            SELECT Nombre
            FROM vw_EncArticulos
            ${sqlOrder}
            OFFSET ${pageSize} * (${pageNumber} - 1) ROWS
            FETCH NEXT ${pageSize} ROWS ONLY;`;
    }else{
        sql_str = `
            SELECT Nombre
            FROM vw_EncArticulos
            WHERE clave COLLATE Latin1_General_CI_AI LIKE '%${search}%' 
            ${sqlOrder}
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


exports.article = async (req, res) => {
    const id = req.body.id || req.query.id;
    const request = new sql.Request();
    sql_str = ` SELECT * FROM vw_DetArticulo WHERE Id = ${id}`;
    request.query(sql_str)
        .then((object) => {
            res.status(200).json(object.recordset[0]);
        })
        .catch((err) => {
            console.log('Articulos article: ',err);
            res.status(500).send({ Error: true, Message: err });
        });
}