# SSO Configuration Guide: OpenID Connect

To integrate Flarum with the SSO provider `ucs-sso-ng.schleswignetzwerk.eu`, follow these steps in the Flarum Admin Panel after running the setup scripts.

## 1. Extension Activation
- Go to **Admin Panel** -> **Extensions**.
- Find **OpenID Connect** (installed via `flarum-community/auth-oidc`).
- Click the configuration icon (cogwheel).

## 2. Configuration Parameters
Fill in the following details provided by your UCS OIDC Client configuration:

| Field | Value / Description |
| :--- | :--- |
| **Provider Name** | Schleswig Netzwerk SSO |
| **Client ID** | (From your OIDC Client setup in UCS) |
| **Client Secret** | (From your OIDC Client setup in UCS) |
| **Issuer URL** | `https://ucs-sso-ng.schleswignetzwerk.eu/adfs` (or your specific OIDC endpoint) |
| **Discover** | Enabled (Yes) |

## 3. Advanced Settings (Optional)
- **Sync Group/Roles**: To automatically assign the "Moderator" role, you may need to map the OIDC group claim to Flarum groups.
- Ensure the `group` claim is requested in the Scopes if you want auto-promotion based on SSO groups.

## 4. Moderator Auto-Promotion
If you want *every* SSO user to be a moderator (as per requirements):
- Go to **Permissions** in Flarum.
- Ensure the "Moderator" group is correctly mapped or manually assigned to initial SSO users.
- *Note*: The `auth-oidc` extension might require additional mapping logic if specific group claims are used.
