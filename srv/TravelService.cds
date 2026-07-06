using myapp from '../db/schema';

@(requires: 'authenticated-user')
service TravelService {
    entity Travels as projection on myapp.Travel;
    entity TravelBookings as projection on myapp.TravelBooking;
    entity Users as projection on myapp.User;

    function getTravelsByRole() returns array of {
        ID: UUID;
        travelID: String;
        description: String;
        destination: String;
        startDate: Date;
        endDate: Date;
        status: String;
    };

    action updateTravelStatus(ID: UUID, status: String) returns {
        success: Boolean;
        message: String;
    };
}
