## Backend API Endpoints

### Implemented Endpoints

| Method   | Path                               | Description                                                            | Status |
| :-----   | :--------------------------------- | :--------------------------------------------------------------------- | :----- |
| `POST`   | `/users/`                          | Create a new user. Checks the uniqueness of `username` and `email`.    | [x]    |
| `GET`    | `/users/`                          | Get a list of all users.                                               | [x]    |
| `GET`    | `/users/{user_id}`                 | Get a single user by their ID.                                         | [x]    |
| `POST`   | `/messages/`                       | Create a new message (thread). Requires the author's ID.               | [x]    |
| `GET`    | `/messages/`                       | Get a list of all messages with authors and comments.                  | [x]    |
| `POST`   | `/messages/{message_id}/comments/` | Create a new comment for a specific message.                           | [x]    |
| `PUT`    | `/messages/{message_id}`           | Update the text of an existing message.                                | [x]    |
| `POST`   | `/token`                           | **Authentication.** Get a JWT token to log in.                         | [ ]    |
| `GET`    | `/users/me`                        | Get data about the currently logged-in user.                           | [ ]    |
| `DELETE` | `/messages/{message_id}`           | Delete a message (only by the author or an admin).                     | [ ]    |
| `DELETE` | `/comments/{comment_id}`           | Delete a comment.                                                      | [ ]    |
| `POST`   | `/messages/{message_id}/like`      | "Like" a message.                                                      | [ ]    |
| `GET`    | `/users/{username}/messages`       | Get all messages from a specific user by their name.                   | [ ]    |
| `GET`    | `/ws`                              | **Real-time.** WebSocket for instant updates of messages and comments. | [ ]    |
