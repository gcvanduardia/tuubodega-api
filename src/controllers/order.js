const sql = require("mssql");
const { generateIntegritySignature, generateReference } = require('../services/wompi');

exports.store = async (req, res) => {
    let transaction;
    try {
        transaction = new sql.Transaction();
        await transaction.begin();

        const request = new sql.Request(transaction);
        const idUser = req.user.IdUsuario;

        // Se consulta los articulos que el usuario tiene en el carrito
        const sql_query = `SELECT C.Id, C.IdArticulo, C.Cantidad, A.PrecioUnit
        FROM Carrito AS C 
        INNER JOIN Articulos AS A ON  C.IdArticulo = A.Id
        WHERE C.IdUser = ${idUser}`;

        const articulos = await request.query(sql_query);

        if (articulos.recordset.length == 0) {
            res.status(500).send({ Error: true, Message: 'No tiene productos en el carrito' });
            return;
        }

        // Se hace el inser en la tabla ordenes con los datos basicos
        const sql_orden = `INSERT INTO Ordenes (IdOrdenEstado, IdUser, FechaCreacion)
        OUTPUT INSERTED.Id
        VALUES ( 1, ${req.user.IdUsuario}, '${new Date().toISOString()}' )`;

        const orden = await request.query(sql_orden);
        const idOrden = orden.recordset[0].Id;

        let valorTotal = 0;
        // Se recorre cada articulo y se hace insert en ordenesArticulos relacionadolo con la orden creada anteriormente
        for (const key in articulos.recordset) {
            const item = articulos.recordset[key];

            await request.query(`INSERT INTO OrdenesArticulos (IdArticulo, IdOrden, PrecioUnit, Cantidad)
            VALUES ( ${item.IdArticulo}, ${idOrden}, ${item.PrecioUnit}, ${item.Cantidad} )`);

            valorTotal += item.PrecioUnit * item.Cantidad;
        }

        // Se generan los datos para wompi
        const reference = generateReference(16);
        const monto = Math.round(valorTotal) * 100;
        const cadena = reference + monto + 'COP';
        const integritySignature = generateIntegritySignature(cadena);

        // Se hace insert en la tabla de transacciones con los datos basicos
        const sql_payment = `INSERT INTO PaymentsTransactions (Referencia, IdUser, IdOrden)
        VALUES ('${reference}', ${req.user.IdUsuario}, ${idOrden})`;

        await request.query(sql_payment);

        // Se actualiza la tabla de Ordenes con el valor total de la Orden y la refencia de Wompi
        const sql_update_orden = `UPDATE Ordenes
        SET Referencia = '${reference}', Valor = ${valorTotal}
        WHERE Id = ${idOrden};`;

        await request.query(sql_update_orden);

        // Se eliminan los articulos del carrito
        const sql_delete_carrito = `DELETE FROM Carrito WHERE IdUser = ${req.user.IdUsuario}`;

        await request.query(sql_delete_carrito);

        await transaction.commit();

        res.status(200).json({
            publicKey: process.env.WOMPI_PUBLIC_KEY,
            currency: 'COP',
            amountInCents: monto,
            reference: reference,
            integritySignature: integritySignature,
            idOrden: idOrden
        });

    } catch (error) {
        if (transaction && transaction._aborted !== true) {
            await transaction.rollback();
        }
        console.log('Order store: ', error);
        res.status(500).send({ Error: true, Message: error });
    }
};

exports.getCotizacionById = async (req, res) => {
    try {
        const { idCotizacion } = req.params;
        
        // Log the idOrden to ensure it's a valid number
        console.log('idCotizacion:', idCotizacion);

        // Check if idOrden is a valid number
        if (isNaN(idCotizacion)) {
            return res.status(400).json({ Error: true, Message: 'El campo idCotizacion debe ser un número válido.' });
        }

        const request = new sql.Request();

        const sql_str = `
            SELECT * FROM CotizacionesCarrito 
            WHERE Id = ${idCotizacion}
        `;

        const result = await request.query(sql_str);

        if (result.recordset.length === 0) {
            return res.status(404).json({ Error: true, Message: 'Cotizacion no encontrada.' });
        }

        res.status(200).json(result.recordset[0]);

    } catch (error) {
        console.log('Error getting Cotizacion: ', error);
        res.status(500).send({ Error: true, Message: error });
    }
};

exports.updateOrdenMethods = async (req, res) => {
    try {
        const { idOrden } = req.params;
        const { DeliveryMethod, PaymentMethod } = req.body;
        
        if (!idOrden) {
            return res.status(400).json({ Error: true, Message: 'El campo idOrden es necesario.' });
        }
        
        if (!DeliveryMethod && !PaymentMethod) {
            return res.status(400).json({ Error: true, Message: 'Se debe proporcionar al menos uno de los campos DeliveryMethod o PaymentMethod.' });
        }

        const request = new sql.Request();
        let updateFields = [];
        
        if (DeliveryMethod) {
            updateFields.push(`DeliveryMethod = @DeliveryMethod`);
            request.input('DeliveryMethod', sql.VarChar, DeliveryMethod);
        }
        
        if (PaymentMethod) {
            updateFields.push(`PaymentMethod = @PaymentMethod`);
            request.input('PaymentMethod', sql.VarChar, PaymentMethod);
        }

        const sql_str = `
            UPDATE CotizacionesCarrito
            SET ${updateFields.join(', ')}
            WHERE Id = @idOrden
        `;

        request.input('idOrden', sql.VarChar, idOrden);

        await request.query(sql_str);

        res.status(200).json({ Success: true, Message: 'Cotizacion actualizada exitosamente.' });

    } catch (error) {
        console.log('Error updating cotizacion: ', error);
        res.status(500).send({ Error: true, Message: error });
    }
};

exports.getProductByOrdenId = async (req, res) => {
    try {
        const { idCotizacion } = req.params;
        const request = new sql.Request();

        const sql_str = `
            SELECT * FROM DetallesCotizacionesCarrito
            WHERE IdOrdenCarrito = ${idCotizacion}
        `;

        const result = await request.query(sql_str);

        if (result.recordset.length === 0) {
            return res.status(404).json({ Error: true, Message: 'Cotizacion no encontrada.' });
        }

        res.status(200).json(result.recordset);

    } catch (error) {
        console.log('Error getting Cotizacion: ', error);
        res.status(500).send({ Error: true, Message: error });
    }
}

exports.createCotizacion = async (req, res) => {
    try {
        const idUser = req.params.idUser
        const request = new sql.Request();

        //Se consulta los articulos que el usuario tiene en el carrito
        sql_query =  `SELECT C.Id, C.IdArticulo, C.Cantidad, A.PrecioUnit
        FROM Carrito AS C 
        INNER JOIN Articulos AS A ON  C.IdArticulo = A.Id
        WHERE C.IdUser = ${idUser}`;

       const articulos = await request.query(sql_query);

       if(articulos.recordset.length == 0){
            res.status(500).send({ Error: true, Message: 'No tiene productos en el carrito' });
       }

       // Se hace el inser en la tabla CotizacionesCarrito con los datos basicos
       sql_orden =  `INSERT INTO CotizacionesCarrito (IdUser, FechaCreacion)
        OUTPUT INSERTED.Id
        VALUES (${req.user.IdUsuario}, '${new Date().toISOString()}' )`;

       const orden =  await request.query(sql_orden);
       const idOrden = orden.recordset[0].Id
       console.log('idOrden: ',idOrden);
       for (const key in articulos.recordset) {
            const item = articulos.recordset[key];

            await request.query(`INSERT INTO DetallesCotizacionesCarrito (IdArticulo, IdOrdenCarrito, Cantidad)
            VALUES ( ${item.IdArticulo}, ${idOrden}, ${item.Cantidad} )`);
       }

        res.status(200).json({
            currency: 'COP',
            idOrden: parseInt(idOrden)
        });
        console.log('IdOrden: ',idOrden);

        
    } catch (error) {
        console.log('Cotizacion Error: ',error);
        res.status(500).send({ Error: true, Message: error });
    }
}