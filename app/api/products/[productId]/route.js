// //app/api/products/[productId]/page.jsx
// import { NextRequest, NextResponse } from 'next/server';
// import connectMongoDB from '../../../../lib/config/db';
// import Product from '../../../../lib/models/Product';
// import {uploadImageToCloudinary} from '@/lib/utils/cloudinaryUpload'; // Adjust path as needed
//
// export async function GET(request, { params }) {
//     try {
//         await connectMongoDB();
//
//         const { productId } = await params;
//
//         const product = await Product.findOne({ _id: productId }).populate({
//             path: "reviews",
//             populate: { path: "user" },
//         });
//
//         if (!product) {
//             return NextResponse.json({
//                 message: "No Product found",
//                 data: {}
//             }, { status: 204 });
//         }
//
//         return NextResponse.json({
//             message: "Product Found Successfully",
//             data: product
//         });
//     } catch (err) {
//         console.log(err);
//         return NextResponse.json({
//             message: "Product can't be fetched",
//             error: err.message
//         }, { status: 404 });
//     }
// }
//
// export async function PUT(request, { params }) {
//     try {
//         await connectMongoDB();
//
//         const { productId } = await params;
//         const formData = await request.formData();
//         const images = formData.getAll('all_images');
//
//         const product = await Product.findById(productId);
//         if (!product) {
//             return NextResponse.json({
//                 message: "Product not found"
//             }, { status: 404 });
//         }
//
//         // Update fields
//         product.name = formData.get('name');
//         product.category = JSON.parse(formData.get('category')).map(cat => cat.toLowerCase());
//         product.tagline = formData.get('tagline');
//         product.description = formData.get('description');
//         product.price = formData.get('price');
//         product.stock = formData.get('stock');
//         product.sizes = JSON.parse(formData.get('sizes') || '[]');
//         product.colors = JSON.parse(formData.get('colors') || '[]');
//
//         // Handle new images
//         if (images && images.length > 0) {
//             const newImageUrls = await Promise.all(
//                 images.map(async (image, index) => {
//                     const bytes = await image.arrayBuffer();
//                     const buffer = Buffer.from(bytes);
//
//                     const folder = `products/${product._id}`;
//                     const publicId = `image_${index}`;
//                     return uploadImageToCloudinary(buffer, folder, publicId);
//                 })
//             );
//             product.all_images = newImageUrls.map(img => img.secure_url);
//         }
//
//         await product.save();
//         return NextResponse.json(product);
//     } catch (error) {
//         console.error("Error editing product:", error);
//         return NextResponse.json({
//             message: "Internal server error"
//         }, { status: 500 });
//     }
// }
//
// export async function DELETE(request, { params }) {
//     try {
//         await connectMongoDB();
//         const { productId } = await params;
//         const deleted = await Product.findByIdAndDelete(productId);
//         if (!deleted) {
//             return NextResponse.json({
//                 success: false,
//                 message: "Product not found"
//             }, { status: 404 });
//         }
//         return NextResponse.json({
//             success: true,
//             message: "Product deleted successfully",
//             data: deleted
//         });
//     } catch (error) {
//         console.error("Error deleting product:", error);
//         return NextResponse.json({
//             success: false,
//             message: "Internal server error"
//         }, { status: 500 });
//     }
// }
//
// export const config = {
//   api: {
//     bodyParser: {
//       sizeLimit: '10mb', // Increase if needed
//     },
//   },
// };

import { NextResponse } from 'next/server';
import connectMongoDB from '../../../../lib/config/db';
import Product from '../../../../lib/models/Product';
import { uploadImageToCloudinary } from '@/lib/utils/cloudinaryUpload';

import formidable from 'formidable';
import { Readable } from 'stream';

export const runtime = "nodejs";

// 🔁 Convert Web Request → Node Stream
function convertWebRequestToNodeRequest(req) {
    const reader = req.body.getReader();

    return new Readable({
        async read() {
            const { done, value } = await reader.read();
            if (done) {
                this.push(null);
            } else {
                this.push(Buffer.from(value));
            }
        }
    });
}

// ---------------- PUT ----------------
export async function PUT(request, { params }) {
    try {
        await connectMongoDB();

        const { productId } = params;

        const nodeReq = convertWebRequestToNodeRequest(request);

        const form = formidable({
            multiples: true,
            maxFileSize: 50 * 1024 * 1024, // 50MB
        });

        return new Promise((resolve) => {
            form.parse(nodeReq, async (err, fields, files) => {
                if (err) {
                    console.error(err);
                    return resolve(
                        NextResponse.json({ error: "File upload failed" }, { status: 500 })
                    );
                }

                try {
                    const product = await Product.findById(productId);

                    if (!product) {
                        return resolve(
                            NextResponse.json({ message: "Product not found" }, { status: 404 })
                        );
                    }

                    // -------- Fields --------
                    product.name = fields.name?.[0];
                    product.tagline = fields.tagline?.[0];
                    product.description = fields.description?.[0];
                    product.price = Number(fields.price?.[0]);
                    product.stock = Number(fields.stock?.[0]);

                    product.category = JSON.parse(fields.category?.[0] || '[]')
                        .map(cat => cat.toLowerCase());

                    product.sizes = JSON.parse(fields.sizes?.[0] || '[]');
                    product.colors = JSON.parse(fields.colors?.[0] || '[]');

                    // -------- Images --------
                    let images = files.all_images;

                    if (images) {
                        if (!Array.isArray(images)) {
                            images = [images];
                        }

                        const newImageUrls = await Promise.all(
                            images.map(async (file, index) => {
                                const fs = await import('fs');
                                const buffer = fs.readFileSync(file.filepath);

                                const folder = `products/${product._id}`;
                                const publicId = `image_${Date.now()}_${index}`;

                                return uploadImageToCloudinary(buffer, folder, publicId);
                            })
                        );

                        product.all_images = newImageUrls.map(img => img.secure_url);
                    }

                    await product.save();

                    return resolve(
                        NextResponse.json({ success: true, data: product })
                    );

                } catch (error) {
                    console.error(error);
                    return resolve(
                        NextResponse.json({ error: "Internal server error" }, { status: 500 })
                    );
                }
            });
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}