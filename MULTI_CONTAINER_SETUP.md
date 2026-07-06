# Multi-HDI Container Setup for Employee & Supplier Roles

## Overview

This implementation provides **two separate HDI containers** - one for **Employee** data and one for **Supplier** data. Both containers have identical schema structures but maintain separate data isolation.

## Architecture

### Database Structure

```
RamTravels Application
├── HDI Container: db-employee
│   ├── User table
│   ├── Travel table
│   └── TravelBooking table
│
└── HDI Container: db-supplier
    ├── User table
    ├── Travel table
    └── TravelBooking table
```

### MTA Deployment

The `mta.yaml` has been updated with:
- **RamTravels-db-employee**: HDI container for employee data
- **RamTravels-db-supplier**: HDI container for supplier data
- **Two db-deployer modules**: Each deployer deploys the schema to its respective container

### Database Schema Changes

#### New User Entity Fields
- `role: UserRole enum { 'Employee', 'Supplier' }` - Determines which container the user belongs to

#### New Entities
- **Travel**: Stores travel information
- **TravelBooking**: Stores travel booking information

Both tables are replicated in both containers for identical schema structure.

## Login Flow

### Registration
1. User provides email, password, and role (Employee/Supplier)
2. System validates email format and checks for existing user with same email+role combination
3. User is created in the appropriate schema container based on their role
4. Role is stored in the User table for future reference

### Login
1. User provides email, password, and **role** parameter
2. System validates credentials against the user's role-specific container
3. On successful login:
   - User role is returned
   - Session maintains the role information
   - Subsequent queries route to the correct container

## Implementation Details

### Service Modifications

#### UserService (Travel-Service.cds)
```
function login(emailId: String, password: String, role: String) returns {
    message: String;
    success: Boolean;
    userId: String;
    userRole: String;
    userName: String;
}
```

#### TravelService (New)
- `Travels` entity (CRUD operations)
- `TravelBookings` entity (CRUD operations)
- `getTravelsByRole()` function
- `updateTravelStatus()` action

### Backend Logic (server.js)

- **Database Routing**: Intercepts requests and matches user role to appropriate container
- **Role Detection**: Automatically identifies user role from authentication context
- **Logging**: Logs all container routing decisions for debugging

### Authentication Context

The `req.userRole` is set during request processing:
- Employee: Default role
- Supplier: If 'Supplier' role detected in user context

## Deployment Steps

### 1. Local Development
```bash
npm install
npm start
```

For local development, the setup uses SQLite with automatic schema evolution.

### 2. Cloud Deployment
```bash
npm run build
npm run deploy
```

During deployment:
1. MTA builder creates packages for both db-deployer modules
2. Each deployer is assigned its own HDI container in the HANA database
3. Both containers receive identical schema structure
4. Environment bindings are created for container access

## Environment Variables

Upon deployment, the following bindings are created:
- `VCAP_SERVICES.hana[0]` - RamTravels-db-employee binding
- `VCAP_SERVICES.hana[1]` - RamTravels-db-supplier binding

The CAP runtime automatically manages multi-tenant database routing based on configuration.

## API Usage Examples

### Registration - Employee

```http
POST /odata/v4/user-service/Users
Content-Type: application/json

{
  "emailId": "john@company.com",
  "firstName": "John",
  "lastName": "Doe",
  "Password": "secure123",
  "role": "Employee",
  "mobileNumber": 1234567890,
  "gender": "Male"
}
```

### Registration - Supplier

```http
POST /odata/v4/user-service/Users
Content-Type: application/json

{
  "emailId": "supplier@company.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "Password": "secure456",
  "role": "Supplier",
  "mobileNumber": 9876543210,
  "gender": "Female"
}
```

### Login - Employee

```http
POST /odata/v4/user-service/login
Content-Type: application/json

{
  "emailId": "john@company.com",
  "password": "secure123",
  "role": "Employee"
}
```

### Login - Supplier

```http
POST /odata/v4/user-service/login
Content-Type: application/json

{
  "emailId": "supplier@company.com",
  "password": "secure456",
  "role": "Supplier"
}
```

### Create Travel

```http
POST /odata/v4/travel-service/Travels
Content-Type: application/json

{
  "travelID": "TR001",
  "description": "Paris Business Trip",
  "destination": "Paris",
  "startDate": "2026-07-15",
  "endDate": "2026-07-22"
}
```

## Key Features

✅ **Data Isolation**: Each role has separate data in different containers
✅ **Same Schema**: Identical table structure in both containers for consistency
✅ **Role-Based Routing**: Automatic routing based on user role
✅ **Scalability**: Each container can be scaled independently
✅ **Audit Trail**: All operations track the creating user
✅ **Account Lock**: 3 failed login attempts trigger 30-minute lockout
✅ **Status Management**: Users can be Active or Inactive

## Important Notes

1. **Role Determination**: The role must be provided during registration and login
2. **Email Uniqueness**: Email must be unique within the same role, but can exist in both roles
3. **Schema Synchronization**: Both schemas are deployed simultaneously and kept in sync
4. **Database Performance**: Query performance depends on container-specific index optimization
5. **Transaction Management**: Each transaction is scoped to its respective container

## Troubleshooting

### User Not Found on Login
- Verify email is correct
- Ensure role parameter matches registration role
- Check that user account status is 'Active' (not locked)

### Database Connection Error
- Verify MTA deployment completed successfully
- Check HDI container bindings in VCAP_SERVICES
- Ensure db-deployer modules ran without errors

### Schema Mismatch
- Rebuild database: `npm run deploy`
- Check for CDS syntax errors in schema.cds
- Verify both db-deployer modules completed deployment

## Migration Notes

If migrating from single-container setup:
1. Manually assign role to existing users (default: Employee)
2. Run differentiated queries to separate data by role
3. Update application UI to include role selection

## Support

For issues or questions about the multi-container setup, check:
- CAP Documentation: https://cap.cloud.sap/docs
- HANA HDI Documentation
- Build logs from MTA deployment
- Application server logs (server.js)
