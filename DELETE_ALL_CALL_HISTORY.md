# Delete All Call History Feature

## Overview
Added functionality to delete all call history records from the database with a single click.

## Backend Changes

### 1. Controller Functions (`backend/controllers/report_controller.js`)

#### Delete All Calls
```javascript
exports.deleteAllCalls = async (req, res) => {
    try {
        const result = await CallLog.deleteMany({});
        console.log(`🗑️ Deleted ${result.deletedCount} call logs`);
        res.json({ 
            success: true, 
            message: `Successfully deleted ${result.deletedCount} call logs`,
            deletedCount: result.deletedCount 
        });
    } catch (err) {
        console.error('❌ Error deleting call logs:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};
```

#### Delete Calls by Filter (Bonus Feature)
```javascript
exports.deleteCallsByFilter = async (req, res) => {
    try {
        const { from, to, status } = req.query;
        const query = {};
        
        if (from || to) {
            query.startTime = {};
            if (from) query.startTime.$gte = new Date(from);
            if (to) query.startTime.$lte = new Date(to);
        }
        if (status) {
            query.status = status;
        }
        
        // Require filters to prevent accidental deletion
        if (Object.keys(query).length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Please provide filters or use DELETE /calls/all endpoint' 
            });
        }
        
        const result = await CallLog.deleteMany(query);
        res.json({ 
            success: true, 
            message: `Successfully deleted ${result.deletedCount} call logs`,
            deletedCount: result.deletedCount,
            filters: query
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
```

### 2. Routes (`backend/routes/report.js`)

```javascript
// DELETE /report/calls/all - Delete all call logs
router.delete('/calls/all', reportController.deleteAllCalls);

// DELETE /report/calls - Delete call logs by filter (date range or status)
router.delete('/calls', reportController.deleteCallsByFilter);
```

## Frontend Changes

### 1. Delete All Handler (`client/src/pages/CallHistory.tsx`)

```typescript
const handleDeleteAll = async () => {
    if (!window.confirm('⚠️ Are you sure you want to delete ALL call history? This action cannot be undone!')) {
        return;
    }
    
    setDeleting(true);
    setError('');
    
    try {
        const response = await axios.delete(`${baseUrl}/api/report/calls/all`);
        if (response.data.success) {
            console.log(`✅ Deleted ${response.data.deletedCount} call logs`);
            setItems([]);
            setTotal(0);
            setPage(1);
            alert(`Successfully deleted ${response.data.deletedCount} call logs`);
        }
    } catch (err: any) {
        console.error('❌ Error deleting call logs:', err);
        setError(err.response?.data?.error || 'Failed to delete call logs');
    } finally {
        setDeleting(false);
    }
};
```

### 2. UI Button

Added "Delete All" button in the header section:

```tsx
<button 
    onClick={handleDeleteAll}
    disabled={deleting || total === 0}
    style={{ 
        padding: '8px 16px', 
        cursor: (deleting || total === 0) ? 'not-allowed' : 'pointer', 
        border: '1px solid #dc3545', 
        borderRadius: '4px', 
        backgroundColor: '#dc3545', 
        color: 'white', 
        opacity: (deleting || total === 0) ? 0.6 : 1 
    }}
    title={total === 0 ? 'No calls to delete' : 'Delete all call history'}
>
    <Trash2 style={{ display: 'inline', marginRight: '5px', width: '16px', height: '16px' }} />
    {deleting ? 'Deleting...' : `Delete All (${total})`}
</button>
```

## Features

### Delete All
- **Endpoint**: `DELETE /api/report/calls/all`
- **Action**: Deletes all call logs from the database
- **Confirmation**: Requires user confirmation before deletion
- **Feedback**: Shows count of deleted records
- **Safety**: Button disabled when no calls exist or deletion in progress

### Delete by Filter (Bonus)
- **Endpoint**: `DELETE /api/report/calls?from=YYYY-MM-DD&to=YYYY-MM-DD&status=answered`
- **Action**: Deletes call logs matching the filters
- **Filters**: 
  - `from`: Start date (YYYY-MM-DD)
  - `to`: End date (YYYY-MM-DD)
  - `status`: Call status (answered, missed, etc.)
- **Safety**: Requires at least one filter to prevent accidental deletion

## API Examples

### Delete All Calls
```bash
curl -X DELETE http://localhost:4000/api/report/calls/all
```

Response:
```json
{
  "success": true,
  "message": "Successfully deleted 1234 call logs",
  "deletedCount": 1234
}
```

### Delete Calls by Date Range
```bash
curl -X DELETE "http://localhost:4000/api/report/calls?from=2025-01-01&to=2025-01-31"
```

Response:
```json
{
  "success": true,
  "message": "Successfully deleted 456 call logs",
  "deletedCount": 456,
  "filters": {
    "startTime": {
      "$gte": "2025-01-01T00:00:00.000Z",
      "$lte": "2025-01-31T23:59:59.999Z"
    }
  }
}
```

### Delete Missed Calls Only
```bash
curl -X DELETE "http://localhost:4000/api/report/calls?status=missed"
```

Response:
```json
{
  "success": true,
  "message": "Successfully deleted 78 call logs",
  "deletedCount": 78,
  "filters": {
    "status": "missed"
  }
}
```

## Safety Features

1. **Confirmation Dialog**: User must confirm before deletion
2. **Disabled State**: Button disabled when no calls exist
3. **Loading State**: Shows "Deleting..." during operation
4. **Error Handling**: Displays error messages if deletion fails
5. **Success Feedback**: Shows count of deleted records
6. **Filter Requirement**: Filtered deletion requires at least one filter

## UI States

| State | Button Text | Enabled | Opacity |
|-------|-------------|---------|---------|
| Normal | Delete All (123) | ✅ Yes | 100% |
| No Calls | Delete All (0) | ❌ No | 60% |
| Deleting | Deleting... | ❌ No | 60% |

## Testing Checklist

- [ ] Click "Delete All" button
- [ ] Confirm deletion in dialog
- [ ] Verify all calls are deleted from database
- [ ] Verify UI updates (shows 0 calls)
- [ ] Verify success message displays
- [ ] Test with no calls (button should be disabled)
- [ ] Test canceling the confirmation dialog
- [ ] Test error handling (disconnect backend)
- [ ] Test filtered deletion by date range
- [ ] Test filtered deletion by status

## Security Considerations

⚠️ **Important**: This endpoint permanently deletes data!

Consider adding:
1. **Authentication**: Require admin role
2. **Rate Limiting**: Prevent abuse
3. **Audit Log**: Track who deleted what and when
4. **Soft Delete**: Mark as deleted instead of permanent deletion
5. **Backup**: Automatic backup before deletion

## Future Enhancements

1. **Soft Delete**: Add `deleted` flag instead of permanent deletion
2. **Restore**: Allow restoring deleted calls within 30 days
3. **Scheduled Cleanup**: Auto-delete calls older than X days
4. **Export Before Delete**: Automatically export to CSV before deletion
5. **Granular Permissions**: Different delete permissions for different users
6. **Batch Operations**: Delete in batches to avoid timeout on large datasets
