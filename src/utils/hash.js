const bcrypt = require('bcrypt');


exports.hashPassword = async (plainPassword) => {
  try {
    const saltRounds = 10;
    const hash = await bcrypt.hash(plainPassword, saltRounds);
    return hash;
  } catch (err) {
    console.error('hash Error: ', err);
  }
};

exports.comparePassword = async (plainPassword, hashPassword) => {
  try {
    const result = await bcrypt.compare(plainPassword, hashPassword);
    return result;
  } catch (err) {
    console.error('comparePassword Error: ', err);
  }
}