We can use the bcryptjs library version `^3.0.2` to hash and verify passwords.

```
import bcryptjs from "bcryptjs";

// hash a password
const hashedPassword = await bcryptjs.hash(myPlaintextPassword, saltRounds);

// verify a password
const result = await bcryptjs.compare(myPlaintextPassword, hashedPassword);

if (result) {
  // the password is correct!
} else {
  // the password is incorrect
}
```

Note that the ADMIN_PASSWORD environment variable is the plain-text admin password, not a hashed password.
