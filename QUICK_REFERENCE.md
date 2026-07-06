# Two HDI Container Setup - Quick Reference

## Project Structure After Implementation

```
srv/
├── Travel-Service.cds          (CatalogService - Northwind integration)
├── Travel-Service.js           (CatalogService implementation)
├── UserService.cds             (User registration & login)
├── UserService.js              (User service implementation)
├── TravelService.cds           (Travel & booking management)
├── TravelService.js            (Travel service implementation)
└── external/
    ├── Northwind.csn
    └── Northwind.edmx

db/
└── schema.cds                  (All entities & types)

app/
├── router/
├── travels/
└── services.cds
```

## Key Implementation Files

### 1. Database Schema [db/schema.cds]
- `UserRole` enum: Employee | Supplier
- `User` entity with role field
- `Travel` entity for travel information
- `TravelBooking` entity for bookings

### 2. MTA Configuration [mta.yaml]
- Two HDI container resources:
  - `RamTravels-db-employee`
  - `RamTravels-db-supplier`
- Two db-deployer modules:
  - `RamTravels-db-deployer-employee`
  - `RamTravels-db-deployer-supplier`
- Both deploy same schema to separate containers

### 3. Server Configuration [srv/server.js]
- Database routing middleware
- Role detection from auth context
- Request logging for container usage

### 4. Service Layer

#### UserService [UserService.cds/js]
```
API Endpoints:
- POST /odata/v4/user-service/Users                 → Register
- POST /odata/v4/user-service/login                 → Login
- GET  /odata/v4/user-service/Users                 → List Users
```

#### TravelService [TravelService.cds/js]
```
API Endpoints:
- GET  /odata/v4/travel-service/Travels             → Read travels
- POST /odata/v4/travel-service/Travels             → Create travel
- GET  /odata/v4/travel-service/TravelBookings      → Read bookings
- POST /odata/v4/travel-service/TravelBookings      → Create booking
- POST /odata/v4/travel-service/getTravelsByRole    → Get by role
- POST /odata/v4/travel-service/updateTravelStatus  → Update status
```

## Installation & Setup

### Step 1: Local Development
```bash
cd /home/user/projects/RamTravels
npm install
npm start
```

### Step 2: Build for Production
```bash
npm run build
```

### Step 3: Deploy to Cloud
```bash
npm run deploy
```

## Usage Examples

### Register Employee User
```json
POST /odata/v4/user-service/Users

{
  "emailId": "employee@company.com",
  "firstName": "John",
  "lastName": "Doe",
  "Password": "password123",
  "role": "Employee",
  "mobileNumber": 9876543210,
  "gender": "Male"
}
```

### Register Supplier User
```json
POST /odata/v4/user-service/Users

{
  "emailId": "supplier@company.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "Password": "password456",
  "role": "Supplier",
  "mobileNumber": 8765432109,
  "gender": "Female"
}
```

### Login as Employee
```json
POST /odata/v4/user-service/login

{
  "emailId": "employee@company.com",
  "password": "password123",
  "role": "Employee"
}
```

### Login as Supplier
```json
POST /odata/v4/user-service/login

{
  "emailId": "supplier@company.com",
  "password": "password456",
  "role": "Supplier"
}
```

### Create Travel
```json
POST /odata/v4/travel-service/Travels

{
  "travelID": "TR-001",
  "description": "Business trip to Paris",
  "destination": "Paris",
  "startDate": "2026-08-01",
  "endDate": "2026-08-08"
}
```

### Update Travel Status
```json
POST /odata/v4/travel-service/updateTravelStatus

{
  "ID": "550e8400-e29b-41d4-a716-446655440000",
  "status": "Confirmed"
}
```

## Features Implemented

✅ **Dual Database Containers**
- Separate employee and supplier databases
- Identical schema structure
- Independent scaling

✅ **Role-Based Access Control**
- Employee role detection
- Supplier role detection
- Automatic container routing

✅ **User Management**
- Registration with role assignment
- Login with role validation
- Email uniqueness per role
- Account lockout (3 attempts)
- 30-minute unlock period

✅ **Travel Management**
- Create/Read/Update operations
- Role-specific data isolation
- User tracking (createdBy)
- Timestamp tracking (createdAt, modifiedAt)
- Status management

✅ **Security Features**
- Password validation
- Failed login tracking
- Account lockout mechanism
- Role-based data access

## Environment Variables

When deployed to Cloud Foundry, the following environment bindings are created:
- `VCAP_SERVICES.hana[0]` - Employee HDI Container
- `VCAP_SERVICES.hana[1]` - Supplier HDI Container

CAP automatically routes database requests based on configuration.

## Troubleshooting

### Users Not Isolated by Container
**Solution**: Verify role is specified in login request and user was registered with that role.

### Schema Not in Both Containers
**Solution**: Check MTA deployment logs. Both db-deployer modules must complete successfully.

### Database Connection Errors
**Solution**: 
1. Verify HANA service is running
2. Check HDI container bindings in Cloud Foundry
3. Review server logs

### Permission Denied Errors
**Solution**: Ensure user has 'authenticated-user' role in XSUAA security configuration.

## Database Migration

If migrating from single container:
1. Backup existing data
2. Assign default role 'Employee' to existing users
3. Deploy new MTA with both containers
4. Run data migration queries to separate data by role

## Support & Documentation

Detailed documentation available in:
- [MULTI_CONTAINER_SETUP.md](./MULTI_CONTAINER_SETUP.md) - Complete setup guide
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Implementation details

CAP Documentation: https://cap.cloud.sap/docs
HANA HDI Guide: https://help.sap.com/viewer/index
