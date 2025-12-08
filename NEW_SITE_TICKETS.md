# New Site Tickets Feature

## Overview
Added support for "New Site" ticket type with additional fields and file uploads. Also added image attachments (up to 5) for regular tickets.

## Database Changes Required

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Add New Site to ticket type constraint
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_ticket_type_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_ticket_type_check 
  CHECK (ticket_type IN ('Hardware', 'Software', 'New Site'));

-- Add new columns for New Site tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS site_name TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS installers TEXT[] DEFAULT '{}';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS site_files JSONB DEFAULT '[]';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS dependencies TEXT[] DEFAULT '{}';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS target_date DATE;

-- Add attachments column for regular tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
```

## Storage Bucket Setup

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `tickets`
3. Set it to **Public** (for file access)
4. Add storage policies to allow authenticated users to upload:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Users can upload ticket files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tickets');

-- Allow authenticated users to read ticket files
CREATE POLICY "Users can read ticket files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'tickets');
```

## New Site Ticket Fields

### Required Fields:
- **Client** (dropdown - same as regular tickets)
- **Site Name** (text field)
- **Issue Description** (textarea)

### Optional Fields:
- **Installers** (multiple text entries - can add more than one)
- **Dependencies** (multiple text entries - can add more than one)
- **Target Date** (date picker)
- **Site Files** (files/images with labels):
  - Site Information
  - BOM
  - Site Images
  - Hardware Delivery Notes
  - etc.

## Regular Ticket Attachments

- Regular tickets (Hardware/Software) can now have up to **5 image attachments**
- Images are displayed in a grid on the ticket view
- Click to view full size

## Time Tracking

New Site tickets track time automatically just like regular tickets:
- Time starts when ticket is created
- Time is logged automatically on each update
- Both admin and members can see the time tracking

## Implementation Details

### Files Modified:
1. `app/lib/supabase.ts` - Added file upload functions and updated Ticket interface
2. `app/dashboard/page.tsx` - Added New Site form and file uploads
3. `app/admin/page.tsx` - Added New Site form and file uploads
4. `supabase-schema.sql` - Updated schema with new fields

### Key Functions:
- `uploadTicketAttachment()` - Uploads files to Supabase storage
- `updateTicket()` - Updates ticket with file URLs after upload
- Form validation ensures required fields are filled based on ticket type

## Usage

### Creating a New Site Ticket:
1. Click "Open New Ticket"
2. Select "New Site" from the Type dropdown
3. Fill in required fields (Client, Site Name, Issue)
4. Optionally add installers, dependencies, target date
5. Upload site files with labels
6. Submit

### Creating a Regular Ticket with Images:
1. Click "Open New Ticket"
2. Select "Hardware" or "Software"
3. Fill in all required fields
4. Upload up to 5 images in the Attachments section
5. Submit

## Display

Tickets now show:
- **New Site tickets**: Site name, installers, dependencies, target date, and site files
- **Regular tickets**: Attachments displayed as image thumbnails (click to view full size)

All fields are displayed in color-coded sections for easy identification.
