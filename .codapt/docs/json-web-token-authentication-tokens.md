We can generate authentication tokens using `jsonwebtoken` version `^9.0.2`.

Here is how we can sign a JWT token:

```
import jwt from "jsonwebtoken";

jwt.sign({ /* data to sign -- userId, as an example */ userId }, JWT_SECRET_GOES_HERE, { expiresIn: "1y" });
```

You may want to store the JWT secret in an environment variable if you don't already have one.

Then, you can verify and parse it:

```
try {
  const verified = jwt.verify(authToken, JWT_SECRET_GOES_HERE);
  const parsed = z.object({ userId: z.number() }).parse(verified);
} catch (error) {
  // something is wrong with the token, for example it may have expired or be invalid
}
```
