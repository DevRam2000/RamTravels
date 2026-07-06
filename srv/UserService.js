const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

    const { Users } = this.entities;
    const { User } = cds.entities('myapp');
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
    //console.log(req.user);

    if (req.user.is('Supplier')) {
        return supplierDb;
    }

    if (req.user.is('Employee')) {
        return employeeDb;
    }

    throw new Error('User has neither Supplier nor Employee role.');
};

    // Registration with role support
    this.on('CREATE', 'Users', async (req) => {
        const data = req.data;
        console.log("[CREATE] Incoming user data:", data);

        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const emailPrefix = data.emailId.split('@')[0];
        data.userId = `${emailPrefix} - ${year} - ${month} - ${day}`
        data.lockedAt = null;

        // Set role (default to Employee if not provided)
        if (!data.role) {
            data.role = 'Employee';
        } else if (data.role === 'supplier' || data.role === 'Supplier') {
            data.role = 'Supplier';
        } else {
            data.role = 'Employee';
        }

        if (data.failedCount === undefined) {
            data.failedCount = 0;
        }
        if (!data.accountStatus) {
            data.accountStatus = 'Active';
        }

        console.log("[CREATE] User role set to:", data.role);

        // Check for existing user by email AND role in the base User entity
        const exists = await SELECT.one.from(User).where({ 
            emailId: data.emailId,
            role: data.role 
        });

        if (exists) {
            return {
                message: `A user with this email already exists for role ${data.role}`,
                success: false
            }
        }

        // Create new user in the base User entity
        const db = dbFor(req);
        const result = await db.tx(req).run(INSERT.into(User).entries(data));
        console.log("[CREATE] User created successfully:", result);

        return {
            message: `Registration Successful for ${data.role}: ${data.userId}`,
            userId: data.userId,
            role: data.role,
            success: true
        };
    });

    // Login with role-based database routing
    this.on("login", async (req) => {
        const { emailId, password, role } = req.data;
        console.log("emailId", emailId);
        console.log("password", password);
        console.log("role", role);

        if (!emailId || !isValidEmail(emailId)) {
            return { 
                message: `Please enter a valid email address.`,
                success: false 
            };
        }

        // Normalize role to 'Employee' or 'Supplier'
        const userRole = (role === 'Supplier' || role === 'supplier') ? 'Supplier' : 'Employee';
        console.log("normalized role", userRole);

        // Store role in request context for database routing
        req.userRole = userRole;

        const db = dbFor(req);
        const user = await db.tx(req).run(SELECT.one.from(User).where({ emailId: emailId, role: userRole }));
        console.log("userFound", user);

        if (!user) {
            return { 
                message: `No user found with this email and role. Please check credentials.`,
                success: false 
            };
        }

        if (user.accountStatus === 'Inactive') {
            if (user.lockedAt) {
                const lockedAt = new Date(user.lockedAt);
                const unlockAt = new Date(lockedAt.getTime() + 30 * 60 * 1000);
                const now = new Date();

                console.log("lockedAt:", lockedAt.toISOString());
                console.log("unlockAt:", unlockAt.toISOString());
                console.log("now:", now.toISOString());

                if (now >= unlockAt) {
                    const db = dbFor(req);
                    await db.tx(req).run(UPDATE(User).set({
                        failedCount: 0,
                        accountStatus: 'Active',
                        lockedAt: null
                    }).where({ emailId: emailId }));
                    return { 
                        message: "Account unlocked, please try logging in again.",
                        success: false 
                    };
                } else {
                    const minutesLeft = Math.ceil((unlockAt - now) / (1000 * 60));
                    return { 
                        message: `Account locked. Try again after ${minutesLeft} minutes.`,
                        success: false 
                    };
                }
            } else {
                return { 
                    message: `Account locked due to multiple failed login attempts.`,
                    success: false 
                };
            }
        }

        if (emailId === user.emailId && password === user.Password) {
            const db = dbFor(req);
            await db.tx(req).run(UPDATE(User).set({ 
                failedCount: 0, 
                accountStatus: 'Active', 
                lockedAt: null 
            }).where({ emailId: emailId }));
            
            return { 
                message: `Login Successful: ${emailId}`,
                success: true,
                userId: user.userId,
                userRole: userRole,
                userName: `${user.firstName} ${user.lastName}`
            };
        }
        else {
            let failedCount = (user.failedCount || 0) + 1;
            let updates = { failedCount: failedCount };
            let message;
            if (failedCount > 3) {
                updates.accountStatus = 'Inactive';
                updates.lockedAt = new Date().toISOString();
                message = `Account locked due to multiple failed login attempts. Try after sometime`;
            } else {
                message = `Invalid credentials. Please try again. Attempts remaining: ${3 - failedCount}`;
            }
            const db = dbFor(req);
            await db.tx(req).run(UPDATE(User).set(updates).where({ emailId: emailId }));
            return { 
                message,
                success: false 
            };
        }
    });

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // Get user info
    this.on('getUserInfo', async (req) => {
        try {
            console.log("inside userinfo")
            const user = req.user.id;
            console.log("user", user);
            const userData = cds.context;
            console.log("userData", userData);
            return { user, userData };
        }
        catch (error) {
            console.log("error", error);
            return { message: "Error retrieving user info", error: error.message };
        }
    });

});
