const sql = require("mssql");
const axios = require('axios');

exports.store = async (req, res) => {
    try {
        const request = new sql.Request();
        const idArticulo = req.body.idArticulo;
        const cantidad = req.body.cantidad;
        const idUser = req.user.IdUsuario;
        let Article = null;

        if (cantidad < 1) {
            return res.status(400).send({ Error: true, Message: 'La cantidad debe ser mayor a cero' });
        }

        try {
            const headers = {
                'Authorization': 'AutGmovilDenario2021'
            };
            const response = await axios.get(`https://api-den.tuubodega.com/api/tuuBodega/premios/${idArticulo}`, { headers });

            Article = response.data.body;
            console.log(Article);

            // Ajustar la verificación para la estructura correcta de la respuesta
            if (!Article || !Article.Stock) {
                return res.status(400).send({ Error: true, Message: 'El articulo seleccionado no existe' });
            }

            if (Article.Stock < cantidad) {
                return res.status(400).send({ Error: true, Message: 'La cantidad solicitada supera la cantidad disponible' });
            }

        } catch (error) {
            console.error('Error al llamar al servicio de la otra API:', error);
            return res.status(500).send({ error: 'Error al obtener el producto por Id' });
        }

        const exist = await request.query(`SELECT COUNT(*) as count FROM Carrito WHERE IdArticulo = ${idArticulo} AND IdUser = ${idUser}`);

        if (exist.recordset[0].count > 0) {
            return res.status(400).send({ Error: true, Message: 'El articulo ya se encuentra en el carrito' });
        }

        const sql_insert = `INSERT INTO Carrito (Cantidad, IdArticulo, IdUser, FechaCreacion)
                            VALUES (${cantidad}, ${idArticulo}, ${idUser}, '${new Date().toISOString()}')`;

        await request.query(sql_insert);

        res.status(200).json({
            Message: 'Almacenado correctamente',
            data: true
        });

    } catch (error) {
        console.log('Cart store: ', error);
        res.status(500).send({ Error: true, Message: error });
    }
};

exports.update = async (req, res) => {
    try {
        const request = new sql.Request();
        const idArticulo = req.body.idArticulo;
        const cantidad = req.body.cantidad;
        const idUser = req.user.IdUsuario;

        if (cantidad < 1) {
            return res.status(400).send({ Error: true, Message: 'La cantidad debe ser mayor a cero' });
        }

        let Article = null;
        try {
            const headers = {
                'Authorization': 'AutGmovilDenario2021'
            };
            const response = await axios.get(`https://api-den.tuubodega.com/api/tuuBodega/premios/${idArticulo}`, { headers });

            Article = response.data.body;
            console.log(Article);

            // Ajustar la verificación para la estructura correcta de la respuesta
            if (!Article || !Article.Stock) {
                return res.status(400).send({ Error: true, Message: 'El articulo seleccionado no existe' });
            }

            if (Article.Stock < cantidad) {
                return res.status(400).send({ Error: true, Message: 'La cantidad solicitada supera la cantidad disponible' });
            }

        } catch (error) {
            console.error('Error al llamar al servicio de la otra API:', error);
            return res.status(500).send({ error: 'Error al obtener el producto por Id' });
        }

        const exist = await request.query(`SELECT COUNT(*) as count FROM Carrito WHERE IdArticulo = ${idArticulo} AND IdUser = ${idUser}`);
        console.log(exist);

        if (exist.recordset[0].count == 0) {
            return res.status(400).send({ Error: true, Message: 'El articulo NO esta en el carrito' });
        }

        const sql_update = `UPDATE Carrito SET Cantidad = ${cantidad} WHERE IdArticulo = ${idArticulo} AND IdUser = ${idUser}`;

        await request.query(sql_update);

        res.status(200).json({
            Message: 'Actualizado correctamente',
            data: true
        });

    } catch (error) {
        console.log('Cart Update: ', error);
        res.status(500).send({ Error: true, Message: error });
    }
};

exports.destroy = async (req, res) => {
    try {
        const request = new sql.Request();
        const idArticulo = req.query.idArticulo;
        const idUser = req.user.IdUsuario;

        // Paso 1: Obtener los detalles del artículo desde la otra API
        let Article = null;
        try {
            const headers = {
                'Authorization': 'AutGmovilDenario2021'
            };
            const response = await axios.get(`https://api-den.tuubodega.com/api/tuuBodega/premios/${idArticulo}`, { headers });

            Article = response.data.body;
            console.log(Article);

            // Ajustar la verificación para la estructura correcta de la respuesta
            if (!Article || !Article.Stock) {
                return res.status(400).send({ Error: true, Message: 'El articulo seleccionado no existe' });
            }

        } catch (error) {
            console.error('Error al llamar al servicio de la otra API:', error);
            return res.status(500).send({ error: 'Error al obtener el producto por Id' });
        }

        // Paso 2: Eliminar el artículo del carrito
        const sql_delete = `DELETE FROM Carrito WHERE IdArticulo = ${idArticulo} AND IdUser = ${idUser}`;
        await request.query(sql_delete);

        res.status(200).json({
            Message: 'Eliminado correctamente',
            data: true
        });

    } catch (error) {
        console.log('Cart destroy: ', error);
        res.status(500).send({ Error: true, Message: error });
    }
};

exports.list = async (req, res) => {
    try {
        const request = new sql.Request();
        const idUser = req.user.IdUsuario;

        // Paso 1: Obtener los artículos del carrito
        const sql_query = `SELECT C.Id, C.IdArticulo, C.Cantidad
                           FROM Carrito AS C
                           WHERE C.IdUser = ${idUser}`;

        const carritoData = await request.query(sql_query);

        if (carritoData.recordset.length === 0) {
            return res.status(200).json({
                Message: 'El carrito está vacío',
                data: []
            });
        }

        // Paso 2: Obtener los detalles de los artículos desde la otra API
        const headers = {
            'Authorization': 'AutGmovilDenario2021'
        };

        const articleDetailsPromises = carritoData.recordset.map(async (item) => {
            const response = await axios.get(`https://api-den.tuubodega.com/api/tuuBodega/premios/${item.IdArticulo}`, { headers });
            return {
                ...item,
                ...response.data.body
            };
        });

        const articlesDetails = await Promise.all(articleDetailsPromises);

        // Paso 3: Combinar los datos del carrito con los detalles de los artículos
        const dataMap = articlesDetails.map(e => {
            return {
                Id: e.Id,
                IdArticulo: e.IdArticulo,
                Cantidad: e.Cantidad,
                Nombre: e.Titulo,
                ImagenPrin: e.UrlFotos[0], // Asumiendo que UrlFotos es un array
                PrecioUnit: e.ValorUnt,
                CantidadMaxima: e.Stock,
                PrecioTotal: e.ValorUnt * e.Cantidad
            };
        });

        res.status(200).json({
            Message: 'Consultado correctamente',
            data: dataMap,
        });

    } catch (error) {
        console.log('Cart List: ', error);
        res.status(500).send({ Error: true, Message: error });
    }
};

exports.summary = async (req, res) => {
    try {
        const request = new sql.Request();
        const idUser = req.user.IdUsuario;

        // Paso 1: Obtener los artículos del carrito
        const sql_query = `SELECT C.Cantidad, C.IdArticulo
                           FROM Carrito AS C
                           WHERE C.IdUser = ${idUser}`;

        const carritoData = await request.query(sql_query);

        if (carritoData.recordset.length === 0) {
            return res.status(200).json({
                Message: 'El carrito está vacío',
                data: 0
            });
        }

        // Paso 2: Obtener los detalles de los artículos desde la otra API
        const headers = {
            'Authorization': 'AutGmovilDenario2021'
        };

        const articleDetailsPromises = carritoData.recordset.map(async (item) => {
            const response = await axios.get(`https://api-den.tuubodega.com/api/tuuBodega/premios/${item.IdArticulo}`, { headers });
            return {
                ...item,
                ...response.data.body
            };
        });

        const articlesDetails = await Promise.all(articleDetailsPromises);

        // Paso 3: Calcular el valor total
        let valorTotal = 0;
        articlesDetails.forEach(e => {
            valorTotal += e.ValorUnt * e.Cantidad;
        });

        res.status(200).json({
            Message: 'Consultado correctamente',
            data: Math.round(valorTotal)
        });

    } catch (error) {
        console.log('Cart Summary: ', error);
        res.status(500).send({ Error: true, Message: error });
    }
};


exports.emptyCart = async (req, res) => {
    try {
        const request = new sql.Request();
        const idUser = req.user.IdUsuario;

        const sql_delete = `DELETE FROM Carrito WHERE IdUser = ${idUser}`;
        await request.query(sql_delete);

        res.status(200).json({
            Message: 'Carrito vaciado correctamente',
            data: true
        });

    } catch (error) {
        console.log('Cart empty: ', error);
        res.status(500).send({ Error: true, Message: error });
    }
};

exports.countArticlesInCart = async (req, res) => {
    try {
        const request = new sql.Request();
        const idUser = req.user.IdUsuario;

        const sql_query = `SELECT COUNT(*) AS contador
                           FROM Carrito
                           WHERE IdUser = ${idUser}`;

        const data = await request.query(sql_query);

        res.status(200).json({
            Message: 'consultado correctamente',
            data: data.recordset[0].contador,
        });

    } catch (error) {
        console.log('Cart List: ', error);
        res.status(500).send({ Error: true, Message: error });
    }
};