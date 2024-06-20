const sql = require("mssql");
const { generateIntegritySignature, generateReference } = require('../services/wompi');

exports.integritySignature = async (req, res) => {
    const id = req.query.id;
    const cantidad = req.query.cantidad;
    const request = new sql.Request();
    sql_str = ` SELECT * FROM vw_DetArticulo WHERE Id = ${id}`;


    request.query(sql_str)
        .then((object) => {

            const reference = generateReference(16);

            const product = object.recordset[0]
            const monto = (Math.round(product.PrecioUnit) * cantidad) * 100 
            const cadena = reference + monto + 'COP'
            const integritySignature = generateIntegritySignature(cadena);

            res.status(200).json({
                publicKey:process.env.WOMPI_PUBLIC_KEY,
                currency: 'COP',
                amountInCents: monto,
                reference: reference,
                integritySignature: integritySignature
            });

        })
        .catch((err) => {
            console.log('Error al firmar: ',err);
            res.status(500).send({ Error: true, Message: err });
        });
}

exports.recordsList = async (req, res) => {

    const request = new sql.Request();
    sql_str = ` SELECT * FROM PaymentsTransactions`;

    request.query(sql_str)
        .then((object) => {
            res.status(200).json(object.recordset);
        })
        .catch((err) => {
            console.log('Payments records: ',err);
            res.status(500).send({ Error: true, Message: err });
        });
}