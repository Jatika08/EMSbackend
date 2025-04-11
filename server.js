const dotenv = require("dotenv");
dotenv.config();

const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const superUserRoutes = require("./routes/super-user-routes");
const userRoutes = require("./routes/user-routes");
const leaveRoutes = require("./routes/leaveRoutes");
const { sequelize } = require("./models/user");

const port = process.env.PORT || 5000;

const app = express();

// ✅ CORS Setup
const corsOptions = {
  origin: [
    "https://employee-management-system-indol-xi.vercel.app",
    "http://localhost:3000",
  ],
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// ✅ Body Parser
app.use(bodyParser.json({ extended: false }));

// ✅ Serve uploaded files
app.use("/uploads", express.static("uploads"));

// ✅ Routes
app.use("/api/superuser", superUserRoutes);
app.use("/api/users", userRoutes);
app.use("/api/leaves", leaveRoutes);

// ✅ Catch-all Route Handler
app.use((req, res, next) => {
  return res.status(404).json({ message: "Could Not Find the Route" });
});

// ✅ Start Server + Connect DB

sequelize
  .sync({ force: false }) // Set 'force: false' to avoid dropping the table if already exists
  .then(() => {
    console.log("Database synced successfully!");
  })
  .catch((err) => {
    console.error("Error syncing database:", err);
  });

sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Connected to PostgreSQL");

    // Optional: Sync models (avoid in prod without migrations)
    return sequelize.sync();
  })
  .then(() => {
    app.listen(port, () => {
      console.log(`🚀 Server started on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("❌ Unable to connect to DB:", err);
  });

module.exports = app;
