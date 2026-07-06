const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

        const { Travels, TravelBookings, Users } = this.entities;
    const defaultDb = cds.db;
    const employeeDb = await cds.connect.to('employeeDb').catch((err) => {
        console.warn('Could not connect to employeeDb, falling back to default DB:', err.message || err);
        return defaultDb;
    });
    const supplierDb = await cds.connect.to('supplierDb').catch((err) => {
        console.warn('Could not connect to supplierDb, falling back to default DB:', err.message || err);
        return defaultDb;
    });

    const dbFor = (req) => {
        const role = req?.user?.roles?.includes('Supplier') ? 'Supplier' : 'Employee';
        return role === 'Supplier' ? supplierDb : employeeDb;
    };

    // Get travels by user role
    this.on('getTravelsByRole', async (req) => {
        const userRole = req.user.roles?.includes('Supplier') ? 'Supplier' : 'Employee';
        console.log("Getting travels for role:", userRole);

        const db = dbFor(req);
        const travels = await db.tx(req).run(SELECT.from(Travels));
        
        return travels.map(t => ({
            ID: t.ID,
            travelID: t.travelID,
            description: t.description,
            destination: t.destination,
            startDate: t.startDate,
            endDate: t.endDate,
            status: t.status
        }));
    });

    // Read Travels
    this.on('READ', 'Travels', async (req) => {
        const userRole = req.user.roles?.includes('Supplier') ? 'Supplier' : 'Employee';
        console.log("Reading travels for role:", userRole);
        
        const db = dbFor(req);
        return db.tx(req).run(SELECT.from(Travels));
    });

    // Create Travel
    this.on('CREATE', 'Travels', async (req) => {
        const data = req.data;
        const userId = req.user.id;

        data.createdBy = userId;
        data.createdAt = new Date().toISOString();
        data.modifiedAt = new Date().toISOString();
        data.status = 'New';

        console.log("[CREATE] Travel data:", data);

        const db = dbFor(req);
        const result = await db.tx(req).run(INSERT.into(Travels).entries(data));
        
        return {
            ...result,
            message: `Travel created successfully`
        };
    });

    // Update Travel Status
    this.on('updateTravelStatus', async (req) => {
        const { ID, status } = req.data;

        if (!ID || !status) {
            return {
                success: false,
                message: "Travel ID and status are required"
            };
        }

        const db = dbFor(req);
        const updatedRecord = await db.tx(req).run(UPDATE(Travels, ID).set({ 
            status: status,
            modifiedAt: new Date().toISOString()
        }));

        return {
            success: true,
            message: `Travel status updated to ${status}`
        };
    });

    // Read Travel Bookings
    this.on('READ', 'TravelBookings', async (req) => {
        const userRole = req.user.roles?.includes('Supplier') ? 'Supplier' : 'Employee';
        console.log("Reading travel bookings for role:", userRole);
        
        const db = dbFor(req);
        return db.tx(req).run(SELECT.from(TravelBookings));
    });

    // Create Travel Booking
    this.on('CREATE', 'TravelBookings', async (req) => {
        const data = req.data;
        data.bookingDate = new Date().toISOString().split('T')[0];
        data.status = 'Booked';

        console.log("[CREATE] Travel Booking data:", data);

        const db = dbFor(req);
        const result = await db.tx(req).run(INSERT.into(TravelBookings).entries(data));
        
        return {
            ...result,
            message: `Travel booking created successfully`
        };
    });

    // Read Users (for reference)
    this.on('READ', 'Users', async (req) => {
        const userRole = req.user.roles?.includes('Supplier') ? 'Supplier' : 'Employee';
        console.log("Reading users for role:", userRole);
        
        const db = dbFor(req);
        return db.tx(req).run(SELECT.from(Users).where({ role: userRole }));
    });

});
