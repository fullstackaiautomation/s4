/**
 * Google Ads API - OAuth Refresh Token Generator
 * Run this script to generate a refresh token for Google Ads API access
 */

const http = require('http');
const { URL } = require('url');

const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_GOOGLE_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';
const SCOPES = 'https://www.googleapis.com/auth/adwords';

console.log('\n🔐 Google Ads OAuth Refresh Token Generator\n');
console.log('Follow these steps:\n');

// Step 1: Generate authorization URL
const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', SCOPES);
authUrl.searchParams.set('access_type', 'offline');
authUrl.searchParams.set('prompt', 'consent');

console.log('1. Open this URL in your browser:\n');
console.log(authUrl.toString());
console.log('\n2. Sign in with your Google Ads account');
console.log('3. Grant permissions');
console.log('4. You will be redirected to localhost:3000 (this script will handle it)\n');
console.log('Starting local server on port 3000...\n');

// Step 2: Start local server to receive OAuth callback
const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://localhost:3000`);

  if (reqUrl.pathname === '/oauth2callback') {
    const code = reqUrl.searchParams.get('code');

    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end('<h1>Error: No authorization code received</h1>');
      return;
    }

    console.log('✅ Authorization code received!');
    console.log('🔄 Exchanging for refresh token...\n');

    // Step 3: Exchange authorization code for refresh token
    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code: code,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await tokenResponse.json();

      if (tokens.error) {
        throw new Error(tokens.error_description || tokens.error);
      }

      console.log('✅ SUCCESS! Tokens received:\n');
      console.log('📋 REFRESH TOKEN (save this):');
      console.log('━'.repeat(60));
      console.log(tokens.refresh_token);
      console.log('━'.repeat(60));
      console.log('\n📋 Access Token (temporary):');
      console.log(tokens.access_token);
      console.log('\n⏰ Expires in:', tokens.expires_in, 'seconds\n');

      // Success response to browser
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <head><title>Success!</title></head>
          <body style="font-family: Arial; padding: 50px; text-align: center;">
            <h1 style="color: green;">✅ Authorization Successful!</h1>
            <p>Your refresh token has been generated.</p>
            <p>Check your terminal/console for the token.</p>
            <p>You can close this window now.</p>
          </body>
        </html>
      `);

      console.log('\n📝 Next steps:');
      console.log('1. Copy the refresh token above');
      console.log('2. Update your claude_desktop_config.json file');
      console.log('3. Replace "PLACEHOLDER_NEED_TO_GENERATE" with your refresh token');
      console.log('4. Restart Claude Desktop\n');

      // Close server after a delay
      setTimeout(() => {
        console.log('Closing server...');
        server.close();
        process.exit(0);
      }, 2000);

    } catch (error) {
      console.error('❌ Error exchanging code for token:', error.message);
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`<h1>Error: ${error.message}</h1>`);
      server.close();
      process.exit(1);
    }
  }
});

server.listen(3000, () => {
  console.log('✅ Server ready! Waiting for OAuth callback...\n');
  console.log('👆 Click or copy the authorization URL above to continue.\n');
});

// Handle errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('\n❌ Error: Port 3000 is already in use.');
    console.error('Please close any application using port 3000 and try again.\n');
  } else {
    console.error('\n❌ Server error:', err.message);
  }
  process.exit(1);
});
