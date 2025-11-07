# Support Ticket System - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [User Screens](#user-screens)
3. [Admin Screens](#admin-screens)
4. [Authentication](#authentication)
5. [AI Features](#ai-features)
6. [Technical Architecture](#technical-architecture)
7. [User Workflows](#user-workflows)

---

## Overview

The Support Ticket System is an AI-powered customer support platform that enables users to submit support tickets and receive instant AI-generated responses. The system features intelligent ticket categorization, priority assignment, and comprehensive ticket management capabilities.

### Key Features
- **Instant AI Categorization**: Tickets are automatically categorized using rule-based logic and enhanced with AI
- **Dual-Stage Processing**: Rule-based instant categorization followed by AI enhancement
- **File Attachments**: Users can attach files (images, PDFs, documents) to tickets
- **Follow-up System**: Users can add additional information to existing tickets
- **Admin Dashboard**: Comprehensive analytics and ticket management interface
- **Role-Based Access**: Separate interfaces for users and administrators

---

## User Screens

### 1. User Dashboard (Support Portal)
**Route:** `/`  
**Access:** Public (anonymous and authenticated users)

#### Screen Elements

**Header Section:**
- **Title**: "Support Portal"
- **Sign Out Button**: Visible only for authenticated users (top-right)

**Create New Support Ticket Form:**
- **Subject Field**: Brief description of the issue (max 200 characters)
- **Description Field**: Detailed explanation of the problem (max 2000 characters, multiline)
- **Your Name Field**: Customer name (max 100 characters)
- **Your Email Field**: Customer email address (validated format)
- **Create Ticket Button**: Submits the form and initiates AI processing

**Tip Banner** (for logged-in users):
- Informational message: "💡 Tip: After submitting, you'll be able to view your tickets and add more information below!"

#### Features

**Instant Categorization:**
- Rule-based keyword matching categorizes tickets immediately
- Categories: Login issues, Account Access, Technical, Feedback
- Priority levels: High, Medium, Low
- SLA assignment: 1 day (high), 2 days (medium), 3 days (low)

**AI Enhancement:**
- After initial categorization, AI refines the classification
- Generates personalized response for the customer
- Shows animated loading modal during AI processing

**AI Response Display** (after submission):
- Category badge (color-coded)
- Priority badge (High/Medium/Low)
- SLA timeline badge
- Full AI-generated suggested response
- Informational note about support team follow-up

#### My Tickets Section
**Visibility:** Only for authenticated users  
**Location:** Below the ticket creation form

**Ticket Cards Display:**
- Grid layout (2 columns on desktop)
- Each card shows:
  - Ticket subject (truncated to 2 lines)
  - Status badge (Open/Closed/Pending)
  - Category badge (color-coded)
  - Priority badge (color-coded)
  - SLA timeline
  - Brief description preview
  - AI response preview (3 lines)
  - Number of updates
  - Creation timestamp

**Expandable Ticket Details:**
- Click "Show More" to expand
- Full description
- Complete AI response
- All update messages with timestamps
- Attached files with download links
- "Add More Information" button

#### Add More Information Dialog
**Trigger:** Click "Add More Information" button on any ticket

**Dialog Elements:**
- **Title**: "Add More Information"
- **Description**: "Provide additional details or attach files to help us resolve your issue faster"
- **Message Field**: Textarea for additional details (max 2000 characters, with character counter)
- **File Upload**:
  - Drag-and-drop or click to select
  - Supported formats: Images (JPG, PNG, GIF, WEBP), PDF, Word documents
  - Maximum file size: 20MB
  - Shows file preview with size when selected
  - Remove button to clear selection
- **Action Buttons**:
  - Cancel (closes dialog)
  - Submit Update (submits information and refreshes ticket)

**File Handling:**
- Files uploaded to secure storage bucket
- Only ticket owner can view their attachments
- Admins can view all attachments

---

### 2. Authentication Screen
**Route:** `/auth`  
**Access:** Public

#### Login Mode

**Form Fields:**
- **Email**: Email address input with validation
- **Password**: Password input (masked)
- **Login Button**: Submits credentials

**Toggle Link:**
- "Don't have an account? Sign up" - switches to sign-up mode

#### Sign Up Mode

**Form Fields:**
- **Full Name**: User's display name
- **Email**: Email address with format validation
- **Password**: Minimum security requirements
- **Sign Up Button**: Creates new account

**Toggle Link:**
- "Already have an account? Login" - switches to login mode

**Auto-Confirmation:**
- Email verification is automatically enabled
- Users can log in immediately after sign-up

**Role Assignment:**
- Regular users get "user" role automatically
- Admin emails (configured in database) get "admin" role
- Admins: admin@admin.com, varunsaluja07@gmail.com

---

## Admin Screens

### 3. Admin Dashboard
**Route:** `/admin`  
**Access:** Authenticated admin users only

#### Header Section
- **Title**: "Admin Dashboard"
- **Sign Out Button**: Logs out and redirects to auth page

#### Action Bar
**Quick Actions:**
1. **Refresh Button**: Reloads all tickets from database
2. **Quick Categorize**: Rule-based bulk categorization (instant, no AI)
3. **Categorize with AI**: AI-powered categorization for open uncategorized tickets
4. **Suggest AI Responses**: Generates personalized responses for all open tickets
5. **Export All JSON**: Downloads all tickets as JSON file
6. **Export All CSV**: Downloads all tickets as CSV file

#### Analytics Overview Section

**Key Metrics Cards:**

1. **Total Tickets**
   - Large number display
   - Total count of all tickets

2. **Categorized Tickets**
   - Count of categorized tickets
   - Percentage of total
   - Color: Green (success indicator)

3. **High Priority**
   - Count of high-priority tickets
   - Color: Red (urgent indicator)

4. **Open Tickets**
   - Count of open tickets
   - Color: Blue
   - "Categorize with AI" quick action button

**Analytics Charts:**

1. **By Category**
   - Horizontal bar chart
   - Shows distribution across categories:
     - Login issues
     - Account Access
     - Technical
     - Feedback
     - Uncategorized
   - Bar length represents percentage
   - Count displayed on right

2. **By Priority**
   - Horizontal bar chart with icons
   - High (🔴 red), Medium (🟡 yellow), Low (🟢 green)
   - Visual priority indicators
   - Count and percentage display

3. **By Status**
   - Horizontal bar chart
   - Open, Closed, Pending status
   - Count and percentage display

#### All Tickets Section

**Display Format:**
- Grid layout (3 columns on desktop)
- Animated card entrance (fade-in)
- Hover effect with shadow

**Ticket Card Components:**

**Header:**
- Subject (2-line truncation)
- Status badge

**Metadata Badges:**
- Category (color-coded by type)
- Priority (High/Medium/Low)
- SLA timeline with clock icon

**Customer Information:**
- Customer name
- Customer email

**Ticket Description:**
- Preview (3 lines max)
- Expandable to full text

**AI Response Section** (if available):
- Highlighted card with primary color accent
- Full AI-generated response
- Separated from ticket details

**Action Buttons:**
1. **Categorize with AI** (if not categorized)
   - Triggers individual ticket AI processing
   - Updates ticket in real-time

2. **Export JSON**
   - Downloads single ticket as JSON file
   - Filename: `ticket-[id]-[timestamp].json`

3. **Export CSV**
   - Downloads single ticket as CSV file
   - Filename: `ticket-[id]-[timestamp].csv`

**Timestamp:**
- Creation date and time
- Format: MM/DD/YYYY, HH:MM AM/PM

---

## AI Features

### Dual-Stage Categorization System

#### Stage 1: Rule-Based Categorization (Instant)
**Triggers:** Immediately when ticket is submitted

**Process:**
1. Analyzes subject and description text
2. Matches keywords against predefined categories
3. Calculates confidence score
4. Assigns priority based on urgency keywords
5. Sets SLA timeline

**Category Keywords:**

**Login issues:**
- login, sign in, signin, password, forgot password, reset password
- can't login, cannot login, unable to login
- authentication, auth, credentials, locked out
- access denied, 2fa, two factor

**Account Access:**
- account, access, permission, role, privileges
- can't access, cannot access, unable to access
- restricted, blocked, suspended, deactivated
- profile, settings, verify, verification

**Technical:**
- error, bug, crash, broken, not working, doesn't work
- issue, problem, slow, loading, timeout
- 500, 404, failure, failed, exception
- technical, system, server, database, api, code

**Feedback:**
- suggestion, feature request, improvement, enhance
- would like, could you, please add
- feedback, recommend, love, great, awesome
- thank, appreciate, idea, proposal

**Priority Keywords:**

**High Priority:**
- urgent, critical, emergency, immediately, asap
- broken, not working, can't, cannot, unable
- blocked, down, production, clients, customers
- security, data loss

**Medium Priority:**
- important, soon, need, issue, problem
- affecting, multiple, several
- experiencing, intermittent

**Low Priority:**
- minor, small, typo, cosmetic
- suggestion, enhancement, future
- eventually, nice to have, when possible

**SLA Mapping:**
- High Priority: 1 day response
- Medium Priority: 2 days response
- Low Priority: 3 days response

#### Stage 2: AI Enhancement
**Triggers:** After database insert, in background

**Process:**
1. Sends ticket to Lovable AI Gateway
2. Uses Google Gemini 2.5 Flash model
3. Structured output via function calling
4. Generates category, priority, SLA, and personalized response
5. Updates database with refined information

**AI Model Capabilities:**
- Context understanding beyond keywords
- Sentiment analysis
- Customer intent recognition
- Professional response generation
- Multi-language support

**Response Generation:**
- Addresses customer by name
- Acknowledges the concern
- Provides clear next steps or solutions
- Maintains professional, empathetic tone
- 2-4 paragraphs
- Offers further assistance

---

## Technical Architecture

### Frontend Stack
- **Framework**: React 18.3.1 with TypeScript
- **Routing**: React Router DOM 6.30.1
- **UI Components**: Shadcn UI (Radix UI primitives)
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation
- **State Management**: React Hooks (useState, useEffect, useMemo)

### Backend Stack
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Edge Functions**: Deno runtime
- **AI Integration**: Lovable AI Gateway (Google Gemini 2.5 Flash)

### Database Schema

**Tables:**

1. **profiles**
   - id (UUID, primary key)
   - email (text, not null)
   - full_name (text)
   - created_at (timestamp)

2. **tickets**
   - id (UUID, primary key)
   - subject (text, not null)
   - description (text, not null)
   - customer_name (text, not null)
   - customer_email (text, not null)
   - created_by (UUID, not null)
   - status (text, default: 'open')
   - category (text)
   - priority (text)
   - sla (text)
   - ai_response (text)
   - created_at (timestamp)
   - updated_at (timestamp)

3. **ticket_updates**
   - id (UUID, primary key)
   - ticket_id (UUID, foreign key → tickets.id)
   - user_id (UUID, not null)
   - message (text, not null)
   - attachment_url (text)
   - created_at (timestamp)

4. **user_roles**
   - id (UUID, primary key)
   - user_id (UUID, not null)
   - role (enum: admin, moderator, user)
   - unique constraint on (user_id, role)

**Storage Buckets:**

1. **ticket-attachments**
   - Private bucket
   - 20MB file size limit
   - Allowed types: images, PDF, Word documents
   - RLS policies for user/admin access

### Row-Level Security (RLS)

**tickets table:**
- Public ticket creation (anonymous allowed)
- Users view their own tickets
- Admins view and update all tickets

**ticket_updates table:**
- Users add updates to their tickets
- Users view updates on their tickets
- Admins view and add updates to any ticket

**storage.objects:**
- Users upload to their ticket folders
- Users view their own ticket attachments
- Admins view all ticket attachments

### Edge Functions

1. **categorize-ticket**
   - Public function (no JWT verification)
   - Receives: ticket subject, description, customer email
   - Calls Lovable AI for categorization
   - Returns: category, priority, sla, aiResponse
   - Error handling for rate limits (429) and payment (402)

2. **suggest-response**
   - Public function (no JWT verification)
   - Receives: ticketId, subject, description, customerName
   - Generates personalized support response
   - Updates ticket with AI response
   - Service role key for database updates

---

## User Workflows

### 1. Anonymous User Submitting a Ticket

**Steps:**
1. Navigate to Support Portal (/)
2. Fill in ticket form:
   - Enter subject
   - Describe issue
   - Provide name
   - Provide email
3. Click "Create Ticket"
4. System instantly categorizes (rule-based)
5. See loading modal: "Processing with AI"
6. View AI-generated response with:
   - Category assignment
   - Priority level
   - Expected response time (SLA)
   - Personalized response text
7. Ticket is saved to database
8. User receives confirmation

**Limitations:**
- Cannot view ticket history
- Cannot add follow-up information
- No access to "My Tickets"

### 2. Authenticated User Submitting and Managing Tickets

**Steps:**
1. Sign up or log in at /auth
2. Navigate to Support Portal (/)
3. See tip about viewing tickets after submission
4. Create ticket (same as anonymous)
5. View AI response
6. Scroll down to see "My Tickets" section
7. View all previously submitted tickets
8. Click "Show More" on any ticket to:
   - Read full description
   - View complete AI response
   - See all updates
   - Download attachments
9. Click "Add More Information" to:
   - Provide additional details
   - Attach files (screenshots, documents)
   - Submit update
10. Update appears in ticket history immediately

### 3. Admin Managing Tickets

**Steps:**
1. Log in as admin at /auth
2. Redirected to Admin Dashboard (/admin)
3. View analytics overview:
   - Review total tickets
   - Check categorization rate
   - Monitor high-priority count
   - See open ticket count
4. Analyze ticket distribution:
   - Review category breakdown
   - Check priority distribution
   - Monitor status stats
5. Perform bulk actions:
   - Quick Categorize: instant rule-based for all uncategorized
   - Categorize with AI: deep analysis for open tickets
   - Suggest AI Responses: generate responses for all open
6. Manage individual tickets:
   - Click on ticket card
   - Review customer information
   - Read full description
   - Check AI categorization
   - Categorize manually if needed
7. Export data:
   - Individual ticket export (JSON/CSV)
   - Bulk export all tickets (JSON/CSV)
8. Monitor system performance:
   - Track categorization success rate
   - Review AI response quality
   - Analyze support metrics

### 4. Ticket Categorization Flow

**User Perspective:**
1. User submits ticket
2. Sees immediate toast: "Categorized as [category]"
3. Loading modal appears: "Processing with AI"
4. AI-enhanced results appear:
   - Refined category (may change from initial)
   - Accurate priority
   - Personalized response

**System Perspective:**
1. **Instant (< 100ms):**
   - Rule-based keyword matching
   - Category, priority, SLA assigned
   - Ticket inserted into database
   - User sees initial categorization

2. **AI Enhancement (2-5 seconds):**
   - Edge function called
   - Lovable AI analyzes context
   - Structured output generated
   - Database updated with refined data
   - User sees final AI response

3. **Fallback Handling:**
   - If AI fails, ticket keeps rule-based categorization
   - User informed: "Created with basic categorization"
   - Support team can manually categorize
   - Ticket is not lost

---

## Design System

### Color Scheme

**Status Colors:**
- High Priority: `hsl(0 84% 60%)` - Red
- Medium Priority: `hsl(38 92% 50%)` - Orange
- Low Priority: `hsl(142 76% 36%)` - Green

**Category Colors:**
- Login issues: `hsl(0 84% 60%)` - Red
- Account Access: `hsl(38 92% 50%)` - Orange
- Technical: `hsl(221 83% 53%)` - Blue
- Feedback: `hsl(142 71% 45%)` - Green

**Base Colors:**
- Primary: `hsl(217 91% 60%)` - Blue
- Background: `hsl(220 25% 97%)` - Light gray
- Card: `hsl(0 0% 100%)` - White
- Foreground: `hsl(222 47% 11%)` - Dark gray

### Animations

**Fade In:**
- Duration: 0.3s
- Easing: ease-out
- Used for: Card entrances, modal appearances

**Scale In:**
- Duration: 0.2s
- Easing: ease-out
- Used for: Modal openings, button interactions

**Slide In Right:**
- Duration: 1.5s
- Easing: ease-in-out
- Used for: Loading progress bars

**Pulse:**
- Duration: 2s
- Used for: AI processing indicator

### Typography
- **Font Family**: System font stack (Inter fallback)
- **Headings**: Bold, larger sizes (2xl for page titles, xl for section headers)
- **Body**: Regular weight, comfortable line height (1.5)
- **Labels**: Medium weight, smaller size

---

## Security Features

### Authentication
- Email/password authentication via Supabase Auth
- Automatic session management
- Secure password hashing (bcrypt)
- JWT token-based authorization

### Row-Level Security (RLS)
- All database tables protected with RLS policies
- Users can only access their own tickets
- Admins have elevated privileges
- Anonymous users can create tickets only

### Input Validation
- Client-side validation with Zod schemas
- Server-side validation in edge functions
- SQL injection prevention via parameterized queries
- XSS prevention via React's automatic escaping

### File Upload Security
- File size limits (20MB)
- File type restrictions (whitelist)
- Secure storage with access control
- Sanitized file names

### API Security
- Rate limiting on AI endpoints
- Error handling for abuse scenarios
- CORS configured for edge functions
- Service role key for privileged operations

---

## Performance Optimizations

### Frontend
- Component code splitting
- Lazy loading for routes
- Memoization of computed values (useMemo)
- Optimized re-renders with React hooks
- Tailwind CSS purging for minimal bundle

### Backend
- Database indexing on frequently queried columns
- Connection pooling in Supabase
- Edge function cold start optimization
- Efficient RLS policies

### AI Integration
- Background processing for AI calls
- User sees instant feedback while AI enhances
- Graceful degradation if AI unavailable
- Caching of common AI responses (future enhancement)

---

## Error Handling

### User-Facing Errors
- Validation errors: Clear, specific messages
- Network errors: Retry suggestions
- AI failures: Fallback to rule-based
- Authentication errors: Redirect to login

### Admin Notifications
- Bulk operation results: Success/failure counts
- Toast notifications for all actions
- Console logging for debugging
- Error boundary for React crashes

### System Monitoring
- Edge function logs available in Supabase
- Network request tracking
- Console error tracking
- Database query performance logs

---

## Future Enhancements

### Potential Features
1. **Email Notifications**: Alert users when tickets are updated
2. **Live Chat**: Real-time support agent communication
3. **Ticket Assignment**: Route tickets to specific support agents
4. **SLA Tracking**: Visual countdown timers for response deadlines
5. **Knowledge Base**: Self-service articles linked to categories
6. **Multi-language Support**: Automatic translation of tickets/responses
7. **Sentiment Analysis**: Detect frustrated customers and auto-escalate
8. **Ticket Templates**: Pre-filled forms for common issues
9. **Analytics Dashboard**: Trends, charts, performance metrics
10. **Mobile App**: Native iOS/Android applications

### Technical Improvements
1. **Caching Layer**: Redis for frequently accessed data
2. **Search Functionality**: Full-text search across tickets
3. **Real-time Updates**: WebSocket for live ticket status
4. **Machine Learning**: Learn from corrections to improve categorization
5. **A/B Testing**: Experiment with different AI prompts
6. **Backup System**: Automated daily database backups
7. **Audit Logs**: Track all admin actions
8. **Two-Factor Authentication**: Enhanced security for admin accounts

---

## Support & Maintenance

### Monitoring
- Check Supabase dashboard for database health
- Review edge function logs for errors
- Monitor AI usage and costs
- Track user authentication issues

### Regular Tasks
- Review and update category keywords
- Analyze categorization accuracy
- Update AI prompts for better responses
- Export data for reporting

### Troubleshooting
- If tickets not appearing: Check RLS policies
- If AI not working: Verify Lovable AI key
- If files not uploading: Check storage bucket policies
- If login failing: Review Supabase auth configuration

---

## Conclusion

This Support Ticket System provides a comprehensive solution for managing customer support requests with intelligent AI-powered categorization and response generation. The dual-stage processing ensures instant feedback while maintaining high-quality categorization through AI enhancement.

The system is built with security, scalability, and user experience as top priorities, making it suitable for businesses of all sizes looking to streamline their customer support operations.

For technical support or feature requests, please contact the development team.

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-07  
**Created by:** Lovable AI Assistant
