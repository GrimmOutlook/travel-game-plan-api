# Travel Game Plan API
For use with: http://travelgameplan.com/

# Summary
Going on vacation?  A business trip?  Organizing a trip with friends?  Keep track of them all with Travel Game Plan!  Coordinate your trip with friends and keep track of who's bringing what.

# Endpoints

- **/api/users/** - Register a new user. - POST
- **/api/users/me** - All trips for a given user - GET
- **/api/users/me** - Add a new trip to a given user's list. - PUT

- **/api/auth/login** - Existing user login. - POST
- **/api/auth/refresh** - User exchanges a valid JWT for a new one with a later expiration. - POST

- **/api/trip/** - List of all trips in database. - GET
- **/api/trip/** - Create a new trip & UUID for a user.  Add the trip to their list of trips & add the user to the list of users for the trip - POST

- **/api/trip/:tripId - Retrieve one particular trip along with its list of items & list of users from a user's list of trips. - GET
- **/api/trip/:tripId - Create a new item for a particular trip. - POST
- **/api/trip/:tripId - Edit existing trip information. - PUT
- **/api/trip/:tripId - Remove a particular trip from the database. - DELETE

- **/api/trip/:tripId/:itemId - Edit an existing item. - PUT
- **/api/trip/:tripId/:itemId - Remove a particular item from the list of items of a particular trip. - DELETE

- **/api/trip/:trip-invite/:tripUUID - Returns the tripName & tripUUID only when sent a trip UUID from a user receiving an invitation. - GET
