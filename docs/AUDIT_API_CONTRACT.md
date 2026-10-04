# Audit API Integration Contract (Group 27)
**Assigned Owner:** Tope Dickson

## Endpoints

### 1. GET `/api/audit-logs`
Retrieves paginated audit log entries.

**Query Parameters:**
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `search` | string | Keyword search on message or entity |
| `action` | string | Filter by event action |
| `entity` | string | Filter by target resource |
| `page` | number | Page number (default: 1) |
| `limit` | number | Records per page (default: 10) |

### 2. GET `/api/audit-logs/:id`
Retrieves detailed information for a single audit record.