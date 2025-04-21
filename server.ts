import dotenv from "dotenv";
import express, { Request, Response } from "express";
import cors from "cors";
import { userModel } from "./models/user";


import superUserRoutes from "./routes/super-user-routes";
import userRoutes from "./routes/user-routes";
import leaveRoutes from "./routes/leaveRoutes";

const app = express();

const corsOptions = {
  origin: ["http://localhost:3000"],
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

app.use(express.json());

app.use("/api/superuser", superUserRoutes);
app.use("/api/users", userRoutes);
app.use("/api/leaves", leaveRoutes);

app.use((req: Request, res: Response): void => {
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
});
