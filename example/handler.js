const Application = require('../index.js');
const App = new Application();

App.create('render', data => {
  console.log(data);

  return App.getDB(`sites/123`).then(data => {
    console.log(data);

    return {
      statusCode: 200,
      body: 'DONE!',
    };
  });
});

module.exports = App.getHandlers();
