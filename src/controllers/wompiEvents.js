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

    sql_search = ` SELECT * FROM PaymentsTransactions WHERE Referencia = '${reference}'`;
    
    const result = await request.query(sql_search)

    if(result.recordset.length == 0){
        return res.status(400).send({ Error: true, Message: 'La refencia no existe en la DB' });
    }

    sql_str = `UPDATE PaymentsTransactions
    SET IdTransaccion = '${id}', Valor = ${amount_in_cents}, Moneda = '${currency}', MetodoPago = '${payment_method_type}', Estado = '${status}', FechaCreacion = '${creationDate}', FechaEnvio = '${sendDate}'
    WHERE Referencia = '${reference}';`

    if(result.recordset[0].IdOrden != null){

        let estado = 1
        switch (status) {
            case 'PENDING':
                estado = 1
                break; 
            case 'APPROVED':
                estado = 2
                break; 
            case 'DECLINED':
                estado = 3
                break;
            case 'VOIDED':
                estado = 3
                break;
            case 'ERROR':
                estado = 3
                break;
        
            default:
                break;
        }

        await request.query(`UPDATE Ordenes
        SET IdOrdenEstado = ${estado}
        WHERE Id = ${result.recordset[0].IdOrden};`)
    }
   

    request.query(sql_str).then(() => {
        res.status(200).json({success:true});
    })
    .catch((err) => {
        res.status(400).send({ Error: true, Message: err });
    });

    
}