# Student ID Card Management System

A comprehensive web application for managing schools, classes, and student ID cards built with Next.js, Prisma, and MongoDB.

## Features

- **School Management**: Create and manage educational institutions with logos and signature photos
- **Class Organization**: Organize students into classes and sections
- **Student Records**: Maintain detailed student information including profile pictures
- **Image Upload**: Cloud-based image storage using Cloudinary
- **Responsive Design**: Modern UI with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Prisma ORM
- **Image Storage**: Cloudinary
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB database
- Cloudinary account (for image uploads)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd student-icard-management
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your configuration:

```env
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=images_preset

# Database Configuration
DATABASE_URL="your_mongodb_connection_string"
```

4. Set up the database:

```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Usage

### Navigation

- **Home Page**: Overview dashboard with sidebar navigation
- **Schools**: Create new schools and view existing ones
- **Classes**: Manage classes within schools
- **Students**: Add and manage student records

### Creating a School

1. Click "Create School" in the sidebar
2. Fill in school details (name, caption, address, phone)
3. Upload school logo and signature photo
4. Click "Create School"

### Adding Classes

1. Navigate to a school page
2. Click "Create Class"
3. Enter class name (school is automatically selected)
4. Click "Create Class"

### Adding Students

1. Navigate to a class page
2. Click "Add Student"
3. Fill in student details (school and class are automatically selected)
4. Upload profile picture
5. Click "Create Student"

## API Routes

- `GET/POST /api/schools` - School CRUD operations
- `GET/PUT/DELETE /api/schools/[id]` - Individual school operations
- `GET/POST /api/classes` - Class CRUD operations
- `GET/PUT/DELETE /api/classes/[id]` - Individual class operations
- `GET/POST /api/students` - Student CRUD operations
- `GET/PUT/DELETE /api/students/[id]` - Individual student operations

## Database Schema

The application uses three main models:

- **School**: Institution details with logo and signature
- **Class**: Class/section within a school
- **Student**: Student records linked to school and class

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Make sure to set these in your deployment platform:

- `NEXT_PUBLIC_CLOUDINARY_NAME`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- `DATABASE_URL`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
