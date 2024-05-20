const jwt = require('jsonwebtoken');

const verifyToken = (bearerToken) => {
    if (!bearerToken) {
        return false;
    }

    const token = bearerToken.split('Bearer ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('decoded: ',decoded);
        return decoded;
    } catch (err) {
        console.log('err jwt: ',err);
        return false;
    }
};

const generateToken = (IdUsuario) => {
    const token = jwt.sign({ IdUsuario: IdUsuario }, process.env.JWT_SECRET, { expiresIn: '5d' });
    return token;
};

module.exports = { generateToken, verifyToken };