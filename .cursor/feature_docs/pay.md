This, Zalongwa SARIS Payment Gateway (SPG), is a Laravel application
that acts as a payment gateway/billing system for a
school/institution system to the NMB.
ENDPOINTS:
BASE_URL=https://xyz.spg.co.tz/ "client_usr": "user@zalongwa.com",
"client_key": "MzingawaPassword"
Route | Purpose
POST api/v1/login API token generation
Live endpoints (post data to Invoices and Transactions tables)
POST api/v1/generatectlno Generate a control number payment
reference
POST api/v1/verification Verify a control number payment
reference
POST api/v1/payment Post payment information
POST api/v1/getpayment View payment information of a control
number
Test endpoints (post data to demo-invoices and demo-transactions tables)
POST api/v1/generatedemoctlno Generate demo payment reference
POST api/v1/demoverification Verify demo controlno
POST api/v1/demopayment Postdemo payment
POST api/v1/getdemopayment View demo payment
Page 1 of 7
1.0 CREATE a CONTROL NUMBER:
BASE_URL="https://xyz.spg.co.tz"
TOKEN=$(curl -s -X POST "$BASE_URL/api/v1/login" \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
"client_usr": "usremail",
"client_key": "Password"
}' | jq -r '.token')
curl -i -X POST "$BASE_URL/api/v1/generatectlno" \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d '{
"systemName": "REMIS",
"systemCode": "SP1001",
"payerID": "CUST101",
"firstName": "Khadija",
"lastName": "Omary",
"email": "djao@gmail.com",
"payerMobile": "255754002200",
"currency": "TZS",
"amount": 40000,
"amountType": "EXACT",
"paymentType": "RENT",
"paymentDesc": "RENT fee payment"
}'
2.0 RESPONSE
{
"std_reg_number": "CUST101",
"reference_number": "777138535002",
"status": "Success"
}
Page 2 of 7
3.0 VERIFY THE CONTROL NUMBER
BASE_URL="https://xyz.spg.co.tz"
TOKEN=$(curl -s -X POST "$BASE_URL/api/v1/login" \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
"client_usr": "usremail",
"client_key": "Password"
}' | jq -r '.token')
curl -X POST "$BASE_URL/api/v1/verification \
-H "Content-Type: application/json" \
-H "Accept: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d '{
"body": {
"paymentReference": "777138535002",
"transactionId": "anytext"
},
“reservedFields”:[
{
"fieldName": "myFieldName1",
"fieldValue": "myFieldValue1"
},
{
"fieldName": "myFieldName2",
"fieldValue": "myFieldValue2"
}
]
}'
4.0 RESPONSE
{
"statusCode": 600,
"message": "SUCCESS",
"body": {
"paymentReference": "777138535002",
"billAmount": "40000",
"billCurrency": "TZS",
"paymentOption": "FULL",
"paymentPlan": "1",
"minAmountToPay": "40000",
"billDescription": "RENT fee payment",
"billAccountCode": "11931698245176",
"accountNumber": "11931698245176",
"billProductCode": "001",
"productCode": "RENT",
"customerName": "Khadija Omary",
"billOwner": {
"name": "Khadija Omary",
"mobileNumber": "255754002200",
"emailAddress": "djao@gmail.com"
},
Page 3 of 7
"billExpirationDate": "05/31/2028 10:35:44 PM",
"billStatus": {
"Code": "103",
"Description": "active"
}
}
}
Page 4 of 7
5.0 BILL PAYMENT NOTIFICATION
BASE_URL="https://xyz.spg.co.tz"
TOKEN=$(curl -s -X POST "$BASE_URL/api/v1/login" \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
"client_usr": "usremail",
"client_key": "Password"
}' | jq -r '.token')
PAYMENT_REFERENCE="777138535002"
TRANSACTION_ID="GWX9876738"
BANK_REFERENCE="NMB123467587"
CHANNEL_ID="INTERNET BANKING"
PAYERNAME="Khadija Omary"
PAYERMOBILE="255787088798"
EFFECTIVE_DATE="2026-05-31 12:30:00",
AMOUNT=60000
curl -i -X POST "$BASE_URL/api/v1/payment" \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d "{
\"requestDetails\": {
\"channelId\": \"$CHANNEL_ID\",
\"transactionId\": \"$TRANSACTION_ID\",
\"paymentReference\": \"$PAYMENT_REFERENCE\",
\"amount\": \"$AMOUNT\",
\"bankReference\": \"$BANK_REFERENCE\",
\"payerDetails\": {
\"name\": \"$PAYERNAME\",
\"mobileNumber\": \"$PAYERMOBILE\"
},
\"effectiveDate\": \"$EFFECTIVE_DATE\"
}
}"
6.0 RESPONSE
{
"body": {
"transactionId": "GWX9876738",
"receiptNumber": "3VD7CSI",
"paymentReference": "777138535002",
"barcode": "Nzc3MTM4NTM1MDAyfDNWRDdDU0k="
},
"message": "SUCCESS",
"statusCode": 600
}
Page 5 of 7
7.0 View Payment Info for a Given Payment Reference
BASE_URL="https://xyz.spg.co.tz"
TOKEN=$(curl -s -X POST "$BASE_URL/api/v1/login" \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-d '{
"client_usr": "usremail",
"client_key": "Password"
}' | jq -r '.token')
PAYMENT_REFERENCE="777365615105"
curl -i -X POST "$BASE_URL/api/v1/getpayment" \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d "{
\"paymentReference\": \"$PAYMENT_REFERENCE\"
}"
8.0 Response
{
"statusCode": 600,
"statusDesc": "SUCCESS",
"data": {
"paymentReference": "777365615105",
"paid": false,
"invoice": {
"id": 9,
"regNumber": "MUM-2026-000123",
"amount": 50000,
"paidAmount": 60000,
"balance": -10000,
"currency": "TZS",
"amountType": "FIXED",
"paymentType": "TUITION",
"paymentDesc": "Tuition fee payment",
"institutionID": "11931698245176",
"status": "pending",
"createdAt": "2026-05-31T21:09:22.000000Z",
"updatedAt": "2026-05-31T22:18:25.000000Z"
},
"summary": {
"transactionCount": 1,
"transactionAmountTotal": 60000
},
"transactions": [
{
"id": 6,
"invoice_id": 9,
Page 6 of 7
"payerName": "Khadija Omary",
"amount": "60000",
"amountType": "FIXED",
"currency": "TZS",
"paymentReference": "777365615105",
"paymentType": "INTERNET BANKING",
"payerMobile": "255787088798",
"paymentDesc": "Tuition fee payment",
"payerID": "MUM-2026-000123",
"transactionRef": "GWX9876738",
"transactionChannel": "INTERNET BANKING",
"transactionDate": "2026-05-31 12:30:00",
"institutionID": "11931698245176",
"receipt": "IMV01RT",
"status": "0",
"created_at": "2026-05-31T22:18:25.000000Z",
"updated_at": "2026-05-31T22:18:25.000000Z"
}
}
}
]
Page 7 of 7