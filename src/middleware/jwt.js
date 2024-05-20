const { verifyToken } = require('../services/jwt');

const auth = (req, res, next) => {
    const bearerToken = req.headers['authorization'];

    if (!bearerToken) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = verifyToken(bearerToken);
    if (decoded) {
        req.user = decoded;
        next();
    } else {
        return res.status(401).json({ message: 'Failed to authenticate token' });
    }
};

module.exports = auth;