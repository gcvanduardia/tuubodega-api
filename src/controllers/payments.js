const sql = require("mssql");
const { generateIntegritySignature, generateReference } = require('../services/wompi');

exports.integritySignature = async (req, res) => {

    try {
        const id = req.query.id;
        const cantidad = req.query.cantidad;
        const request = new sql.Request();
        sql_str = ` SELECT * FROM vw_DetArticulo WHERE Id = ${id}`;

        const result = await request.query(sql_str);
        
        const reference = generateReference(16);

        const product = result.recordset[0]
        const monto = (Math.round(product.PrecioUnit) * cantidad) * 100 
        const cadena = reference + monto + 'COP'
        const integritySignature = generateIntegritySignature(cadena);


        sql_str_payment =  `INSERT INTO PaymentsTransactions (Referencia, IdUser)
        VALUES ('${reference}', ${req.user.IdUsuario})`;

        await request.query(sql_str_payment);

        res.status(200).json({
            publicKey:process.env.WOMPI_PUBLIC_KEY,
            currency: 'COP',
            amountInCents: monto,
            reference: reference,
            integritySignature: integritySignature
        });

    } catch (error) {
        console.log('Payments records: ',error);
        res.status(500).send({ Error: true, Message: error });
    }
}

exports.recordsList = async (req, res) => {
    const request = new sql.Request();
    const pageNumber = req.body.pageNumber || req.query.pageNumber || 1;
    const pageSize = req.body.pageSize || req.query.pageSize || 10;
    let sql_searchInfo = '';
    let sql_str = '';

    if (pageNumber == 1) {
        sql_searchInfo = `
        SELECT Resultados = COUNT(IdTransaccion), PageZise = ${pageSize}
        FROM VistaPaymentsTransactions`;
    }

    sql_str = `
        SELECT * FROM VistaPaymentsTransactions
        ORDER BY FechaCreacion ASC
        OFFSET ${pageSize} * (${pageNumber} - 1) ROWS
        FETCH NEXT ${pageSize} ROWS ONLY;
        
        SELECT Resultados = COUNT(IdTransaccion), PageZise = ${pageSize}
        FROM VistaPaymentsTransactions`;

    request.query(sql_str)
        .then((object) => {
            res.status(200).json(object.recordsets);
        })
        .catch((err) => {
            console.log('Payments records: ', err);
            res.status(500).send({ Error: true, Message: err });
        });
}


exports.createCotizacion = async (req, res) => {
    try {
        const {
            IdUsuario,
            IdProducto,
            Cantidad,
            Codigo,
            Descripcion,
            IdCategoria,
            IdSubCategoria1,
            Imagenes,
            ImagenesArray,
            Nombre,
            PrecioUnit,
            DeliveryMethod,
            PaymentMethod
        } = req.body;

        if (!IdUsuario || !IdProducto || !Cantidad || !Codigo || !Descripcion || !IdCategoria || !IdSubCategoria1 || !Imagenes || !ImagenesArray || !Nombre || !PrecioUnit) {
            return res.status(400).json({ Error: true, Message: 'Todos los campos obligatorios deben ser proporcionados.' });
        }

        const request = new sql.Request();

        const sql_str = `
            INSERT INTO cotizaciones (
                IdUsuario,
                IdProducto,
                Cantidad,
                Codigo,
                Descripcion,
                IdCategoria,
                IdSubCategoria1,
                Imagenes,
                ImagenesArray,
                Nombre,
                PrecioUnit,
                DeliveryMethod,
                PaymentMethod
            )
            VALUES (
                ${IdUsuario},
                ${IdProducto},
                ${Cantidad},
                '${Codigo}',
                '${Descripcion}',
                ${IdCategoria},
                ${IdSubCategoria1},
                '${Imagenes}',
                '${ImagenesArray}',
                '${Nombre}',
                ${PrecioUnit},
                ${DeliveryMethod ? `'${DeliveryMethod}'` : 'NULL'},
                ${PaymentMethod ? `'${PaymentMethod}'` : 'NULL'}
            )
        `;

        await request.query(sql_str);

        res.status(201).json({ Success: true, Message: 'Cotización creada exitosamente.' });

    } catch (error) {
        console.log('Error creating cotizacion: ', error);
        res.status(500).send({ Error: true, Message: error });
    }
};

exports.getCotizacionById = async (req, res) => {
    try {
        const { cod } = req.params;
        const { IdProducto, IdUsuario } = req.query;
        const request = new sql.Request();

        const sql_str = `
            SELECT * FROM cotizaciones 
            WHERE Codigo = ${cod} 
            AND IdProducto = ${IdProducto} 
            AND IdUsuario = ${IdUsuario}
        `;

        const result = await request.query(sql_str);

        if (result.recordset.length === 0) {
            return res.status(404).json({ Error: true, Message: 'Cotización no encontrada.' });
        }

        res.status(200).json(result.recordset[0]);

    } catch (error) {
        console.log('Error getting cotizacion: ', error);
        res.status(500).send({ Error: true, Message: error });
    }
};

exports.updateCotizacion = async (req, res) => {
    try {
        const { cod } = req.params;
        const { IdProducto, IdUsuario } = req.query;
        const { DeliveryMethod, PaymentMethod } = req.body;
        if (!cod || !IdProducto || !IdUsuario) {
            return res.status(400).json({ Error: true, Message: 'Los campos cod, IdProducto e IdUsuario son obligatorios.' });
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
            UPDATE Cotizaciones
            SET ${updateFields.join(', ')}
            WHERE Codigo = @cod
            AND IdProducto = @IdProducto
            AND IdUsuario = @IdUsuario
        `;

        request.input('cod', sql.VarChar, cod);
        request.input('IdProducto', sql.Int, IdProducto);
        request.input('IdUsuario', sql.Int, IdUsuario);

        await request.query(sql_str);

        res.status(200).json({ Success: true, Message: 'Cotización actualizada exitosamente.' });

    } catch (error) {
        console.log('Error updating cotizacion: ', error);
        res.status(500).send({ Error: true, Message: error });
    }
};
