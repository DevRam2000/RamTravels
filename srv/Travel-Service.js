const { year } = require('@cap-js/hana/lib/cql-functions');
const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

    this.on('getUserInfo', async (req) => {
        try {
            console.log("inside userinfo")
            const user = req.user.id;
            console.log("user", user);
            const userData = cds.context;
            console.log("userData", userData);
            return 'Success';
        }
        catch (error) {
            console.log("error", error);
            return 'Error';
        }
    })

    // no remote Northwind destination configured in production


});
