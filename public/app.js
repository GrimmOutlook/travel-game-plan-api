const {authToken} = require('../auth/router');

//Upon clicking the login button on login form:
// - send an AJAX request to the server for the authToken & "Bearer" method


// 1. Get the authorization token from router.post('/login')

// 2. Set the authorization header to `Bearer: authToken`

// 3. Pass that authorization header to every single protected route when that route is rendered.
//        Do I need a jQuery event handler on every single button in my app?



function setHeader(authToken){
  const authHeader = XMLHttpRequest.setRequestHeader('Bearer', authToken);
  $.ajax(authHeader);
}


$(document).ready(function(){
  $('.login-button').click(function(e){
   e.preventDefault();
    setHeader(authToken);
    console.log("The login button was just clicked");
  });
})

