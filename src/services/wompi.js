const crypto = require('crypto');

const generateIntegritySignature = (cadena) => {
    
    const cadenaConcatenada = cadena + process.env.WOMPI_SECRET_INTEGRITY;
   
    const integritySignature = crypto.createHash('sha256').update(cadenaConcatenada).digest('hex');
    
    return integritySignature;
};

const generateReference = (length) => {
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        result += chars[randomIndex];
    }
    return result;
};

module.exports = { generateIntegritySignature,generateReference  };