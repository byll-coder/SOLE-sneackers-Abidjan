module.exports = {
  MONGODB_URI:
    process.env.MONGODB_URI ||
    "mongodb+srv://lokossoubille_db_user:lokossoulokossou@cluster0.b3yp3hc.mongodb.net/?appName=Cluster0",
  JWT_SECRET: process.env.JWT_SECRET || "sole_sneakers_ci_jwt_secret_2025",
  JWT_EXPIRE: process.env.JWT_EXPIRE || "30d",
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  FRONTEND_URL: process.env.FRONTEND_URL || "*",
};
