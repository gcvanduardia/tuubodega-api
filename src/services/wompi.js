const crypto = require('crypto');

const generateIntegritySignature = (cadena) => {
    
    const cadenaConcatenada = cadena + process.env.WOMPI_SECRET_INTEGRITY;
   
    const integritySignature = crypto.createHash('sha256').update(cadenaConcatenada).digest('hex');
    
    return integritySignature;
};

module.exports = { generateIntegritySignature };