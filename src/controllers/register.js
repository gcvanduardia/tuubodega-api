const sql = require("mssql");
const hash = require('../utils/hash');
const sendMail = require('../services/email');

exports.store = async (req, res) => {
    let transaction;
    try {

        transaction = new sql.Transaction();

        await transaction.begin();

        const request = new sql.Request(transaction);
        const {
            name,
            lastName,
            document,
            email,
            phone,
            country,
            department,
            city,
            address,
            addressAdd,
            password
        } = req.body
        
        const existUser = await request.query(`SELECT COUNT(*)  as count FROM Users WHERE Email = '${email}' OR Phone = '${phone}' OR Documento = '${document}'`);
        
        if (existUser.recordset[0].count > 0 ) {
            return res.status(400).send({ Error: true, Message: 'El correo o el telefono o el documento ya se encuentra registrado' });
        }

        const passwordHash = await hash.hashPassword(password);
        
        const result = await request.query(`SELECT ISNULL(MAX(IdUser), 0) + 1 AS SiguienteID FROM Users`);
        const idUser = result.recordset[0].SiguienteID

        sql_insert =  `INSERT INTO Users (
        IdUser, 
        Name, 
        LastName, 
        Documento, 
        Email, 
        Phone, 
        Pais, 
        Departamento, 
        Ciudad, 
        Address, 
        AddressAdd, 
        Pass, 
        En,
        CreateDate)
        VALUES (${idUser}, '${name}', '${lastName}', '${document}', '${email}', '${phone}','${country}','${department}','${city}','${address}','${addressAdd}','${passwordHash}', 1, '${new Date().toISOString()}')`;

       await request.query(sql_insert);

       await transaction.commit();

        res.status(200).json({
            Message:'Usuario creado correctamente',
            data: true
        });

        
    } catch (error) {
        if (transaction) {
            await transaction.rollback();
        }
        console.log('Create User: ',error);
        res.status(500).send({ Error: true, Message: error });
    }
}

exports.generateCode = async (req, res) => {
    
    const request = new sql.Request();

    if(!req.body.email){
        return res.status(400).send({ Error: true, Message: 'El correo es requerido' });
    }

    const email= req.body.email
    const phone= req.body.phone ?? null

    const existUser = await request.query(`SELECT COUNT(*)  as count FROM Users WHERE Email = '${email}' OR Phone = '${phone}'`);
        
    if (existUser.recordset[0].count > 0 ) {
        return res.status(400).send({ Error: true, Message: 'El correo o el telefono ya se encuentra registrado' });
    }

    const code = Math.floor(100000 + Math.random() * 900000);

    sql_insert =  `INSERT INTO CodigosTemp (
        Email,
        Phone,
        Codigo
        )
    VALUES ('${email}', ${phone}, '${code}')`;

   await request.query(sql_insert);

   sendMail(email,'Codigo en TuuBodega',`Tu codigo de verificacion en TuuBodega es: ${code}`);

    res.status(200).json({
        Message:'Codigo enviado',
        data: true
    });

}

exports.verificationCode = async (req, res) => {
    
    const request = new sql.Request();

    if(!req.body.email){
        return res.status(400).send({ Error: true, Message: 'El correo es requerido' });
    }
    if(!req.body.code){
        return res.status(400).send({ Error: true, Message: 'El codigo es requerido' });
    }

    const email= req.body.email
    const code= req.body.code

    const verify = await request.query(`SELECT COUNT(*)  as count FROM CodigosTemp WHERE Email = '${email}' AND Codigo = ${code}`);
        
    if (verify.recordset[0].count <= 0 ) {
        return res.status(400).send({ Error: true, Message: 'Codigo Incorrecto' });
    }

    sql_delete =  `DELETE FROM CodigosTemp WHERE Email = '${email}' AND Codigo = ${code}`;

    await request.query(sql_delete);

    res.status(200).json({
        Message:'Codigo verificado',
        data: true
    });

}