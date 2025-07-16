# Troubleshooting Chat System

## 403 Error when Creating Conversations

### Possible Causes:

1. **Database Migration Not Applied**
   - Execute the SQL migration in your Supabase SQL editor
   - Check if the `conversations` and `messages` tables exist

2. **RLS Policies Issue**
   - Verify that Row Level Security is enabled
   - Check that the policies allow INSERT operations

3. **User Authentication Issue**
   - Ensure the user is properly authenticated
   - Check that `auth.uid()` returns the correct user ID

4. **Database Schema Mismatch**
   - Verify that `user_id` in conversations table references the correct user table
   - Ensure the user exists in the `public.users` table

### Debugging Steps:

1. **Check Browser Console**
   - Look for detailed error messages with error codes
   - Check if the user ID is being logged correctly

2. **Verify Database Schema**
   ```sql
   -- Check if tables exist
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('conversations', 'messages');

   -- Check RLS policies
   SELECT * FROM pg_policies 
   WHERE tablename IN ('conversations', 'messages');
   ```

3. **Test User Creation**
   ```sql
   -- Test if you can insert a conversation manually
   INSERT INTO public.conversations (user_id, title) 
   VALUES ((SELECT auth.uid()), 'Test Conversation');
   ```

### Environment Variables Required:

Make sure you have these in your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```