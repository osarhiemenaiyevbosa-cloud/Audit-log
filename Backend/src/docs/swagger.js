const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Central Audit Log API',
      version: '1.0.0',
      description: 'Group 27 beginner-friendly REST API'
    },
    servers: [{
      url: 'http://localhost:5000/api'
    }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    tags: [
      { name: 'Authentication' },
      { name: 'Companies' },
      { name: 'Users' },
      { name: 'Audits' },
      { name: 'Dashboard' }
    ]
  },
  apis: ['./src/docs/swaggerRoutes.js']
};

module.exports = swaggerJsdoc(options);