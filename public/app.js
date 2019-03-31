//Upon clicking the login button on login form:
// - send an AJAX request to the server for the authToken & "Bearer" method


// 1. Get the authorization token from router.post('/login')

// 2. Set the authorization header to `Bearer: authToken`

// 3. Pass that authorization header to every single protected route when that route is rendered.
//        Do I need a jQuery event handler on every single button in my app?


// $(document).ready(function(){

//   $('#sign-up').submit(e => {
//     e.preventDefault();
//     const username = $('#username').val();
//     const password = $('#password').val();
//     console.log('-------------- username in /public/app.js --------------- ', username);
//       $.ajax({
//         method: "POST",
//         url: "http://localhost:8080/api/auth/login",
//         data: { username: username, password: password }
//       })
//       .done(function( msg ) {
//           console.log("msg: ", msg);
//           console.log("msg.token: ", msg.token);
//           localStorage.setItem('token', msg.token);
//           window.location="http://localhost:8080/api/auth/profile/";
//       });
//   });

// })
// If you go back to the login screen after closing the tab, the token is still in localStorage























// function setHeader(authToken){
//   const authHeader = XMLHttpRequest.setRequestHeader('Bearer', authToken);
//   $.ajax(authHeader);
// }


// $(document).ready(function(){
//   $('.login-button').click(function(e){
//    e.preventDefault();
//     setHeader(authToken);
//     console.log("The login button was just clicked");
//   });
// })

// Use fetch() with this? :
// const httpHeader = { 'Content-Type' : 'application/json', 'Bearer' : token };
// const tokenHeader = new Headers(httpHeader);


// localStorage.getItem('Bearer', authToken);
// localStorage.setItem('Bearer', authToken);
