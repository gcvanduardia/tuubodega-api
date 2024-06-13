const sql = require("mssql");

exports.updateTransaction = async (req, res) => {

    if(req.body.event != 'transaction.updated'){
        return res.status(400).send({ Error: true, Message: 'evento no valido' });
    }

    if(!req.body.data || !req.body.data.transaction){
        return res.status(400).send({ Error: true, Message: 'El payload recibido no tiene data ni transaccion' });
    }

    const { 
        id, 
        amount_in_cents, 
        reference, 
        currency, 
        payment_method_type,
        status
    } = req.body.data.transaction;

    const milisegundos = req.body.timestamp * 1000
    const creationDate = new Date(milisegundos).toISOString()
    const sendDate = req.body.sent_at

    const request = new sql.Request();

    sql_search = ` SELECT * FROM PaymentsTransactions WHERE IdTransaccion = '${id}'`;
    
    const result = await request.query(sql_search)
    
    if(result.recordset[0]){
        sql_str = `UPDATE PaymentsTransactions
        SET Valor = ${amount_in_cents}, Referencia = '${reference}', MetodoPago = '${payment_method_type}', Estado = '${status}', FechaCreacion = '${creationDate}', FechaEnvio = '${sendDate}'
        WHERE IdTransaccion = '${id}';`
    }else {
        sql_str =  `INSERT INTO PaymentsTransactions (IdTransaccion, Valor, Referencia, Moneda, MetodoPago, Estado, FechaCreacion, FechaEnvio)
        VALUES ('${id}', ${amount_in_cents}, '${reference}', '${currency}', '${payment_method_type}', '${status}', '${creationDate}', '${sendDate}')`;
    }

    request.query(sql_str).then(() => {
        res.status(200).json({success:true});
    })
    .catch((err) => {
        res.status(400).send({ Error: true, Message: err });
    });

    
}