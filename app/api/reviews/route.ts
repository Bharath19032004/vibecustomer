export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/lib/authOptions"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET all reviews for authenticated user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { reviews: { orderBy: { createdAt: "desc" } } },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user.reviews)
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create new review
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

    const { productName, description, boughtFrom, stars, images } = body

    // Only productName and description are required
    if (!productName || productName.trim() === "") {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 })
    }
    if (!description || description.trim() === "") {
      return NextResponse.json({ error: "Description is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const review = await prisma.review.create({
      data: {
        productName: productName.trim(),
        description: description.trim(),
        stars,
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

// PATCH - Update review
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const { id, productName, description, boughtFrom, stars, images } = body
    if (!id) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const existingReview = await prisma.review.findFirst({
      where: { id, userId: user.id },
    })
    if (!existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        ...(productName ? { productName: productName.trim() } : {}),
        ...(description ? { description: description.trim() } : {}),
        ...(boughtFrom ? { boughtFrom: boughtFrom.trim() } : {}),
        ...(typeof stars === "number" ? { stars } : {}),
        ...(Array.isArray(images) ? { images } : {}),
      },
    })

    return NextResponse.json(updatedReview)
  } catch (error) {
    console.error("Error updating review:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
