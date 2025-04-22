import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { userModel } from "./models/user.js";

import superUserRoutes from "./routes/super-user-routes.js";
import userRoutes from "./routes/user-routes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import seedAdminUser from "./seeds/seedUser.js";

dotenv.config(); // Make sure this is called early

const app = express();

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());

app.use("/superuser", superUserRoutes);
app.use("/users", userRoutes);
app.use("/leaves", leaveRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Could Not Find the Route" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  try {
    await userModel.initDatabase();
    console.log("Database initialized.");
  } catch (err) {
    console.error("Failed to initialize database:", err);
  }

  try {
    await seedAdminUser();
  } catch (err) {
    // silently ignore for now
  }
});
