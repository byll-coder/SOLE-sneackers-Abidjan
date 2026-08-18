const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]); // Force les DNS de Google

const mongoose = require("mongoose");
const { MONGODB_URI } = require("./config");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`✅  MongoDB connecté : ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌  Erreur MongoDB : ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
