using myapp from '../db/schema';

@(requires: 'authenticated-user')
service UserService {
    entity Users as projection on myapp.User;

    function login(emailId : String, password : String, role : String) returns {
        message: String;
        success: Boolean;
        userId: String;
        userRole: String;
        userName: String;
    };

    function getUserInfo() returns {
        user: String;
        userData: String;
    };
}
