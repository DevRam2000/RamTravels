const cds = require("@sap/cds");
const cov2ap = require("@cap-js-community/odata-v2-adapter");

cds.on("bootstrap", (app) => app.use(cov2ap()));

// Multi-tenant database routing based on user role
cds.on('served', async () => {
    const log = cds.log('db-router');
    
    // Handle incoming requests to route to correct database
    cds.on('*', (req) => {
        const user = req.user;
        
        if (user && user.id) {
            // Store user role in request for use in handlers
            req.userRole = user.roles?.includes('Supplier') ? 'Supplier' : 'Employee';
            log.info(`Request from: ${user.id}, Role: ${req.userRole}`);
        }
    });
});

// Handle database connection based on tenant/role
cds.on('connect', async (req) => {
    const log = cds.log('db-tenant');
    
    if (req.target?.name === 'User' || req.target?.name === 'Travel' || req.target?.name === 'TravelBooking') {
        // Determine which database to use based on user role
        const userRole = req.userRole || 'Employee';
        const dbName = userRole === 'Supplier' ? 'db-supplier' : 'db-employee';
        
        log.info(`Connecting to database: ${dbName} for entity: ${req.target?.name}`);
        
        // The actual database binding will be handled through environment variables
        // Set during deployment based on the service bindings
    }
});

module.exports = cds.server;