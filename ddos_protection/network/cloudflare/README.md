# Cloudflare Integration for DDoS Protection System
# نظام تكامل Cloudflare لحماية DDoS

This module provides bidirectional integration between the local DDoS Protection System and Cloudflare, allowing for enhanced protection at the edge.

## Features

- **Bidirectional Ban Synchronization**: When the local system bans an IP, it's also banned on Cloudflare and vice versa
- **Webhook Support**: Receives notifications from Cloudflare for firewall events
- **Periodic Synchronization**: Regularly syncs banned IPs between systems
- **API Interface**: Provides a RESTful API for managing Cloudflare firewall rules
- **Authentication**: Secures API endpoints with token-based authentication

## Setup

1. Obtain the necessary Cloudflare API credentials:
   - Email address associated with your Cloudflare account
   - API key (Global API Key from your profile)
   - Zone ID (found in the Cloudflare dashboard for your domain)
   - Create a webhook secret for receiving webhook notifications

2. Add these credentials to your environment variables in `clyne.env`:
   ```
   CLOUDFLARE_EMAIL=your-email@example.com
   CLOUDFLARE_API_KEY=your-global-api-key
   CLOUDFLARE_ZONE_ID=your-zone-id
   CLOUDFLARE_WEBHOOK_SECRET=random-secure-string
   CF_API_AUTH_KEY=random-secure-string-for-api-auth
   ```

3. Set up a webhook in your Cloudflare account:
   - Go to Cloudflare Dashboard → Notifications → Create Notification
   - Select "Firewall Events" as the notification type
   - Set the webhook URL to `https://your-domain.com/cloudflare/webhook`
   - Set the webhook secret to the same value as `CLOUDFLARE_WEBHOOK_SECRET`

## API Endpoints

All API endpoints require authentication with the `CF_API_AUTH_KEY` value as a Bearer token.

### Status Check
```
GET /cloudflare/status
Authorization: Bearer <CF_API_AUTH_KEY>
```

### Get Blocked IPs
```
GET /cloudflare/blocked-ips
Authorization: Bearer <CF_API_AUTH_KEY>
```

### Block IP
```
POST /cloudflare/block-ip
Authorization: Bearer <CF_API_AUTH_KEY>
Content-Type: application/json

{
  "ip": "192.0.2.1",
  "reason": "Manual block",
  "duration": 86400
}
```

### Unblock IP
```
DELETE /cloudflare/unblock-ip/<ip>
Authorization: Bearer <CF_API_AUTH_KEY>
```

### Trigger Sync
```
POST /cloudflare/sync
Authorization: Bearer <CF_API_AUTH_KEY>
```

### Get Analytics
```
GET /cloudflare/analytics?since=-1440&until=0
Authorization: Bearer <CF_API_AUTH_KEY>
```

## Recommended Cloudflare Worker Script

For enhanced protection, you can deploy this Cloudflare Worker script that works with the integration:

```js
// Cloudflare Worker script to enhance DDoS protection
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Check if the IP is in our blocked list
  const ip = request.headers.get('cf-connecting-ip')
  const userAgent = request.headers.get('user-agent') || ''
  
  // Check for common attack patterns in the request
  const url = new URL(request.url)
  const path = url.pathname.toLowerCase()
  
  // Skip checks for static assets to improve performance
  if (path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    return fetch(request)
  }
  
  // Block suspicious traffic patterns
  if (isHighRiskRequest(request, path, userAgent)) {
    return new Response('Access denied', { status: 403 })
  }
  
  // Forward the request to origin
  return fetch(request)
}

function isHighRiskRequest(request, path, userAgent) {
  // Add your custom detection logic here
  const method = request.method
  
  // Check for suspicious methods on sensitive paths
  if ((method === 'POST' || method === 'PUT') && 
      (path.includes('/wp-') || path.includes('/admin') || path.includes('.php'))) {
    return true
  }
  
  // Check for missing User-Agent or suspicious ones
  if (!userAgent || userAgent.includes('zgrab') || userAgent.includes('masscan')) {
    return true
  }
  
  return false
}
```

## Troubleshooting

- Check the logs for any initialization errors
- Verify your API credentials are correct
- Ensure your webhook URL is publicly accessible
- Confirm the webhook secret matches between Cloudflare and your configuration

## Security Considerations

- Keep your API key and webhook secret secure
- Use HTTPS for all API communication
- Rotate the `CF_API_AUTH_KEY` regularly
- Monitor logs for any unusual activity 