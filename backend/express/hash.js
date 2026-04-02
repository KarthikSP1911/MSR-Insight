import bcrypt from "bcrypt";

const hash = await bcrypt.hash("karthik", 10);
console.log(hash);