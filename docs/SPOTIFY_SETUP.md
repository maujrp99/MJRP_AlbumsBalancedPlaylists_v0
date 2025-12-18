
# How to Get Spotify API Credentials

To enable the **Popularity Fallback** (and future playlist export features), you need to create a free App in the Spotify Developer Dashboard.

## Steps

1.  **Log in to Spotify Developer Dashboard**
    *   Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard).
    *   Log in with your standard Spotify account.

2.  **Create an App**
    *   Click the **"Create App"** button.
    *   **App Name**: `MJRP Album Blender`
    *   **App Description**: `"The Album Blender," is a web tool (SPA) for music curation, empowering enthusiasts to opt for different algorithms to objectively generate balanced album-based playlists and export them to Spotify.`
    *   **Redirect URIs**: 
        *   `https://mjrp-playlist-generator.web.app/callback`
    *   Tick the **"Web API"** checkbox.
    *   Tick the "I understand" checkbox and agree to Terms.
    *   Click **Save**.

3.  **Get Credentials**
    *   On your new App's page, go to **Settings** (top right).
    *   Copy **Client ID** and **Client Secret**.

4.  **Configure Secrets (Google Cloud Secret Manager)**
    *   *Recommended for production security.*
    *   Go to Google Cloud Console > Security > Secret Manager.
    *   Create two new secrets:
        *   `SPOTIFY_CLIENT_ID`
        *   `SPOTIFY_CLIENT_SECRET`
    *   Add the values you copied from Spotify.
    *   **Grant Access**:
        *   In the secret details, go to **Permissions** -> **Add Principal**.
        *   **New Principals**: Enter your application's Service Account email (e.g., usually `[project-number]-compute@developer.gserviceaccount.com` for Cloud Run/App Engine).
        *   **Role**: Select **Secret Manager Secret Accessor**.
    *   *(Alternatively for local dev, update `server/.env`)*:
        ```env
        SPOTIFY_CLIENT_ID=your_client_id_here
        SPOTIFY_CLIENT_SECRET=your_client_secret_here
        ```

5.  **Restart Server**
    *   Restart your backend (`node index.js`) for the changes to take effect.
