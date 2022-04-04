# Usage
## Making a Request with a Signed Claim

```typescript
import { generateNewJws, signJws } from '@castframework/chain-auth';

const secretKey = '<Insert Secret Key>';
const publicKey = '<Insert Public Key>';
const claim = generateNewJws(publicKey, 'myservice.com', 'ETH');
const token = signJws(claim, secretKey);

http.get('myservice.com/goblin', {
  header: {
    authorization: `Bearer ${token}`
  }
});
```

## Verifying a Signed Claim

```typescript
import { authenticate } from '@castframework/chain-auth';

const auth = request.headers.authorization;
// Example: 'Bearer 0x40935789042SDFE750984375ASF893475098109345'

const token = auth.split(' ')[1];
const result = authenticate(token);

if (result.success) {
  console.log('Authenticated!');
} else {
  console.log('Authorization Error:', result.errorMessage);
}
```

# License

Apache 2.0