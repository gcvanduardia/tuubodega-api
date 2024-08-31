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


exports.createOrUpdateCotizacion = async (req, res) => {
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
            ImagenPrin,
            Nombre,
            PrecioUnit,
            DeliveryMethod,
            PaymentMethod
        } = req.body;

        if (!IdUsuario || !IdProducto || !Cantidad || !Codigo || !Descripcion || !IdCategoria || !IdSubCategoria1 || !Imagenes || !ImagenesArray || !Nombre || !PrecioUnit) {
            return res.status(400).json({ Error: true, Message: 'Todos los campos obligatorios deben ser proporcionados.' });
        }

        const request = new sql.Request();

        const checkSql = `
            SELECT IdCotizacion FROM cotizaciones 
            WHERE IdUsuario = ${IdUsuario} AND IdProducto = ${IdProducto}
        `;
        const checkResult = await request.query(checkSql);

        let IdCotizacion;

        if (checkResult.recordset.length > 0) {
            IdCotizacion = checkResult.recordset[0].IdCotizacion;
            const updateSql = `
                UPDATE cotizaciones
                SET 
                    Cantidad = ${Cantidad},
                    Codigo = '${Codigo}',
                    Descripcion = '${Descripcion}',
                    IdCategoria = ${IdCategoria},
                    IdSubCategoria1 = ${IdSubCategoria1},
                    Imagenes = '${Imagenes}',
                    ImagenesArray = '${ImagenesArray}',
                    ImagenPrin = '${ImagenPrin}',
                    Nombre = '${Nombre}',
                    PrecioUnit = ${PrecioUnit},
                    DeliveryMethod = ${DeliveryMethod ? `'${DeliveryMethod}'` : 'NULL'},
                    PaymentMethod = ${PaymentMethod ? `'${PaymentMethod}'` : 'NULL'}
                WHERE IdCotizacion = ${IdCotizacion}
            `;
            await request.query(updateSql);
        } else {
            const insertSql = `
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
                    ImagenPrin,
                    Nombre,
                    PrecioUnit,
                    DeliveryMethod,
                    PaymentMethod
                )
                OUTPUT INSERTED.IdCotizacion
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
                    '${ImagenPrin}',
                    '${Nombre}',
                    ${PrecioUnit},
                    ${DeliveryMethod ? `'${DeliveryMethod}'` : 'NULL'},
                    ${PaymentMethod ? `'${PaymentMethod}'` : 'NULL'}
                )
            `;
            const insertResult = await request.query(insertSql);
            IdCotizacion = insertResult.recordset[0].IdCotizacion;
        }

        res.status(checkResult.recordset.length > 0 ? 200 : 201).json({ Success: true, Message: checkResult.recordset.length > 0 ? 'Cotización actualizada exitosamente.' : 'Cotización creada exitosamente.', IdCotizacion });

    } catch (error) {
        console.log('Error creating or updating cotizacion: ', error);
        res.status(500).send({ Error: true, Message: error });
    }
};

exports.getCotizacionById = async (req, res) => {
    try {
        const { idCotizacion } = req.params;
        const request = new sql.Request();

        const sql_str = `
            SELECT * FROM cotizaciones 
            WHERE IdCotizacion = ${idCotizacion}
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

exports.updateCotizacionMethods = async (req, res) => {
    try {
        const { idCotizacion } = req.params;
        const { DeliveryMethod, PaymentMethod } = req.body;
        if (!idCotizacion) {
            return res.status(400).json({ Error: true, Message: 'El campo idCotizacion es necesario.' });
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
            WHERE IdCotizacion = @idCotizacion
        `;

        request.input('idCotizacion', sql.VarChar, idCotizacion);

        await request.query(sql_str);

        res.status(200).json({ Success: true, Message: 'Cotización actualizada exitosamente.' });

    } catch (error) {
        console.log('Error updating cotizacion: ', error);
        res.status(500).send({ Error: true, Message: error });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const { idCotizacion } = req.params;
        const request = new sql.Request();

        const sql_str = `
            SELECT IdUsuario, IdProducto FROM Cotizaciones 
            WHERE IdCotizacion = ${idCotizacion}
        `;

        const result = await request.query(sql_str);

        if (result.recordset.length === 0) {
            return res.status(404).json({ Error: true, Message: 'Usuario no encontrado.' });
        }

        res.status(200).json(result.recordset[0]);

    } catch (error) {
        console.log('Error getting user: ', error);
        res.status(500).send({ Error: true, Message: error });
    }
}


exports.buyNowOrden = async (req, res) => {

    try {
        const id = req.params.id;
        const request = new sql.Request();
        sql_str = ` SELECT * FROM Ordenes WHERE Id = ${id}`;

        const result = await request.query(sql_str);
        
        const reference = generateReference(16);

        const product = result.recordset[0]
        const monto = (Math.round(product.Valor)) * 100 
        const cadena = reference + monto + 'COP'
        const integritySignature = generateIntegritySignature(cadena);

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

