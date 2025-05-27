const express = require('express');
const app = express();
const port = 8080;

// Environment variables for version and environment name
const appVersion = process.env.APP_VERSION || '1.0.0';
const appEnvironment = process.env.APP_ENVIRONMENT || 'dev';

// UI configuration based on environment
const uiConfig = {
  dev: {
    bgColor: '#f0f8ff',
    versionColor: '#3498db',
    envBgColor: '#3498db',
    envDisplayName: 'DEV',
    features: []
  },
  staging: {
    bgColor: '#e6f7ff',
    versionColor: '#2980b9',
    envBgColor: '#f39c12',
    envDisplayName: 'STAGING',
    features: []
  },
  prod: {
    bgColor: '#e8f5e9',
    versionColor: '#27ae60',
    envBgColor: '#2e7d32',
    envDisplayName: 'PRODUCTION',
    features: ['✅ Updated visual design', '✅ Environment indicator', '✅ Version display']
  }
};

// Get environment specific config
const config = uiConfig[appEnvironment] || uiConfig.dev;

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
        background-color: ${config.bgColor};
      }
      .container {
        text-align: center;
        padding: ${appEnvironment === 'prod' ? '30px' : '20px'};
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 ${appEnvironment === 'prod' ? '3px 15px' : '2px 10px'} rgba(0, 0, 0, ${appEnvironment === 'prod' ? '0.15' : '0.1'});
        ${appEnvironment === 'prod' ? 'min-width: 400px;' : ''}
      }
      h1 {
        color: ${appEnvironment === 'prod' ? '#1a535c' : '#2c3e50'};
        ${appEnvironment === 'prod' ? 'margin-bottom: 20px;' : ''}
      }
      .version {
        font-size: ${appEnvironment === 'prod' ? '28px' : '24px'};
        font-weight: bold;
        color: ${config.versionColor};
        margin: 20px 0;
        ${appEnvironment === 'prod' ? 'padding: 10px; border: 2px solid #27ae60; border-radius: 6px; display: inline-block;' : ''}
      }
      .description {
        color: ${appEnvironment === 'prod' ? '#546e7a' : '#7f8c8d'};
        ${appEnvironment === 'prod' ? 'font-size: 16px; line-height: 1.5;' : ''}
      }
      .environment {
        padding: ${appEnvironment === 'prod' ? '8px 16px' : '5px 10px'};
        background-color: ${config.envBgColor};
        color: white;
        border-radius: 4px;
        font-weight: bold;
        margin-top: ${appEnvironment === 'prod' ? '15px' : '10px'};
        display: inline-block;
        ${appEnvironment === 'prod' ? 'letter-spacing: 1px;' : ''}
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
      <div class="environment">${config.envDisplayName}</div>
      ${appEnvironment === 'prod' ? `
      <div class="features">
        ${config.features.map(feature => `<div class="feature">${feature}</div>`).join('')}
      </div>
      ` : ''}
    </div>
  </body>
  </html>
  `;
  res.send(html);
});

app.listen(port, () => {
  console.log(`GitOps demo app listening at http://localhost:${port}`);
});
