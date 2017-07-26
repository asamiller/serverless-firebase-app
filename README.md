# Serverless Firebase Helpers

### Setup
`yarn add asamiller/serverless-firebase-app`

Set your environment variables.
```
export FIREBASE_PRIVATE_KEY=XXXXX
export FIREBASE_CLIENT_EMAIL=XXXXX
export FIREBASE_PROJECT_ID=XXXXX
export FIREBASE_DATABASE_URL=XXXXX
```

### Create a new application

```javascript
const Application = require('serverless-firebase-app');
const App = new Application();
```

You can have more than 1 per project if needed but you need to pass in a name.

```javascript
const Application = require('serverless-firebase-app');
const App1 = new Application({ name: 'App1' });
const App2 = new Application({ name: 'App2' });
```

You can default results as well. These will be merged with any value you return.

```javascript
const Application = require('serverless-firebase-app');
const App = new Application({
  name: 'app-name',
  results: {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    body: { success: true },
  }
});
```

### Create a new function
```javascript
App.create('render', data => {
  return {
    statusCode: 200,
    body: 'DONE!',
  };
});
```

### Export the handlers
At the end of the document, export the handlers.

```javascript
module.exports = App.getHandlers();
```

## Conveniences

#### Event Data
```javascript
App.create('render', data => {
  console.log(data);
});
```
`data` contains objects for `path`, `query`, `body`. It parses the `body` if it's JSON.


#### Application Flow
The callback for `App.create` wants a sync response or a promise. Anything that's returned from the promise chain will be the results.

```javascript
return doSomethingAsync().then(() => {
  return {
    statusCode: 200,
    body: 'DONE!',
  };
});
```


#### Database (Firebase) Helpers

##### Get data:
`getDB` returns a promise with the value
```javascript
App.getDB(`sites/123`)
  .then(data => console.log(data));
```
It also supports a callback before the promise is resolved. This is helpful for chaining.
```javascript
return Promise.all([
  App.getDB(`sites/123`, data => myVarName = data),
  App.getDB(`sites/xyz`, data => somethingElse = data),
]);
```

##### Setting a value:
```javascript
App.setDB(`data/path`, true);
```

##### Updating a value:
```javascript
App.updateDB(`data/path`, { cool: true, sucks: false });
```

##### Pushing a value to an array:
This returns a promise with the new object's key.
```javascript
App.pushDB(`data/path`, { cool: true, sucks: false })
  .then(key => console.log(key));
```

##### Remove data:
```javascript
App.removeDB(`data/path`);
```

##### Timestamp:
Server generated timestamp.
```javascript
App.setDB(`data/path/time`, App.timestamp);
```

##### Get a user from a token:
Pass in a firebase token and get the user
```javascript
App.getUserFromToken(token)
.then(user => console.log(user));
```

## Full example
```javascript
const Application = require('serverless-firebase-app');
const App = new Application();

App.create('render', data => {
  return App.getDB(`sites/123`).then(data => {
    return {
      statusCode: 200,
      body: 'DONE!',
    };
  });
});

module.exports = App.getHandlers();

```
