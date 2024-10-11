### Local Setup

For local, start up your own local DB or connect to the production database. Ask Aaron if you need credentials.

Port can be set to `3000` on local for testing.

### Endpoints

#### `/random`

- Retrieves a single random Asian person.

#### `/random/:count`

- Retrieves multiple random Asian people.

#### `/people`

- **Warning:** Don't query this unless necessary, as it will return all 26k+ results.
- Instead, use the `limit` query parameter to limit the amount of results you need:

  Example: /people?ethnicity=Thai&limit=5

  Returns 5 Thai people.

### Query Parameters

The following query parameters are accepted:

- `limit`
- `name`
- `ethnicity`
- `gender`
- `occupation`
