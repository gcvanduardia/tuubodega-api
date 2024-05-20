const sql = require("mssql");
const hash = require('../utils/hash');
const sendMail = require('../services/email');
const { generateToken, verifyToken } = require('../services/jwt');
const req = require('express/lib/request');

exports.sesion = async (req, res) => {
    const token = req.headers['authorization'];

    const decoded = verifyToken(token);
    if (decoded) {
        res.status(200).json({ 
            message: 'Token is valid', 
            data: decoded 
        });
    } else {
        res.status(401).json({ 
            message: 'Token is not valid'
        });
    }
}

exports.hashService = async (req, res) => {
    const { data } = req.body;
    const hashData = await hash.hashPassword(data);
    res.status(200).json({
        Error: false,
        Message: 'Hash generado correctamente',
        Hash: hashData
    });
}

exports.loginAdmin = async (req, res) => {
    const { username, password } = req.body;
    const request = new sql.Request();
    request.input('username', sql.NVarChar, username);
    const sql_str = `SELECT * FROM UsersAdmin WHERE En=1 AND (Documento=@username OR Email=@username OR Phone=@username)`;
    request.query(sql_str)
        .then((object) => {
            verifLoginAdmin(object.recordset[0],res,password);
        })
        .catch((err) => {
            console.log('login: ',err);
        });
};

async function verifLoginAdmin(resSql,resApi,password){
    console.log('verifLoginAdmin: ',resSql);
    if(!resSql){
        resApi.status(401).send({ 
            Error: true, 
            Message: 'Usuario no encontrado' 
        });
    }else{
        if(await hash.comparePassword(password, resSql.Pass)){
            const updateLoginAdminResponse = await updateLoginAdmin(resSql.IdUser);
            if(updateLoginAdminResponse.Error){
                console.log('updateLoginAdminResponse: ',updateLoginAdminResponse);
                resApi.status(401).send({
                    Error: true,
                    Message: 'Error al actualizar el login',
                    UpdateLoginAdminResponse: updateLoginAdminResponse
                });
            }else{
                const token = generateToken(resSql.IdUser);
                sendMail(resSql.Email,'Inicio de sesión en TuuBodega','Se ha iniciado sesión en su cuenta.');
                resApi.status(200).json({
                    Message: 'Login correcto',
                    Token: token
                });
            }
        }else{
            resApi.status(401).send({ 
                Error: true, 
                Message: 'Contraseña incorrecta' });
        }
    }
}

async function updateLoginAdmin(IdUser){
    let response;
    const request = new sql.Request();
    request.input('IdUser', sql.Int, IdUser);
    sql_str = `UPDATE UsersAdmin SET LastLogin=GETDATE() WHERE IdUser=@IdUser`;
    await request.query(sql_str)
        .then((object) => {
            response = { 
                Error: false,
                Message: 'Login actualizado correctamente'
            }
        })
        .catch((err) => {
            response = { 
                Error: true,
                Message: err
            }
        });
    console.log('updateLoginAdmin: ',response);
    return response;
}