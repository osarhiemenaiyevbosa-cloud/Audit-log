require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const routes = require("./routes");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.get("/health", (req, res) =>
  res.json({
    success: true,
    message: "Central Audit Log API is running",
    time: new Date().toISOString(),
  }),
);
app.use("/", routes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(notFound);
app.use(errorHandler);
const PORT = process.env.PORT || 5000;
if (require.main === module) {
  connectDB()
    .then(() =>
      app.listen(PORT, () =>
        console.log(`Server running at http://localhost:${PORT}`),
      ),
    )
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
module.exports = app;