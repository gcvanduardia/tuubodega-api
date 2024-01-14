const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
require('./config/database');
const apiKeyVerify = require('./middleware/apiKey');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(apiKeyVerify);



const greetingRouter = require('./routes/greeting');
app.use('/greeting',greetingRouter);

const authRouter = require('./routes/auth');
app.use('/auth',authRouter);

const articulosRouter = require('./routes/articulos');
app.use('/articulos',articulosRouter);



const port = 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});