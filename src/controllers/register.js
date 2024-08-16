const sql = require("mssql");

exports.store = async (req, res) => {
    let transaction;
    try {

        transaction = new sql.Transaction();

        await transaction.begin();

        const request = new sql.Request(transaction);
        const {
            name,
            lastName,
            email,
            phone,
            country,
            department,
            city,
            address,
            addressAdd,
            password
        } = req.body
        
        const existUser = await request.query(`SELECT COUNT(*)  as count FROM Users WHERE Email = ${email} OR Phone = ${phone}`);
        
        if (existUser.recordset[0].count > 0 ) {
            return res.status(400).send({ Error: true, Message: 'El correo o el telefono ya se encuntra registrado' });
        }

        sql_insert =  `INSERT INTO Users (
            Name,
            LastName,
            Email,
            Phone,
            pais,
            Departmento,
            Ciudad,
            address,
            AddressAdd,
            Pass
            )
        VALUES (${cantidad}, ${idArticulo}, ${idUser}, '${new Date().toISOString()}')`;

       await request.query(sql_insert);

        res.status(200).json({
            Message:'Almacenado correctamente',
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