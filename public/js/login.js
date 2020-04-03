function login(){
    form_element = document.getElementById('login_form');
    fd = new FormData(form_element);
    
    $.ajax({
                url: "login_post",                      // ajax sends get request to https://2019znguyen_seniorproject.sites.tjhsst.edu/check_hash
                type: "post",                         // use a 'get' type request
                data:{"username": fd.get("username"), "password": fd.get("password")},
                success: function(response) {
                    if(response == "0")
                    {
                        alert("Either your username or password is invalid.  Please re-enter your login credentials")
                        console.log("Incorrect credentials")
                    }
                    
                    else if(response === "1")
                    {
                        console.log("HELLO")
                    }
                    
                    else if(response == "1")
                    {
                        alert("Your file is a duplicate!  Please upload another file.")
                    }
                },
                error: function (stat, err) {
                    alert("There has been an error while checking for duplicates on the server!")
                    console.log("Error on ajax call to server");
                }       
            });
}