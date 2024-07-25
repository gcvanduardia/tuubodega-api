const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
require('./config/database');
const apiKeyVerify = require('./middleware/apiKey');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const wompiEventsRouter = require('./routes/wompiEvents');
app.use('/wompi',wompiEventsRouter);

app.use(apiKeyVerify);

const usersRouter = require('./routes/users');
app.use('/users',usersRouter);

const greetingRouter = require('./routes/greeting');
app.use('/greeting',greetingRouter);

const authRouter = require('./routes/auth');
app.use('/auth',authRouter);

const articulosRouter = require('./routes/articulos');
app.use('/articulos',articulosRouter);

const paymentsRouter = require('./routes/payments');
app.use('/payments',paymentsRouter);

const cartRouter = require('./routes/cart');
app.use('/cart',cartRouter);



const port = 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});