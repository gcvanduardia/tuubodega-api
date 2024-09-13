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
            Descripcion,
            IdUsuario,
            IdProducto,
            IdCategoria,
            Marca,
            Modelo,
            SKU,
            Stock,
            Nombre,
            UrlFotos,
            Usr,
            DeliveryMethod,
            PaymentMethod,
            ValorUnt
        } = req.body;


        if (!IdUsuario || !IdProducto || !Marca || !Modelo || !Descripcion || !IdCategoria || !SKU || !Stock || !UrlFotos || !Nombre || !Usr || !ValorUnt) {
            return res.status(400).json({ Error: true, Message: 'Todos los campos obligatorios deben ser proporcionados.' });
        }

        // Crear una nueva instancia de sql.Request para cada consulta
        let request = new sql.Request();

        const checkSql = `
            SELECT IdCotizacion FROM cotizaciones 
            WHERE IdUsuario = @IdUsuario AND IdProducto = @IdProducto
        `;
        request.input('IdUsuario', sql.Int, IdUsuario);
        request.input('IdProducto', sql.Int, IdProducto);
        const checkResult = await request.query(checkSql);

        let IdCotizacion;

        if (checkResult.recordset.length > 0) {
            IdCotizacion = checkResult.recordset[0].IdCotizacion;
            request = new sql.Request(); // Nueva instancia de sql.Request
            const updateSql = `
                UPDATE cotizaciones
                SET 
                    Stock = @Stock,
                    Marca = @Marca,
                    Descripcion = @Descripcion,
                    IdCategoria = @IdCategoria,
                    Modelo = @Modelo,
                    UrlFotos = @UrlFotos,
                    Usr = @Usr,
                    Nombre = @Nombre,
                    SKU = @SKU,
                    DeliveryMethod = @DeliveryMethod,
                    PaymentMethod = @PaymentMethod,
                    ValorUnt = @ValorUnt
                WHERE IdCotizacion = @IdCotizacion
            `;
            request.input('Stock', sql.Int, Stock);
            request.input('Marca', sql.VarChar, Marca);
            request.input('Descripcion', sql.VarChar, Descripcion);
            request.input('IdCategoria', sql.Int, IdCategoria);
            request.input('Modelo', sql.VarChar, Modelo);
            request.input('UrlFotos', sql.VarChar, UrlFotos);
            request.input('Usr', sql.VarChar, Usr);
            request.input('Nombre', sql.VarChar, Nombre);
            request.input('SKU', sql.VarChar, SKU);
            request.input('DeliveryMethod', sql.VarChar, DeliveryMethod || null);
            request.input('PaymentMethod', sql.VarChar, PaymentMethod || null);
            request.input('ValorUnt', sql.Int, ValorUnt);
            request.input('IdCotizacion', sql.Int, IdCotizacion);
            await request.query(updateSql);
        } else {
            request = new sql.Request(); // Nueva instancia de sql.Request
            const insertSql = `
                INSERT INTO cotizaciones (
                    Descripcion,
                    IdUsuario,
                    IdProducto,
                    IdCategoria,
                    Marca,
                    Modelo,
                    SKU,
                    Stock,
                    Nombre,
                    UrlFotos,
                    Usr,
                    DeliveryMethod,
                    PaymentMethod,
                    ValorUnt
                )
                OUTPUT INSERTED.IdCotizacion
                VALUES (
                    @Descripcion,
                    @IdUsuario,
                    @IdProducto,
                    @IdCategoria,
                    @Marca,
                    @Modelo,
                    @SKU,
                    @Stock,
                    @Nombre,
                    @UrlFotos,
                    @Usr,
                    @DeliveryMethod,
                    @PaymentMethod,
                    @ValorUnt
                )
            `;
            request.input('Descripcion', sql.VarChar, Descripcion);
            request.input('IdUsuario', sql.Int, IdUsuario);
            request.input('IdProducto', sql.Int, IdProducto);
            request.input('IdCategoria', sql.Int, IdCategoria);
            request.input('Marca', sql.VarChar, Marca);
            request.input('Modelo', sql.VarChar, Modelo);
            request.input('SKU', sql.VarChar, SKU);
            request.input('Stock', sql.Int, Stock);
            request.input('Nombre', sql.VarChar, Nombre);
            request.input('UrlFotos', sql.VarChar, UrlFotos);
            request.input('Usr', sql.VarChar, Usr);
            request.input('DeliveryMethod', sql.VarChar, DeliveryMethod || null);
            request.input('PaymentMethod', sql.VarChar, PaymentMethod || null);
            request.input('ValorUnt', sql.Int, ValorUnt);
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

