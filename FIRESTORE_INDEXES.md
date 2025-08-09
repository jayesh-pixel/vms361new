# Firestore Indexes Required

The ship management system requires specific Firestore composite indexes to function properly. When you encounter index errors, follow these steps:

## Current Required Indexes

### 1. Ships Collection Index
**Error**: The query requires an index for ships collection with companyId and name fields.

**Solution**: Visit the Firebase Console and create a composite index with these fields:
- Collection: `ships`
- Fields to index:
  1. `companyId` (Ascending)
  2. `name` (Ascending)
  3. `__name__` (Ascending) - automatically added

**Firebase Console Link**: 
```
https://console.firebase.google.com/v1/r/project/vms361-codex1/firestore/indexes?create_composite=Cktwcm9qZWN0cy92bXMzNjEtY29kZXgxL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9zaGlwcy9pbmRleGVzL18QARoNCgljb21wYW55SWQQARoICgRuYW1lEAEaDAoIX19uYW1lX18QAQ
```

## How to Create Indexes

### Method 1: Using Firebase Console (Recommended)
1. Click the provided link above
2. Review the index configuration
3. Click "Create Index"
4. Wait for the index to build (usually takes a few minutes)

### Method 2: Manual Creation
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `vms361-codex1`
3. Navigate to Firestore Database
4. Go to "Indexes" tab
5. Click "Create Index"
6. Configure:
   - Collection ID: `ships`
   - Add fields:
     - Field: `companyId`, Order: Ascending
     - Field: `name`, Order: Ascending

### Method 3: Using Firebase CLI (Advanced)
Create a `firestore.indexes.json` file in your project root:

```json
{
  "indexes": [
    {
      "collectionGroup": "ships",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "companyId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "name",
          "order": "ASCENDING"
        }
      ]
    }
  ]
}
```

Then deploy: `firebase deploy --only firestore:indexes`

## Additional Indexes You May Need

As you use more features, you might need these indexes:

### Ships by Status and Company
```
Collection: ships
Fields: companyId (Ascending), status (Ascending), name (Ascending)
```

### Ships by Type and Company  
```
Collection: ships
Fields: companyId (Ascending), type (Ascending), name (Ascending)
```

### Crew Members by Ship
```
Collection: ships/{shipId}/crew
Fields: rank (Ascending), name (Ascending)
```

### Tasks by Ship and Status
```
Collection: ships/{shipId}/tasks
Fields: status (Ascending), dueDate (Ascending)
```

### Requisitions by Ship and Status
```
Collection: ships/{shipId}/requisitions  
Fields: status (Ascending), requiredDate (Ascending)
```

## Troubleshooting

1. **Index Building Time**: Indexes can take several minutes to build, especially with existing data
2. **Query Errors**: If you get new index errors, the Firebase Console will provide direct links to create them
3. **Development vs Production**: Make sure to create indexes in both environments if you have separate projects

## Testing After Index Creation

After creating the index:
1. Wait for the status to show "Enabled" in Firebase Console
2. Refresh your application
3. Try creating a ship or loading the ships page
4. The error should be resolved

## Notes

- Indexes are required for compound queries (filtering/sorting by multiple fields)
- Single-field queries usually don't need custom indexes
- Array and map field queries may need special index configurations
- Monitor your index usage in Firebase Console to optimize performance
