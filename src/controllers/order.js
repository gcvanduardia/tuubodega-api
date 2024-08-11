const sql = require("mssql");
const { generateIntegritySignature, generateReference } = require('../services/wompi');

exports.store = async (req, res) => {
    let transaction;
    try {

        transaction = new sql.Transaction();

        await transaction.begin();

        const request = new sql.Request(transaction);
        const idUser = req.user.IdUsuario

        //Se consulta los articulos que el usuario tiene en el carrito
        sql_query =  `SELECT C.Id, C.IdArticulo, C.Cantidad, A.PrecioUnit
        FROM Carrito AS C 
        INNER JOIN Articulos AS A ON  C.IdArticulo = A.Id
        WHERE C.IdUser = ${idUser}`;

       const articulos = await request.query(sql_query);

       if(articulos.recordset.length == 0){
            res.status(500).send({ Error: true, Message: 'No tiene productos en el carrito' });
       }

       // Se hace el inser en la tabla ordenes con los datos basicos
       sql_orden =  `INSERT INTO Ordenes (Estado, IdUser, FechaCreacion)
        OUTPUT INSERTED.Id
        VALUES ( 1, ${req.user.IdUsuario}, '${new Date().toISOString()}' )`;

       const orden =  await request.query(sql_orden);
       const idOrden = orden.recordset[0].Id
      
       let valorTotal = 0
       // Se recorre cada articulo y se hace insert en ordenesArticulos relacionadolo con la orden creada anteriormente
       for (const key in articulos.recordset) {
            const item = articulos.recordset[key];

            await request.query(`INSERT INTO OrdenesArticulos (IdArticulo, IdOrden, PrecioUnit, Cantidad)
            VALUES ( ${item.IdArticulo}, ${idOrden}, ${item.PrecioUnit}, ${item.Cantidad} )`);

            valorTotal += item.PrecioUnit * item.Cantidad
       }
       
       // Se generan los datos para wompi
        const reference = generateReference(16);
        const monto = Math.round(valorTotal) * 100 
        const cadena = reference + monto + 'COP'
        const integritySignature = generateIntegritySignature(cadena);

       // Se hace insert en la tabla de transacciones con los datos basicos
        sql_payment =  `INSERT INTO PaymentsTransactions (Referencia, IdUser, IdOrden)
        VALUES ('${reference}', ${req.user.IdUsuario}, ${idOrden})`;

        await request.query(sql_payment);

       // Se actualiza la tabla de Ordenes con el valor total de la Orden y la refencia de Wompi
        sql_update_orden = `UPDATE Ordenes
        SET Referencia = '${reference}', Valor = ${valorTotal}
        WHERE Id = ${idOrden};`

        await request.query(sql_update_orden);

        // Se eliminan los articulos del carrito
        sql_delete_carrito =  `DELETE FROM Carrito WHERE IdUser = ${req.user.IdUsuario}`;

        await request.query(sql_delete_carrito);

        await transaction.commit();

        res.status(200).json({
            publicKey:process.env.WOMPI_PUBLIC_KEY,
            currency: 'COP',
            amountInCents: monto,
            reference: reference,
            integritySignature: integritySignature
        });

        
    } catch (error) {

        if (transaction) {
            await transaction.rollback();
        }
        console.log('Order store: ',error);
        res.status(500).send({ Error: true, Message: error });
    }
}