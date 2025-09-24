import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: true, message: 'No file provided' }, { status: 400 });
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: true, 
        message: `File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}` 
      }, { status: 400 });
    }
    
    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: true, 
        message: `File size too large. Maximum size is ${maxSize / (1024 * 1024)}MB` 
      }, { status: 400 });
    }
    
    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const fileName = `${uniqueId}${fileExtension}`;
    
    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'blog', 'public', 'uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {
      // Directory might already exist, which is fine
    }
    
    // Save file
    const filePath = path.join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);
    
    // Return file information
    const fileUrl = `/uploads/${fileName}`;
    
    return NextResponse.json({
      error: false,
      path: fileUrl,
      url: fileUrl,
      thumb: fileUrl, // For now, use the same URL for thumbnail
      name: file.name,
      type: file.type,
      size: file.size
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: true, 
      message: 'Internal server error during upload' 
    }, { status: 500 });
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: true, message: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: true, message: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: true, message: 'Method not allowed' }, { status: 405 });
}
