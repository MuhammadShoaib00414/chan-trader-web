# Authenticating requests

To authenticate requests, include an **`Authorization`** header with the value **`"Bearer YOUR_ACCESS_TOKEN"`**.

All authenticated endpoints are marked with a `requires authentication` badge in the documentation below.

You can retrieve your access token by calling the login or register endpoints. Include the token in the Authorization header as "Bearer YOUR_ACCESS_TOKEN".
