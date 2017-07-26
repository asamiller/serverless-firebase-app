const admin = require('firebase-admin');
const isFunction = require('lodash.isfunction');
const isString = require('lodash.isstring');

const buildResults = (results, defaults) => {
  let returnValue = Object.assign({}, defaults, results);

  // merge the headers together
  if (returnValue.headers && defaults.headers) {
    Object.assign(returnValue.headers, defaults.headers);
  }

  try {
    if (returnValue.body && !isString(returnValue.body)) {
      returnValue.body = JSON.stringify(returnValue.body);
    }
  } catch (e) {
    console.error('could not stringify body');
  }

  return returnValue;
};

class Application {
  constructor(options = {}) {
    this._appName = options.name;
    this._defaultResults = options.results || {};
    this._FBApp;
    this.handlers = {};
  }

  firebaseApp() {
    if (!this._FBApp) {
      this._FBApp = admin.initializeApp(
        {
          credential: admin.credential.cert({
            projectId: process.env['FIREBASE_PROJECT_ID'],
            clientEmail: process.env['FIREBASE_CLIENT_EMAIL'],
            privateKey: (process.env['FIREBASE_PRIVATE_KEY'] || '')
              .replace(/\\n/g, '\n'),
          }),
          databaseURL: process.env['FIREBASE_DATABASE_URL'],
        },
        this._appName
      );
    }

    return this._FBApp;
  }

  create(name, handler) {
    this.handlers[name] = (event, context, callback) => {
      let body = event.body;

      if (body) {
        try {
          body = JSON.parse(body);
        } catch (e) {
          console.log('body parse failed');
        }
      }

      const data = {
        path: event.pathParameters || {},
        query: event.queryStringParameters || {},
        identity: event.identity || {},
        headers: event.headers || {},
        body: body,
        context: context,
      };

      return Promise.resolve(handler(data, this))
        .then(results => {
          let output = Object.assign({ statusCode: 200 }, results);

          return this.end().then(
            callback(null, buildResults(output, this._defaultResults))
          );
        })
        .catch(results => {
          console.error(`## Error with handler: ${name} ##`, results);
          let output = Object.assign({ statusCode: 500 }, results);

          return this.end().then(
            callback(null, buildResults(output, this._defaultResults))
          );
        });
    };
  }

  end() {
    if (!this._FBApp) return Promise.resolve();

    return Promise.resolve(this._FBApp.delete()).then(() => {
      this._FBApp = null;
    });
  }

  getHandlers() {
    return this.handlers;
  }

  // TODO: add limits
  getDB(opts, callback) {
    let options = {};

    if (typeof opts === 'string') {
      options.ref = opts;
    } else {
      Object.assign(options, opts);
    }

    let DBRef = this.firebaseApp().database().ref(options.ref);

    if (options.orderByChild) {
      DBRef = DBRef.orderByChild(options.orderByChild);
    }

    if (options.orderByKey) {
      DBRef = DBRef.orderByKey();
    }

    if (options.orderByValue) {
      DBRef = DBRef.orderByValue();
    }

    if (options.limitToLast) {
      DBRef = DBRef.limitToLast(options.limitToLast);
    }

    if (options.limitToFirst) {
      DBRef = DBRef.limitToFirst(options.limitToFirst);
    }

    if (options.equalTo) {
      DBRef = DBRef.equalTo(options.equalTo);
    }

    return DBRef.once('value').then(snap => {
      let data = snap.val();

      if (isFunction(callback)) {
        callback(data);
      }

      return data;
    });
  }

  setDB(ref, data) {
    return this.firebaseApp().database().ref(ref).set(data);
  }

  updateDB(ref, data) {
    return this.firebaseApp().database().ref(ref).update(data);
  }

  pushDB(ref, data) {
    return this.firebaseApp()
      .database()
      .ref(ref)
      .push(data)
      .then(snap => snap.key);
  }

  removeDB(ref) {
    return this.firebaseApp().database().ref(ref).remove();
  }

  get timestamp() {
    return admin.database.ServerValue.TIMESTAMP;
  }

  getUserFromToken(token) {
    return this.firebaseApp().auth().verifyIdToken(token);
  }
}

module.exports = Application;
