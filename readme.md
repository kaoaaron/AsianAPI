### Local Setup

To run locally, uncomment the code in app.js and just run `npm run start`. You need to create a `.env` file with `MONGO_URI` and `PORT` variables. Ask Aaron for prod connection string if required.

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

## Query Parameters

The following query parameters are accepted for the _people_ endpoint:

- `limit`
- `name`
- `ethnicity`
- `gender`
- `occupation`
