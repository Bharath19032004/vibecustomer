export const runtime = "nodejs";
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma" // Use the shared instance

// GET all reviews (public endpoint)
export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        // Only include reviews with required fields
        productType: { not: null },
        productName: { not: null }
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
    console.error("Error fetching all reviews:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}