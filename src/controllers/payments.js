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
    sql_str = ` SELECT 
    PaymentsTransactions.*, Users.Documento, Users.Name + ' ' + Users.LastName AS NombreCompleto
    FROM PaymentsTransactions LEFT JOIN Users ON Users.IdUser = PaymentsTransactions.IdUser`;

    request.query(sql_str)
        .then((object) => {
            res.status(200).json(object.recordset);
        })
        .catch((err) => {
            console.log('Payments records: ',err);
            res.status(500).send({ Error: true, Message: err });
        });
}