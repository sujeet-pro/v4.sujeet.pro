# Draft: Design an Email System

Building a scalable email service like Gmail.

## TLDR

- Email protocols handle sending and receiving separately
- Spam filtering is critical for usability
- Threading improves conversation organization

## Outline

1. Email sending: SMTP, email service providers
2. Email receiving: MX records, IMAP/POP
3. Spam filtering: rules, ML-based detection
4. Inbox scaling: sharding, indexing for search
5. Attachments: storage, virus scanning
6. Threading: conversation grouping
7. Deliverability: SPF, DKIM, DMARC
