![Screenshot 2025-06-10 140516](https://github.com/user-attachments/assets/5afe7b50-6464-455d-ac17-2f5b83702ab0)
![Screenshot 2025-06-10 140501](https://github.com/user-attachments/assets/68cef23b-0df1-4712-8340-9da2a21e7560)
![Screenshot 2025-06-10 140450](https://github.com/user-attachments/assets/5027cf30-50eb-4a66-a348-802ccd1585d6)
![Screenshot 2025-06-10 140433](https://github.com/user-attachments/assets/29c0ba7a-5d34-4056-afb6-18cf05196a8e)
Metro Ticketing System with Fingerprint Authentication
A model metro payment system using fingerprint verification and a web-based admin portal.

Hardware: ESP32 with AS608 fingerprint sensor, servo gate control.

Backend: Node.js (Express) with MongoDB.

Frontend: Responsive web app for admin functions.

Key Features:

Users register fingerprints; system assigns unique IDs.

Users scan fingerprint at source station and again at destination station — fare is dynamically calculated and balance is deducted.

Same source/destination scan prevention logic to avoid double charges.

Admin can:

Register users

Add balance to user accounts

View trip history

Add stations and fare mappings

Real-time communication between hardware and backend via API polling.

Demo version uses 1 fingerprint sensor with manual station selection on web frontend.
