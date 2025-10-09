# Test Webhook Payload

## Original Issue
The webhook was receiving URL-encoded data like this:
```
data=%7B%22status%22%3A200%2C%22phone%22%3A%229876543210%22%2C%22order_id%22%3A%22TXN1760008898761YGHQR1ULNR5O%22%2C%22amount%22%3A%22100.00%22%2C%22time%22%3A%222025-10-09+11%3A23%3A35%22%7D
```

This decodes to:
```
data={"status":200,"phone":"9876543210","order_id":"TXN1760008898761YGHQR1ULNR5O","amount":"100.00","time":"2025-10-09 11:23:35"}
```

## Fixed Parsing
The webhook handler now:
1. Parses URL-encoded form data
2. Extracts the 'data' parameter
3. JSON parses the data string
4. Handles numeric status codes (200) and string values
5. Updates payment status and wallet accordingly

## Test with curl
```bash
curl -X POST http://localhost:3001/api/payment/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "data=%7B%22status%22%3A200%2C%22phone%22%3A%229876543210%22%2C%22order_id%22%3A%22TXN1760008898761YGHQR1ULNR5O%22%2C%22amount%22%3A%22100.00%22%2C%22time%22%3A%222025-10-09+11%3A23%3A35%22%7D"
```

## Payment Success Flow
1. User makes payment via Kukupay
2. Kukupay redirects to: `/home?payment_success=true&order_id=TXN1760008898761YGHQR1ULNR5O`
3. Home page detects URL parameters
4. Shows success toast notification with green styling
5. Webhook processes payment and updates wallet
6. URL parameters are cleaned up after notification