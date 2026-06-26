# Taro Billing Portal

Mobile-first web portal for the Taro app billing link flow.

## Run

```bash
npm start
```

Open:

```text
http://localhost:3000/payment?t=PORTAL_LINK_TOKEN
```

The site exchanges `t` for a short-lived portal token through:

```text
POST /api/billing/portal/exchange
```

The API base URL defaults to:

```text
http://localhost:5000
```

For local experiments, set it in the browser console:

```js
localStorage.setItem("taro.portal.apiBaseUrl", "http://localhost:5000");
```

## Docker Compose

The portal can be started from `Backend/docker-compose.yml`.

For phone testing on the same Wi-Fi network, set these values in
`Backend/.env` before running compose:

```text
BILLING_PORTAL_BASE_URL=http://YOUR_PC_LAN_IP:3000
BILLING_PORTAL_API_BASE_URL=http://YOUR_PC_LAN_IP:5000
YOOKASSA_RETURN_URL=http://YOUR_PC_LAN_IP:3000/payment-result
```
