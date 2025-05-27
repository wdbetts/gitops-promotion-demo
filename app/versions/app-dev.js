const express = require('express');
const app = express();
const port = 8080;

// App version - this is what we'll change between environments
const appVersion = process.env.APP_VERSION || '1.0.0';

app.get('/', (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GitOps Demo App</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        margin: 0;
        background-color: #f0f8ff;
      }
      .container {
        text-align: center;
        padding: 20px;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }
      h1 {
        color: #2c3e50;
      }
      .version {
        font-size: 24px;
        font-weight: bold;
        color: #3498db;
        margin: 20px 0;
      }
      .description {
        color: #7f8c8d;
      }
      .environment {
        padding: 5px 10px;
        background-color: #3498db;
        color: white;
        border-radius: 4px;
        font-weight: bold;
        margin-top: 10px;
        display: inline-block;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>GitOps Promotion Demo</h1>
      <div class="version">Version: ${appVersion}</div>
      <p class="description">This is a simple app to demonstrate GitOps promotion across environments</p>
      <div class="environment">DEV</div>
    </div>
  </body>
  </html>
  `;
  res.send(html);
});

app.listen(port, () => {
  console.log(`GitOps demo app listening at http://localhost:${port}`);
});
