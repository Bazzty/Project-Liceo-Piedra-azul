# Authenticating requests

To authenticate requests, include an **`Authorization`** header with the value **`"Bearer {YOUR_AUTH_KEY}"`**.

All authenticated endpoints are marked with a `requires authentication` badge in the documentation below.

Las rutas protegidas usan Sanctum: cookie de sesión desde el frontend, o un token en el encabezado <code>Authorization: Bearer</code>.
