const sql = require("mssql");

exports.userById = async (req, res) => {
    const { IdUser } = req.body;
    const request = new sql.Request();
    const sql_str = `SELECT * FROM vw_users WHERE IdUser = @IdUser`;
    request.input('IdUser', sql.Int, IdUser);
    request.query(sql_str)
        .then((result) => {
            res.json(result.recordset[0]);
        })
        .catch((err) => {
            console.log(err);
            res.status(500).send(err);
        });
};