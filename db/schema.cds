namespace myapp;

type UserRole: String enum {
    EMPLOYEE = 'Employee';
    SUPPLIER = 'Supplier';
}

entity User {
    key userId: String;
    firstName: String;
    lastName: String;
    mobileNumber: Integer64;
    gender: String;
    emailId: String;
    Password: String;
    failedCount: Integer @default: 0;
    accountStatus: String @default: 'Active';
    lockedAt: Timestamp;
    role: UserRole default 'Employee';
}

// Additional entities for travel management
entity Travel {
    key ID: UUID;
    travelID: String;
    description: String;
    destination: String;
    startDate: Date;
    endDate: Date;
    status: String default 'New';
    createdBy: String;
    createdAt: Timestamp;
    modifiedAt: Timestamp;
}

entity TravelBooking {
    key ID: UUID;
    travel: Association to Travel;
    passenger: String;
    bookingDate: Date;
    seatNumber: String;
    status: String default 'Booked';
}
