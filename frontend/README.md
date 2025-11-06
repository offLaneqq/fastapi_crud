## Frontend (React)

### Implemented features

-   Displaying a list of messages (threads) with authors and comments.
-   Form for creating a new message.
-   Ability to delete messages.
-   Stylized interface resembling a chat application.

### Future features (development plan)

-   **Authentication:** Creation of pages for user registration and login.
-   **Routing:** Use of `react-router-dom` to create separate pages:
-   Main feed.
    - User profile page.
- Separate thread page with all comments.
- **State management:** Implementing Context API or Zustand to store information about the current user.
- **Interface:**
- Displaying user avatars.
    - Date and time formatting (e.g., “5 minutes ago”).
- Ability to add comments directly below the thread.
- “Like” buttons.
- **Real-time:** Connect to WebSocket for instant feed updates without reloading the page.