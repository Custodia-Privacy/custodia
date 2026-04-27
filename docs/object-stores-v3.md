# Object stores & unstructured data (Data Inventory v3)

Scaffold object-store keys: `s3`, `gcs`, `azure_blob` (see connectors-v2 registry).

## Scope (v3)

- **Listing:** bucket inventory, prefix walks, version-id aware deletes where required.  
- **Extraction:** PDF, DOCX, XLSX, TXT, EML, HTML → text pipeline → PII engine.  
- **Lifecycle:** optional native retention (S3 Lifecycle, GCS Object Lifecycle) as enforcement path when legal holds allow.  
- **Shares:** SMB/NFS gateway or vendor connectors (Google Drive, SharePoint) as separate high-friction integrations.

## Security

- Customer-managed keys (CMK) and per-tenant IAM role assumption.  
- No object payload egress to third-party inference APIs; PII engine stays in-cluster.
