const sql = require("mssql");

exports.store = async (req, res) => {

    try {

        const request = new sql.Request();
        const idArticulo = req.body.idArticulo;
        const cantidad = req.body.cantidad;
        const idUser = req.user.IdUsuario

        if (cantidad < 1 ) {
            return res.status(400).send({ Error: true, Message: 'La cantidad debe ser mayor a cero' });
        }

        const Article = await request.query(`SELECT Id, Cantidad FROM Articulos WHERE Id = ${idArticulo}`);

        if (Article.recordset.length == 0 ) {
            return res.status(400).send({ Error: true, Message: 'El articulo seleccionado no existe' });
        }
        if (Article.recordset[0].Cantidad < cantidad ) {
            return res.status(400).send({ Error: true, Message: 'La cantidad solicitada supera la cantidad disponible' });
        }

        const exist = await request.query(`SELECT COUNT(*)  as count FROM Carrito WHERE IdArticulo = ${idArticulo} AND IdUser = ${idUser}`);

        if (exist.recordset[0].count > 0 ) {
            return res.status(400).send({ Error: true, Message: 'El articulo ya se encuentra en el carrito' });
        }

        sql_insert =  `INSERT INTO Carrito (Cantidad, IdArticulo, IdUser, FechaCreacion)
        VALUES (${cantidad}, ${idArticulo}, ${idUser}, '${new Date().toISOString()}')`;

       await request.query(sql_insert);

        res.status(200).json({
            Message:'Almacenado correctamente',
            data: true
        });

        
    } catch (error) {
        console.log('Cart store: ',error);
        res.status(500).send({ Error: true, Message: error });
    }
}

exports.update = async (req, res) => {

    try {

        const request = new sql.Request();
        const idArticulo = req.body.idArticulo;
        const cantidad = req.body.cantidad;
        const idUser = req.user.IdUsuario

        if (cantidad < 1 ) {
            return res.status(400).send({ Error: true, Message: 'La cantidad debe ser mayor a cero' });
        }

        const Article = await request.query(`SELECT Id, Cantidad FROM Articulos WHERE Id = ${idArticulo}`);

        if (Article.recordset.length == 0 ) {
            return res.status(400).send({ Error: true, Message: 'El articulo seleccionado no existe' });
        }
        if (Article.recordset[0].Cantidad < cantidad ) {
            return res.status(400).send({ Error: true, Message: 'La cantidad solicitada supera la cantidad disponible' });
        }

        const exist = await request.query(`SELECT COUNT(*) as count FROM Carrito WHERE IdArticulo = ${idArticulo} AND IdUser = ${idUser}`);
        console.log(exist);

        if (exist.recordset[0].count == 0) {
            return res.status(400).send({ Error: true, Message: 'El articulo NO esta en el carrito' });
        }

        sql_update =  `UPDATE Carrito SET Cantidad = ${cantidad} WHERE IdArticulo = ${idArticulo} AND IdUser = ${idUser}`

       await request.query(sql_update);

        res.status(200).json({
            Message:'Actualizado correctamente',
            data: true
        });

        
    } catch (error) {
        console.log('Cart Update: ',error);
        res.status(500).send({ Error: true, Message: error });
    }
}

exports.destroy = async (req, res) => {

    try {

        const request = new sql.Request();
        const idArticulo = req.query.idArticulo;
        const idUser = req.user.IdUsuario

        const Article = await request.query(`SELECT Id, Cantidad FROM Articulos WHERE Id = ${idArticulo}`);

        if (Article.recordset.length == 0 ) {
            return res.status(400).send({ Error: true, Message: 'El articulo seleccionado no existe' });
        }

        sql_delete =  `DELETE FROM Carrito WHERE IdArticulo = ${idArticulo} AND IdUser = ${idUser}`;

       await request.query(sql_delete);

        res.status(200).json({
            Message:'Eliminado correctamente',
            data: true
        });

        
    } catch (error) {
        console.log('Cart destroy: ',error);
        res.status(500).send({ Error: true, Message: error });
    }
}

exports.list = async (req, res) => {

    try {

        const request = new sql.Request();
        const idUser = req.user.IdUsuario

        sql_query =  `SELECT C.Id, C.IdArticulo, C.Cantidad, A.Nombre, A.ImagenPrin, A.PrecioUnit, A.Cantidad as CantidadMaxima
        FROM Carrito AS C 
        INNER JOIN Articulos AS A ON  C.IdArticulo = A.Id
        WHERE C.IdUser = ${idUser}`;

       const data = await request.query(sql_query);

       const dataMap = data.recordset.map(e => {

        return {
            ...e,
            PrecioTotal: e.PrecioUnit * e.Cantidad
        }
       })
      
        res.status(200).json({
            Message:'consultado correctamente',
            data: dataMap,
        });

        
    } catch (error) {
        console.log('Cart List: ',error);
        res.status(500).send({ Error: true, Message: error });
    }
}

exports.summary = async (req, res) => {

    try {

        const request = new sql.Request();
        const idUser = req.user.IdUsuario

        sql_query =  `SELECT C.Cantidad, A.PrecioUnit
        FROM Carrito AS C 
        JOIN Articulos AS A ON A.Id = C.IdArticulo
        WHERE IdUser = ${idUser}`;

       const data = await request.query(sql_query);

        let valorTotal = 0
        data.recordset.forEach(e => {
         valorTotal += e.PrecioUnit * e.Cantidad
        });
       
      
        res.status(200).json({
            Message:'consultado correctamente',
            data: Math.round(valorTotal)
        });

        
    } catch (error) {
        console.log('Cart List: ',error);
        res.status(500).send({ Error: true, Message: error });
    }
}

exports.emptyCart = async (req, res) => {

    try {

        const request = new sql.Request();
        const idUser = req.user.IdUsuario

        sql_delete =  `DELETE FROM Carrito WHERE IdUser = ${idUser}`;

       await request.query(sql_delete);

        res.status(200).json({
            Message:'Carrito vaciado correctamente',
            data: true
        });

        
    } catch (error) {
        console.log('Cart empty: ',error);
        res.status(500).send({ Error: true, Message: error });
    }
}

