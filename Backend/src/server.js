require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");

const connectDB = require("./config/db");
const routes = require("./routes");
const swaggerSpec = require("./docs/swagger");
const {
  notFound,
  errorHandler,
} = require("./middleware/errorMiddleware");

const app = express();

// ===============================
// Security Middleware
// ===============================

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

// ===============================
// Body Parser
// ===============================

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ===============================
// Rate Limiting
// ===============================

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ===============================
// Health Check
// ===============================

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Central Audit Log API is running",
    time: new Date().toISOString(),
  });
});

// ===============================
// API Routes
// ===============================

app.use("/api", routes);

// ===============================
// Swagger Documentation
// ===============================

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

// ===============================
// Error Handling
// ===============================

app.use(notFound);
app.use(errorHandler);

// ===============================
// Server Configuration
// ===============================

const PORT = process.env.PORT || 5000;

// ===============================
// Start Server
// ===============================

if (require.main === module) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`MongoDB connected successfully`);
        console.log(`Server running at http://localhost:${PORT}`);
        console.log(
          `Swagger docs available at http://localhost:${PORT}/api-docs`
        );
      });
    })
    .catch((error) => {
      console.error("Failed to start server:");
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = app;