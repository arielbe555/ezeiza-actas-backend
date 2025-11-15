import express from "express";
import dotenv from "dotenv";
dotenv.config();

import pagosRouter from "./src/routes/pagosRoutes.js";

const app = express();
app.use(express.json());

app.use("/api/pagos", pagosRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor en puerto " + PORT));





