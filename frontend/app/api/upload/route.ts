import { uploadImage } from "@/lib/cloudinary.config";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
   try {
     const formData = await req.formData();

     console.log("Form Data Keys:");
 
     const file = formData.get('image') as File;
 
    const arrayBuffer = await file.arrayBuffer();
   const buffer = Buffer.from(arrayBuffer);
   const mimeType = file.type;
   const base64 = `data:${mimeType};base64,${buffer.toString('base64')}`;
 
     const result = await uploadImage(base64);
 
     return NextResponse.json({ result });
   } catch (error) {
     console.error('Error uploading image:', error);
     return NextResponse.json({ error: 'Image upload failed' }, { status: 500 });
    
   }
}

