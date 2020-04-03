function generate_hash()
{
    form_element = document.getElementById('upload_form');
    fd = new FormData(form_element);
    var uploaded_file = fd.get("uploaded_file");
    console.log(uploaded_file);

    var reader = new FileReader();
    var fileArrayBuffer = reader.readAsArrayBuffer(uploaded_file);
    console.log(fileArrayBuffer);
    
    var cur_arrayBuffer;
    reader.onload = async function(e){
        var arrayBuffer = e.target.result;
        cur_arrayBuffer = arrayBuffer;
        console.log(arrayBuffer);
        console.log("Cur Array Buffer:" + cur_arrayBuffer);
            
        digest = await crypto.subtle.digest("SHA-256", cur_arrayBuffer);  //generating sha256 checksum
        console.log("Digest");
        console.log(digest)
        
        var checksum = Array.prototype.map.call(new Uint8Array(digest), x=>(('00'+x.toString(16)).slice(-2))).join('');  //found on https://jameshfisher.com/2017/10/30/web-cryptography-api-hello-world/
        console.log("Checksum found: " + checksum);
        check_hash(checksum);
    }

}

function check_hash(checksum)
{
       console.log("checking hash for" + checksum);
       $.ajax({
                url: "check_hash",                      // ajax sends get request to https://2019znguyen_seniorproject.sites.tjhsst.edu/check_hash
                type: "get",                         // use a 'get' type request
                data:{"hash": checksum},
                success: function(response) {
                    
                    //-1 is error, 0 is no duplicates found, 1 is duplicates found
                    
                    if(response == -1)
                    {
                        alert("There has been an error while checking for duplicates!")
                        console.log("Error while saving on server")
                    }
                    
                    else if(response == 0)
                    {
                        save_file(checksum);
                    }
                    
                    else if(response == 1)
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

function save_file(checksum)
{
        console.log("Starting to save file");
        form_data = document.getElementById('upload_form')
        console.log("Form data created");
        var myForm = new FormData(form_data);
        myForm.append('checksum', checksum);
        console.log("appended");
        
        $.ajax({
            url: "save_file",                 // goes to https://2019znguyen_seniorproject.sites.tjhsst.edu/save_file
            type: "post",                            // specify that this is going to be a get request
            enctype: 'multipart/form-data',  //required for file transfer
            processData: false, 
            contentType: false,            //previous three lines included for file transfer contentType may have to be json/application
            data: myForm,
            success: function(response) 
            {
                alert("Your file has been saved!");         
            },
            error: function (stat, err) {
                alert("There has been an error while saving your file!")
                console.log("Error on file save");
            }  
        });
}