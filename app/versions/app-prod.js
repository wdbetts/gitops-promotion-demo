const express = require('express');
const app = express();
const port = 8080;

// App version - this is what we'll change between environments
const appVersion = process.env.APP_VERSION || '2.0.0';

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
        background-color: #e8f5e9;
      }
      .container {
        text-align: center;
        padding: 30px;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 3px 15px rgba(0, 0, 0, 0.15);
        min-width: 400px;
      }
      h1 {
        color: #1a535c;
        margin-bottom: 20px;
      }
      .version {
        font-size: 28px;
        font-weight: bold;
        color: #27ae60;
        margin: 20px 0;
        padding: 10px;
        border: 2px solid #27ae60;
        border-radius: 6px;
        display: inline-block;
      }
      .description {
        color: #546e7a;
        font-size: 16px;
        line-height: 1.5;
      }
      .environment {
        padding: 8px 16px;
        background-color: #2e7d32;
        color: white;
        border-radius: 4px;
        font-weight: bold;
        margin-top: 15px;
        display: inline-block;
        letter-spacing: 1px;
      }
      .features {
        margin-top: 20px;
        text-align: left;
      }
      .feature {
        margin: 8px 0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>GitOps Promotion Demo</h1>
      <div class="version">Version: ${appVersion}</div>
      <p class="description">This is a simple app to demonstrate GitOps promotion across environments</p>
      <div class="environment">PRODUCTION</div>
      
      <div class="features">
        <div class="feature">✅ Updated visual design</div>
        <div class="feature">✅ Environment indicator</div>
        <div class="feature">✅ Version display</div>
      </div>
    </div>
  </body>
  </html>
  `;
  res.send(html);
});

app.listen(port, () => {
  console.log(`GitOps demo app listening at http://localhost:${port}`);
});
