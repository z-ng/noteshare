function onload(){
    //https://stackoverflow.com/questions/37673994/html5-form-validation-without-submit-button-with-custom-error-message
    //masks submit button
    var btn = document.getElementById('send');
    btn.addEventListener('click',function(e) {
    	document.querySelector('#submitBtn').click();
    });
}
function validate_form(){
    //https://stackoverflow.com/questions/17885843/ajax-request-before-regular-form-is-being-submitted
    //checks ajax before submitting
    console.log("EHLO")
    form = new FormData(document.getElementById("create_account_form"));
    $.ajax({
            url: "account_creation_post",                      // ajax sends get request to https://2019znguyen_seniorproject.sites.tjhsst.edu/check_hash
            type: "post",                         // use a 'get' type request
            data:{"username": form.get("username"), "password": form.get("password"), "email": form.get("email_field"), "first_name": form.get("first_name"), "last_name": form.get("last_name")},
            success: function(response) {
                
                //-1 is error, 0 is no duplicates found, 1 is duplicates found
                
                if(response == "0")
                {
                    alert("Username entered already exists!  Please choose another username.")
                    console.log("Username exists")
                }
                else if(response == "1")
                {
                    alert("Email entered is already in use!  Please choose another email.")
                    console.log("Email exists")
                }
                else if(response == "2")
                {
                    alert("Successful email creation!")
                    console.log("Success")
                }
            },
            error: function (stat, err) {
                alert("There has been an error while checking for duplicates on the server!")
                console.log("Error on ajax call to server");
            }       
        });
}