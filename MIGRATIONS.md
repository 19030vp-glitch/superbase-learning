# Database Migrations

To enable the message reply feature, you must apply the following SQL migration to your Supabase database.

## 1. Add `reply_to` column to `messages`

This command adds the necessary column to track which message is being replied to.

```sql
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES messages(id) ON DELETE SET NULL;
```

You can run this command in the **SQL Editor** of your Supabase dashboard.
