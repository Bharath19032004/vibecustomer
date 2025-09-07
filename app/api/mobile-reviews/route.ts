export const runtime = "nodejs";
// app/api/mobile-reviews/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/lib/authOptions"
import { prisma } from "@/lib/prisma" // Use the shared instance

// GET all mobile shop reviews for the authenticated user only
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the authenticated user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Only get reviews created by this user
    const reviews = await prisma.review.findMany({
      where: {
        userId: user.id,
        // Filter out reviews with null required fields
        AND: [
          { productType: { not: null } },
          { productName: { not: null } }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(reviews)
  } catch (error) {
    console.error("Error fetching reviews:", error)
    
    // Fallback: Try to get all reviews for the user and filter manually
    try {
      const session = await getServerSession(authOptions)
      
      if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      })

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const allReviews = await prisma.review.findMany({
        where: {
          userId: user.id
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      
      // Filter out problematic records manually
      const filteredReviews = allReviews.filter(review => 
        review.productType !== null && 
        review.productName !== null &&
        typeof review.productType === 'string' &&
        typeof review.productName === 'string'
      );
      
      return NextResponse.json(filteredReviews);
    } catch (fallbackError) {
      console.error("Fallback error:", fallbackError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
}

// POST - Create new mobile shop review for the authenticated user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const {
      customerName,
      mobileNumber,
      productType,
      productName,
      description,
      stars,
      productQuality,
      serviceQuality,
      wouldRecommend,
      imageUrl,
      boughtFromUrl
    } = body

    // Required fields validation
    if (!productType || productType.trim() === "") {
      return NextResponse.json({ error: "Product type is required" }, { status: 400 })
    }
    if (!productName || productName.trim() === "") {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 })
    }
    if (!productQuality || productQuality.trim() === "") {
      return NextResponse.json({ error: "Product quality rating is required" }, { status: 400 })
    }
    if (!serviceQuality || serviceQuality.trim() === "") {
      return NextResponse.json({ error: "Service quality rating is required" }, { status: 400 })
    }
    if (wouldRecommend === null || wouldRecommend === undefined) {
      return NextResponse.json({ error: "Recommendation is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const review = await prisma.review.create({
      data: {
        customerName: customerName?.trim(),
        mobileNumber: mobileNumber?.trim(),
        productType: productType.trim(),
        productName: productName.trim(),
        description: description?.trim(),
        stars: stars || 5, // Default to 5 if not provided
        productQuality: productQuality,
        serviceQuality: serviceQuality,
        wouldRecommend: wouldRecommend,
        imageUrl: imageUrl,
        boughtFromUrl: boughtFromUrl,
        user: {
          connect: { id: user.id },
        },
      },
    });

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error("Error creating review:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}