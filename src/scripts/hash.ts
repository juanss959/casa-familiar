import bcrypt from 'bcryptjs'

const password = '1070' 
const hash = await bcrypt.hash(password, 10)
console.log(hash)